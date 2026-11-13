import type { AchievementDef, AppConfig, GearItem, LevelConfig } from './types';

export const ROAD_COORDS = [-100, -60, -20, 20, 60, 100] as const;
export const WORLD_BOUND = 112;
export const RENT_COST = 50;
export const PHONE_COST = 15;
export const HOME_PURCHASE_COST = 5000;
export const GIG_COMPANY_COST = 100000;
export const HOME_UPGRADE_COSTS = [500, 1500, 3000, 6000] as const;

export const WALLET_UPGRADES = [
  { id: 0, name: 'محفظة جلدية احترافية', cost: 300, bonusPct: 25 },
  { id: 1, name: 'حافظة نقود ذكية', cost: 1000, bonusPct: 25 },
  { id: 2, name: 'محفظة ذهبية تنفيذية', cost: 2500, bonusPct: 25 },
] as const;

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    title: 'ساعٍ مبتدئ',
    subtitle: 'شوارع هادئة ومؤقتات مريحة لتعلم مسارات المدينة.',
    xpRequired: 0,
    trafficSpeedMult: 0.9,
    activeCars: 7,
    activeDogs: 1,
    dogSpeed: 9,
    timerFactor: 1.25,
    payRange: [25, 55],
    accentHex: '#22c55e',
  },
  {
    level: 2,
    title: 'ساعي الحي',
    subtitle: 'سيارات أسرع، وكلاب الحدائق تطارد طلبات البيتزا الساخنة!',
    xpRequired: 120,
    trafficSpeedMult: 1.2,
    activeCars: 10,
    activeDogs: 3,
    dogSpeed: 12.5,
    timerFactor: 1.05,
    payRange: [65, 130],
    accentHex: '#38bdf8',
  },
  {
    level: 3,
    title: 'خبير التوصيل',
    subtitle: 'ساعات الذروة تبدأ ومهام VIP تتأثر بالاصطدامات.',
    xpRequired: 320,
    trafficSpeedMult: 1.48,
    activeCars: 12,
    activeDogs: 5,
    dogSpeed: 15.5,
    timerFactor: 0.92,
    payRange: [150, 300],
    accentHex: '#f59e0b',
  },
  {
    level: 4,
    title: 'بطل الذروة',
    subtitle: 'مرور كثيف، مطاردات سريعة، وعقود شركات عالية الأجر.',
    xpRequired: 650,
    trafficSpeedMult: 1.78,
    activeCars: 14,
    activeDogs: 6,
    dogSpeed: 18,
    timerFactor: 0.84,
    payRange: [340, 680],
    accentHex: '#f97316',
  },
  {
    level: 5,
    title: 'أسطورة GIG',
    subtitle: 'أقصى درجات التحدي! سرعة فائقة ومكافآت أسطورية لامتلاك الشركة.',
    xpRequired: 1100,
    trafficSpeedMult: 2.1,
    activeCars: 16,
    activeDogs: 8,
    dogSpeed: 20.5,
    timerFactor: 0.76,
    payRange: [750, 1450],
    accentHex: '#eab308',
  },
];

export const GEAR_ITEMS: GearItem[] = [
  {
    id: 0,
    name: 'جري أساسي',
    description: 'حذاء العمل القياسي — مجاني وجاهز للانطلاق.',
    cost: 0,
    speed: 22,
    dashSpeedBonus: 12,
    icon: '👟',
  },
  {
    id: 1,
    name: 'حذاء التربو الرياضي',
    description: 'يزيد سرعة الجري الأساسية +27% ويخفف استهلاك اللياقة.',
    cost: 180,
    speed: 28,
    dashSpeedBonus: 14,
    icon: '⚡',
  },
  {
    id: 2,
    name: 'لوح التزلج الكهربائي',
    description: 'انزلاق سريع عبر الأرصفة والشوارع (+60% سرعة).',
    cost: 1200,
    speed: 35,
    dashSpeedBonus: 16,
    icon: '🛹',
  },
  {
    id: 3,
    name: 'سكوتر التوصيل الفائق',
    description: 'أسرع مركبة توصيل مع كشاف ليلي أمامي (+100% سرعة).',
    cost: 4500,
    speed: 44,
    dashSpeedBonus: 18,
    icon: '🛵',
  },
];

