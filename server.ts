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
  profile: any | null;
  security: any | null;
}

let serverSyncState: ServerSyncState = {
  version: 1,
  lastUpdatedAt: new Date().toISOString(),
  connections: null,
  moments: null,
  ideas: null,
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
      profile: serverSyncState.profile,
      security: serverSyncState.security,
    },
  });
});

// POST: Push local updates from any device to all other devices
app.post("/api/sync/push", (req, res) => {
  const { deviceId, connections, moments, ideas, profile, security } = req.body;

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
