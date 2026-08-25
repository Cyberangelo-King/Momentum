/**
 * Web-NFC Service for Momentum OS
 * Handles hardware Web NFC (NDEFReader), vCard & JSON payload serialization/deserialization,
 * contactless phone bump interactions, duplicate collision detection, and battery-aware scanning.
 */

import { Connection, NfcExchangeLog, UserProfile, EventConfig } from '../types';
import { triggerHaptic } from './haptics';

export interface NfcContactPayload {
  name: string;
  profession?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  notes?: string;
  eventId?: string;
  eventName?: string;
  avatarUrl?: string;
  tags?: string[];
  role?: string;
  timestamp?: string;
}

export interface NfcCollisionMatch {
  existingConnection: Connection;
  matchedField: 'email' | 'phone' | 'linkedin' | 'name' | 'exact';
  matchedValue: string;
  incomingPayload: NfcContactPayload;
}

const NFC_STORAGE_KEY = 'momentum_nfc_service_enabled_v1';

/**
 * Check if Web-NFC API is supported on the current device and browser
 */
export function isWebNfcSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'NDEFReader' in window;
}

/**
 * Get global NFC service toggle state from local storage (default: true)
 */
export function getNfcServiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(NFC_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Save global NFC service toggle state to local storage
 */
export function setNfcServiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NFC_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to save NFC service state', err);
  }
}

/**
 * Create a structured NFC exchange log item with current time and metadata
 */
export function createNfcExchangeLog(
  type: 'bump' | 'tag_read' | 'virtual_beam' = 'bump',
  eventId?: string,
  eventName?: string,
  notes?: string,
  serialNumber?: string
): NfcExchangeLog {
  const now = new Date();
  return {
    id: `nfc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dateFormatted: now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    eventId,
    eventName,
    type,
    serialNumber: serialNumber || `NFC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    deviceType: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile Handset' : 'Web Terminal') : 'Device',
    notes: notes || 'Contact exchanged via Web-NFC phone bump',
  };
}

/**
 * Generate standard vCard 3.0 string from contact profile
 */
export function serializeToVCard(profile: Partial<UserProfile | Connection>, activeEvent?: EventConfig): string {
  const name = profile.name || 'Event Attendee';
  const title = (profile as UserProfile).title || (profile as Connection).profession || 'Attendee';
  const org = (profile as Connection).company || activeEvent?.name || 'Momentum Network';
  const email = profile.email || '';
  const phone = (profile as Connection).phone || '';
  const url = (profile as UserProfile).portfolioUrl || (profile as Connection).linkedin || 'https://momentum.app';
  const note = (profile as Connection).notes || `Met at ${activeEvent?.name || 'Conference 2026'}`;

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${name};;;;`,
    `FN:${name}`,
    `TITLE:${title}`,
    `ORG:${org}`,
    email ? `EMAIL;TYPE=INTERNET:${email}` : '',
    phone ? `TEL;TYPE=CELL:${phone}` : '',
    url ? `URL:${url}` : '',
    `NOTE:${note}`,
    'X-APP:Momentum OS',
    'END:VCARD',
  ].filter(Boolean).join('\n');
}

/**
 * Serialize contact profile into JSON payload for Web-NFC NDEF records
 */
export function serializeToJsonPayload(profile: Partial<UserProfile | Connection>, activeEvent?: EventConfig): string {
  const payload: NfcContactPayload = {
    name: profile.name || 'Event Attendee',
    profession: (profile as UserProfile).title || (profile as Connection).profession || 'Innovator',
    company: (profile as Connection).company || activeEvent?.name || 'Momentum OS',
    email: profile.email || '',
    phone: (profile as Connection).phone || '',
    linkedin: (profile as Connection).linkedin || (profile as UserProfile).portfolioUrl || '',
    website: (profile as UserProfile).portfolioUrl || '',
    notes: (profile as Connection).notes || '',
    eventId: activeEvent?.id,
    eventName: activeEvent?.name || 'Live Conference',
    avatarUrl: profile.avatarUrl || '',
    tags: (profile as Connection).tags || ['#NFCBump', `#${activeEvent?.eventType || 'Conference'}`],
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

/**
 * Parse raw text (vCard or JSON) into structured NfcContactPayload
 */
export function parseNfcContactData(rawData: string): NfcContactPayload {
  const clean = rawData.trim();

  // 1. Try parsing as JSON
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      if (parsed.name) {
        return {
          name: parsed.name.trim(),
          profession: parsed.profession || parsed.title || '',
          company: parsed.company || parsed.org || '',
          email: parsed.email || '',
          phone: parsed.phone || parsed.tel || '',
          linkedin: parsed.linkedin || parsed.url || '',
          website: parsed.website || parsed.url || '',
          notes: parsed.notes || parsed.note || '',
          eventId: parsed.eventId,
          eventName: parsed.eventName,
          avatarUrl: parsed.avatarUrl,
          tags: Array.isArray(parsed.tags) ? parsed.tags : ['#NFCBump'],
          role: parsed.role,
        };
      }
    } catch {
      // Fall through to vCard or plain text parsing
    }
  }

  // 2. Try parsing as vCard
  if (clean.includes('BEGIN:VCARD') || clean.includes('FN:') || clean.includes('N:')) {
    const payload: NfcContactPayload = {
      name: '',
      profession: '',
      company: '',
      email: '',
      phone: '',
      linkedin: '',
      notes: '',
      tags: ['#NFCBump'],
    };

    const lines = clean.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('FN:')) {
        payload.name = line.slice(3).trim();
      } else if (line.startsWith('N:') && !payload.name) {
        const parts = line.slice(2).split(';').filter(Boolean);
        payload.name = parts.reverse().join(' ').trim();
      } else if (line.startsWith('TITLE:')) {
        payload.profession = line.slice(6).trim();
      } else if (line.startsWith('ORG:')) {
        payload.company = line.slice(4).trim();
      } else if (line.toUpperCase().startsWith('EMAIL')) {
        const parts = line.split(':');
        if (parts.length > 1) payload.email = parts[1].trim();
      } else if (line.toUpperCase().startsWith('TEL')) {
        const parts = line.split(':');
        if (parts.length > 1) payload.phone = parts[1].trim();
      } else if (line.startsWith('URL:')) {
        const url = line.slice(4).trim();
        if (url.includes('linkedin.com')) payload.linkedin = url;
        else payload.website = url;
      } else if (line.startsWith('NOTE:')) {
        payload.notes = line.slice(5).trim();
      }
    }

    if (payload.name) {
      return payload;
    }
  }

  // 3. Fallback: Parse unstructured string (Name, Title at Company, Email, Phone)
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const name = lines[0] || 'NFC Attendee';
  let email = '';
  let phone = '';
  let company = '';
  let profession = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('@') && !email) {
      email = line.replace(/[^a-zA-Z0-9@._+-]/g, '');
    } else if (/\+?[0-9\s-]{7,}/.test(line) && !phone) {
      phone = line;
    } else if (line.toLowerCase().includes(' at ') && !company) {
      const parts = line.split(/ at /i);
      profession = parts[0].trim();
      company = parts[1].trim();
    } else if (!profession) {
      profession = line;
    } else if (!company) {
      company = line;
    }
  }

  return {
    name,
    profession: profession || 'Attendee',
    company: company || 'Conference Guest',
    email,
    phone,
    notes: lines.slice(1).join(' • '),
    tags: ['#NFCBump'],
  };
}

