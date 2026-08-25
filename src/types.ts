export type RelationshipType = 'peer' | 'mentor' | 'lead' | 'speaker';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type FollowUpStatus = 'today' | 'upcoming' | 'overdue' | 'completed';
export type FollowUpPipelineStage = 'to-send' | 'sent' | 'replied' | 'meeting' | 'meeting-booked' | 'closed-deal' | 'completed';
export type MomentType = 'photo' | 'video' | 'note' | 'voice' | 'bookmark';
export type QuickCaptureType = 'idea' | 'note' | 'quote' | 'question' | 'action' | 'bookmark' | 'recording';

export interface WarmIntroRecommendation {
  id: string;
  personA: Connection;
  personB: Connection;
  synergyReason: string;
  sharedInterests: string[];
  suggestedSubject: string;
  draftIntroMessage: string;
  channel: 'whatsapp' | 'email' | 'linkedin';
}

export interface PitchFeedback {
  score: number; // 0-100
  hookScore: number; // 1-10
  clarityScore: number; // 1-10
  deliveryScore: number; // 1-10
  strengths: string[];
  weaknesses: string[];
  fillerWordsDetected: string[];
  tailoredRewrite: string;
  suggestedClosingHook: string;
  personaResponse: string;
}

export interface EventVenueKit {
  wifiSsid?: string;
  wifiPassword?: string;
  floorMapUrl?: string;
  powerOutlets?: string[];
  quietZones?: string[];
  foodNotes?: string[];
  emergencyContact?: string;
}

export interface TranscriptSegment {
  id: string;
  startOffsetSec: number;
  endOffsetSec?: number;
  timestampFormatted: string; // e.g. "02:14"
  speakerLabel?: string;
  text: string;
}

export interface TranscriptionResult {
  rawTranscript: string; // Unaltered verbatim text stream
  structuredTranscript: string; // Formatted with paragraphs & cleanup
  segments?: TranscriptSegment[];
  keyPoints?: string[];
  suggestedTags?: string[];
  title?: string;
  provider: 'gemini-multimodal' | 'web-speech' | 'offline-hybrid';
  confidence?: number;
}

export interface SpeakerBriefing {
  speakerName: string;
  speakerRole: string;
  speakerBio?: string;
  whyItMatters: string;
  coreThemes: string[];
  recommendedAngles: string[];
  preGeneratedQuestions: SpeakerQuestionItem[];
  source: 'gemini' | 'offline-dossier';
}

export interface PostEventReflection {
  whatHappened: {
    totalSessionsAttended: number;
    totalConnectionsMet: number;
    sessionsSummary: string[];
    timelineHighlights: string[];
  };
  whatILearned: {
    coreTheses: string[];
    synthesizedConcepts: string[];
    standoutQuotes: Array<{ quote: string; speaker: string; sessionTitle?: string }>;
  };
  whatChangedMyThinking: {
    contrarianInsights: string[];
    worldviewShifts: string[];
  };
  whatIShouldDoNext: {
    immediate24h: NoteActionItem[];
    thisWeek: NoteActionItem[];
    strategicGoals: string[];
  };
  whoToFollowUpWith: {
    keyPeople: Array<{
      connectionId?: string;
      name: string;
      company: string;
      reason: string;
      recommendedChannel: 'whatsapp' | 'linkedin' | 'email';
      draftText?: string;
    }>;
  };
  executiveSummary: string;
  linkedInRecapPost: string;
  generatedAt: string;
  source: 'gemini' | 'offline-synthesis';
}

export interface NfcExchangeLog {
  id: string;
  timestamp: string; // ISO 8601 string
  timeFormatted?: string; // e.g. "2:45 PM"
  dateFormatted?: string; // e.g. "Aug 24, 2026"
  eventId?: string;
  eventName?: string;
  type: 'bump' | 'tag_read' | 'virtual_beam';
  serialNumber?: string;
  deviceType?: string;
  notes?: string;
}

