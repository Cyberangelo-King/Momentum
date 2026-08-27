import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { momentumEngine } from "./momentum-engine/core/engine";
import { runMomentumEngineTests } from "./momentum-engine/tests/engine.test";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Momentum Neural Engine client
let geminiClient: GoogleGenAI | null = null;
function getNeuralAI(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "momentum-neural-gateway/2.4",
        },
      },
    });
  }
  return geminiClient;
}

// Helper to safely call Momentum Neural Engine with automatic model fallback and retry
async function generateWithFallback(
  prompt: string,
  config?: { responseMimeType?: string; responseSchema?: any }
): Promise<string | null> {
  const ai = getNeuralAI();
  if (!ai) return null;

  const candidateModels = [
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: config?.responseMimeType
            ? { responseMimeType: config.responseMimeType, responseSchema: config.responseSchema }
            : undefined,
        });

        const text = response.text?.trim();
        if (text) {
          return text;
        }
      } catch (err: any) {
        const isTransient =
          err?.status === "UNAVAILABLE" ||
          err?.status === 503 ||
          err?.message?.includes("503") ||
          err?.message?.includes("high demand") ||
          err?.message?.includes("RESOURCE_EXHAUSTED") ||
          err?.message?.includes("429");

        if (isTransient && attempt === 1) {
          // Wait briefly and retry once
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        // Move to next candidate model
        break;
      }
    }
  }

  return null;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper for security & safe input string sanitization
function sanitizeText(input: any, maxLength: number = 5000): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

// ==========================================
// REAL-TIME MULTI-DEVICE DATA SYNC & AUTH ENGINE
// ==========================================

interface ServerSyncState {
  version: number;
  lastUpdatedAt: string;
  lastUpdatedByDevice?: string;
  connections: any[] | null;
  moments: any[] | null;
  ideas: any[] | null;
  notes: any[] | null;
  profile: any | null;
  security: any | null;
}

let serverSyncState: ServerSyncState = {
  version: 1,
  lastUpdatedAt: new Date().toISOString(),
  connections: null,
  moments: null,
  ideas: null,
  notes: null,
  profile: null,
  security: null,
};

// SSE active connection pool
const sseClients = new Set<express.Response>();

function broadcastSyncUpdate(originDevice?: string) {
  const payload = JSON.stringify({
    type: "SYNC_UPDATE",
    version: serverSyncState.version,
    lastUpdatedAt: serverSyncState.lastUpdatedAt,
    originDevice,
    data: {
      connections: serverSyncState.connections,
      moments: serverSyncState.moments,
      ideas: serverSyncState.ideas,
      notes: serverSyncState.notes,
      profile: serverSyncState.profile,
      security: serverSyncState.security,
    },
  });

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  });
}

// GET: Current global sync state for multi-device initial load
app.get("/api/sync/state", (req, res) => {
  res.json({
    success: true,
    version: serverSyncState.version,
    lastUpdatedAt: serverSyncState.lastUpdatedAt,
    data: {
      connections: serverSyncState.connections,
      moments: serverSyncState.moments,
      ideas: serverSyncState.ideas,
      notes: serverSyncState.notes,
      profile: serverSyncState.profile,
      security: serverSyncState.security,
    },
  });
});

// POST: Push local updates from any device to all other devices
app.post("/api/sync/push", (req, res) => {
  const { deviceId, connections, moments, ideas, notes, profile, security } = req.body;

  let hasChanges = false;

  if (Array.isArray(connections)) {
    serverSyncState.connections = connections;
    hasChanges = true;
  }
  if (Array.isArray(moments)) {
    serverSyncState.moments = moments;
    hasChanges = true;
  }
  if (Array.isArray(ideas)) {
    serverSyncState.ideas = ideas;
    hasChanges = true;
  }
  if (Array.isArray(notes)) {
    serverSyncState.notes = notes;
    hasChanges = true;
  }
  if (profile && typeof profile === "object") {
    serverSyncState.profile = profile;
    hasChanges = true;
  }
  if (security && typeof security === "object") {
    serverSyncState.security = security;
    hasChanges = true;
  }

  if (hasChanges) {
    serverSyncState.version += 1;
    serverSyncState.lastUpdatedAt = new Date().toISOString();
    serverSyncState.lastUpdatedByDevice = deviceId || "unknown-device";

    // Broadcast instant update to all connected tablets, phones, and laptops
    broadcastSyncUpdate(deviceId);
  }

  res.json({
    success: true,
    version: serverSyncState.version,
    lastUpdatedAt: serverSyncState.lastUpdatedAt,
    connectedDevicesCount: sseClients.size,
  });
});

// SSE: Server-Sent Events stream for instant real-time sync across all devices
app.get("/api/sync/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({
      type: "SYNC_CONNECTED",
      version: serverSyncState.version,
      lastUpdatedAt: serverSyncState.lastUpdatedAt,
    })}\n\n`
  );

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

// Multi-device SSE sync pool and endpoints
const OWNER_EMAIL = (process.env.VITE_OWNER_EMAIL || (process.env.NODE_ENV === "production" ? "" : "faithakinboyejo@gmail.com")).trim().toLowerCase();

// API: Generate personalized follow-up message
app.post(["/api/ai/quick-message", "/api/gemini/quick-message"], async (req, res) => {
  const { name, company, profession, relationship, notes, channel, talkContext } = req.body;

  const fallbackMessages: Record<string, string> = {
    whatsapp: `Hi ${name || "there"}! Great meeting you at TEDxAkure today. Loved our chat about ${notes || profession || "innovation"}. Let's stay connected! 🚀`,
    linkedin: `Hi ${name || "there"}, it was a pleasure connecting with you at TEDxAkure 2026. I enjoyed our discussion regarding ${notes || (company ? `${company}'s work` : "industry trends")}. Looking forward to keeping in touch.`,
    email: `Dear ${name || "there"},\n\nIt was wonderful meeting you at TEDxAkure 2026 today. I really appreciated our conversation about ${notes || "the conference themes"}.\n\nAs discussed, let's keep the momentum going.\n\nBest regards,`,
  };

  const chosenChannel = (channel || "whatsapp").toLowerCase();

  try {
    const prompt = `Write a crisp, high-impact, authentic follow-up message from a conference attendee who met this person at TEDxAkure 2026.
Contact Name: ${name || "Attendee"}
Profession/Title: ${profession || "Leader"}
Company/Org: ${company || "Tech/Design"}
Relationship: ${relationship || "Peer"}
Conversation Notes: ${notes || "Met during networking"}
Talk or Session context: ${talkContext || "General"}
Channel Format: ${chosenChannel} (e.g. WhatsApp should be conversational and warm; LinkedIn should be professional; Email should have a subject and body).

Output only the message text without quotes or preamble.`;

    const generated = await generateWithFallback(prompt);

    if (generated) {
      return res.json({
        message: generated,
        source: "gemini",
      });
    }

    return res.json({
      message: fallbackMessages[chosenChannel] || fallbackMessages.whatsapp,
      source: "offline-fallback",
    });
  } catch {
    return res.json({
      message: fallbackMessages[chosenChannel] || fallbackMessages.whatsapp,
      source: "offline-fallback",
    });
  }
});

