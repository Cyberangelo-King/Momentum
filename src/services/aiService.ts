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

export interface AudioTranscribeResponse {
  transcript: string;
  title: string;
  keyPoints: string[];
  suggestedTags: string[];
  speakersDetected?: number;
  source: 'gemini' | 'offline-fallback';
}

export interface RefineTranscriptResponse {
  refinedTranscript: string;
  title: string;
  keyPoints: string[];
  suggestedTags: string[];
  source: 'gemini' | 'offline-fallback';
}

export interface EnhanceNoteResponse {
  title?: string;
  summary?: string;
  structuredContent: string;
  keyTakeaways: string[];
  actionItems: { id: string; text: string; done?: boolean; completed?: boolean; priority?: 'high' | 'medium' | 'low'; context?: string }[];
  suggestedQuestions: { id: string; question: string; angle?: string; context?: string; targetAngle?: string; whyItWorks?: string; followUpHook?: string }[];
  suggestedTags: string[];
  tags?: string[];
  source: 'gemini' | 'offline-fallback';
}

export interface SpeakerQuestionsResponse {
  questions: {
    id: string;
    question: string;
    angle: string;
    targetAngle?: string;
    context?: string;
    whyItWorks?: string;
    followUpHook?: string;
  }[];
  speakerIcebreaker: string;
  source: 'gemini' | 'offline-fallback';
}

export async function transcribeAudioWithGemini(
  audioData: string,
  mimeType: string = 'audio/webm',
  context?: string
): Promise<AudioTranscribeResponse> {
  try {
    const res = await fetch('/api/gemini/transcribe-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioData, mimeType, context }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini audio transcription error, using offline fallback', e);
  }

  return {
    transcript: 'Audio recording captured at TEDxAkure 2026.',
    title: 'Spoken Reflection',
    keyPoints: ['Audio recorded during conference session.'],
    suggestedTags: ['#TEDxAkure', '#VoiceMemo'],
    speakersDetected: 1,
    source: 'offline-fallback',
  };
}

export async function refineTranscriptWithGemini(
  transcript: string,
  context?: string
): Promise<RefineTranscriptResponse> {
  try {
    const res = await fetch('/api/gemini/refine-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, context }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini transcript refinement error', e);
  }

  return {
    refinedTranscript: transcript,
    title: 'Refined Voice Note',
    keyPoints: [],
    suggestedTags: ['#TEDxAkure'],
    source: 'offline-fallback',
  };
}

export async function enhanceNoteWithGemini(
  paramsOrTitle:
    | {
        title: string;
        content: string;
        category?: string;
        speakerName?: string;
        sessionTitle?: string;
        action?: 'structure' | 'action_items' | 'takeaways' | 'questions' | 'all';
      }
    | string,
  maybeContent?: string,
  maybeContext?: string
): Promise<EnhanceNoteResponse> {
  const payload =
    typeof paramsOrTitle === 'string'
      ? {
          title: paramsOrTitle,
          content: maybeContent || '',
          sessionTitle: maybeContext,
        }
      : paramsOrTitle;

  try {
    const res = await fetch('/api/gemini/enhance-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini note enhance error', e);
  }

  return {
    title: payload.title,
    structuredContent: payload.content,
    keyTakeaways: [`Key insight captured during ${payload.sessionTitle || payload.speakerName || 'TEDxAkure'}.`],
    actionItems: [{ id: `a_${Date.now()}`, text: 'Follow up on session takeaways', done: false, completed: false }],
    suggestedQuestions: [
      {
        id: `q_${Date.now()}`,
        question: `What was the most surprising takeaway during your execution of this?`,
        angle: 'Execution',
        targetAngle: 'Execution',
        context: 'Unlocks deeper operational learnings.',
      },
    ],
    suggestedTags: ['#TEDxAkure', '#SmartNotes'],
    tags: ['#TEDxAkure', '#SmartNotes'],
    source: 'offline-fallback',
  };
}

export async function generateSpeakerQuestions(
  paramsOrSpeaker:
    | {
        speakerName: string;
        speakerRole?: string;
        topic?: string;
        sessionTitle?: string;
        talkNotes?: string;
        angle?: 'provocative' | 'practical' | 'ecosystem' | 'networking' | 'rapid_fire' | 'mixed';
      }
    | string,
  maybeTopic?: string,
  maybeNotes?: string
): Promise<SpeakerQuestionsResponse> {
  const payload =
    typeof paramsOrSpeaker === 'string'
      ? {
          speakerName: paramsOrSpeaker,
          topic: maybeTopic,
          sessionTitle: maybeTopic,
          talkNotes: maybeNotes,
        }
      : paramsOrSpeaker;

  try {
    const res = await fetch('/api/gemini/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini speaker question generator error', e);
  }

  const topicName = payload.topic || payload.sessionTitle || 'innovation';
  return {
    questions: [
      {
        id: `q_off_1`,
        question: `In your work regarding ${topicName}, what was the most counterintuitive operational hurdle your team had to overcome?`,
        angle: 'Execution Playbook',
        targetAngle: 'Execution Playbook',
        whyItWorks: 'Bypasses standard talking points to unlock real operational depth.',
        context: 'Bypasses standard talking points to unlock real operational depth.',
        followUpHook: 'How did that inform your long-term scaling strategy?',
      },
      {
        id: `q_off_2`,
        question: `What is one commonly accepted industry assumption about ${topicName} that you believe is completely outdated in emerging African markets?`,
        angle: 'Thought-Provoking',
        targetAngle: 'Thought-Provoking',
        whyItWorks: 'Invites the speaker to share their most compelling contrarian insight.',
        context: 'Invites the speaker to share their most compelling contrarian insight.',
        followUpHook: 'What was the earliest metric that proved this to you?',
      },
      {
        id: `q_off_3`,
        question: `Looking across West Africa over the next 3-5 years, which adjacent infrastructure layer needs to evolve fastest to support your vision?`,
        angle: 'Ecosystem Scale',
        targetAngle: 'Ecosystem Scale',
        whyItWorks: 'Directly contextualizes their talk into regional macro impact at TEDxAkure.',
        context: 'Directly contextualizes their talk into regional macro impact at TEDxAkure.',
        followUpHook: 'Are there local players you are actively looking to partner with on this?',
      },
      {
        id: `q_off_4`,
        question: `What was the hardest pivot or hypothesis you had to abandon before reaching this milestone?`,
        angle: '1-on-1 Opener',
        targetAngle: '1-on-1 Opener',
        whyItWorks: 'Creates genuine authentic empathy when approaching the speaker backstage or during networking.',
        context: 'Creates genuine authentic empathy when approaching the speaker backstage or during networking.',
        followUpHook: "I'd love to exchange contacts to keep following your journey.",
      },
    ],
    speakerIcebreaker: `Hi ${payload.speakerName || 'there'}, really loved your session on ${topicName}! Your point about regional execution really stood out.`,
    source: 'offline-fallback',
  };
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
