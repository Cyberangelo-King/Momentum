import { Connection } from '../types';

export interface QuickMessageResponse {
  message: string;
  source: 'gemini' | 'offline-template' | 'offline-fallback';
}

export interface SummarizeResponse {
  memoryPoints: string[];
  suggestedTags: string[];
  priority?: string;
}

export interface RecapResponse {
  dailySynthesis: string;
  themes: string[];
  linkedInPost: string;
}

export async function generateQuickMessage(
  connection: Partial<Connection>,
  channel: 'whatsapp' | 'linkedin' | 'email'
): Promise<QuickMessageResponse> {
  try {
    const res = await fetch('/api/gemini/quick-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: connection.name,
        company: connection.company,
        profession: connection.profession,
        relationship: connection.relationship,
        notes: connection.notes,
        channel,
        talkContext: connection.eventContext,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Network request to AI failed, using offline fallback', e);
  }

  // Pure client fallback if server unavailable
  if (channel === 'whatsapp') {
    return {
      message: `Hi ${connection.name || 'there'}! It was fantastic connecting with you at TEDxAkure 2026. Really appreciated our conversation about ${connection.notes || 'our shared projects'}. Let's keep the momentum going! 🚀`,
      source: 'offline-fallback',
    };
  }
  if (channel === 'linkedin') {
    return {
      message: `Hi ${connection.name || 'there'}, it was great meeting you at TEDxAkure 2026. I really enjoyed our discussion regarding ${connection.company ? `${connection.company}'s work` : 'industry developments'}. Let's stay connected!`,
      source: 'offline-fallback',
    };
  }
  return {
    message: `Dear ${connection.name || 'there'},\n\nIt was a pleasure meeting you at TEDxAkure 2026 today. I really enjoyed our conversation regarding ${connection.notes || 'tech ecosystem opportunities'}.\n\nLooking forward to staying in touch and exploring potential synergies.\n\nBest regards,\nAlex Mercer`,
    source: 'offline-fallback',
  };
}

export async function summarizeConnection(
  name: string,
  company: string,
  notes: string
): Promise<SummarizeResponse> {
  try {
    const res = await fetch('/api/gemini/summarize-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, company, notes }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Summarize API fallback', e);
  }

  return {
    memoryPoints: [
      `Met ${name} from ${company || 'the conference'} during TEDxAkure.`,
      notes ? `Key discussion note: "${notes}"` : 'Shared perspectives on scaling innovation in West Africa.',
      'Scheduled follow-up to continue the discussion.',
    ],
    suggestedTags: ['#TEDxAkure', '#Networking', '#Innovation'],
    priority: 'High',
  };
}

export async function generateDailyRecap(
  totalConnections: number,
  momentsCount: number,
  ideasCount: number,
  connectionNames: string[],
  topIdeas: string[]
): Promise<RecapResponse> {
  try {
    const res = await fetch('/api/gemini/recap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalConnections,
        momentsCount,
        ideasCount,
        connectionNames,
        topIdeas,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Recap API fallback', e);
  }

  return {
    dailySynthesis: `Your interactions today clustered around two powerful themes: Pan-African logistics and AI ethics in emerging markets. You established ${totalConnections} key touchpoints with speakers leading these discussions.`,
    themes: ['Pan-African Logistics', 'AI Ethics', 'Emerging Markets'],
    linkedInPost: `I came to TEDxAkure 2026 with one bold goal: meet 50 changemakers and document the journey.\n\nToday I connected with ${totalConnections} remarkable founders and thinkers, captured ${momentsCount} memorable moments, and refined ${ideasCount} key insights.\n\nThe future of African tech has undeniable momentum!\n\n#TEDxAkure #Momentum #Innovation #AfricanTech #Networking`,
  };
}