// API: Summarize conversation memory
app.post(["/api/ai/summarize-connection", "/api/gemini/summarize-connection"], async (req, res) => {
  const { name, company, notes, quotes } = req.body;

  try {
    const prompt = `You are the AI memory engine of Momentum OS for TEDxAkure 2026.
Analyze the connection notes and return a JSON object with:
1. "memoryPoints": array of 3 concise, high-value bullet points summarizing what was discussed and key takeaways.
2. "suggestedTags": array of 3-4 hashtag keywords (e.g. ["#Logistics", "#AI", "#Mentorship"]).
3. "priority": "High" | "Medium" | "Low".

Contact: ${name} (${company || "N/A"})
Notes: ${notes || "Met during conference session"}
Quotes/Mentions: ${quotes || "None"}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch {
        // parsing fallback
      }
    }

    return res.json({
      memoryPoints: [
        `Connected with ${name || "contact"} at TEDxAkure.`,
        notes ? `Note: "${notes}"` : "Exchanged contact details and shared professional perspectives.",
        "Set action item to follow up within 48 hours.",
      ],
      suggestedTags: ["#TEDxAkure", "#Networking", "#Tech2026"],
      priority: "High",
    });
  } catch {
    return res.json({
      memoryPoints: [
        `Connected with ${name || "contact"} at TEDxAkure.`,
        notes ? `Note: "${notes}"` : "Exchanged contact details and shared professional backgrounds.",
        "Set action item to follow up.",
      ],
      suggestedTags: ["#TEDxAkure", "#Leadership", "#Innovation"],
      priority: "High",
    });
  }
});

// API: Daily synthesis and LinkedIn event recap post
app.post(["/api/ai/recap", "/api/gemini/recap"], async (req, res) => {
  const { totalConnections, momentsCount, ideasCount, connectionNames, topIdeas } = req.body;

  const peopleSample = Array.isArray(connectionNames) && connectionNames.length > 0
    ? connectionNames.slice(0, 8).join(", ")
    : "speakers, founders, and innovators";

  const fallbackSynthesis = `Your interactions today clustered around transformative regional momentum, African innovation, and ecosystem expansion. You established ${totalConnections || 50} key touchpoints with leaders including ${peopleSample} at TEDxAkure 2026.`;

  const fallbackThemes = ["Pan-African Innovation", "Ecosystem Scaling", "Emerging Tech"];

  const fallbackLinkedIn = `I came to TEDxAkure 2026 with one bold goal: meet 50 changemakers and document the experience.\n\nToday I connected with ${totalConnections || 50} remarkable minds (${peopleSample}), captured ${momentsCount || 42} memorable moments, and synthesized ${ideasCount || 8} groundbreaking ideas.\n\nThe energy in Akure is proof that Africa's tech renaissance is here. What a day of momentum!\n\n#TEDxAkure #Momentum #AfricanTech #Innovation #Networking #TEDx2026`;

  try {
    const prompt = `You are synthesizing an attendee's experience at TEDxAkure 2026.
Event Goal: 50 connections reached.
Stats:
- Total Connections: ${totalConnections || 50}
- Moments Captured: ${momentsCount || 42}
- Ideas Saved: ${ideasCount || 8}
- People Met: ${(connectionNames || []).slice(0, 10).join(", ") || "Founders, Designers, Speakers"}
- Top Talk Ideas: ${(topIdeas || []).slice(0, 5).join(" | ") || "Future of African Tech, Generative AI, Sustainable Growth"}

Return a JSON object with:
1. "dailySynthesis": A 2-3 sentence editorial summary of their event impact and themes.
2. "themes": Array of 3 key theme tags.
3. "linkedInPost": A compelling, inspiring LinkedIn post celebrating reaching their connection milestone at TEDxAkure 2026 with relevant hashtags.`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({
          dailySynthesis: parsed.dailySynthesis || fallbackSynthesis,
          themes: parsed.themes || fallbackThemes,
          linkedInPost: parsed.linkedInPost || fallbackLinkedIn,
        });
      } catch {
        // fallback to structured response
      }
    }

    return res.json({
      dailySynthesis: fallbackSynthesis,
      themes: fallbackThemes,
      linkedInPost: fallbackLinkedIn,
    });
  } catch {
    return res.json({
      dailySynthesis: fallbackSynthesis,
      themes: fallbackThemes,
      linkedInPost: fallbackLinkedIn,
    });
  }
});

// ==========================================
// MOMENTUM NEURAL HIGH-PRECISION AUDIO TRANSCRIPTION & SPEECH INTELLIGENCE
// ==========================================

app.post(["/api/ai/transcribe-audio", "/api/gemini/transcribe-audio"], async (req, res) => {
  const { audioData, mimeType, context, sessionTitle, speakerName } = req.body;

  if (!audioData) {
    return res.status(400).json({ error: "audioData is required" });
  }

  // Extract base64 payload if it has data URL header
  let cleanBase64 = audioData;
  let detectedMime = mimeType || "audio/webm";

  if (audioData.startsWith("data:")) {
    const matches = audioData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      detectedMime = matches[1];
      cleanBase64 = matches[2];
    } else {
      cleanBase64 = audioData.replace(/^data:[^;]+;base64,/, "");
    }
  }

  try {
    const prompt = `You are the precision audio transcription and intelligence engine of Momentum OS at TEDxAkure 2026.
Listen carefully to the provided spoken audio.

1. Transcribe the raw spoken audio with 100% verbatim accuracy.
2. Also provide a cleaned, punctuated structured transcript with logical paragraphs and timestamped segment estimates.
3. Extract core ideas, actionable takeaways, and unanswered questions provoked by the recording.

Domain Context:
- Conference: TEDxAkure 2026 (Akure, Ondo State, Nigeria)
- Themes: Technology, African innovation, fintech, engineering, UX design, startup ecosystems, infrastructure, leadership.
- Session: ${sanitizeText(sessionTitle) || "Conference Session"}
- Speaker: ${sanitizeText(speakerName) || "Speaker"}
${context ? `Additional user/speaker context: ${sanitizeText(context)}` : ""}

Return a JSON object with:
1. "rawTranscript": Exact verbatim unedited transcript of spoken words.
2. "structuredTranscript": Cleaned, punctuated, paragraph-structured transcript.
3. "title": A punchy 3-6 word title summarizing the audio reflection.
4. "keyPoints": Array of 2-4 core takeaway bullet points.
5. "actionItems": Array of objects [{"id": "a1", "text": "...", "done": false}].
6. "suggestedTags": Array of 3-4 hashtags (e.g. ["#TEDxAkure", "#AfricanInnovation"]).
7. "segments": Array of estimated timestamped segments [{"id": "s1", "startOffsetSec": 0, "timestampFormatted": "00:00", "speakerLabel": "${sanitizeText(speakerName) || "Speaker"}", "text": "..."}].`;

    const ai = getNeuralAI();
    if (!ai) {
      const defaultText = "Voice memo captured successfully at TEDxAkure 2026.";
      return res.json({
        rawTranscript: defaultText,
        structuredTranscript: defaultText,
        transcript: defaultText,
        title: "Voice Reflection",
        keyPoints: ["Spoken moment captured at TEDxAkure 2026."],
        actionItems: [],
        suggestedTags: ["#TEDxAkure", "#VoiceMemo"],
        segments: [{ id: "seg_1", startOffsetSec: 0, timestampFormatted: "00:00", text: defaultText }],
        speakersDetected: 1,
        source: "offline-fallback",
      });
    }

    const candidateModels = [
      "gemini-3.7-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
    ];

    let resultText: string | null = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime.includes(";") ? detectedMime.split(";")[0] : detectedMime,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text?.trim();
        if (text) {
          resultText = text;
          break;
        }
      } catch (err: any) {
        console.warn(`Transcription attempt with ${model} error:`, err?.message || err);
      }
    }

    if (resultText) {
      try {
        const parsed = JSON.parse(resultText);
        const raw = parsed.rawTranscript || parsed.transcript || "Spoken recording captured.";
        const structured = parsed.structuredTranscript || parsed.transcript || raw;
        return res.json({
          rawTranscript: raw,
          structuredTranscript: structured,
          transcript: structured,
          title: parsed.title || "Voice Note",
          keyPoints: parsed.keyPoints || ["Key takeaway from voice reflection."],
          actionItems: parsed.actionItems || [],
          suggestedTags: parsed.suggestedTags || ["#TEDxAkure"],
          segments: parsed.segments || [{ id: "seg_1", startOffsetSec: 0, timestampFormatted: "00:00", text: raw }],
          speakersDetected: parsed.speakersDetected || 1,
          source: "gemini",
        });
      } catch {
        // Fallback if parse fails
      }
    }

    const fallbackTxt = "Voice memo captured at TEDxAkure 2026.";
    return res.json({
      rawTranscript: fallbackTxt,
      structuredTranscript: fallbackTxt,
      transcript: fallbackTxt,
      title: "Spoken Memo",
      keyPoints: ["Live event reflection."],
      actionItems: [],
      suggestedTags: ["#TEDxAkure"],
      segments: [{ id: "seg_1", startOffsetSec: 0, timestampFormatted: "00:00", text: fallbackTxt }],
      speakersDetected: 1,
      source: "offline-fallback",
    });
  } catch (err) {
    console.error("Transcribe audio error:", err);
    const fallbackTxt = "Voice memo captured at TEDxAkure 2026.";
    return res.json({
      rawTranscript: fallbackTxt,
      structuredTranscript: fallbackTxt,
      transcript: fallbackTxt,
      title: "Spoken Memo",
      keyPoints: ["Live event reflection."],
      actionItems: [],
      suggestedTags: ["#TEDxAkure"],
      segments: [{ id: "seg_1", startOffsetSec: 0, timestampFormatted: "00:00", text: fallbackTxt }],
      speakersDetected: 1,
      source: "offline-fallback",
    });
  }
});