export interface Connection {
  id: string;
  eventId?: string; // Scoped to active event or global
  name: string;
  profession: string;
  company: string;
  avatarUrl: string;
  photos?: string[]; // Multiple photos/snaps for each connection (business cards, selfies, badges)
  phone?: string;
  whatsapp?: string;
  email?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  notes: string;
  relationship: RelationshipType;
  priority: PriorityLevel;
  followUpDate: string; // YYYY-MM-DD
  followUpStatus: FollowUpStatus;
  metTimestamp: string;
  eventContext: string;
  conversationMemory: string[];
  tags: string[];
  pipelineStage?: FollowUpPipelineStage;
  relatedMomentIds?: string[];
  lastFollowUpMessage?: string;
  isDemo?: boolean;
  isOfflineCaptured?: boolean;
  savedOfflineAt?: string;
  inTrash?: boolean;
  deletedAt?: string;
  // Web-NFC Bump & Hardware Exchange metadata
  isNfcCaptured?: boolean;
  nfcTimestamp?: string;
  nfcExchangeHistory?: NfcExchangeLog[];
}

export interface Moment {
  id: string;
  eventId?: string; // Scoped to active event or global
  type: MomentType;
  title: string;
  caption: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  audioDuration?: string;
  timestamp: string; // e.g. "10:45 AM"
  date: string;
  taggedPeopleIds: string[];
  taggedPeopleNames?: string[];
  location: string;
  sessionId?: string;
  sessionTitle?: string;
  speakerName?: string;
  isDemo?: boolean;
  isOfflineCaptured?: boolean;
  savedOfflineAt?: string;
  inTrash?: boolean;
  deletedAt?: string;
}

export interface Idea {
  id: string;
  eventId?: string; // Scoped to active event or global
  quote: string;
  takeaway?: string;
  speakerName: string;
  speakerRole: string;
  speakerAvatar: string;
  sessionTitle: string;
  sessionId?: string;
  stageName: string;
  timeStr: string;
  category: 'Keynote' | 'Workshop' | 'Fireside Chat' | 'Panel' | 'Design & UX' | 'Leadership' | 'Technology';
  tags: string[];
  isDemo?: boolean;
  isOfflineCaptured?: boolean;
  savedOfflineAt?: string;
  inTrash?: boolean;
  deletedAt?: string;
}

export type NoteCategory =
  | 'Keynote'
  | 'Fireside Chat'
  | 'Workshop'
  | 'Networking'
  | 'Brainstorm'
  | 'Personal Reflection'
  | 'Quick Jot'
  | 'Talk'
  | 'Panel'
  | 'Strategy'
  | 'General';

export interface NoteActionItem {
  id: string;
  text: string;
  done: boolean;
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: string;
  sessionId?: string;
  sessionTitle?: string;
  speakerName?: string;
}

export interface SpeakerQuestionItem {
  id: string;
  question: string;
  angle?: string;
  whyItWorks?: string;
  followUpHook?: string;
  context?: string;
  targetAngle?: string;
  followUpAngle?: string;
  asked?: boolean;
  speakerAnswerNotes?: string;
  sessionId?: string;
  speakerName?: string;
}

export interface Note {
  id: string;
  eventId?: string; // Scoped to active event or global
  title: string;
  content: string; // Raw or user authored text
  rawTranscript?: string; // Verbatim raw audio speech stream (preserved unmodified)
  structuredTranscript?: string; // Cleaned and structured with paragraph markers
  transcriptSegments?: TranscriptSegment[];
  category: NoteCategory;
  speakerName?: string;
  speaker?: string; // alias
  speakerRole?: string;
  sessionTitle?: string;
  sessionId?: string;
  stageName?: string;
  location?: string;
  summary?: string; // AI generated synthesis
  keyTakeaways: string[]; // AI synthesized takeaways
  contrarianInsights?: string[]; // AI identified thinking shifts
  unansweredQuestions?: string[]; // AI questions provoked
  actionItems: NoteActionItem[];
  generatedQuestions: SpeakerQuestionItem[];
  suggestedQuestions?: Array<string | SpeakerQuestionItem>;
  audioAttachmentUrl?: string;
  audioDataUrl?: string;
  audioDuration?: string;
  audioDurationFormatted?: string;
  tags: string[];
  isPinned?: boolean;
  timestamp: string; // e.g. "11:20 AM"
  date: string; // e.g. "Aug 20, 2026"
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  isOfflineCaptured?: boolean;
  savedOfflineAt?: string;
  inTrash?: boolean;
  deletedAt?: string;
}