export const APPS_CONFIG: AppConfig[] = [
  {
    id: 'yw',
    name: 'YOUWATCH',
    subtitle: 'بث يوميات التوصيل وكسب عائد تلقائي من المشاهدات',
    cost: 1000,
    incomePerMin: 180,
    accent: '#ef4444',
  },
  {
    id: 'bc',
    name: 'BIBCOIN',
    subtitle: 'تعدين وتداول رقمي يدر أرباحاً مستمرة أثناء عملك',
    cost: 2500,
    incomePerMin: 420,
    requires: 'yw',
    accent: '#f59e0b',
  },
  {
    id: 'is',
    name: 'ISTOCKS',
    subtitle: 'محفظة أسهم ذكية بأعلى عائد سلبي في المدينة',
    cost: 6000,
    incomePerMin: 950,
    requires: 'bc',
    accent: '#10b981',
  },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_delivery',
    title: 'أول طلبية ناجحة',
    description: 'أكمل أول عملية توصيل في المدينة.',
    reward: 35,
    icon: '📦',
    category: 'deliveries',
    target: 1,
  },
  {
    id: 'deliveries_10',
    title: 'ساعٍ نشيط',
    description: 'أكمل 10 توصيلات ناجحة في المدينة.',
    reward: 150,
    icon: '🏃',
    category: 'deliveries',
    target: 10,
  },
  {
    id: 'deliveries_25',
    title: 'محترف الشوارع',
    description: 'أكمل 25 توصيلة ناجحة.',
    reward: 450,
    icon: '⚡',
    category: 'deliveries',
    target: 25,
  },
  {
    id: 'deliveries_50',
    title: 'نجم التوصيل الذهبي',
    description: 'أتمم 50 توصيلة ناجحة دون كلل.',
    reward: 1200,
    icon: '🌟',
    category: 'deliveries',
    target: 50,
  },
  {
    id: 'deliveries_100',
    title: 'أسطورة النقل السريع',
    description: 'أتمم 100 توصيلة ناجحة عبر أحياء المدينة.',
    reward: 3500,
    icon: '👑',
    category: 'deliveries',
    target: 100,
  },
  {
    id: 'earn_1k',
    title: 'أول ألف دولار',
    description: 'حقّق إجمالي أرباح يصل إلى $1,000.',
    reward: 120,
    icon: '💵',
    category: 'earnings',
    target: 1000,
  },
  {
    id: 'earn_10k',
    title: 'ثروة متنامية',
    description: 'حقّق إجمالي أرباح يصل إلى $10,000.',
    reward: 800,
    icon: '💰',
    category: 'earnings',
    target: 10000,
  },
  {
    id: 'earn_50k',
    title: 'قطب الأعمال',
    description: 'حقّق إجمالي أرباح يصل إلى $50,000.',
    reward: 3000,
    icon: '💎',
    category: 'earnings',
    target: 50000,
  },
  {
    id: 'earn_100k',
    title: 'مليونير GIG المرتقب',
    description: 'حقّق إجمالي أرباح يصل إلى $100,000.',
    reward: 5000,
    icon: '🏦',
    category: 'earnings',
    target: 100000,
  },
  {
    id: 'phone_owner',
    title: 'متصل بالشبكة',
    description: 'اشترِ هاتفك الذكي من متجر الهواتف.',
    reward: 40,
    icon: '📱',
    category: 'progression',
    target: 1,
  },
  {
    id: 'combo_5',
    title: 'سلسلة نارية ×5',
    description: 'أكمل 5 توصيلات متتالية قبل انتهاء الوقت.',
    reward: 250,
    icon: '🔥',
    category: 'progression',
    target: 5,
  },
  {
    id: 'combo_10',
    title: 'دقة متناهية ×10',
    description: 'أكمل 10 توصيلات متتالية دون تأخير.',
    reward: 750,
    icon: '🎯',
    category: 'progression',
    target: 10,
  },
  {
    id: 'coin_hunter',
    title: 'صياد العملات',
    description: 'اجمع 15 عملة ذهبية منتشرة في المدينة.',
    reward: 300,
    icon: '🪙',
    category: 'progression',
    target: 15,
  },
  {
    id: 'home_owner',
    title: 'مالك عقار',
    description: 'اشترِ منزلك وتخلص من الإيجار اليومي للأبد.',
    reward: 500,
    icon: '🏡',
    category: 'progression',
    target: 1,
  },
  {
    id: 'home_max',
    title: 'قصر الأحلام',
    description: 'طوّر منزلك إلى المستوى الخامس والأخير.',
    reward: 1500,
    icon: '🏰',
    category: 'progression',
    target: 5,
  },
  {
    id: 'scooter_rider',
    title: 'قائد السكوتر',
    description: 'اشترِ سكوتر التوصيل الفائق من متجر المعدات.',
    reward: 600,
    icon: '🛵',
    category: 'progression',
    target: 1,
  },
  {
    id: 'investor_all',
    title: 'مستثمر رقمي شامل',
    description: 'فعّل جميع تطبيقات الاستثمار الثلاثة.',
    reward: 1200,
    icon: '📈',
    category: 'progression',
    target: 3,
  },
  {
    id: 'level_3',
    title: 'خبير المدينة',
    description: 'تأهل إلى مستوى الصعوبة الثالث.',
    reward: 400,
    icon: '🥉',
    category: 'progression',
    target: 3,
  },
  {
    id: 'level_5',
    title: 'نخبة GIG',
    description: 'بلوغ مستوى الصعوبة الخامس والأخير.',
    reward: 1500,
    icon: '🏆',
    category: 'progression',
    target: 5,
  },
];