// ==========================================
// BEFORE STAGE: SPEAKER BRIEFINGS & PREPARATION DOSSIER
// ==========================================

app.post(["/api/ai/speaker-briefing", "/api/gemini/speaker-briefing"], async (req, res) => {
  const { speakerName, speakerRole, speakerBio, sessionTitle, stage, topics } = req.body;

  const safeSpeaker = sanitizeText(speakerName, 100) || "Featured Speaker";
  const safeRole = sanitizeText(speakerRole, 200) || "Thought Leader";
  const safeTitle = sanitizeText(sessionTitle, 200) || "TEDxAkure Session";

  try {
    const prompt = `You are the Executive Intelligence Officer for an attendee at TEDxAkure 2026.
Generate a high-leverage "BEFORE" stage briefing dossier for a speaker session so the attendee enters the room deeply prepared.

Speaker & Session Details:
- Speaker Name: ${safeSpeaker}
- Role / Background: ${safeRole}
- Session Title: ${safeTitle}
- Stage / Location: ${sanitizeText(stage, 100) || "Main Stage"}
- Speaker Bio Context: ${sanitizeText(speakerBio, 500) || "Leading African technology and ecosystem innovator."}
- Known Topics: ${Array.isArray(topics) ? topics.join(", ") : "Innovation, Scaling, Leadership"}

Return a JSON object with:
1. "whyItMatters": 2-3 sentences explaining the strategic importance of this talk and why an ambitious attendee MUST pay attention.
2. "coreThemes": Array of 3-4 key themes and ideas expected in this talk.
3. "recommendedAngles": Array of 3 strategic angles to observe (e.g. "Operational Tradeoffs", "Pan-African Expansion", "Technical Bottlenecks").
4. "preGeneratedQuestions": Array of 3-4 brilliant, memorable questions to prepare BEFORE the talk:
   [
     {
       "id": "q1",
       "question": "Question text to ask during Q&A or networking",
       "angle": "Provocative / Deep Dive" | "Practical Playbook" | "Ecosystem Impact",
       "whyItWorks": "Why this question stands out",
       "followUpHook": "Follow up conversational hook"
     }
   ]`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({
          speakerName: safeSpeaker,
          speakerRole: safeRole,
          whyItMatters: parsed.whyItMatters || `${safeSpeaker}'s session on "${safeTitle}" explores crucial frontiers in African technology and ecosystem infrastructure.`,
          coreThemes: parsed.coreThemes || ["Ecosystem Scale", "Engineering Resilience", "Sustainable Growth"],
          recommendedAngles: parsed.recommendedAngles || ["Operational Playbooks", "Regional Bottlenecks", "Zero-to-One Strategy"],
          preGeneratedQuestions: parsed.preGeneratedQuestions || [
            {
              id: `q_pre_${Date.now()}_1`,
              question: `In scaling your thesis on "${safeTitle}", what was the most counterintuitive operational hurdle you navigated in West Africa?`,
              angle: "Practical Playbook",
              whyItWorks: "Directly addresses real execution realities rather than surface theory.",
              followUpHook: "How did that shape your current roadmap?",
            },
          ],
          source: "gemini",
        });
      } catch {
        // parsing fallback
      }
    }

    return res.json({
      speakerName: safeSpeaker,
      speakerRole: safeRole,
      whyItMatters: `${safeSpeaker} is a key voice at TEDxAkure 2026. This session offers high-value insights into regional technological development and strategic innovation.`,
      coreThemes: ["Regional Innovation", "Ecosystem Scaling", "Strategic Leadership"],
      recommendedAngles: ["Execution Realities", "Regional Advantage", "Talent & Infrastructure"],
      preGeneratedQuestions: [
        {
          id: `q_pre_${Date.now()}_1`,
          question: `What is the single biggest misconception founders have when tackling "${safeTitle}" in emerging markets?`,
          angle: "Provocative / Deep Dive",
          whyItWorks: "Invites the speaker to bust prevalent myths.",
          followUpHook: "What early signals tell you a team gets it right?",
        },
      ],
      source: "offline-dossier",
    });
  } catch (err) {
    console.error("Speaker briefing error:", err);
    return res.json({
      speakerName: safeSpeaker,
      speakerRole: safeRole,
      whyItMatters: `${safeSpeaker}'s session is a highlighted event on the schedule.`,
      coreThemes: ["Innovation", "Leadership"],
      recommendedAngles: ["Execution", "Strategy"],
      preGeneratedQuestions: [],
      source: "offline-dossier",
    });
  }
});

// ==========================================
// UNDERSTAND STAGE: EXTRACT INSIGHTS, CONTRARIAN TAKEAWAYS & UNANSWERED QUESTIONS
// ==========================================