export type EventType =
  | 'conference'
  | 'summit'
  | 'tedx'
  | 'hackathon'
  | 'unconference'
  | 'trade-expo'
  | 'mastermind'
  | 'meetup'
  | 'workshop';

export type EventColorTheme =
  | 'tangerine'
  | 'cyber-blue'
  | 'emerald'
  | 'purple'
  | 'amber'
  | 'rose'
  | 'crimson';

export interface EventBranding {
  themeKey: EventColorTheme;
  primaryColor: string; // e.g. '#FF5C00'
  accentColor: string; // e.g. '#ff7a33'
  badgeBgColor?: string;
  badgeTextColor?: string;
  bannerGradient?: string;
  taglineColor?: string;
}

export interface EventConfig {
  id: string;
  name: string; // e.g. "TEDxAkure", "AfroTech Summit", "WebSummit Lisbon", "Global AI Con"
  year: string; // "2026"
  tagline: string; // "The Catalyst Effect: Driving Frontier Innovation"
  themeDescription: string;
  eventType: EventType;
  startDate: string; // "2026-08-20"
  endDate?: string;
  location: string; // "Akure Tech Hub, Nigeria"
  venue: string; // "Grand Innovation Arena"
  city: string;
  country: string;
  targetConnections: number; // e.g. 50
  stages: string[]; // ["Main Stage", "Frontier Workshop B", "Fireside Pavilion"]
  hashtag?: string; // e.g. "#TEDxAkure" or "#WebSummit"
  branding: EventBranding;
  sessions: EventSession[];
  customIcebreakers?: string[];
  venueKit?: EventVenueKit;
  isArchived?: boolean;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventTemplatePreset {
  id: string;
  title: string;
  subtitle: string;
  eventType: EventType;
  themeKey: EventColorTheme;
  primaryColor: string;
  accentColor: string;
  sampleStages: string[];
  sampleTagline: string;
  sampleThemeDescription: string;
  sampleLocation: string;
  defaultTarget: number;
  sampleSessions: Array<Omit<EventSession, 'id'>>;
  sampleIcebreakers: string[];
}

export interface EventSession {
  id: string;
  title: string;
  speaker: string;
  speakerName?: string; // alias
  speakerRole: string;
  speakerBio?: string;
  speakerAvatar?: string;
  timeStr: string;
  stage: string;
  status: 'live' | 'upcoming' | 'completed';
  description: string;
  heroImage: string;
  briefing?: SpeakerBriefing;
  topics?: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  title: string;
  avatarUrl: string;
  portfolioUrl: string;
  targetConnections: number;
  conferenceName: string;
  conferenceYear: string;
  location: string;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'connection' | 'moment' | 'idea' | 'note';
  action: 'upsert' | 'delete';
  payload: any;
  queuedAt: string;
  retries: number;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  error: string | null;
}

export interface SecuritySettings {
  isLockEnabled: boolean;
  pinHash: string | null;
  authorizedEmail: string;
  isLocked: boolean;
  lastUnlockedAt: string | null;
  isBiometricEnabled?: boolean;
  biometricCredentialId?: string | null;
}

export type ThemeId = 'cyber_cobalt' | 'nordic_emerald' | 'royal_iris' | 'sunset_ember';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  category: string;
  description: string;
  accentColor: string;
  accentSecondary: string;
  previewColors: [string, string, string];
}

export interface GuestTrialSession {
  trialId: string;
  guestName: string;
  guestEmail?: string;
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
  storageQuotaBytes: number;
  bandwidthQuotaBytes: number;
  bandwidthUsedBytes: number;
  maxConnections: number;
  maxMoments: number;
  maxIdeas: number;
  maxNotes: number;
  maxPhotos: number;
}

export interface TrialQuotaMetrics {
  isTrial: boolean;
  guestName: string;
  remainingTimeMs: number;
  remainingTimeFormatted: string;
  isExpired: boolean;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  storagePercent: number;
  bandwidthUsedBytes: number;
  bandwidthQuotaBytes: number;
  bandwidthPercent: number;
  connectionsCount: number;
  maxConnections: number;
  momentsCount: number;
  maxMoments: number;
  ideasCount: number;
  maxIdeas: number;
  notesCount: number;
  maxNotes: number;
}

