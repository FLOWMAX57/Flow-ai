export type GigCategory = 'parcel' | 'pizza' | 'vip' | 'express';

export type ZoneKind = 'phone' | 'pizza' | 'hub' | 'home_manage' | 'home_start' | 'gig';

export type CameraMode = 'close' | 'medium' | 'high';

export type QualityTier = 'HD' | '2K' | '4K';

export type PhoneTab = 'gigs' | 'wallet' | 'apps' | 'property' | 'social';

export interface WorldPoint {
  x: number;
  z: number;
}

export interface BuildingHouse extends WorldPoint {
  id: number;
  label: string;
  district: string;
}

export interface ZoneRing extends WorldPoint {
  kind: ZoneKind;
  title: string;
  color: number;
}

export interface Gig {
  id: string;
  title: string;
  category: GigCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  basePay: number;
  xpReward: number;
  timeLimitSec: number;
  remainingSec: number;
  stage: 0 | 1; // 0 = pick up, 1 = deliver
  targetHouse: BuildingHouse;
  pickupType: 'pizza' | 'hub';
  integrity: number; // 0 to 100, drops on car/dog collision
  isManual?: boolean;
}

export interface LevelConfig {
  level: number;
  title: string;
  subtitle: string;
  xpRequired: number;
  trafficSpeedMult: number;
  activeCars: number;
  activeDogs: number;
  dogSpeed: number;
  timerFactor: number;
  payRange: [number, number];
  accentHex: string;
}

export interface GearItem {
  id: number;
  name: string;
  description: string;
  cost: number;
  speed: number;
  dashSpeedBonus: number;
  icon: string;
}

export interface AppConfig {
  id: 'yw' | 'bc' | 'is';
  name: string;
  subtitle: string;
  cost: number;
  incomePerMin: number;
  requires?: 'yw' | 'bc';
  accent: string;
}

export type AchievementCategory = 'deliveries' | 'earnings' | 'progression';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  category: AchievementCategory;
  target: number;
}

export interface GameSnapshot {
  started: boolean;
  paused: boolean;
  won: boolean;
  endlessMode: boolean;
  money: number;
  totalEarned: number;
  day: number;
  dayMinutes: number; // 480 (8:00 AM) to 1320 (10:00 PM)
  dayOn: boolean;
  hasPhone: boolean;
  ownHome: boolean;
  homeLevel: number;
  walletUpgrades: [boolean, boolean, boolean];
  apps: { yw: boolean; bc: boolean; is: boolean };
  gearLevel: number;
  xp: number;
  careerLevel: number;
  combo: number;
  bestCombo: number;
  completedGigs: number;
  coinsCollected: number;
  stamina: number; // 0..100
  isDashing: boolean;
  activeGig: Gig | null;
  availableGigs: Gig[];
  unlockedAchievements: string[];
  objective: {
    x: number;
    z: number;
    label: string;
    distance: number;
    angleDeg: number;
    kind: 'pickup' | 'deliver' | 'shop' | 'home' | 'gig' | 'none';
  };
  nearbyZone: ZoneKind | null;
  dayStats: {
    deliveries: number;
    earned: number;
    tips: number;
    bumps: number;
  };
}

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}

export type ActiveDialog =
  | null
  | { type: 'zone'; kind: ZoneKind }
  | { type: 'day_summary'; dayCompleted: number; earned: number; deliveries: number; tips: number; rentPaid: number }
  | { type: 'level_up'; level: LevelConfig }
  | { type: 'pause' }
  | { type: 'welcome' };