app.post(["/api/ai/extract-insights", "/api/gemini/extract-insights"], async (req, res) => {
  const { content, rawTranscript, speakerName, sessionTitle, category } = req.body;

  const safeContent = sanitizeText(content, 10000) || sanitizeText(rawTranscript, 10000);
  if (!safeContent) {
    return res.status(400).json({ error: "Content or transcript is required" });
  }

  try {
    const prompt = `You are the Chief Synthesis Editor of Momentum OS for TEDxAkure 2026.
Analyze this user note and/or raw speech transcript from a conference session.
Strictly distinguish between VERBATIM SOURCE facts and your AI SYNTHESIS.

Session Context:
- Session: ${sanitizeText(sessionTitle) || "TEDxAkure Talk"}
- Speaker: ${sanitizeText(speakerName) || "Speaker"}
- Category: ${sanitizeText(category) || "Keynote"}

Input Material:
"""
${safeContent}
"""

Return a JSON object with:
1. "coreTheses": Array of 2-3 core theses or mental models presented.
2. "standoutTakeaways": Array of 3-5 punchy, memorable takeaway bullet points.
3. "contrarianInsights": Array of 2-3 insights that challenge common assumptions or shift worldviews.
4. "unansweredQuestions": Array of 2-3 provocative questions the talk raises or leaves open for deeper research.
5. "actionItems": Array of specific, actionable commitments [{"id": "a1", "text": "Specific next action step", "priority": "high"|"medium"|"low", "done": false}].
6. "structuredSummary": A concise 2-paragraph executive synthesis.`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({
          coreTheses: parsed.coreTheses || [],
          standoutTakeaways: parsed.standoutTakeaways || [],
          contrarianInsights: parsed.contrarianInsights || [],
          unansweredQuestions: parsed.unansweredQuestions || [],
          actionItems: parsed.actionItems || [],
          structuredSummary: parsed.structuredSummary || "Executive synthesis generated.",
          source: "gemini",
        });
      } catch {
        // parsing fallback
      }
    }

    return res.json({
      coreTheses: ["Innovation thrives when tailored to regional market constraints."],
      standoutTakeaways: [safeContent.slice(0, 120)],
      contrarianInsights: ["Friction and operational hurdles can serve as powerful defensibility moats."],
      unansweredQuestions: ["How will edge infrastructure evolve to support this in secondary African cities?"],
      actionItems: [{ id: `a_${Date.now()}`, text: `Synthesize insights from ${speakerName || "the talk"}`, done: false, priority: "medium" }],
      structuredSummary: "Session notes logged and synthesized.",
      source: "offline-fallback",
    });
  } catch (err) {
    console.error("Extract insights error:", err);
    return res.status(500).json({ error: "Failed to extract insights" });
  }
});

// ==========================================
// REFLECT STAGE: 5-PILLAR POST-EVENT REVIEW SYNTHESIS
// ==========================================

app.post(["/api/ai/post-event-review", "/api/gemini/post-event-review"], async (req, res) => {
  const { connections, moments, ideas, notes, sessions, profile } = req.body;

  const attendeeName = profile?.name || "Attendee";
  const connectionsArr = Array.isArray(connections) ? connections : [];
  const notesArr = Array.isArray(notes) ? notes : [];
  const ideasArr = Array.isArray(ideas) ? ideas : [];
  const sessionsArr = Array.isArray(sessions) ? sessions : [];

  const connectionsSummary = connectionsArr.slice(0, 15).map(c => `${c.name} (${c.company || 'N/A'}, ${c.profession || 'Leader'}) - Notes: ${c.notes || 'Met at conference'}`).join("\n");
  const notesSummary = notesArr.slice(0, 10).map(n => `Session: ${n.sessionTitle || n.title} by ${n.speakerName || 'Speaker'} - Content: ${n.content?.slice(0, 150)}...`).join("\n");
  const ideasSummary = ideasArr.slice(0, 10).map(i => `Quote by ${i.speakerName}: "${i.quote}" - Takeaway: ${i.takeaway || ''}`).join("\n");

  try {
    const prompt = `You are the Chief Reflection Architect for Momentum OS at TEDxAkure 2026.
Synthesize the attendee's comprehensive conference experience into the authoritative 5-Pillar Reflection Framework:

1. WHAT HAPPENED: Chronological journey of sessions attended, people met (${connectionsArr.length} connections), and moments captured.
2. WHAT I LEARNED: Cross-speaker thematic synthesis, master ideas, and standout quotes.
3. WHAT CHANGED MY THINKING: Contrarian insights, surprise revelations, and worldview shifts.
4. WHAT I SHOULD DO NEXT: Prioritized action item matrix categorized by timeframe (Immediate 24h, This Week, Long-term Strategic).
5. WHO/WHAT TO FOLLOW UP WITH: Key individuals with personalized outreach rationale and recommended communication channel (WhatsApp/LinkedIn/Email).

Attendee: ${attendeeName}
Conference: TEDxAkure 2026

Attendee's Data:
- Connections Met (${connectionsArr.length}):
${connectionsSummary || "Multiple leaders, founders, and designers."}

- Session Notes (${notesArr.length}):
${notesSummary || "Keynotes on African tech infrastructure, intent-driven design, and AI."}

- Captured Ideas & Quotes (${ideasArr.length}):
${ideasSummary || "Quotes on momentum and execution."}

Return a JSON object conforming strictly to:
{
  "whatHappened": {
    "totalSessionsAttended": ${sessionsArr.length || 3},
    "totalConnectionsMet": ${connectionsArr.length},
    "sessionsSummary": ["Array of 3-4 bullet points summarizing session attendance"],
    "timelineHighlights": ["Array of 3-4 key timestamped event milestones"]
  },
  "whatILearned": {
    "coreTheses": ["Array of 3 core synthesized theses"],
    "synthesizedConcepts": ["Array of 3 conceptual frameworks"],
    "standoutQuotes": [{"quote": "...", "speaker": "...", "sessionTitle": "..."}]
  },
  "whatChangedMyThinking": {
    "contrarianInsights": ["Array of 2-3 counter-intuitive takeaways"],
    "worldviewShifts": ["Array of 2-3 shifts in perspective"]
  },
  "whatIShouldDoNext": {
    "immediate24h": [{"id": "act_24h_1", "text": "...", "priority": "high", "done": false}],
    "thisWeek": [{"id": "act_wk_1", "text": "...", "priority": "medium", "done": false}],
    "strategicGoals": ["Array of 2 strategic initiatives"]
  },
  "whoToFollowUpWith": {
    "keyPeople": [
      {
        "name": "...",
        "company": "...",
        "reason": "...",
        "recommendedChannel": "whatsapp" | "linkedin" | "email",
        "draftText": "..."
      }
    ]
  },
  "executiveSummary": "A compelling 2-paragraph master reflection for the attendee's personal archive.",
  "linkedInRecapPost": "A standout, inspiring LinkedIn recap post celebrating reaching the 50-connection milestone at TEDxAkure 2026."
}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({
          ...parsed,
          generatedAt: new Date().toISOString(),
          source: "gemini",
        });
      } catch {
        // parsing fallback
      }
    }

    // High quality fallback
    return res.json({
      whatHappened: {
        totalSessionsAttended: sessionsArr.length || 3,
        totalConnectionsMet: connectionsArr.length,
        sessionsSummary: ["Attended keynotes on regional technology, intentional design, and African AI infrastructure."],
        timelineHighlights: ["Opening keynote kick-off", "VIP Networking breakfast", "Afternoon deep-dive panel"],
      },
      whatILearned: {
        coreTheses: ["African tech infrastructure scales best when designed around local economic mechanics."],
        synthesizedConcepts: ["Strategic friction in product design creates lasting user intent."],
        standoutQuotes: ideasArr.slice(0, 2).map(i => ({ quote: i.quote, speaker: i.speakerName, sessionTitle: i.sessionTitle })),
      },
      whatChangedMyThinking: {
        contrarianInsights: ["Constraint is not a disadvantage; it is the primary catalyst for zero-to-one product design."],
        worldviewShifts: ["Secondary tech hubs like Akure represent the real grassroots momentum of African innovation."],
      },
      whatIShouldDoNext: {
        immediate24h: [
          { id: `act_1`, text: "Send personalized WhatsApp follow-ups to top 5 connections", priority: "high", done: false },
          { id: `act_2`, text: "Organize raw audio transcripts into clean Smart Notes", priority: "medium", done: false }
        ],
        thisWeek: [
          { id: `act_3`, text: "Schedule 3 virtual follow-up syncs with prospective collaborators", priority: "medium", done: false }
        ],
        strategicGoals: ["Integrate TEDxAkure insights into Q4 product strategy."],
      },
      whoToFollowUpWith: {
        keyPeople: connectionsArr.slice(0, 3).map(c => ({
          name: c.name,
          company: c.company || "Innovator",
          reason: `Follow up on our chat regarding ${c.notes ? c.notes.slice(0, 40) : 'collaboration'}`,
          recommendedChannel: "whatsapp" as const,
          draftText: `Hi ${c.name.split(' ')[0]}, wonderful meeting you at TEDxAkure 2026 today! Let's keep the conversation going.`
        })),
      },
      executiveSummary: `TEDxAkure 2026 marked a pivotal milestone of connection, learning, and momentum. Reaching ${connectionsArr.length} meaningful connections and capturing pivotal keynote insights, this event has transformed strategic thinking across ecosystem development and product execution.`,
      linkedInRecapPost: `I came to TEDxAkure 2026 with a goal to connect deeply and turn inspiration into action.\n\nToday I established ${connectionsArr.length} high-value connections, documented keynotes from world-class African innovators, and synthesized crucial takeaways on tech resilience.\n\nAfrica's tech momentum is unstoppable. Special thanks to everyone I spoke with today!\n\n#TEDxAkure #Momentum #AfricanTech #Innovation #Networking`,
      generatedAt: new Date().toISOString(),
      source: "offline-synthesis",
    });
  } catch (err) {
    console.error("Post event review error:", err);
    return res.status(500).json({ error: "Failed to generate post-event review" });
  }
});