/**
 * Check if the received contact data collides with an existing connection in the CRM.
 * Prevents duplicates by inspecting email, phone, LinkedIn, or exact full name.
 */
export function checkNfcCollision(
  incoming: NfcContactPayload,
  existingConnections: Connection[]
): NfcCollisionMatch | null {
  const norm = (s?: string) => (s || '').toLowerCase().trim();
  const digitsOnly = (s?: string) => (s || '').replace(/[^0-9]/g, '');

  const inEmail = norm(incoming.email);
  const inPhone = digitsOnly(incoming.phone);
  const inName = norm(incoming.name);
  const inLinkedIn = norm(incoming.linkedin).replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');

  for (const conn of existingConnections) {
    if (conn.inTrash) continue;

    // 1. Match Email
    if (inEmail && conn.email && norm(conn.email) === inEmail) {
      return {
        existingConnection: conn,
        matchedField: 'email',
        matchedValue: conn.email,
        incomingPayload: incoming,
      };
    }

    // 2. Match Phone Number
    if (inPhone && conn.phone && inPhone.length >= 7) {
      const connPhoneDigits = digitsOnly(conn.phone);
      if (connPhoneDigits && (connPhoneDigits === inPhone || connPhoneDigits.endsWith(inPhone) || inPhone.endsWith(connPhoneDigits))) {
        return {
          existingConnection: conn,
          matchedField: 'phone',
          matchedValue: conn.phone,
          incomingPayload: incoming,
        };
      }
    }

    // 3. Match LinkedIn Username / URL
    if (inLinkedIn && conn.linkedin) {
      const connLinkedIn = norm(conn.linkedin).replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '');
      if (connLinkedIn && connLinkedIn === inLinkedIn) {
        return {
          existingConnection: conn,
          matchedField: 'linkedin',
          matchedValue: conn.linkedin,
          incomingPayload: incoming,
        };
      }
    }

    // 4. Match Full Name & Company (exact match)
    if (inName && conn.name && norm(conn.name) === inName) {
      const inComp = norm(incoming.company);
      const connComp = norm(conn.company);
      if (!inComp || !connComp || inComp === connComp) {
        return {
          existingConnection: conn,
          matchedField: 'name',
          matchedValue: conn.name,
          incomingPayload: incoming,
        };
      }
    }
  }

  return null;
}

/**
 * Start listening for physical Web NFC tags / phone bumps
 */
