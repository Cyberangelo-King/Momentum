import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialize Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Helper to safely call Gemini with automatic model fallback and retry
async function generateWithFallback(
  prompt: string,
  config?: { responseMimeType?: string; responseSchema?: any }
): Promise<string | null> {
  const ai = getGemini();
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
app.post("/api/gemini/quick-message", async (req, res) => {
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
app.post("/api/gemini/summarize-connection", async (req, res) => {
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
app.post("/api/gemini/recap", async (req, res) => {
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
// GEMINI HIGH-PRECISION AUDIO TRANSCRIPTION & SPEECH INTELLIGENCE
// ==========================================

app.post("/api/gemini/transcribe-audio", async (req, res) => {
  const { audioData, mimeType, context } = req.body;

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
Listen carefully to the provided spoken audio. Transcribe it with 100% verbatim accuracy, proper punctuation, sentence capitalization, and domain-aware spelling.

Domain Context:
- Conference: TEDxAkure 2026 (Akure, Ondo State, Nigeria)
- Themes: Technology, African innovation, fintech, engineering, UX design, startup ecosystems, pan-African infrastructure, leadership.
${context ? `Additional user/speaker context: ${context}` : ""}

Return a JSON object with:
1. "transcript": Full, punctuated, pristine transcript of everything spoken.
2. "title": A crisp, punchy 3-6 word title summarizing the spoken thought.
3. "keyPoints": Array of 2-4 key bullet points summarizing core insights.
4. "suggestedTags": Array of 3-4 hashtags (e.g. ["#TEDxAkure", "#TechInnovation", "#StartupGrowth"]).
5. "speakersDetected": Estimated number of speakers (number).`;

    const ai = getGemini();
    if (!ai) {
      return res.json({
        transcript: "Voice memo captured successfully at TEDxAkure 2026.",
        title: "Voice Reflection",
        keyPoints: ["Spoken moment captured at TEDxAkure 2026."],
        suggestedTags: ["#TEDxAkure", "#VoiceMemo"],
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
        // Continue to fallback candidate
      }
    }

    if (resultText) {
      try {
        const parsed = JSON.parse(resultText);
        return res.json({
          transcript: parsed.transcript || "Transcribed audio note.",
          title: parsed.title || "Voice Note",
          keyPoints: parsed.keyPoints || ["Key takeaway from voice reflection."],
          suggestedTags: parsed.suggestedTags || ["#TEDxAkure"],
          speakersDetected: parsed.speakersDetected || 1,
          source: "gemini",
        });
      } catch {
        // Fallback if parse fails
      }
    }

    return res.json({
      transcript: "Voice memo captured at TEDxAkure 2026.",
      title: "Spoken Memo",
      keyPoints: ["Live event reflection."],
      suggestedTags: ["#TEDxAkure"],
      speakersDetected: 1,
      source: "offline-fallback",
    });
  } catch (err) {
    console.error("Transcribe audio error:", err);
    return res.json({
      transcript: "Voice memo captured at TEDxAkure 2026.",
      title: "Spoken Memo",
      keyPoints: ["Live event reflection."],
      suggestedTags: ["#TEDxAkure"],
      speakersDetected: 1,
      source: "offline-fallback",
    });
  }
});

// API: Refine and format raw speech transcript
app.post("/api/gemini/refine-transcript", async (req, res) => {
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
// GEMINI SMART NOTE CO-PILOT & ENHANCEMENT ENGINE
// ==========================================

app.post("/api/gemini/enhance-note", async (req, res) => {
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
// GEMINI SPEAKER QUESTION GENERATOR ENGINE
// ==========================================

app.post("/api/gemini/generate-questions", async (req, res) => {
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