// API: Refine and format raw speech transcript
app.post(["/api/ai/refine-transcript", "/api/gemini/refine-transcript"], async (req, res) => {
  const { transcript, context } = req.body;

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "transcript is required" });
  }

  try {
    const prompt = `You are the speech refinement editor for Momentum OS at TEDxAkure 2026.
Given the following raw speech-to-text transcript (which may contain phonetically misrecognized words, missing punctuation, or awkward breaks), polish it into crisp, accurate, readable text while preserving the speaker's original voice and meaning.

Domain Context:
- TEDxAkure 2026 in Akure, Ondo State, Nigeria.
- African technology, software, venture capital, UX, community building.
${context ? `Context: ${context}` : ""}

Raw Transcript:
"""
${transcript}
"""

Return a JSON object with:
1. "refinedTranscript": The clean, punctuated, beautifully formatted transcript.
2. "title": A 3-6 word descriptive title.
3. "keyPoints": Array of 2-4 key bullet points summarizing core ideas.
4. "suggestedTags": Array of 3-4 hashtags.`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({
          refinedTranscript: parsed.refinedTranscript || transcript,
          title: parsed.title || "Voice Note",
          keyPoints: parsed.keyPoints || [],
          suggestedTags: parsed.suggestedTags || ["#TEDxAkure"],
          source: "gemini",
        });
      } catch {
        // parsing fallback
      }
    }

    return res.json({
      refinedTranscript: transcript,
      title: "Voice Reflection",
      keyPoints: [],
      suggestedTags: ["#TEDxAkure"],
      source: "offline-fallback",
    });
  } catch {
    return res.json({
      refinedTranscript: transcript,
      title: "Voice Reflection",
      keyPoints: [],
      suggestedTags: ["#TEDxAkure"],
      source: "offline-fallback",
    });
  }
});

// ==========================================
// MOMENTUM NEURAL SMART NOTE CO-PILOT & ENHANCEMENT ENGINE
// ==========================================

app.post(["/api/ai/enhance-note", "/api/gemini/enhance-note"], async (req, res) => {
  const { title, content, category, speakerName, action, sessionTitle } = req.body;

  try {
    const prompt = `You are the AI Note-Taking Co-Pilot for Momentum Event OS at TEDxAkure 2026.
The user is attending talks, keynotes, fireside chats, and workshops, capturing high-velocity notes.

Note Metadata:
- Title: ${title || "Untitled Note"}
- Category: ${category || "Keynote"}
- Speaker: ${speakerName || "Conference Speaker"}
- Session: ${sessionTitle || "TEDxAkure Session"}

Raw User Note Content:
"""
${content || "Key takeaways and ideas from the session."}
"""

Requested Action: "${action || "all"}" (actions can be: "structure", "action_items", "takeaways", "questions", "all")

Return a JSON object with:
1. "structuredContent": A well-structured markdown note with:
   - ## Core Thesis
   - ## Key Insights & Arguments (clear bullet points)
   - ## Memorable Quotes or Frameworks
   - ## Executive Summary (2-3 sentences)
2. "keyTakeaways": Array of 3-4 sharp, high-impact takeaway bullet points.
3. "actionItems": Array of objects: [{"id": "a1", "text": "Task or follow-up description", "done": false}]. Scans for explicit or implied commitments, books to read, frameworks to try, people to contact.
4. "suggestedQuestions": Array of 3-4 brilliant questions to ask the speaker during Q&A or 1-on-1 networking [{"id": "q1", "question": "...", "angle": "Provocative / Deep Dive" | "Practical Playbook" | "Ecosystem Impact"}].
5. "suggestedTags": Array of 3-5 relevant hashtag topics.`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        return res.json({
          structuredContent: parsed.structuredContent || content,
          keyTakeaways: parsed.keyTakeaways || [],
          actionItems: parsed.actionItems || [],
          suggestedQuestions: parsed.suggestedQuestions || [],
          suggestedTags: parsed.suggestedTags || ["#TEDxAkure", "#Insight"],
          source: "gemini",
        });
      } catch {
        // parsing fallback
      }
    }

    return res.json({
      structuredContent: content,
      keyTakeaways: ["Key insight from " + (speakerName || "TEDxAkure") + "."],
      actionItems: [{ id: `a_${Date.now()}`, text: "Follow up on talk insights", done: false }],
      suggestedQuestions: [
        {
          id: `q_${Date.now()}`,
          question: `What was the most counterintuitive discovery you made while developing this project?`,
          angle: "Deep Dive",
        },
      ],
      suggestedTags: ["#TEDxAkure", "#Notes"],
      source: "offline-fallback",
    });
  } catch {
    return res.json({
      structuredContent: content,
      keyTakeaways: [],
      actionItems: [],
      suggestedQuestions: [],
      suggestedTags: ["#TEDxAkure"],
      source: "offline-fallback",
    });
  }
});

// ==========================================
// MOMENTUM NEURAL SPEAKER QUESTION GENERATOR ENGINE
// ==========================================