export async function startWebNfcReader({
  onRead,
  onError,
  signal,
}: {
  onRead: (payload: NfcContactPayload, rawMessage: string, serialNumber?: string) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}): Promise<boolean> {
  if (!getNfcServiceEnabled()) {
    onError(new Error('NFC Service is disabled in App Settings. Enable it to listen for NFC bumps.'));
    return false;
  }

  if (!isWebNfcSupported()) {
    // Hardware Web NFC not available; simulator handles fallback seamlessly
    return false;
  }

  try {
    // @ts-ignore - NDEFReader is modern Chromium Web API
    const ndef = new window.NDEFReader();
    await ndef.scan({ signal });

    ndef.onreading = (event: any) => {
      try {
        const serialNumber = event.serialNumber;
        let combinedText = '';

        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
            combinedText += textDecoder.decode(record.data) + '\n';
          } else if (record.recordType === 'mime') {
            const textDecoder = new TextDecoder();
            combinedText += textDecoder.decode(record.data) + '\n';
          } else if (record.recordType === 'url') {
            const textDecoder = new TextDecoder();
            combinedText += textDecoder.decode(record.data) + '\n';
          }
        }

        if (combinedText.trim()) {
          // Trigger tactile handshake vibration
          triggerHaptic('nfc_handshake' as any);
          const parsed = parseNfcContactData(combinedText);
          onRead(parsed, combinedText, serialNumber);
        }
      } catch (err: any) {
        console.error('Error decoding NFC record', err);
      }
    };

    ndef.onreadingerror = () => {
      triggerHaptic('warning');
      onError(new Error('NFC Tag Read Error. Please hold the phone steady against the attendee badge or device.'));
    };

    return true;
  } catch (err: any) {
    onError(err);
    return false;
  }
}

/**
 * Write contact data to physical NFC tag or write-enabled device
 */
export async function writeWebNfcContact(
  profile: Partial<UserProfile | Connection>,
  activeEvent?: EventConfig,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> {
  if (!isWebNfcSupported()) {
    return { success: false, message: 'Web NFC hardware write is not supported in this browser environment.' };
  }

  try {
    // @ts-ignore
    const ndef = new window.NDEFReader();
    const jsonPayload = serializeToJsonPayload(profile, activeEvent);
    const vCardPayload = serializeToVCard(profile, activeEvent);

    await ndef.write(
      {
        records: [
          { recordType: 'mime', mediaType: 'application/json', data: new TextEncoder().encode(jsonPayload) },
          { recordType: 'text', data: vCardPayload },
        ],
      },
      { signal }
    );

    triggerHaptic('nfc_handshake' as any);
    return { success: true, message: 'Successfully beamed contact payload to NFC tag!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to write to NFC tag' };
  }
}

/**
 * Curated list of mock event attendees for testing the NFC bump & collision experience
 */
export const mockNfcBumpAttendees: NfcContactPayload[] = [
  {
    name: 'Dr. Kunle Adebayo',
    profession: 'Managing Partner',
    company: 'Ventures Africa Tech Fund',
    email: 'kunle.adebayo@venturesafrica.vc',
    phone: '+234 803 555 0192',
    linkedin: 'https://linkedin.com/in/kunle-adebayo-vc',
    notes: 'Keynote panelist on African DeepTech infrastructure. Looking for seed-stage startups in clean energy and AI.',
    tags: ['#NFCBump', '#Investor', '#Speaker', '#TEDxAkure'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Elena Rostov',
    profession: 'Head of Developer Ecosystem',
    company: 'Global Cloud Systems',
    email: 'elena.rostov@globalcloud.io',
    phone: '+1 415 555 3829',
    linkedin: 'https://linkedin.com/in/elena-rostov-dev',
    notes: 'Offering $100K in cloud credits and developer partnership grants for conference innovators.',
    tags: ['#NFCBump', '#Enterprise', '#Partner', '#TEDxAkure'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'David Okafor',
    profession: 'Principal Robotics Engineer',
    company: 'Okafor Autonomous Robotics',
    email: 'david@okaforrobotics.ng',
    phone: '+234 812 444 8821',
    linkedin: 'https://linkedin.com/in/david-okafor-robotics',
    notes: 'Met during stage intermission. Discussed edge compute and battery management for solar sensors.',
    tags: ['#NFCBump', '#Hardware', '#Peer', '#TEDxAkure'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sarah Chen',
    profession: 'General Partner',
    company: 'Apex Horizon Ventures',
    email: 'sarah.chen@apexhorizon.com',
    phone: '+1 650 555 9210',
    linkedin: 'https://linkedin.com/in/sarah-chen-apex',
    notes: 'Exchanged contact via phone bump at VIP reception. Wants 30-day deck follow up on networking metrics.',
    tags: ['#NFCBump', '#VIP', '#Investor', '#TEDxAkure'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Aisha Bello',
    profession: 'Founder & CEO',
    company: 'SolarGrid Agritech',
    email: 'aisha@solargridagri.com',
    phone: '+234 809 333 7712',
    linkedin: 'https://linkedin.com/in/aisha-bello-agri',
    notes: 'Pitched her solar storage microgrids during breakfast breakout. Mutual interest in IoT hardware integrations.',
    tags: ['#NFCBump', '#Founder', '#Agritech', '#TEDxAkure'],
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
  },
];
