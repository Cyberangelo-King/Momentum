import { Connection, Moment, Idea } from '../types';

export interface GamificationBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'connections' | 'visuals' | 'ideas' | 'action';
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  xpReward: number;
}

export interface GamificationStats {
  totalXp: number;
  level: number;
  levelTitle: string;
  levelBadge: string;
  nextLevelXp: number;
  currentLevelBaseXp: number;
  levelProgressPercent: number;
  connectionsCount: number;
  targetConnections: number;
  photosCount: number;
  ideasCount: number;
  followupsCompletedCount: number;
  badges: GamificationBadge[];
  streakDays: number;
}

const LEVELS = [
  { level: 1, title: 'First Spark', minXp: 0, badge: '✨' },
  { level: 2, title: 'Rising Networker', minXp: 120, badge: '⚡' },
  { level: 3, title: 'Catalyst Connector', minXp: 350, badge: '🔥' },
  { level: 4, title: 'Ecosystem Builder', minXp: 700, badge: '🚀' },
  { level: 5, title: 'TEDx Luminary', minXp: 1200, badge: '👑' },
];

export function calculateGamification(
  connections: Connection[],
  moments: Moment[],
  ideas: Idea[],
  targetCount: number = 50
): GamificationStats {
  const activeConnections = connections.filter((c) => !c.inTrash);
  const activeMoments = moments.filter((m) => !m.inTrash);
  const activeIdeas = ideas.filter((i) => !i.inTrash);

  // Count photos across connections and moments
  let connectionPhotosCount = 0;
  activeConnections.forEach((c) => {
    if (c.photos && c.photos.length > 0) {
      connectionPhotosCount += c.photos.length;
    } else if (c.avatarUrl && !c.avatarUrl.includes('unsplash.com')) {
      connectionPhotosCount += 1;
    }
  });
  const totalPhotosCount = connectionPhotosCount + activeMoments.length;

  const followupsCompleted = activeConnections.filter((c) => c.followUpStatus === 'completed').length;

  // Base XP computation
  let totalXp = 0;
  // +25 XP per connection made
  totalXp += activeConnections.length * 25;
  // +15 XP per photo / badge attached
  totalXp += totalPhotosCount * 15;
  // +20 XP per session idea / thesis logged
  totalXp += activeIdeas.length * 20;
  // +35 XP per completed follow-up message
  totalXp += followupsCompleted * 35;

  // Bonus for detailed conversation notes (>10 chars)
  const detailedNotesCount = activeConnections.filter(
    (c) => c.notes && c.notes.trim().length > 15
  ).length;
  totalXp += detailedNotesCount * 10;

  // Milestone XP bonus
  if (activeConnections.length >= 5) totalXp += 50;
  if (activeConnections.length >= 10) totalXp += 100;
  if (activeConnections.length >= 25) totalXp += 250;
  if (activeConnections.length >= 50) totalXp += 600;

  // Determine Level
  let currentLevelObj = LEVELS[0];
  let nextLevelXp = LEVELS[1].minXp;
  let currentLevelBaseXp = 0;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].minXp) {
      currentLevelObj = LEVELS[i];
      currentLevelBaseXp = LEVELS[i].minXp;
      nextLevelXp = LEVELS[i + 1] ? LEVELS[i + 1].minXp : LEVELS[i].minXp + 500;
      break;
    }
  }

  const levelProgressPercent = Math.min(
    100,
    Math.round(
      ((totalXp - currentLevelBaseXp) / Math.max(1, nextLevelXp - currentLevelBaseXp)) * 100
    )
  );

  // Badges
  const badges: GamificationBadge[] = [
    {
      id: 'first_handshake',
      title: 'First Handshake',
      description: 'Make your very first connection at TEDxAkure.',
      icon: 'handshake',
      category: 'connections',
      isUnlocked: activeConnections.length >= 1,
      progress: Math.min(1, activeConnections.length),
      maxProgress: 1,
      xpReward: 50,
    },
    {
      id: 'tenfold_impact',
      title: 'Power Ten',
      description: 'Connect with 10 innovators and leaders.',
      icon: 'groups',
      category: 'connections',
      isUnlocked: activeConnections.length >= 10,
      progress: Math.min(10, activeConnections.length),
      maxProgress: 10,
      xpReward: 100,
    },
    {
      id: 'halfway_mark',
      title: 'Midpoint Maestro',
      description: 'Reach 25 connections halfway to the 50 Goal.',
      icon: 'flag',
      category: 'connections',
      isUnlocked: activeConnections.length >= 25,
      progress: Math.min(25, activeConnections.length),
      maxProgress: 25,
      xpReward: 250,
    },
    {
      id: 'the_50_club',
      title: 'The 50 Club Legend',
      description: 'Hit the full 50 TEDxAkure 2026 connections target.',
      icon: 'workspace_premium',
      category: 'connections',
      isUnlocked: activeConnections.length >= targetCount,
      progress: Math.min(targetCount, activeConnections.length),
      maxProgress: targetCount,
      xpReward: 600,
    },
    {
      id: 'visual_archivist',
      title: 'Visual Chronicler',
      description: 'Snap or import 5+ photos of badges and moments.',
      icon: 'photo_camera',
      category: 'visuals',
      isUnlocked: totalPhotosCount >= 5,
      progress: Math.min(5, totalPhotosCount),
      maxProgress: 5,
      xpReward: 150,
    },
    {
      id: 'idea_incubator',
      title: 'Thought Leader',
      description: 'Record 3+ profound speaker insights and talk quotes.',
      icon: 'lightbulb',
      category: 'ideas',
      isUnlocked: activeIdeas.length >= 3,
      progress: Math.min(3, activeIdeas.length),
      maxProgress: 3,
      xpReward: 120,
    },
    {
      id: 'followup_closer',
      title: 'Momentum Builder',
      description: 'Send follow-up communications to 3+ attendees.',
      icon: 'send',
      category: 'action',
      isUnlocked: followupsCompleted >= 3,
      progress: Math.min(3, followupsCompleted),
      maxProgress: 3,
      xpReward: 180,
    },
  ];

  return {
    totalXp,
    level: currentLevelObj.level,
    levelTitle: currentLevelObj.title,
    levelBadge: currentLevelObj.badge,
    nextLevelXp,
    currentLevelBaseXp,
    levelProgressPercent,
    connectionsCount: activeConnections.length,
    targetConnections: targetCount,
    photosCount: totalPhotosCount,
    ideasCount: activeIdeas.length,
    followupsCompletedCount: followupsCompleted,
    badges,
    streakDays: 1,
  };
}