app.post(["/api/ai/generate-questions", "/api/gemini/generate-questions"], async (req, res) => {
  const { speakerName, speakerRole, topic, sessionTitle, talkNotes, angle } = req.body;

  try {
    const prompt = `You are the Chief Q&A Strategist and Intellectual Sparring Partner for an ambitious attendee at TEDxAkure 2026.
Your goal is to prepare 4-5 exceptionally sharp, insightful, and memorable questions that the attendee can ask this speaker during the Q&A session or in a backstage 1-on-1 conversation.

Speaker Context:
- Speaker Name: ${speakerName || "TEDx Speaker"}
- Role / Background: ${speakerRole || "Thought Leader"}
- Talk / Topic: ${topic || sessionTitle || "African Innovation & Growth"}
- Session Title: ${sessionTitle || "Main Stage Keynote"}
- Attendee's Notes on Talk: ${talkNotes || "Covering innovation, scaling, technical bottlenecks, and ecosystem design."}
- Preferred Question Angle: ${angle || "mixed"} (Options: 'provocative', 'practical', 'ecosystem', 'networking', 'rapid_fire', 'mixed')

Guidelines for Questions:
- Avoid generic softball questions (e.g. "what inspires you?").
- Ask specific, high-leverage questions that demonstrate deep listening, touch on real tradeoffs, zero-to-one friction, or future horizons in African tech and design.
- If angle is 'provocative': Challenge assumptions or ask about failure modes / unintended consequences.
- If angle is 'practical': Ask about execution playbooks, team structure, or unit economics.
- If angle is 'ecosystem': Ask about Pan-African scalability, policy, and infrastructure hurdles.
- If angle is 'networking': Formulate an approachable opener that naturally leads to a fruitful post-talk coffee or WhatsApp follow-up.

Return a JSON object with:
1. "questions": Array of 4-5 objects:
   [
     {
       "id": "q1",
       "question": "The exact question text to ask.",
       "angle": "Thought-Provoking" | "Execution Playbook" | "Ecosystem Scale" | "1-on-1 Opener" | "Rapid Q&A",
       "whyItWorks": "1-sentence explanation of why this question makes you stand out to the speaker.",
       "followUpHook": "A quick follow-up remark based on their likely answer."
     }
   ]
2. "speakerIcebreaker": A 1-sentence warm opener for walking up to the speaker after the talk.`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          return res.json({
            questions: parsed.questions,
            speakerIcebreaker: parsed.speakerIcebreaker || `Hi ${speakerName || "there"}, fantastic talk on ${topic || "your work"}!`,
            source: "gemini",
          });
        }
      } catch {
        // parsing fallback
      }
    }

    // High quality offline fallback questions
    return res.json({
      questions: [
        {
          id: `q_${Date.now()}_1`,
          question: `In your talk on "${topic || "innovation"}", what is the single biggest operational tradeoff you had to make that surprised you most?`,
          angle: "Execution Playbook",
          whyItWorks: "Bypasses high-level theory and prompts the speaker to share real operational war stories.",
          followUpHook: "How did your early team align around that tradeoff?",
        },
        {
          id: `q_${Date.now()}_2`,
          question: `If you had to point out one widespread assumption in the industry right now regarding ${topic || "this space"} that is completely wrong, what would it be?`,
          angle: "Thought-Provoking",
          whyItWorks: "Gives the speaker permission to be candid and share their strongest contrarian thesis.",
          followUpHook: "What metric or signal first alerted you that this assumption was flawed?",
        },
        {
          id: `q_${Date.now()}_3`,
          question: `Looking at West Africa over the next 3 to 5 years, what missing infrastructure layer is the biggest bottleneck to scaling what you described today?`,
          angle: "Ecosystem Scale",
          whyItWorks: "Connects their thesis directly to the regional momentum of TEDxAkure 2026.",
          followUpHook: "Who do you see as best positioned to solve that layer?",
        },
        {
          id: `q_${Date.now()}_4`,
          question: `What was the most difficult pivot or dead-end your team navigated before reaching the breakthrough you shared on stage?`,
          angle: "1-on-1 Opener",
          whyItWorks: "Humanizes the founder/speaker journey and creates instant rapport.",
          followUpHook: "I'd love to connect on WhatsApp or LinkedIn to follow how this unfolds.",
        },
      ],
      speakerIcebreaker: `Hi ${speakerName || "there"}, really loved your perspective on ${topic || "today's session"}! Loved your point about regional execution.`,
      source: "offline-fallback",
    });
  } catch {
    return res.json({
      questions: [
        {
          id: `q_fallback_1`,
          question: `What is the biggest lesson from your work on ${topic || "this topic"} that you wish you knew when you started?`,
          angle: "Execution Playbook",
          whyItWorks: "Simple, powerful reflection.",
          followUpHook: "Would love to stay connected.",
        },
      ],
      speakerIcebreaker: `Hi ${speakerName || "there"}, great session today!`,
      source: "offline-fallback",
    });
  }
});

// ==========================================
// UNIVERSAL EVENT INTELLIGENCE ENDPOINTS
// ==========================================

// Parse raw schedule text or agenda table into structured EventSession items
app.post("/api/events/parse-agenda", async (req, res) => {
  const { rawText, eventName, defaultStage } = req.body;

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: "rawText is required" });
  }

  try {
    const prompt = `You are the AI Conference Agenda Parser for Momentum Universal Event OS.
Parse the following unstructured conference schedule, agenda list, or speaker timetable into an array of clean, structured session objects.

Event Context: ${eventName || "Conference / Summit"}
Default Stage: ${defaultStage || "Main Stage"}

Raw Text:
"""
${rawText}
"""

Return a JSON object containing:
1. "sessions": Array of objects:
   - "id": unique string e.g. "s-gen-1"
   - "title": session / talk title
   - "speaker": speaker full name (or "Panel / Keynote" if unspecified)
   - "speakerRole": speaker role / company / designation
   - "timeStr": time string e.g. "9:30 AM" or "In 15 mins"
   - "stage": stage name or track (e.g. "Main Stage", "Track A", "Workshop Studio")
   - "status": "upcoming" | "live" | "completed"
   - "description": 1-2 sentence description of what the talk covers
   - "heroImage": an appropriate relevant Unsplash image URL (e.g. https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80)
   - "topics": array of 2-3 topic tags
2. "detectedStages": Array of unique stage/track names detected in the text.`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.sessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
          return res.json({
            sessions: parsed.sessions,
            detectedStages: parsed.detectedStages || [defaultStage || "Main Stage"],
            source: "gemini",
          });
        }
      } catch (err) {
        console.warn("JSON parse error in parse-agenda:", err);
      }
    }

    // Fallback simple line-by-line parsing
    const lines = rawText.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 3);
    const fallbackSessions = lines.slice(0, 6).map((line: string, idx: number) => ({
      id: `s-manual-${Date.now()}-${idx + 1}`,
      title: line.replace(/^\d+[:.]\s*/, "").slice(0, 60),
      speaker: "Keynote Speaker",
      speakerRole: "Industry Leader",
      timeStr: `${9 + idx}:00 AM`,
      stage: defaultStage || "Main Stage",
      status: "upcoming" as const,
      description: line,
      heroImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      topics: ["General", "Keynote"],
    }));

    return res.json({
      sessions: fallbackSessions,
      detectedStages: [defaultStage || "Main Stage"],
      source: "offline-fallback",
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to parse agenda", sessions: [] });
  }
});

// Generate event-tailored conversation icebreakers
app.post("/api/events/suggest-icebreakers", async (req, res) => {
  const { eventName, eventType, themeDescription, location } = req.body;

  try {
    const prompt = `You are a world-class executive networking strategist for Momentum Universal Event OS.
Generate 5 sharp, high-conviction, non-generic conversation icebreaker questions tailored specifically for attendees at:

- Event: ${eventName || "Tech Conference"}
- Type: ${eventType || "Conference / Summit"}
- Theme: ${themeDescription || "Technology & Innovation"}
- Location: ${location || "Global"}

The questions must:
- Avoid boring clichés ("What do you do?", "Nice weather huh?")
- Sound like questions a smart, ambitious peer would ask in a hallway or after a keynote
- Spark authentic intellectual rapport in under 30 seconds

Return a JSON object:
{
  "icebreakers": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });

    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.icebreakers && Array.isArray(parsed.icebreakers)) {
          return res.json({ icebreakers: parsed.icebreakers, source: "gemini" });
        }
      } catch {}
    }

    return res.json({
      icebreakers: [
        `What is the most contrarian take you've heard so far at ${eventName || "the event"}?`,
        "What is the single hardest operational bottleneck your team is navigating this quarter?",
        "If you could fast-forward 24 months, what does a breakout win look like for your project?",
        "Which session on the agenda today are you most curious to challenge or unpack?",
        "What brought you to this event specifically over all others this year?",
      ],
      source: "offline-fallback",
    });
  } catch {
    return res.json({
      icebreakers: [
        "What is the most exciting milestone your team shipped recently?",
        "Which talk on today's agenda are you most looking forward to?",
      ],
      source: "offline-fallback",
    });
  }
});

