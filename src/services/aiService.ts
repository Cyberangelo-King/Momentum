import { Connection, SpeakerBriefing, PostEventReflection, EventSession, Note, Idea, Moment, UserProfile, TranscriptSegment, WarmIntroRecommendation, PitchFeedback } from '../types';

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
  rawTranscript?: string;
  structuredTranscript?: string;
  transcript: string;
  title: string;
  keyPoints: string[];
  actionItems?: { id: string; text: string; done?: boolean }[];
  suggestedTags: string[];
  segments?: TranscriptSegment[];
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

export interface ExtractInsightsResponse {
  coreTheses: string[];
  standoutTakeaways: string[];
  contrarianInsights: string[];
  unansweredQuestions: string[];
  actionItems: { id: string; text: string; priority?: 'high' | 'medium' | 'low'; done: boolean }[];
  structuredSummary: string;
  source: 'gemini' | 'offline-fallback';
}

export async function fetchSpeakerBriefing(session: Partial<EventSession>): Promise<SpeakerBriefing> {
  try {
    const res = await fetch('/api/gemini/speaker-briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        speakerName: session.speaker || session.speakerName,
        speakerRole: session.speakerRole,
        speakerBio: session.speakerBio || session.description,
        sessionTitle: session.title,
        stage: session.stage,
        topics: session.topics,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini speaker briefing error:', e);
  }

  const speaker = session.speaker || session.speakerName || 'Speaker';
  return {
    speakerName: speaker,
    speakerRole: session.speakerRole || 'Thought Leader',
    speakerBio: session.description || 'Featured speaker at TEDxAkure 2026.',
    whyItMatters: `${speaker}'s session explores essential strategies for African technology and ecosystem growth.`,
    coreThemes: ['Regional Tech Scaling', 'Operational Resilience', 'Talent Ecosystems'],
    recommendedAngles: ['Operational Execution', 'Overcoming Constraints', 'Long-term Sustainability'],
    preGeneratedQuestions: [
      {
        id: `q_pre_${Date.now()}`,
        question: `What was the most surprising operational tradeoff you made while building this?`,
        angle: 'Practical Playbook',
        whyItWorks: 'Encourages transparent operational war stories.',
        followUpHook: 'How has that evolved as you scaled?',
      },
    ],
    source: 'offline-dossier',
  };
}

export async function extractInsightsWithGemini(params: {
  content: string;
  rawTranscript?: string;
  speakerName?: string;
  sessionTitle?: string;
  category?: string;
}): Promise<ExtractInsightsResponse> {
  try {
    const res = await fetch('/api/gemini/extract-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini extract insights error:', e);
  }

  return {
    coreTheses: ['Ecosystem growth accelerates when tailored directly to regional conditions.'],
    standoutTakeaways: [params.content.slice(0, 150)],
    contrarianInsights: ['Navigating local constraints produces higher structural defensibility.'],
    unansweredQuestions: ['How can decentralized infrastructure scale faster across West Africa?'],
    actionItems: [
      {
        id: `a_${Date.now()}`,
        text: `Review key takeaways from ${params.speakerName || 'session'}`,
        priority: 'medium',
        done: false,
      },
    ],
    structuredSummary: 'Session note logged and synthesized.',
    source: 'offline-fallback',
  };
}

export async function fetchPostEventReview(data: {
  connections: Connection[];
  moments: Moment[];
  ideas: Idea[];
  notes: Note[];
  sessions: EventSession[];
  profile: UserProfile;
}): Promise<PostEventReflection> {
  try {
    const res = await fetch('/api/gemini/post-event-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Gemini post-event review error:', e);
  }

  const connCount = data.connections.length;
  return {
    whatHappened: {
      totalSessionsAttended: data.sessions.length || 3,
      totalConnectionsMet: connCount,
      sessionsSummary: ['Attended sessions across regional infrastructure, UX design, and AI.'],
      timelineHighlights: ['TEDxAkure Kickoff', 'Morning Keynotes', 'Networking Exchange'],
    },
    whatILearned: {
      coreTheses: ['African innovation gains velocity from tailored regional architectures.'],
      synthesizedConcepts: ['Intent-driven product friction enhances long-term retention.'],
      standoutQuotes: data.ideas.slice(0, 3).map((i) => ({ quote: i.quote, speaker: i.speakerName, sessionTitle: i.sessionTitle })),
    },
    whatChangedMyThinking: {
      contrarianInsights: ['Operational constraints breed superior product focus.'],
      worldviewShifts: ['Tier-2 tech ecosystems are pioneering breakthrough grassroots innovation.'],
    },
    whatIShouldDoNext: {
      immediate24h: [
        { id: 'act_1', text: 'Send personalized WhatsApp follow-ups to high priority connections', priority: 'high', done: false },
      ],
      thisWeek: [
        { id: 'act_2', text: 'Synthesize raw conference audio into action playbooks', priority: 'medium', done: false },
      ],
      strategicGoals: ['Incorporate TEDxAkure learnings into active project roadmaps.'],
    },
    whoToFollowUpWith: {
      keyPeople: data.connections.slice(0, 3).map((c) => ({
        name: c.name,
        company: c.company || 'Innovator',
        reason: `Follow up regarding ${c.notes ? c.notes.slice(0, 40) : 'our chat'}`,
        recommendedChannel: 'whatsapp' as const,
        draftText: `Hi ${c.name.split(' ')[0]}, great meeting you at TEDxAkure 2026! Let's keep in touch.`,
      })),
    },
    executiveSummary: `TEDxAkure 2026 generated tremendous momentum with ${connCount} high-value connections and actionable keynote takeaways.`,
    linkedInRecapPost: `I had an incredible time connecting with ${connCount} brilliant minds at TEDxAkure 2026! Inspiring talks on innovation and technology.\n\n#TEDxAkure #Momentum #AfricanTech`,
    generatedAt: new Date().toISOString(),
    source: 'offline-synthesis',
  };
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

export interface ParseAgendaResponse {
  sessions: EventSession[];
  detectedStages: string[];
  source: 'gemini' | 'offline-fallback';
}

export async function parseAgendaText(
  rawText: string,
  eventName?: string,
  defaultStage?: string
): Promise<ParseAgendaResponse> {
  try {
    const res = await fetch('/api/events/parse-agenda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, eventName, defaultStage }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Parse agenda API error, using fallback', e);
  }

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 3);
  const fallbackSessions: EventSession[] = lines.slice(0, 5).map((line, idx) => ({
    id: `s-parsed-${Date.now()}-${idx + 1}`,
    title: line.replace(/^\d+[:.]\s*/, '').slice(0, 60),
    speaker: 'Featured Speaker',
    speakerRole: 'Industry Specialist',
    timeStr: `${9 + idx}:00 AM`,
    stage: defaultStage || 'Main Stage',
    status: 'upcoming' as const,
    description: line,
    heroImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
    topics: ['Keynote', 'Session'],
  }));

  return {
    sessions: fallbackSessions,
    detectedStages: [defaultStage || 'Main Stage'],
    source: 'offline-fallback',
  };
}

export async function fetchWarmIntroRecommendations(
  connections: Connection[],
  eventName?: string
): Promise<{ recommendations: WarmIntroRecommendation[]; source: 'gemini' | 'offline-fallback' }> {
  try {
    const res = await fetch('/api/gemini/warm-intro-matchmaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connections, eventName }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Warm intro matchmaker error:', e);
  }

  if (connections.length < 2) {
    return { recommendations: [], source: 'offline-fallback' };
  }

  const pA = connections[0];
  const pB = connections[1];
  return {
    recommendations: [
      {
        id: `intro-${Date.now()}`,
        personA: pA,
        personB: pB,
        synergyReason: `Both ${pA.name} and ${pB.name} have synergistic skillsets in ${eventName || 'frontier innovation'}.`,
        sharedInterests: ['Ecosystem Growth', 'Scaling Tech'],
        suggestedSubject: `Connecting ${pA.name} & ${pB.name}`,
        draftIntroMessage: `Hi ${pA.name.split(' ')[0]} & ${pB.name.split(' ')[0]}, introducing you two! Thought you'd have great synergies collaborating following ${eventName || 'the event'}.`,
        channel: 'whatsapp',
      },
    ],
    source: 'offline-fallback',
  };
}

export async function fetchPitchSimulation(
  pitchText: string,
  personaKey: string = 'tech-vc',
  eventName?: string,
  targetTimeSec: number = 30
): Promise<PitchFeedback & { source: 'gemini' | 'offline-fallback' }> {
  try {
    const res = await fetch('/api/gemini/pitch-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pitchText, personaKey, eventName, targetTimeSec }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Pitch simulator error:', e);
  }

  return {
    score: 84,
    hookScore: 8,
    clarityScore: 8,
    deliveryScore: 8,
    strengths: ['Clear core value proposition', 'Good relevance to the event context', 'High energy'],
    weaknesses: ['Opening could be more punchy', 'Make the call to action friction-free'],
    fillerWordsDetected: ['basically'],
    tailoredRewrite: `We are building the future of event intelligence. We eliminate networking friction and turn raw conversations into verified deals. I'd love to share a 30-second live preview—are you free for a coffee right after this panel?`,
    suggestedClosingHook: 'What is your single biggest bottleneck in this space right now?',
    personaResponse: "Sounds sharp. Ping me on WhatsApp with your one-pager and let's set up a time next week.",
    source: 'offline-fallback',
  };
}

export async function fetchBatchFollowUps(
  connections: Connection[],
  eventName?: string,
  profileName?: string
): Promise<{ messages: Array<{ connectionId: string; subject: string; message: string; channel: 'whatsapp' | 'email' | 'linkedin' }>; source: 'gemini' | 'offline-fallback' }> {
  try {
    const res = await fetch('/api/gemini/batch-follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connections, eventName, profileName }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Batch follow-ups error:', e);
  }

  const fallback = connections.map((c) => ({
    connectionId: c.id,
    subject: `Great meeting you at ${eventName || 'the event'}!`,
    message: `Hi ${c.name.split(' ')[0]}, it was fantastic connecting with you at ${eventName || 'the event'}! Loved hearing about your focus at ${c.company || 'your team'}. Let's stay in touch!`,
    channel: (c.whatsapp ? 'whatsapp' : (c.email ? 'email' : 'linkedin')) as 'whatsapp' | 'email' | 'linkedin',
  }));

  return { messages: fallback, source: 'offline-fallback' };
}

export async function fetchEventROIAnalytics(
  connections: Connection[],
  moments: Moment[],
  ideas: Idea[],
  notes: Note[],
  eventName?: string,
  targetConnections: number = 50
): Promise<{
  roiScore: number;
  networkingVelocity: string;
  relationshipEquityScore: string;
  keyWins: string[];
  followUpActionPlan: string[];
  executiveSummary: string;
  source: 'gemini' | 'offline-fallback';
}> {
  try {
    const res = await fetch('/api/gemini/event-roi-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connections, moments, ideas, notes, eventName, targetConnections }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Event ROI error:', e);
  }

  const cCount = connections.length;
  const nCount = notes.length;
  const mCount = moments.length;
  const iCount = ideas.length;

  return {
    roiScore: Math.min(100, Math.round((cCount / targetConnections) * 85 + nCount * 3 + mCount * 2)),
    networkingVelocity: `${(cCount / 4).toFixed(1)} contacts/hr`,
    relationshipEquityScore: 'Tier 1 High Impact',
    keyWins: [
      `Met ${cCount} strategic contacts across high-growth verticals`,
      `Captured ${nCount} deep session notes with verbatim transcripts`,
      `Documented ${iCount} pivotal keynote quotes and contrarian theses`,
    ],
    followUpActionPlan: [
      'Send WhatsApp follow-ups to high-priority connections within 24h',
      'Convert key takeaways into a team briefing or LinkedIn thought leadership post',
      'Schedule follow-up exploration calls with prospective partners',
    ],
    executiveSummary: `Attending ${eventName || 'the event'} yielded exceptional relationship equity. With ${cCount} verified connections established, comprehensive session notes logged, and multiple collaborative threads initiated, this event represents a high-leverage milestone for ecosystem expansion.`,
    source: 'offline-fallback',
  };
}

export async function fetchEventIcebreakers(
  eventName: string,
  eventType: string,
  themeDescription?: string,
  location?: string
): Promise<{ icebreakers: string[]; source: 'gemini' | 'offline-fallback' }> {
  try {
    const res = await fetch('/api/gemini/speaker-icebreaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        speakerName: eventName,
        speakerRole: eventType,
        talkTitle: themeDescription || `${eventType} at ${location || 'Global'}`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.icebreaker) {
        return {
          icebreakers: [
            data.icebreaker,
            `What brought you specifically to ${eventName} this year?`,
            `What is the most unexpected insight you've picked up from the floor today?`,
            `What is the biggest operational hurdle your team is solving right now?`,
          ],
          source: 'gemini',
        };
      }
    }
  } catch (err) {
    console.warn('AI Icebreakers fallback:', err);
  }

  return {
    icebreakers: [
      `What brought you specifically to ${eventName} this year?`,
      `What is the single most valuable talk or session you've attended so far?`,
      `What is the primary breakthrough or milestone you're aiming for this quarter?`,
      `How did you first get into your current industry niche?`,
    ],
    source: 'offline-fallback',
  };
}