export function getAchievementProgress(
  ach: AchievementDef,
  snap: {
    completedGigs: number;
    totalEarned: number;
    hasPhone: boolean;
    bestCombo: number;
    coinsCollected: number;
    ownHome: boolean;
    homeLevel: number;
    gearLevel: number;
    apps: { yw: boolean; bc: boolean; is: boolean };
    careerLevel: number;
  },
): number {
  switch (ach.id) {
    case 'first_delivery':
    case 'deliveries_10':
    case 'deliveries_25':
    case 'deliveries_50':
    case 'deliveries_100':
      return Math.min(ach.target, snap.completedGigs);
    case 'earn_1k':
    case 'earn_10k':
    case 'earn_50k':
    case 'earn_100k':
      return Math.min(ach.target, Math.floor(snap.totalEarned));
    case 'phone_owner':
      return snap.hasPhone ? 1 : 0;
    case 'combo_5':
    case 'combo_10':
      return Math.min(ach.target, snap.bestCombo);
    case 'coin_hunter':
      return Math.min(ach.target, snap.coinsCollected);
    case 'home_owner':
      return snap.ownHome ? 1 : 0;
    case 'home_max':
      return snap.ownHome ? Math.min(5, snap.homeLevel) : 0;
    case 'scooter_rider':
      return snap.gearLevel >= 3 ? 1 : 0;
    case 'investor_all':
      return [snap.apps.yw, snap.apps.bc, snap.apps.is].filter(Boolean).length;
    case 'level_3':
    case 'level_5':
      return Math.min(ach.target, snap.careerLevel);
    default:
      return 0;
  }
}

export function formatMoney(n: number): string {
  const rounded = Math.round(n);
  return (rounded < 0 ? '-$' : '$') + Math.abs(rounded).toLocaleString('en-US');
}

export function formatClock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const mm = String(Math.floor(minutes % 60)).padStart(2, '0');
  const suffix = h24 >= 12 ? 'م' : 'ص';
  const h12 = h24 % 12 || 12;
  return `${h12}:${mm} ${suffix}`;
}