// ==========================================
// 1000000X AI SUITE: WARM INTRO MATCHMAKER, PITCH SIMULATOR, BATCH OUTREACH & EVENT ROI
// ==========================================

// 1. AI Warm Intro Matchmaker: Synergistic Pairings
app.post(["/api/ai/warm-intro-matchmaker", "/api/gemini/warm-intro-matchmaker"], async (req, res) => {
  const { connections, eventName } = req.body;
  const list = Array.isArray(connections) ? connections : [];

  if (list.length < 2) {
    return res.json({ recommendations: [], source: "offline-fallback" });
  }

  try {
    const contactsSummary = list.map(c => `ID: ${c.id} | Name: ${c.name} | Role: ${c.profession} at ${c.company} | Tags: ${(c.tags || []).join(", ")} | Notes: ${c.notes || ""}`).join("\n");

    const prompt = `You are the Superconnector AI for Momentum Event OS at "${eventName || "Global Conference"}".
Analyze this attendee list of ${list.length} connections. Identify up to 3 synergistic pairs where introducing Person A to Person B creates immense mutual value (e.g. founder meets investor, AI engineer meets product lead, complimentary regional expansion).

Contacts:
"""
${contactsSummary}
"""

Return a JSON object:
{
  "recommendations": [
    {
      "id": "intro-1",
      "personAId": "ID of first person",
      "personBId": "ID of second person",
      "synergyReason": "Why these two must connect (2 sentences)",
      "sharedInterests": ["Shared theme 1", "Shared theme 2"],
      "suggestedSubject": "Warm intro subject line",
      "draftIntroMessage": "A crisp, professional double-opt-in intro email or WhatsApp message connecting Person A and Person B.",
      "channel": "whatsapp" | "email" | "linkedin"
    }
  ]
}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.recommendations)) {
        const enriched = parsed.recommendations.map((rec: any, idx: number) => {
          const pA = list.find(c => c.id === rec.personAId) || list[0];
          const pB = list.find(c => c.id === rec.personBId && c.id !== pA.id) || list[1] || list[0];
          return {
            id: rec.id || `intro-${Date.now()}-${idx}`,
            personA: pA,
            personB: pB,
            synergyReason: rec.synergyReason || `${pA.name} and ${pB.name} share complimentary focus areas in ${eventName || "tech"}.`,
            sharedInterests: rec.sharedInterests || ["Innovation", "Collaboration"],
            suggestedSubject: rec.suggestedSubject || `Connecting ${pA.name} & ${pB.name} (${eventName || "Event"})`,
            draftIntroMessage: rec.draftIntroMessage || `Hi ${pA.name.split(' ')[0]} and ${pB.name.split(' ')[0]}, wanted to connect you both after ${eventName || "the event"}. ${pA.name} is working on ${pA.profession} and ${pB.name} is leading ${pB.profession}. Thought you'd love to chat!`,
            channel: rec.channel || 'whatsapp',
          };
        });
        return res.json({ recommendations: enriched, source: "gemini" });
      }
    }
  } catch (err) {
    console.warn("Warm intro error:", err);
  }

  // Fallback pairing
  const pA = list[0];
  const pB = list[1] || list[0];
  return res.json({
    recommendations: [
      {
        id: `intro-${Date.now()}`,
        personA: pA,
        personB: pB,
        synergyReason: `Both ${pA.name} and ${pB.name} are scaling initiatives aligned with the event's core themes.`,
        sharedInterests: ["Strategic Growth", "Technology"],
        suggestedSubject: `Intro: ${pA.name} <> ${pB.name}`,
        draftIntroMessage: `Hi ${pA.name.split(' ')[0]} and ${pB.name.split(' ')[0]}, introducing you two! Thought you'd have great synergies collaborating post-event.`,
        channel: "whatsapp",
      }
    ],
    source: "offline-fallback",
  });
});

// 2. AI Pitch Simulator & Charisma Coach
app.post(["/api/ai/pitch-simulator", "/api/gemini/pitch-simulator"], async (req, res) => {
  const { pitchText, personaKey, eventName, targetTimeSec } = req.body;

  const safePitch = sanitizeText(pitchText, 2000);
  const safePersona = sanitizeText(personaKey, 50) || "tech-vc";

  try {
    const prompt = `You are an elite Pitch & Charisma Coach in Momentum Event OS.
Evaluate this attendee's 30-60s elevator pitch at "${eventName || "the conference"}".

Simulated Persona: ${safePersona} (Options: 'tech-vc', 'angel-investor', 'tech-lead', 'potential-client', 'keynote-speaker', 'co-founder')
Target Time: ${targetTimeSec || 30} seconds
Pitch Delivered:
"""
${safePitch}
"""

Evaluate ruthlessly but constructively. Return a JSON object:
{
  "score": 88, // Overall score 0-100
  "hookScore": 9, // 1-10
  "clarityScore": 8, // 1-10
  "deliveryScore": 8, // 1-10
  "strengths": ["Array of 2-3 specific things that landed well"],
  "weaknesses": ["Array of 2-3 specific friction points or vague words"],
  "fillerWordsDetected": ["Array of filler or weak words e.g. 'basically', 'kind of'"],
  "tailoredRewrite": "A punchy, hypnotic 30-second rewrite of this exact pitch that hooks instantly and ends with a clear call-to-action.",
  "suggestedClosingHook": "A natural 1-sentence closing question that invites an immediate coffee or exchange.",
  "personaResponse": "How the simulated ${safePersona} persona would realistically respond in character to this pitch in a noisy hallway."
}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        ...parsed,
        source: "gemini",
      });
    }
  } catch (err) {
    console.warn("Pitch simulator error:", err);
  }

  // High quality offline fallback
  return res.json({
    score: 82,
    hookScore: 8,
    clarityScore: 8,
    deliveryScore: 8,
    strengths: ["Clear core proposition", "Good enthusiasm", "Relevant to conference domain"],
    weaknesses: ["Could tighten the opening hook", "Make the closing ask more specific"],
    fillerWordsDetected: ["basically", "like"],
    tailoredRewrite: `We are building the next-generation infrastructure for ${eventName || "frontier innovation"}. We solve the core bottleneck in 10x less time. I'd love to show you a 60-second demo—are you free for a quick coffee after this session?`,
    suggestedClosingHook: "What is your team's biggest focus in this space right now?",
    personaResponse: "That sounds intriguing. Send me a quick WhatsApp note with the one-pager and let's touch base next week.",
    source: "offline-fallback",
  });
});

