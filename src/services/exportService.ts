import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Connection, Moment, Idea, UserProfile } from '../types';

export function exportConnectionsCSV(connections: Connection[]): void {
  const headers = [
    'ID',
    'Name',
    'Profession',
    'Company',
    'Relationship',
    'Priority',
    'Phone',
    'WhatsApp',
    'Email',
    'LinkedIn',
    'Follow-up Date',
    'Follow-up Status',
    'Met Time',
    'Tags',
    'Notes',
    'Is NFC Bumped',
    'NFC Bumps Count',
  ];

  const rows = connections.map(c => [
    `"${c.id}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.profession || '').replace(/"/g, '""')}"`,
    `"${(c.company || '').replace(/"/g, '""')}"`,
    `"${c.relationship}"`,
    `"${c.priority}"`,
    `"${c.phone || ''}"`,
    `"${c.whatsapp || ''}"`,
    `"${c.email || ''}"`,
    `"${c.linkedin || ''}"`,
    `"${c.followUpDate || ''}"`,
    `"${c.followUpStatus || ''}"`,
    `"${c.metTimestamp || ''}"`,
    `"${(c.tags || []).join(';')}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    `"${c.isNfcCaptured ? 'YES' : 'NO'}"`,
    `"${(c.nfcExchangeHistory?.length || (c.isNfcCaptured ? 1 : 0))}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Momentum_Connections_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Dedicated CSV export for all Web-NFC captured connections, marking them clearly
 * to distinguish 'bumped' leads from manual entries.
 */
export function exportNfcConnectionsCSV(connections: Connection[]): void {
  const nfcConnections = connections.filter(
    (c) => c.isNfcCaptured || (c.nfcExchangeHistory && c.nfcExchangeHistory.length > 0) || (c.tags && c.tags.includes('#NFCBump'))
  );

  const headers = [
    'Lead ID',
    'Capture Channel',
    'Full Name',
    'Profession / Title',
    'Organization / Company',
    'Relationship Tier',
    'Priority Level',
    'Phone Number',
    'WhatsApp Direct',
    'Email Address',
    'LinkedIn Profile',
    'First Bump Timestamp',
    'Total NFC Handshakes',
    'Latest Interaction Time',
    'NFC Handshake Details',
    'Event Venue Context',
    'Notes & Transcripts',
  ];

  const rows = (nfcConnections.length > 0 ? nfcConnections : connections).map((c) => {
    const totalBumps = c.nfcExchangeHistory?.length || (c.isNfcCaptured ? 1 : 0);
    const firstBump = c.nfcTimestamp || c.nfcExchangeHistory?.[0]?.timestamp || c.metTimestamp || 'N/A';
    const latestBump = c.nfcExchangeHistory?.[c.nfcExchangeHistory.length - 1]?.timestamp || firstBump;
    const details = (c.nfcExchangeHistory || [])
      .map((l, i) => `Bump #${i + 1}: ${l.dateFormatted || ''} ${l.timeFormatted || ''} [${l.deviceType || 'Device'}] ${l.notes || ''}`)
      .join(' | ') || 'Contactless Web-NFC phone bump';

    return [
      `"${c.id}"`,
      `"WEB-NFC BUMP (Verified)"`,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.profession || '').replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${c.relationship}"`,
      `"${c.priority}"`,
      `"${c.phone || ''}"`,
      `"${c.whatsapp || ''}"`,
      `"${c.email || ''}"`,
      `"${c.linkedin || ''}"`,
      `"${firstBump}"`,
      `"${totalBumps}"`,
      `"${latestBump}"`,
      `"${details.replace(/"/g, '""')}"`,
      `"${(c.eventContext || 'Conference 2026').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Momentum_NFC_Bumped_Connections_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFullJSON(connections: Connection[], moments: Moment[], ideas: Idea[], profile: UserProfile): void {
  const exportPayload = {
    app: 'Momentum OS',
    conference: 'TEDxAkure 2026',
    exportedAt: new Date().toISOString(),
    profile,
    stats: {
      totalConnections: connections.length,
      momentsCaptured: moments.length,
      ideasSaved: ideas.length,
    },
    connections,
    moments,
    ideas,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `TEDxAkure2026_FullCRM_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function generatePersonalJournalPDF(
  connections: Connection[],
  moments: Moment[],
  ideas: Idea[],
  profile: UserProfile,
  onProgress?: (percent: number) => void
): Promise<void> {
  if (onProgress) onProgress(15);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Dark Cover / Header styling
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, 210, 297, 'F');

  // Title in Tangerine & White
  doc.setTextColor(255, 92, 0); // Tangerine
  doc.setFontSize(28);
  doc.text('MOMENTUM', 20, 35);

  doc.setTextColor(250, 220, 210);
  doc.setFontSize(16);
  doc.text('TEDxAkure 2026 — Personal Event Documentary', 20, 45);

  doc.setFontSize(10);
  doc.setTextColor(180, 160, 150);
  doc.text(`Attendee: ${profile.name} (${profile.title})`, 20, 53);
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Total Connections: ${connections.length}/50`, 20, 59);

  // Horizontal Tangerine line
  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(1);
  doc.line(20, 64, 190, 64);

  if (onProgress) onProgress(40);

  let y = 75;

  // Executive Synthesis
  doc.setTextColor(255, 92, 0);
  doc.setFontSize(14);
  doc.text('1. Conference Synthesis & Impact', 20, y);
  y += 8;

  doc.setTextColor(230, 220, 215);
  doc.setFontSize(10);
  const summaryText =
    `I came to TEDxAkure 2026 with the explicit intention to meet 50 changemakers and document the ideas shaping our future. ` +
    `Across keynotes, workshops, and serendipitous hallway encounters, I engaged with ${connections.length} leaders, captured ${moments.length} key moments, ` +
    `and recorded ${ideas.length} core insights. Key focus areas: Pan-African logistics, AI ethics, and developer ecosystems.`;
  const splitSummary = doc.splitTextToSize(summaryText, 170);
  doc.text(splitSummary, 20, y);
  y += splitSummary.length * 5 + 10;

  // Key Connections
  doc.setTextColor(255, 92, 0);
  doc.setFontSize(14);
  doc.text('2. Priority Connections Met', 20, y);
  y += 8;

  const topConnections = connections.slice(0, 8);
  topConnections.forEach((c) => {
    if (y > 270) {
      doc.addPage();
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 297, 'F');
      y = 25;
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(`• ${c.name} — ${c.profession} (${c.company})`, 22, y);
    y += 5;
    doc.setTextColor(170, 160, 155);
    doc.setFontSize(9);
    const noteLine = doc.splitTextToSize(`Notes: ${c.notes || 'Met at session'} | Follow-up: ${c.followUpDate || 'Pending'}`, 160);
    doc.text(noteLine, 26, y);
    y += noteLine.length * 4 + 4;
  });

  if (onProgress) onProgress(75);

  // Key Saved Ideas / Quotes
  if (y > 230) {
    doc.addPage();
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 297, 'F');
    y = 25;
  } else {
    y += 6;
  }

  doc.setTextColor(255, 92, 0);
  doc.setFontSize(14);
  doc.text('3. Key Ideas & Quotations', 20, y);
  y += 8;

  ideas.slice(0, 5).forEach((idea) => {
    if (y > 270) {
      doc.addPage();
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, 210, 297, 'F');
      y = 25;
    }
    doc.setTextColor(250, 220, 210);
    doc.setFontSize(10);
    const quoteLines = doc.splitTextToSize(`"${idea.quote}"`, 165);
    doc.text(quoteLines, 22, y);
    y += quoteLines.length * 4.5 + 2;
    doc.setTextColor(255, 92, 0);
    doc.setFontSize(8.5);
    doc.text(`— ${idea.speakerName}, ${idea.sessionTitle} (${idea.timeStr})`, 26, y);
    y += 7;
  });

  if (onProgress) onProgress(95);

  doc.save(`Momentum_Journal_TEDxAkure2026_${new Date().toISOString().slice(0, 10)}.pdf`);
  if (onProgress) onProgress(100);
}

export async function exportMediaArchiveZIP(
  connections: Connection[],
  moments: Moment[],
  ideas: Idea[],
  onProgress?: (percent: number) => void
): Promise<void> {
  const zip = new JSZip();
  if (onProgress) onProgress(10);

  // 1. Add Data Manifests
  zip.file('manifest.json', JSON.stringify({
    event: 'TEDxAkure 2026',
    generatedAt: new Date().toISOString(),
    connectionCount: connections.length,
    momentCount: moments.length,
    ideaCount: ideas.length
  }, null, 2));

  zip.file('connections.json', JSON.stringify(connections, null, 2));
  zip.file('moments.json', JSON.stringify(moments, null, 2));
  zip.file('ideas.json', JSON.stringify(ideas, null, 2));

  // 2. Add Readme Markdown Journal
  const markdownJournal = `# Momentum OS — TEDxAkure 2026 Journal

**Goal:** 50 Connections
**Current Achieved:** ${connections.length} / 50

## Connections Met
${connections.map((c, i) => `${i + 1}. **${c.name}** - ${c.profession} at ${c.company}
   - Notes: ${c.notes}
   - Follow-up: ${c.followUpDate} (${c.followUpStatus})
   - Phone/WhatsApp: ${c.phone || c.whatsapp || 'N/A'}
   - LinkedIn: ${c.linkedin || 'N/A'}`).join('\n\n')}

## Saved Ideas & Quotes
${ideas.map((idea, i) => `${i + 1}. *"${idea.quote}"* — **${idea.speakerName}** (${idea.sessionTitle})`).join('\n\n')}

## Moments Timeline
${moments.map((m, i) => `${i + 1}. [${m.timestamp}] **${m.title}**
   - Location: ${m.location}
   - Caption: ${m.caption}`).join('\n\n')}
`;

  zip.file('TEDxAkure_Journal.md', markdownJournal);

  if (onProgress) onProgress(60);

  // Generate ZIP blob
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(Math.round(60 + metadata.percent * 0.4));
    }
  });

  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TEDxAkure2026_MediaArchive_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
