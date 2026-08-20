export type RelationshipType = 'peer' | 'mentor' | 'lead' | 'speaker';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type FollowUpStatus = 'today' | 'upcoming' | 'overdue' | 'completed';
export type MomentType = 'photo' | 'video' | 'note' | 'voice';

export interface Connection {
  id: string;
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
  relatedMomentIds?: string[];
  lastFollowUpMessage?: string;
  isDemo?: boolean;
  isOfflineCaptured?: boolean;
  savedOfflineAt?: string;
  inTrash?: boolean;
  deletedAt?: string;
}

export interface Moment {
  id: string;
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
  isDemo?: boolean;
  isOfflineCaptured?: boolean;
  savedOfflineAt?: string;
  inTrash?: boolean;
  deletedAt?: string;
}

export interface Idea {
  id: string;
  quote: string;
  takeaway?: string;
  speakerName: string;
  speakerRole: string;
  speakerAvatar: string;
  sessionTitle: string;
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

export interface EventSession {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  timeStr: string;
  stage: string;
  status: 'live' | 'upcoming' | 'completed';
  description: string;
  heroImage: string;
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
  entityType: 'connection' | 'moment' | 'idea';
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
}