// 3. AI Batch Personalized Follow-Up Composer
app.post(["/api/ai/batch-follow-ups", "/api/gemini/batch-follow-ups"], async (req, res) => {
  const { connections, eventName, profileName } = req.body;
  const list = Array.isArray(connections) ? connections : [];

  try {
    const listSummary = list.map(c => `ID: ${c.id} | Name: ${c.name} | Role: ${c.profession} at ${c.company} | Channel: ${c.whatsapp ? 'whatsapp' : (c.email ? 'email' : 'linkedin')} | Notes: ${c.notes || ""}`).join("\n");

    const prompt = `You are the Executive Follow-Up Strategist for ${profileName || "the attendee"} at "${eventName || "the event"}".
Generate unique, warm, high-converting follow-up outreach messages for each of the following ${list.length} connections.

Attendee: ${profileName || "Attendee"}
Event: ${eventName || "Conference"}

Connections:
"""
${listSummary}
"""

Return a JSON object:
{
  "messages": [
    {
      "connectionId": "ID of connection",
      "subject": "Email subject (if email) or quick hook",
      "message": "Personalized 2-3 sentence follow-up referencing their role/company and event context with an easy low-friction next step.",
      "channel": "whatsapp" | "email" | "linkedin"
    }
  ]
}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });
    if (text) {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.messages)) {
        return res.json({ messages: parsed.messages, source: "gemini" });
      }
    }
  } catch (err) {
    console.warn("Batch follow up error:", err);
  }

  // Fallback
  const fallbackMessages = list.map(c => ({
    connectionId: c.id,
    subject: `Great meeting at ${eventName || "the event"}!`,
    message: `Hi ${c.name.split(' ')[0]}, really enjoyed our conversation at ${eventName || "the event"} regarding your work at ${c.company || "your team"}. Would love to stay connected and follow up on our discussion!`,
    channel: c.whatsapp ? 'whatsapp' : (c.email ? 'email' : 'linkedin'),
  }));

  return res.json({ messages: fallbackMessages, source: "offline-fallback" });
});

// 4. AI Event ROI & Networking Scorecard
app.post(["/api/ai/event-roi-analytics", "/api/gemini/event-roi-analytics"], async (req, res) => {
  const { connections, moments, ideas, notes, eventName, targetConnections } = req.body;

  const cCount = Array.isArray(connections) ? connections.length : 0;
  const mCount = Array.isArray(moments) ? moments.length : 0;
  const iCount = Array.isArray(ideas) ? ideas.length : 0;
  const nCount = Array.isArray(notes) ? notes.length : 0;
  const target = targetConnections || 50;

  try {
    const prompt = `You are the Chief ROI Auditor for Momentum Universal Event OS.
Evaluate the executive ROI of attending "${eventName || "Conference"}".

Data Metrics:
- Total Connections Met: ${cCount} (Target: ${target})
- Moments / Badges Captured: ${mCount}
- Keynote Ideas / Quotes: ${iCount}
- Deep Session Notes & Transcripts: ${nCount}

Return a JSON object:
{
  "roiScore": 94, // 0-100
  "networkingVelocity": "e.g. 6.2 contacts/hour (Top 5% Tier)",
  "relationshipEquityScore": "e.g. High ($12,500 Estimated Lifetime Value)",
  "keyWins": ["Array of 3 top strategic wins achieved"],
  "followUpActionPlan": ["Array of 3 high-priority 48-hour follow-up actions"],
  "executiveSummary": "A punchy 2-paragraph ROI assessment celebrating performance and detailing how this event will drive 12-month career and business leverage."
}`;

    const text = await generateWithFallback(prompt, { responseMimeType: "application/json" });
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({ ...parsed, source: "gemini" });
    }
  } catch (err) {
    console.warn("Event ROI error:", err);
  }

  return res.json({
    roiScore: Math.min(100, Math.round((cCount / target) * 85 + (nCount * 3) + (mCount * 2))),
    networkingVelocity: `${(cCount / 4).toFixed(1)} contacts/active hour`,
    relationshipEquityScore: "High Impact Tier",
    keyWins: [
      `Met ${cCount} strategic contacts across high-growth verticals`,
      `Captured ${nCount} deep session notes with verbatim transcripts`,
      `Documented ${iCount} pivotal keynote quotes and contrarian theses`
    ],
    followUpActionPlan: [
      "Send WhatsApp follow-ups to high-priority connections within 24h",
      "Convert key takeaways into a team briefing or LinkedIn thought leadership post",
      "Schedule follow-up exploration calls with prospective partners"
    ],
    executiveSummary: `Attending ${eventName || "the event"} yielded exceptional relationship equity. With ${cCount} verified connections established, comprehensive session notes logged, and multiple collaborative threads initiated, this event represents a high-leverage milestone for ecosystem expansion.`,
    source: "offline-fallback",
  });
});

// 5. AI Speaker & Event Icebreaker Generator
app.post(["/api/ai/speaker-icebreaker", "/api/gemini/speaker-icebreaker"], async (req, res) => {
  const { speakerName, speakerRole, talkTitle } = req.body;
  try {
    const prompt = `Generate 1 magnetic, thoughtful conversation starter or icebreaker to approach ${speakerName || "the speaker"} (${speakerRole || "Guest"}) who gave a talk on "${talkTitle || "their work"}".
Output ONLY the sentence.`;
    const text = await generateWithFallback(prompt);
    if (text) {
      return res.json({ icebreaker: text.trim(), source: "gemini" });
    }
  } catch (err) {
    console.warn("Icebreaker error:", err);
  }
  return res.json({
    icebreaker: `I was really captivated by your points regarding ${talkTitle || "your talk"}—what was the hardest tradeoff you navigated there?`,
    source: "offline-fallback",
  });
});

// ============================================================
// MOMENTUM INTELLIGENCE ENGINE - GOVERNED API ENDPOINTS
// ============================================================

// 1. Engine Health & Status
app.get("/api/engine/health", (req, res) => {
  res.json(momentumEngine.getHealth());
});

// 2. Event Observation & Ingestion
app.post("/api/engine/observe", async (req, res) => {
  try {
    const result = await momentumEngine.observe(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ accepted: false, error: err?.message });
  }
});

// 3. Connection Value & High-Signal Prediction
app.post("/api/engine/predict", (req, res) => {
  try {
    const prediction = momentumEngine.predict(req.body);
    res.json(prediction);
  } catch (err: any) {
    res.status(400).json({ error: err?.message });
  }
});

// 4. Multi-Objective Contextual Recommendations
app.post("/api/engine/recommend", (req, res) => {
  try {
    const recommendations = momentumEngine.recommend(req.body);
    res.json({ recommendations, count: recommendations.length });
  } catch (err: any) {
    res.status(400).json({ error: err?.message });
  }
});

// 5. Active Hypotheses & Evidence
app.get("/api/engine/hypotheses", (req, res) => {
  res.json({ hypotheses: momentumEngine.hypothesisEngine.getAll() });
});

// 6. Discovered Product Opportunities
app.get("/api/engine/opportunities", (req, res) => {
  res.json({ opportunities: momentumEngine.discoverOpportunities() });
});

// 7. Capability DAG Graph
app.get("/api/engine/capabilities", (req, res) => {
  res.json({ capabilities: momentumEngine.capabilityGraph.getAll() });
});

// 8. Evolutionary Candidates & Lineage
app.get("/api/engine/candidates", (req, res) => {
  res.json({
    champion: momentumEngine.evolutionEngine.getChampion(),
    candidates: momentumEngine.evolutionEngine.getAllCandidates(),
  });
});

// 9. Constitution & Immutable Laws
app.get("/api/engine/constitution", (req, res) => {
  res.json({ laws: momentumEngine.getConstitution() });
});

// 10. Security & Governance Audit Logs
app.get("/api/engine/audit-logs", (req, res) => {
  res.json({ logs: momentumEngine.getRecentAuditLogs(50) });
});

// 11. Trigger Sandboxed Strategy Mutation
app.post("/api/engine/evolve", (req, res) => {
  const candidate = momentumEngine.evolve();
  res.json({ success: !!candidate, candidate });
});

// 12. Toggle Emergency Kill Switches
app.post("/api/engine/kill-switch", (req, res) => {
  const { switchName, state } = req.body;
  if (!switchName) {
    return res.status(400).json({ error: "Missing switchName" });
  }
  momentumEngine.rollbackManager.setKillSwitch(switchName, !!state, "OPERATOR_UI");
  res.json({ success: true, killSwitches: momentumEngine.rollbackManager.getKillSwitches() });
});

// 13. Run Governed Engine Security & Verification Tests
app.post("/api/engine/tests/run", (req, res) => {
  const testReport = runMomentumEngineTests();
  res.json(testReport);
});

// Setup Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Momentum OS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
