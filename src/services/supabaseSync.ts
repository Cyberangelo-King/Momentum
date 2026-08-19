import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Connection, Moment, Idea, UserProfile } from '../types';

export { isSupabaseConfigured };

export interface SyncStatus {
  isConfigured: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

/**
 * Uploads or syncs connections to Supabase
 */
export async function syncConnectionsToSupabase(connections: Connection[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const formatted = connections.map((conn) => ({
      id: conn.id,
      name: conn.name,
      profession: conn.profession,
      company: conn.company,
      avatar_url: conn.avatarUrl,
      phone: conn.phone || null,
      whatsapp: conn.whatsapp || null,
      email: conn.email || null,
      linkedin: conn.linkedin || null,
      instagram: conn.instagram || null,
      twitter: conn.twitter || null,
      notes: conn.notes,
      relationship: conn.relationship,
      priority: conn.priority,
      follow_up_date: conn.followUpDate,
      follow_up_status: conn.followUpStatus,
      met_timestamp: conn.metTimestamp,
      event_context: conn.eventContext,
      conversation_memory: conn.conversationMemory,
      tags: conn.tags,
      related_moment_ids: conn.relatedMomentIds || [],
      last_follow_up_message: conn.lastFollowUpMessage || null,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('connections').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase connections upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync error:', err);
    return false;
  }
}

/**
 * Fetches connections from Supabase
 */
export async function fetchConnectionsFromSupabase(): Promise<Connection[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('connections').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      console.warn('Failed to fetch from Supabase:', error?.message);
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      profession: row.profession,
      company: row.company,
      avatarUrl: row.avatar_url,
      phone: row.phone || undefined,
      whatsapp: row.whatsapp || undefined,
      email: row.email || undefined,
      linkedin: row.linkedin || undefined,
      instagram: row.instagram || undefined,
      twitter: row.twitter || undefined,
      notes: row.notes,
      relationship: row.relationship,
      priority: row.priority,
      followUpDate: row.follow_up_date,
      followUpStatus: row.follow_up_status,
      metTimestamp: row.met_timestamp,
      eventContext: row.event_context,
      conversationMemory: row.conversation_memory || [],
      tags: row.tags || [],
      relatedMomentIds: row.related_moment_ids || [],
      lastFollowUpMessage: row.last_follow_up_message || undefined,
    }));
  } catch (err) {
    console.warn('Supabase fetch error:', err);
    return null;
  }
}

/**
 * Uploads or syncs moments to Supabase
 */
export async function syncMomentsToSupabase(moments: Moment[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const formatted = moments.map((m) => ({
      id: m.id,
      type: m.type,
      title: m.title,
      caption: m.caption,
      media_url: m.mediaUrl,
      thumbnail_url: m.thumbnailUrl || null,
      timestamp: m.timestamp,
      date: m.date,
      tagged_people_ids: m.taggedPeopleIds,
      tagged_people_names: m.taggedPeopleNames || [],
      location: m.location,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('moments').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase moments upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync moments error:', err);
    return false;
  }
}

/**
 * Fetches moments from Supabase
 */
export async function fetchMomentsFromSupabase(): Promise<Moment[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('moments').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      caption: row.caption,
      mediaUrl: row.media_url,
      thumbnailUrl: row.thumbnail_url || undefined,
      timestamp: row.timestamp,
      date: row.date,
      taggedPeopleIds: row.tagged_people_ids || [],
      taggedPeopleNames: row.tagged_people_names || [],
      location: row.location,
    }));
  } catch (err) {
    console.warn('Supabase fetch moments error:', err);
    return null;
  }
}

/**
 * Uploads or syncs ideas to Supabase
 */
export async function syncIdeasToSupabase(ideas: Idea[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const formatted = ideas.map((idea) => ({
      id: idea.id,
      quote: idea.quote,
      takeaway: idea.takeaway || null,
      speaker_name: idea.speakerName,
      speaker_role: idea.speakerRole,
      speaker_avatar: idea.speakerAvatar,
      session_title: idea.sessionTitle,
      stage_name: idea.stageName,
      time_str: idea.timeStr,
      category: idea.category,
      tags: idea.tags,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client.from('ideas').upsert(formatted, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase ideas upsert error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase sync ideas error:', err);
    return false;
  }
}

/**
 * Fetches ideas from Supabase
 */
export async function fetchIdeasFromSupabase(): Promise<Idea[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('ideas').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      quote: row.quote,
      takeaway: row.takeaway || undefined,
      speakerName: row.speaker_name,
      speakerRole: row.speaker_role,
      speakerAvatar: row.speaker_avatar,
      sessionTitle: row.session_title,
      stageName: row.stage_name,
      timeStr: row.time_str,
      category: row.category,
      tags: row.tags || [],
    }));
  } catch (err) {
    console.warn('Supabase fetch ideas error:', err);
    return null;
  }
}

/**
 * Checks Supabase connection status
 */
export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in environment variables.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Unable to initialize Supabase client.',
    };
  }

  try {
    const { error } = await client.from('connections').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: `Connected to Supabase, but encountered error: ${error.message}. Please verify the database schema has been executed.`,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to Supabase database!',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect: ${err?.message || 'Unknown error'}`,
    };
  }
}
