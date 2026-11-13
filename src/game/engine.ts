import * as THREE from 'three';
import { soundEngine } from './audio';
import {
  ACHIEVEMENTS,
  APPS_CONFIG,
  GEAR_ITEMS,
  GIG_COMPANY_COST,
  HOME_PURCHASE_COST,
  HOME_UPGRADE_COSTS,
  LEVEL_CONFIGS,
  PHONE_COST,
  RENT_COST,
  ROAD_COORDS,
  WALLET_UPGRADES,
  WORLD_BOUND,
  formatMoney,
} from './constants';
import type {
  AchievementDef,
  ActiveDialog,
  BuildingHouse,
  CameraMode,
  GameSnapshot,
  Gig,
  GigCategory,
  LevelConfig,
  QualityTier,
  ToastMessage,
  ZoneKind,
} from './types';
import { buildWorld, detectSoftwareGl, type BuiltWorld } from './worldBuilder';

const SAVE_KEY = 'deliver_dash_save_v2';

// Module-scope reusable math helpers (zero per-frame allocations)
const _camDesired = new THREE.Vector3();
const _lookDesired = new THREE.Vector3();
const _lookCurrent = new THREE.Vector3();
const _skyDay = new THREE.Color(0x87cefa);
const _skyDusk = new THREE.Color(0xf97316);
const _skyNight = new THREE.Color(0x0f172a);
const _skyTemp = new THREE.Color();

interface SavedData {
  money: number;
  totalEarned: number;
  day: number;
  hasPhone: boolean;
  ownHome: boolean;
  homeLevel: number;
  walletUpgrades: [boolean, boolean, boolean];
  apps: { yw: boolean; bc: boolean; is: boolean };
  gearLevel: number;
  xp: number;
  completedGigs: number;
  bestCombo: number;
  coinsCollected: number;
  unlockedAchievements: string[];
  won: boolean;
  endlessMode: boolean;
}

export interface EngineCallbacks {
  onSnapshot: (snap: GameSnapshot) => void;
  onToast: (toast: Omit<ToastMessage, 'id'>) => void;
  onDialog: (dlg: ActiveDialog) => void;
  onAchievementUnlocked: (ach: AchievementDef) => void;
  onContextLost: (lost: boolean) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private callbacks: EngineCallbacks;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private world: BuiltWorld;
  private clock = new THREE.Clock();
  private isSoftwareGl: boolean;

  private frameId = 0;
  private disposed = false;
  private contextLost = false;

  // Input state
  private keys: Record<string, boolean> = {};
  private joystick = { x: 0, z: 0 };
  private dashPressed = false;

  // Visual / Camera settings
  private cameraMode: CameraMode = 'medium';
  private qualityTier: QualityTier = '2K';
  private cameraShake = 0;
  private hitCooldown = 0;
  private stepAccum = 0;
  private snapshotAccum = 0;
  private lastHourTick = 8;

  // Core simulation state
  private state = {
    started: false,
    paused: false,
    won: false,
    endlessMode: false,
    money: 0,
    totalEarned: 0,
    day: 1,
    dayMinutes: 480,
    dayOn: false,
    hasPhone: false,
    ownHome: false,
    homeLevel: 1,
    walletUpgrades: [false, false, false] as [boolean, boolean, boolean],
    apps: { yw: false, bc: false, is: false },
    gearLevel: 0,
    xp: 0,
    careerLevel: 1,
    combo: 0,
    bestCombo: 0,
    completedGigs: 0,
    coinsCollected: 0,
    stamina: 100,
    isDashing: false,
    activeGig: null as Gig | null,
    availableGigs: [] as Gig[],
    unlockedAchievements: [] as string[],
    nearbyZone: null as ZoneKind | null,
    dayStats: {
      deliveries: 0,
      earned: 0,
      tips: 0,
      bumps: 0,
    },
  };

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      56,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.2,
      420,
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyQualityAndResize();

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.world = buildWorld(this.scene, this.renderer);
    this.loadSavedState();
    this.syncWorldWithState();
    this.generateAvailableGigs();

    _lookCurrent.copy(this.world.courier.root.position);
    this.camera.position.set(0, 23, 40);
    this.camera.lookAt(_lookCurrent);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.emitSnapshot();
    this.startLoop();
  }

  public static hasSavedGame(): boolean {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  public setMinimapCanvas(canvas: HTMLCanvasElement | null) {
    this.minimapCanvas = canvas;
  }

  public startNewGame() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // ignore storage failure
    }
    this.state = {
      started: true,
      paused: false,
      won: false,
      endlessMode: false,
      money: 0,
      totalEarned: 0,
      day: 1,
      dayMinutes: 480,
      dayOn: false,
      hasPhone: false,
      ownHome: false,
      homeLevel: 1,
      walletUpgrades: [false, false, false],
      apps: { yw: false, bc: false, is: false },
      gearLevel: 0,
      xp: 0,
      careerLevel: 1,
      combo: 0,
      bestCombo: 0,
      completedGigs: 0,
      coinsCollected: 0,
      stamina: 100,
      isDashing: false,
      activeGig: null,
      availableGigs: [],
      unlockedAchievements: [],
      nearbyZone: null,
      dayStats: { deliveries: 0, earned: 0, tips: 0, bumps: 0 },
    };
    this.world.courier.root.position.set(0, 0.22, 20);
    this.syncWorldWithState();
    this.generateAvailableGigs();
    soundEngine.playNewDay();
    this.emitSnapshot();
    this.callbacks.onDialog({ type: 'welcome' });
  }

  public resumeGame() {
    this.state.started = true;
    this.state.paused = false;
    soundEngine.playClick();
    this.emitSnapshot();
    if (!this.state.hasPhone && this.state.completedGigs === 0) {
      this.callbacks.onDialog({ type: 'welcome' });
    }
  }

  public setPaused(paused: boolean) {
    this.state.paused = paused;
    this.emitSnapshot();
  }

  public setJoystick(x: number, z: number) {
    this.joystick.x = x;
    this.joystick.z = z;
  }

  public setDash(active: boolean) {
    this.dashPressed = active;
  }

  public cycleCameraMode(): CameraMode {
    const order: CameraMode[] = ['medium', 'close', 'high'];
    this.cameraMode = order[(order.indexOf(this.cameraMode) + 1) % order.length];
    soundEngine.playClick();
    return this.cameraMode;
  }

  public cycleQuality(): QualityTier {
    const order: QualityTier[] = ['HD', '2K', '4K'];
    this.qualityTier = order[(order.indexOf(this.qualityTier) + 1) % order.length];
    this.applyQualityAndResize();
    soundEngine.playClick();
    this.toast(`دقة العرض: ${this.qualityTier}`, 'info');
    return this.qualityTier;
  }

  public interactNearby() {
    if (this.state.nearbyZone) {
      this.triggerZoneAction(this.state.nearbyZone);
    }
  }

  public acceptGig(gigId: string) {
    if (!this.state.dayOn) {
      soundEngine.playError();
      this.toast('ابدأ اليوم من الدائرة الزرقاء في بيتك أولاً', 'warning');
      return;
    }
    if (this.state.activeGig) {
      soundEngine.playError();
      this.toast('لديك مهمة نشطة بالفعل! سلّمها أو ألغِها أولاً.', 'warning');
      return;
    }
    const found = this.state.availableGigs.find((g) => g.id === gigId);
    if (!found) return;

    this.state.activeGig = { ...found, stage: 0 };
    this.state.availableGigs = this.state.availableGigs.filter((g) => g.id !== gigId);
    soundEngine.playPickup();
    this.toast(
      found.pickupType === 'pizza'
        ? "🍕 توجّه إلى Terry's Pizza لاستلام الطلب"
        : '📦 توجّه إلى مركز الطرود لاستلام الشحنة',
      'info',
    );
    this.syncWorldWithState();
    this.emitSnapshot();
  }

  public cancelActiveGig() {
    if (!this.state.activeGig) return;
    this.state.activeGig = null;
    this.state.combo = 0;
    soundEngine.playError();
    this.toast('تم إلغاء المهمة وإعادة ضبط سلسلة التوصيل', 'warning');
    this.syncWorldWithState();
    this.emitSnapshot();
  }

  public refreshGigs() {
    if (!this.state.dayOn) return;
    this.generateAvailableGigs();
    soundEngine.playClick();
    this.toast('تم تحديث قائمة مهام GigFinder', 'info');
    this.emitSnapshot();
  }

  public buyPhone() {
    if (this.state.hasPhone) return;
    if (!this.spendMoney(PHONE_COST)) return;
    this.state.hasPhone = true;
    soundEngine.playBuy();
    this.unlockAchievement('phone_owner');
    this.toast('📱 مبروك! اشتريت الهاتف الذكي — ابدأ يومك من البيت', 'success');
    this.saveState();
    this.emitSnapshot();
  }

  public buyHome() {
    if (this.state.ownHome) return;
    if (!this.spendMoney(HOME_PURCHASE_COST)) return;
    this.state.ownHome = true;
    soundEngine.playBuy();
    this.unlockAchievement('home_owner');
    this.toast('🏡 أصبح البيت ملكك! لا مزيد من الإيجار اليومي', 'success');
    this.syncWorldWithState();
    this.saveState();
    this.emitSnapshot();
  }

  public upgradeHome() {
    if (!this.state.ownHome || this.state.homeLevel >= 5) return;
    const cost = HOME_UPGRADE_COSTS[this.state.homeLevel - 1];
    if (!this.spendMoney(cost)) return;
    this.state.homeLevel += 1;
    soundEngine.playLevelUp();
    if (this.state.homeLevel >= 5) this.unlockAchievement('home_max');
    this.toast(`🏠 تم تطوير بيتك إلى المستوى ${this.state.homeLevel}!`, 'success');
    this.syncWorldWithState();
    this.saveState();
    this.emitSnapshot();
  }

  public buyWalletUpgrade(index: 0 | 1 | 2) {
    if (this.state.walletUpgrades[index]) return;
    if (index > 0 && !this.state.walletUpgrades[index - 1]) {
      soundEngine.playError();
      this.toast('اشترِ الترقية السابقة أولاً', 'warning');
      return;
    }
    const item = WALLET_UPGRADES[index];
    if (!this.spendMoney(item.cost)) return;
    this.state.walletUpgrades[index] = true;
    soundEngine.playBuy();
    this.toast(`💳 تم تفعيل ${item.name} (+25% أرباح)`, 'success');
    this.saveState();
    this.emitSnapshot();
  }

  public buyGear(level: number) {
    if (level <= this.state.gearLevel || level < 0 || level >= GEAR_ITEMS.length) return;
    const item = GEAR_ITEMS[level];
    if (!this.spendMoney(item.cost)) return;
    this.state.gearLevel = level;
    soundEngine.playLevelUp();
    if (level === 3) this.unlockAchievement('scooter_rider');
    this.toast(`${item.icon} تم تجهيز ${item.name}!`, 'success');
    this.syncWorldWithState();
    this.saveState();
    this.emitSnapshot();
  }

  public buyApp(appId: 'yw' | 'bc' | 'is') {
    if (this.state.apps[appId]) return;
    const cfg = APPS_CONFIG.find((a) => a.id === appId);
    if (!cfg) return;
    if (cfg.requires && !this.state.apps[cfg.requires]) {
      soundEngine.playError();
      this.toast('اشترِ التطبيق السابق أولاً', 'warning');
      return;
    }
    if (!this.spendMoney(cfg.cost)) return;
    this.state.apps[appId] = true;
    soundEngine.playBuy();
    if (this.state.apps.yw && this.state.apps.bc && this.state.apps.is) {
      this.unlockAchievement('investor_all');
    }
    this.toast(`📲 تم تفعيل ${cfg.name} للدخل التلقائي!`, 'success');
    this.saveState();
    this.emitSnapshot();
  }

  public startDay() {
    if (this.state.dayOn) {
      this.toast('اليوم قيد التقدم بالفعل — ينتهي الساعة 10:00 م', 'info');
      return;
    }
    if (!this.state.ownHome && this.state.day > 1) {
      this.state.money -= RENT_COST;
    }
    this.state.dayOn = true;
    this.state.dayMinutes = 480;
    this.lastHourTick = 8;
    this.state.dayStats = { deliveries: 0, earned: 0, tips: 0, bumps: 0 };
    this.generateAvailableGigs();
    soundEngine.playNewDay();

    const rentNote =
      this.state.ownHome
        ? 'بيتك ملكك — لا يوجد إيجار!'
        : this.state.day === 1
          ? 'اليوم الأول مجاني بدون إيجار!'
          : `تم خصم إيجار اليوم ${formatMoney(RENT_COST)}.`;
    this.toast(`☀️ بدأ اليوم ${this.state.day}! ${rentNote}`, 'success');
    this.saveState();
    this.emitSnapshot();
  }

  public buyGigCompany() {
    if (!this.isReadyForGigCompany()) {
      soundEngine.playError();
      this.toast('أكمل تطوير البيت للمستوى 5 وجميع ترقيات المحفظة أولاً', 'warning');
      return;
    }
    if (!this.spendMoney(GIG_COMPANY_COST)) return;
    this.state.won = true;
    this.state.paused = true;
    soundEngine.playVictory();
    this.saveState();
    this.emitSnapshot();
  }

  public continueEndless() {
    this.state.won = false;
    this.state.endlessMode = true;
    this.state.paused = false;
    soundEngine.playClick();
    this.saveState();
    this.emitSnapshot();
  }

  public getIncomeMultiplier(): number {
    const walletCount = this.state.walletUpgrades.filter(Boolean).length;
    const comboBonus = Math.min(1.5, this.state.combo * 0.15);
    return 1 + walletCount * 0.25 + comboBonus;
  }

  public isReadyForGigCompany(): boolean {
    return (
      this.state.ownHome &&
      this.state.homeLevel >= 5 &&
      this.state.walletUpgrades.every(Boolean)
    );
  }

  public getLevelConfig(lvl = this.state.careerLevel): LevelConfig {
    return LEVEL_CONFIGS[Math.min(LEVEL_CONFIGS.length - 1, Math.max(0, lvl - 1))];
  }

  private addMoney(amount: number, countTowardTotal = true) {
    this.state.money += amount;
    if (amount > 0 && countTowardTotal) {
      this.state.totalEarned += amount;
      this.state.dayStats.earned += amount;
      if (this.state.totalEarned >= 1000) this.unlockAchievement('earn_1k');
      if (this.state.totalEarned >= 10000) this.unlockAchievement('earn_10k');
      if (this.state.totalEarned >= 50000) this.unlockAchievement('earn_50k');
      if (this.state.totalEarned >= 100000) this.unlockAchievement('earn_100k');
    }
  }

  private spendMoney(amount: number): boolean {
    if (this.state.money < amount) {
      soundEngine.playError();
      this.toast(`❌ رصيدك لا يكفي (تحتاج ${formatMoney(amount)})`, 'danger');
      return false;
    }
    this.state.money -= amount;
    return true;
  }

  private toast(text: string, tone: ToastMessage['tone']) {
    this.callbacks.onToast({ text, tone });
  }

  private unlockAchievement(id: string) {
    if (this.state.unlockedAchievements.includes(id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    this.state.unlockedAchievements.push(id);
    this.addMoney(def.reward, true);
    soundEngine.playLevelUp();
    this.callbacks.onAchievementUnlocked(def);
    this.saveState();
  }

  private grantXp(amount: number) {
    this.state.xp += amount;
    let newLevel = 1;
    for (const cfg of LEVEL_CONFIGS) {
      if (this.state.xp >= cfg.xpRequired) {
        newLevel = cfg.level;
      }
    }
    if (newLevel > this.state.careerLevel) {
      this.state.careerLevel = newLevel;
      const cfg = this.getLevelConfig(newLevel);
      soundEngine.playLevelUp();
      if (newLevel >= 3) this.unlockAchievement('level_3');
      if (newLevel >= 5) this.unlockAchievement('level_5');
      this.callbacks.onDialog({ type: 'level_up', level: cfg });
      this.generateAvailableGigs();
    }
  }

  private generateAvailableGigs() {
    const houses = this.world.houses;
    if (houses.length === 0) return;

    const lvlCfg = this.getLevelConfig();
    const list: Gig[] = [];
    const categories: GigCategory[] =
      this.state.careerLevel >= 3
        ? ['pizza', 'parcel', 'vip', 'express']
        : ['pizza', 'parcel', 'pizza', 'parcel'];

    for (let i = 0; i < 6; i++) {
      const cat = categories[i % categories.length];
      const house: BuildingHouse = houses[Math.floor(Math.random() * houses.length)];
      const [minPay, maxPay] = lvlCfg.payRange;
      const rawPay = minPay + Math.random() * (maxPay - minPay);
      const catMult = cat === 'vip' ? 1.45 : cat === 'express' ? 1.3 : cat === 'pizza' ? 1.12 : 1.0;
      const basePay = Math.round(rawPay * catMult);

      const distFromHub = Math.hypot(house.x - this.world.hubPoint.x, house.z - this.world.hubPoint.z);
      const baseTimer = Math.max(24, (28 + distFromHub * 0.16) * lvlCfg.timerFactor * (cat === 'express' ? 0.85 : 1));
      const difficulty = Math.min(
        5,
        Math.max(1, this.state.careerLevel + (cat === 'vip' || cat === 'express' ? 1 : 0) - (i === 0 ? 1 : 0)),
      ) as 1 | 2 | 3 | 4 | 5;

      const labelMap: Record<GigCategory, string> = {
        pizza: `🍕 بيتزا ساخنة — ${house.label}`,
        parcel: `📦 طرد بريدي — ${house.label}`,
        vip: `💼 شحنة VIP حساسة — ${house.label}`,
        express: `⚡ توصيل فائق السرعة — ${house.label}`,
      };

      list.push({
        id: `gig_${Date.now()}_${i}_${Math.floor(Math.random() * 999)}`,
        title: labelMap[cat],
        category: cat,
        difficulty,
        basePay,
        xpReward: 24 + difficulty * 14,
        timeLimitSec: Math.round(baseTimer),
        remainingSec: Math.round(baseTimer),
        stage: 0,
        targetHouse: house,
        pickupType: cat === 'pizza' ? 'pizza' : 'hub',
        integrity: 100,
      });
    }

    this.state.availableGigs = list;
  }

  private getPickupPoint(gig: Gig) {
    if (gig.pickupType === 'pizza') {
      const px = this.world.courier.root.position.x;
      const pz = this.world.courier.root.position.z;
      return this.world.pizzas.reduce((best, p) =>
        Math.hypot(p.x - px, p.z - pz) < Math.hypot(best.x - px, best.z - pz) ? p : best,
      );
    }
    return this.world.hubPoint;
  }

  private triggerZoneAction(kind: ZoneKind) {
    soundEngine.playClick();

    if (kind === 'pizza') {
      if (this.state.activeGig && this.state.activeGig.stage === 0 && this.state.activeGig.pickupType === 'pizza') {
        this.state.activeGig.stage = 1;
        soundEngine.playPickup();
        this.toast('🍕 استلمت البيتزا الساخنة! احذر من كلاب الحدائق وسلّمها بسرعة!', 'success');
        this.syncWorldWithState();
        this.emitSnapshot();
      } else if (!this.state.activeGig) {
        this.callbacks.onDialog({ type: 'zone', kind: 'pizza' });
      }
      return;
    }

    if (kind === 'hub') {
      if (this.state.activeGig && this.state.activeGig.stage === 0 && this.state.activeGig.pickupType === 'hub') {
        this.state.activeGig.stage = 1;
        soundEngine.playPickup();
        this.toast('📦 تم استلام الطرد! اتبع السهم للتسليم.', 'success');
        this.syncWorldWithState();
        this.emitSnapshot();
      } else if (!this.state.activeGig && !this.state.hasPhone) {
        // Starter manual delivery so player earns $25 immediately
        const house = this.world.houses[Math.floor(Math.random() * this.world.houses.length)];
        this.state.activeGig = {
          id: `manual_${Date.now()}`,
          title: `📦 طرد تدريبي — ${house.label}`,
          category: 'parcel',
          difficulty: 1,
          basePay: 25,
          xpReward: 30,
          timeLimitSec: 80,
          remainingSec: 80,
          stage: 1,
          targetHouse: house,
          pickupType: 'hub',
          integrity: 100,
          isManual: true,
        };
        soundEngine.playPickup();
        this.toast('📦 خذ هذا الطرد وسلّمه للمبنى المحدد لتكسب $25 وتشتري الهاتف!', 'info');
        this.syncWorldWithState();
        this.emitSnapshot();
      } else if (!this.state.activeGig) {
        this.callbacks.onDialog({ type: 'zone', kind: 'hub' });
      }
      return;
    }

    if (kind === 'home_start') {
      this.startDay();
      return;
    }

    this.callbacks.onDialog({ type: 'zone', kind });
  }

  private computeObjective(): GameSnapshot['objective'] {
    const px = this.world.courier.root.position.x;
    const pz = this.world.courier.root.position.z;

    let tx: number | null = null;
    let tz: number | null = null;
    let label = '';
    let kind: GameSnapshot['objective']['kind'] = 'none';

    if (this.state.activeGig) {
      if (this.state.activeGig.stage === 0) {
        const p = this.getPickupPoint(this.state.activeGig);
        tx = p.x;
        tz = p.z;
        label = this.state.activeGig.pickupType === 'pizza' ? "استلم من Terry's Pizza" : 'استلم من مركز الطرود';
        kind = 'pickup';
      } else {
        tx = this.state.activeGig.targetHouse.x;
        tz = this.state.activeGig.targetHouse.z;
        label = `سلّم إلى ${this.state.activeGig.targetHouse.label}`;
        kind = 'deliver';
      }
    } else if (!this.state.hasPhone) {
      if (this.state.money < PHONE_COST) {
        tx = this.world.hubPoint.x;
        tz = this.world.hubPoint.z;
        label = 'خذ مهمة من مركز الطرود ($25)';
        kind = 'pickup';
      } else {
        tx = this.world.phonePoint.x;
        tz = this.world.phonePoint.z;
        label = 'اشترِ الهاتف ($15)';
        kind = 'shop';
      }
    } else if (!this.state.dayOn) {
      tx = this.world.homePoint.x + 5;
      tz = this.world.homePoint.z;
      label = 'ابدأ اليوم من بيتك';
      kind = 'home';
    } else if (this.isReadyForGigCompany() && this.state.money >= GIG_COMPANY_COST && !this.state.endlessMode) {
      tx = this.world.gigPoint.x;
      tz = this.world.gigPoint.z;
      label = 'اشترِ شركة GIG للفوز!';
      kind = 'gig';
    }

    if (tx === null || tz === null) {
      return { x: 0, z: 0, label: '', distance: 0, angleDeg: 0, kind: 'none' };
    }

    const dx = tx - px;
    const dz = tz - pz;
    return {
      x: tx,
      z: tz,
      label,
      distance: Math.round(Math.hypot(dx, dz)),
      angleDeg: (Math.atan2(dx, -dz) * 180) / Math.PI,
      kind,
    };
  }

  private syncWorldWithState() {
    this.world.homeController.updateLevel(this.state.homeLevel, this.state.ownHome);
    const { courier } = this.world;
    courier.hoverboard.visible = this.state.gearLevel === 2;
    courier.scooter.visible = this.state.gearLevel === 3;

    const carrying = Boolean(this.state.activeGig && this.state.activeGig.stage === 1);
    courier.pizzaProp.visible = carrying && this.state.activeGig?.category === 'pizza';
    courier.vipProp.visible = carrying && this.state.activeGig?.category === 'vip';
    courier.parcelProp.visible =
      carrying &&
      this.state.activeGig?.category !== 'pizza' &&
      this.state.activeGig?.category !== 'vip';
  }

  private applyBumpPenalty(reason: string, knockX: number, knockZ: number) {
    if (this.hitCooldown > 0) return;
    this.hitCooldown = 1.35;
    this.cameraShake = 0.75;
    this.state.dayStats.bumps += 1;
    soundEngine.playBump();

    // Push player away cleanly
    const root = this.world.courier.root;
    root.position.x = THREE.MathUtils.clamp(root.position.x + knockX * 3.8, -WORLD_BOUND, WORLD_BOUND);
    root.position.z = THREE.MathUtils.clamp(root.position.z + knockZ * 3.8, -WORLD_BOUND, WORLD_BOUND);

    if (this.state.activeGig && this.state.activeGig.stage === 1) {
      const dmg = this.state.activeGig.category === 'vip' ? 35 : 20;
      this.state.activeGig.integrity = Math.max(25, this.state.activeGig.integrity - dmg);
      this.toast(`${reason} تضررت جودة الشحنة (${this.state.activeGig.integrity}%)`, 'danger');
    } else {
      this.toast(reason, 'warning');
    }
    this.emitSnapshot();
  }

  private endDay() {
    const completedDay = this.state.day;
    const summary = {
      type: 'day_summary' as const,
      dayCompleted: completedDay,
      earned: Math.round(this.state.dayStats.earned),
      deliveries: this.state.dayStats.deliveries,
      tips: Math.round(this.state.dayStats.tips),
      rentPaid: this.state.ownHome || completedDay === 1 ? 0 : RENT_COST,
    };

    this.state.dayOn = false;
    this.state.day += 1;
    this.state.dayMinutes = 480;
    this.state.activeGig = null;
    this.world.beacon.visible = false;
    this.syncWorldWithState();
    this.saveState();
    this.emitSnapshot();
    this.callbacks.onDialog(summary);
  }

  private updateSimulation(dt: number, elapsed: number) {
    const lvlCfg = this.getLevelConfig();
    const courier = this.world.courier;
    const playerPos = courier.root.position;

    // 1. Animate fountain ripples & zone rings
    this.world.fountainRings.forEach((r, idx) => {
      const p = ((elapsed * 0.9 + idx * 0.3) % 1);
      const s = 0.6 + p * 2.2;
      r.scale.set(s, s, 1);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7;
    });

    this.world.zoneRings.forEach((zr, idx) => {
      const pulse = 1 + 0.08 * Math.sin(elapsed * 3.2 + idx);
      zr.mesh.scale.set(pulse, pulse, 1);
    });

    // 2. Traffic Cars (count & speed scale with careerLevel!)
    this.world.cars.forEach((car, idx) => {
      const active = idx < lvlCfg.activeCars;
      car.group.visible = active;
      if (!active) return;

      car.honkCooldown = Math.max(0, car.honkCooldown - dt);
      car.t += car.dir * car.baseSpeed * lvlCfg.trafficSpeedMult * dt;
      if (car.t > 105) car.t = -105;
      if (car.t < -105) car.t = 105;

      const laneOffset = car.dir > 0 ? -2.2 : 2.2;
      if (car.horiz) {
        car.group.position.set(car.t, 0.22, car.road + laneOffset);
        car.group.rotation.y = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        car.group.position.set(car.road + laneOffset, 0.22, car.t);
        car.group.rotation.y = car.dir > 0 ? 0 : Math.PI;
      }

      if (this.state.started && !this.state.paused && !this.state.won) {
        const dx = playerPos.x - car.group.position.x;
        const dz = playerPos.z - car.group.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 7.5 && car.honkCooldown <= 0) {
          car.honkCooldown = 4.5;
          soundEngine.playHorn();
        }
        if (dist < 3.0) {
          const len = dist || 1;
          this.applyBumpPenalty('🚗 احذر حركة المرور!', dx / len, dz / len);
        }
      }
    });

    // 3. Pedestrians
    this.world.pedestrians.forEach((npc, idx) => {
      npc.t += npc.dir * npc.speed * dt;
      if (npc.t > 100) npc.t = -100;
      if (npc.t < -100) npc.t = 100;
      if (npc.horiz) {
        npc.group.position.set(npc.t, 0.22, npc.axis);
        npc.group.rotation.y = npc.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        npc.group.position.set(npc.axis, 0.22, npc.t);
        npc.group.rotation.y = npc.dir > 0 ? 0 : Math.PI;
      }
      const swing = Math.sin(elapsed * 7 + idx) * 0.55;
      npc.leftLeg.rotation.x = swing;
      npc.rightLeg.rotation.x = -swing;
    });

    // 4. Dogs AI (patrol parks; in Level 2+, chase courier if carrying hot pizza or nearby!)
    this.world.dogs.forEach((dog, idx) => {
      const active = idx < lvlCfg.activeDogs;
      dog.group.visible = active;
      if (!active) return;

      dog.barkCooldown = Math.max(0, dog.barkCooldown - dt);
      const carryingPizza = Boolean(this.state.activeGig?.stage === 1 && this.state.activeGig.category === 'pizza');
      const distToPlayer = Math.hypot(playerPos.x - dog.group.position.x, playerPos.z - dog.group.position.z);
      const distFromHome = Math.hypot(playerPos.x - dog.homeX, playerPos.z - dog.homeZ);

      const shouldChase =
        this.state.started &&
        !this.state.paused &&
        !this.state.won &&
        this.state.careerLevel >= 2 &&
        ((carryingPizza && distToPlayer < 28) || distToPlayer < 14) &&
        distFromHome < 42;

      if (shouldChase) {
        if (!dog.chasing && dog.barkCooldown <= 0) {
          dog.barkCooldown = 3.5;
          soundEngine.playBark();
        }
        dog.chasing = true;
        const dx = playerPos.x - dog.group.position.x;
        const dz = playerPos.z - dog.group.position.z;
        const len = Math.hypot(dx, dz) || 1;
        dog.group.position.x += (dx / len) * lvlCfg.dogSpeed * dt;
        dog.group.position.z += (dz / len) * lvlCfg.dogSpeed * dt;
        dog.group.rotation.y = Math.atan2(dx, dz);

        if (len < 2.2) {
          this.applyBumpPenalty('🐕 طاردك كلب الحراسة!', dx / len, dz / len);
        }
      } else {
        dog.chasing = false;
        dog.angle += dt * 0.9;
        const tx = dog.homeX + Math.cos(dog.angle) * 6;
        const tz = dog.homeZ + Math.sin(dog.angle) * 6;
        const dx = tx - dog.group.position.x;
        const dz = tz - dog.group.position.z;
        const len = Math.hypot(dx, dz) || 1;
        if (len > 0.3) {
          dog.group.position.x += (dx / len) * 6 * dt;
          dog.group.position.z += (dz / len) * 6 * dt;
          dog.group.rotation.y = Math.atan2(dx, dz);
        }
      }

      dog.tail.rotation.z = Math.sin(elapsed * (dog.chasing ? 18 : 9) + idx) * 0.45;
      const runCycle = Math.sin(elapsed * (dog.chasing ? 18 : 8) + idx) * 0.6;
      dog.legs[0].rotation.x = runCycle;
      dog.legs[1].rotation.x = -runCycle;
      dog.legs[2].rotation.x = -runCycle;
      dog.legs[3].rotation.x = runCycle;
    });

    // 5. Collectibles (Coins & Energy Espresso)
    this.world.collectibles.forEach((item, idx) => {
      if (!item.active) {
        item.respawnTimer -= dt;
        if (item.respawnTimer <= 0) {
          item.active = true;
          item.group.visible = true;
        }
        return;
      }

      item.group.rotation.y = elapsed * 2.4 + idx;
      item.group.position.y = 1.55 + Math.sin(elapsed * 3 + idx) * 0.28;

      if (this.state.started && !this.state.paused && !this.state.won) {
        const d = Math.hypot(playerPos.x - item.x, playerPos.z - item.z);
        if (d < 2.6) {
          item.active = false;
          item.group.visible = false;
          item.respawnTimer = 28;
          if (item.kind === 'coin') {
            const coinVal = Math.round((15 + this.state.careerLevel * 12) * this.getIncomeMultiplier());
            this.addMoney(coinVal, true);
            this.state.coinsCollected += 1;
            soundEngine.playCoin();
            this.toast(`🪙 عملة ذهبية +${formatMoney(coinVal)}`, 'success');
            if (this.state.coinsCollected >= 15) this.unlockAchievement('coin_hunter');
          } else {
            this.state.stamina = 100;
            soundEngine.playPickup();
            this.toast('⚡ إسبريسو الطاقة! تم شحن اللياقة 100%', 'info');
          }
          this.emitSnapshot();
        }
      }
    });

    if (!this.state.started || this.state.paused || this.state.won) {
      this.updateCamera(dt, 0);
      return;
    }

    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    if (this.hitCooldown > 0) {
      courier.bodyPivot.visible = Math.floor(elapsed * 16) % 2 === 0;
    } else {
      courier.bodyPivot.visible = true;
    }

    // 6. Day clock, hourly gig refresh, passive income apps
    if (this.state.dayOn) {
      this.state.dayMinutes += dt * 3.0; // ~4.6 min per full 14h game day
      const currentHour = Math.floor(this.state.dayMinutes / 60);
      if (currentHour !== this.lastHourTick) {
        this.lastHourTick = currentHour;
        this.generateAvailableGigs();
        this.toast('🔔 وصلت طلبات جديدة في GigFinder!', 'info');
      }

      const passivePerMin =
        (this.state.apps.yw ? APPS_CONFIG[0].incomePerMin : 0) +
        (this.state.apps.bc ? APPS_CONFIG[1].incomePerMin : 0) +
        (this.state.apps.is ? APPS_CONFIG[2].incomePerMin : 0);
      if (passivePerMin > 0) {
        this.addMoney((passivePerMin * dt) / 60, true);
      }

      if (this.state.dayMinutes >= 1320) {
        this.endDay();
        return;
      }
    }

    // 7. Active Gig Countdown Timer
    if (this.state.activeGig) {
      this.state.activeGig.remainingSec -= dt;
      if (this.state.activeGig.remainingSec <= 0) {
        this.state.activeGig = null;
        this.state.combo = 0;
        soundEngine.playError();
        this.toast('⏰ انتهى وقت الطلب! تم إلغاء المهمة.', 'danger');
        this.syncWorldWithState();
        this.emitSnapshot();
      }
    }

    // 8. Player Movement + Sprint/Dash
    let moveX = (this.keys['d'] || this.keys['arrowright'] ? 1 : 0) - (this.keys['a'] || this.keys['arrowleft'] ? 1 : 0) + this.joystick.x;
    let moveZ = (this.keys['s'] || this.keys['arrowdown'] ? 1 : 0) - (this.keys['w'] || this.keys['arrowup'] ? 1 : 0) + this.joystick.z;
    const len = Math.hypot(moveX, moveZ);

    const wantsDash = this.dashPressed || Boolean(this.keys['shift'] || this.keys[' ']);
    const canDash = wantsDash && len > 0.08 && this.state.stamina > 2;
    this.state.isDashing = canDash;

    if (canDash) {
      const drainRate = this.state.gearLevel >= 1 ? 24 : 32;
      this.state.stamina = Math.max(0, this.state.stamina - drainRate * dt);
    } else {
      this.state.stamina = Math.min(100, this.state.stamina + 18 * dt);
    }

    const gear = GEAR_ITEMS[this.state.gearLevel];
    const speed = gear.speed + (canDash ? gear.dashSpeedBonus : 0);

    if (len > 0.06) {
      const mag = Math.min(1, len);
      moveX /= len;
      moveZ /= len;
      playerPos.x += moveX * speed * mag * dt;
      playerPos.z += moveZ * speed * mag * dt;
      courier.root.rotation.y = Math.atan2(moveX, moveZ);

      if (this.state.gearLevel <= 1) {
        const stride = elapsed * (canDash ? 18 : 12);
        courier.bodyPivot.position.y = Math.abs(Math.sin(stride)) * 0.24;
        const legSwing = Math.sin(stride) * 0.72;
        courier.leftLeg.rotation.x = legSwing;
        courier.rightLeg.rotation.x = -legSwing;
      } else {
        // Riding hoverboard or scooter
        courier.leftLeg.rotation.x = 0;
        courier.rightLeg.rotation.x = 0;
        courier.bodyPivot.position.y = this.state.gearLevel === 2 ? 0.45 + Math.sin(elapsed * 8) * 0.06 : 0.75;
      }

      this.stepAccum += dt;
      if (canDash && this.stepAccum > 0.4) {
        this.stepAccum = 0;
        soundEngine.playDash();
      }
    } else {
      courier.leftLeg.rotation.x = 0;
      courier.rightLeg.rotation.x = 0;
      courier.bodyPivot.position.y = this.state.gearLevel === 2 ? 0.42 : this.state.gearLevel === 3 ? 0.75 : 0;
    }

    // 9. Building Colliders
    for (const c of this.world.colliders) {
      const dx = playerPos.x - c.x;
      const dz = playerPos.z - c.z;
      const hx = c.w / 2 + 1.3;
      const hz = c.d / 2 + 1.3;
      if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
        if (hx - Math.abs(dx) < hz - Math.abs(dz)) {
          playerPos.x = c.x + Math.sign(dx || 1) * hx;
        } else {
          playerPos.z = c.z + Math.sign(dz || 1) * hz;
        }
      }
    }
    playerPos.x = THREE.MathUtils.clamp(playerPos.x, -WORLD_BOUND, WORLD_BOUND);
    playerPos.z = THREE.MathUtils.clamp(playerPos.z, -WORLD_BOUND, WORLD_BOUND);

    // 10. Zone Rings Detection
    let activeZone: ZoneKind | null = null;
    for (const zr of this.world.zoneRings) {
      if (Math.hypot(playerPos.x - zr.x, playerPos.z - zr.z) < 4.1) {
        activeZone = zr.kind;
        break;
      }
    }
    if (activeZone !== this.state.nearbyZone) {
      this.state.nearbyZone = activeZone;
      if (activeZone) {
        this.triggerZoneAction(activeZone);
      }
    }

    // 11. Active Gig Beacon & Delivery Completion
    if (this.state.activeGig) {
      const target =
        this.state.activeGig.stage === 1
          ? this.state.activeGig.targetHouse
          : this.getPickupPoint(this.state.activeGig);
      this.world.beacon.visible = true;
      this.world.beacon.position.set(target.x, 0.22, target.z);

      if (
        this.state.activeGig.stage === 1 &&
        Math.hypot(playerPos.x - target.x, playerPos.z - target.z) < 10.5
      ) {
        const gig = this.state.activeGig;
        const timeRatio = gig.remainingSec / gig.timeLimitSec;
        const speedTipPct = timeRatio > 0.5 ? 0.35 : timeRatio > 0.25 ? 0.18 : 0;
        const integrityMult = gig.integrity / 100;

        this.state.combo += 1;
        this.state.bestCombo = Math.max(this.state.bestCombo, this.state.combo);

        const baseScaled = gig.basePay * this.getIncomeMultiplier() * integrityMult;
        const tipAmount = Math.round(baseScaled * speedTipPct);
        const totalPayout = Math.round(baseScaled + tipAmount);

        this.state.completedGigs += 1;
        this.state.dayStats.deliveries += 1;
        this.state.dayStats.tips += tipAmount;
        this.state.activeGig = null;
        this.world.beacon.visible = false;

        this.addMoney(totalPayout, true);
        soundEngine.playDelivery();

        if (this.state.completedGigs >= 1) this.unlockAchievement('first_delivery');
        if (this.state.completedGigs >= 10) this.unlockAchievement('deliveries_10');
        if (this.state.completedGigs >= 25) this.unlockAchievement('deliveries_25');
        if (this.state.completedGigs >= 50) this.unlockAchievement('deliveries_50');
        if (this.state.completedGigs >= 100) this.unlockAchievement('deliveries_100');
        if (this.state.combo >= 5) this.unlockAchievement('combo_5');
        if (this.state.combo >= 10) this.unlockAchievement('combo_10');

        this.toast(
          `🎉 تم التسليم! +${formatMoney(totalPayout)}${tipAmount > 0 ? ` (إكرامية +${formatMoney(tipAmount)})` : ''}`,
          'success',
        );
        this.grantXp(gig.xpReward);
        this.syncWorldWithState();
        this.saveState();
        this.emitSnapshot();
      }
    } else {
      this.world.beacon.visible = false;
    }

    // 12. Day-Night Sky, Fog, Streetlamps, Scooter Headlight
    this.updateAtmosphere();
    this.updateCamera(dt, canDash ? 1 : 0);
  }

  private updateAtmosphere() {
    // 480 = 8 AM (0), 780 = 1 PM (0.35), 1140 = 7 PM (0.78), 1320 = 10 PM (1.0)
    const dayProgress = THREE.MathUtils.clamp((this.state.dayMinutes - 480) / (1320 - 480), 0, 1);
    let nightFactor = 0;

    if (dayProgress < 0.62) {
      _skyTemp.copy(_skyDay);
      nightFactor = 0;
    } else if (dayProgress < 0.82) {
      const t = (dayProgress - 0.62) / 0.2;
      _skyTemp.copy(_skyDay).lerp(_skyDusk, t);
      nightFactor = t * 0.45;
    } else {
      const t = (dayProgress - 0.82) / 0.18;
      _skyTemp.copy(_skyDusk).lerp(_skyNight, t);
      nightFactor = 0.45 + t * 0.55;
    }

    (this.scene.background as THREE.Color).copy(_skyTemp);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(_skyTemp);
    }

    this.world.sunLight.intensity = THREE.MathUtils.lerp(1.35, 0.35, nightFactor);
    this.world.hemiLight.intensity = THREE.MathUtils.lerp(0.85, 0.38, nightFactor);

    const lampGlow = 0.2 + nightFactor * 2.2;
    this.world.lampBulbs.forEach((m) => {
      m.emissiveIntensity = lampGlow;
    });
    this.world.windowEmissives.forEach((m) => {
      m.emissiveIntensity = 0.15 + nightFactor * 0.9;
    });
    this.world.courier.scooterLight.intensity =
      this.state.gearLevel === 3 ? nightFactor * 4.5 : 0;
  }

  private updateCamera(dt: number, dashAmt: number) {
    const pos = this.world.courier.root.position;
    const heightMap: Record<CameraMode, [number, number]> = {
      close: [15, 14],
      medium: [23, 20],
      high: [34, 27],
    };
    const [camY, camZ] = heightMap[this.cameraMode];

    _camDesired.set(pos.x, camY, pos.z + camZ);
    if (this.cameraShake > 0.01) {
      _camDesired.x += (Math.random() - 0.5) * this.cameraShake * 2.2;
      _camDesired.y += (Math.random() - 0.5) * this.cameraShake * 1.4;
      this.cameraShake = THREE.MathUtils.damp(this.cameraShake, 0, 8, dt);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camDesired.x, 7.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camDesired.y, 7.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camDesired.z, 7.5, dt);

    _lookDesired.set(pos.x, 2.2, pos.z);
    _lookCurrent.x = THREE.MathUtils.damp(_lookCurrent.x, _lookDesired.x, 10, dt);
    _lookCurrent.y = THREE.MathUtils.damp(_lookCurrent.y, _lookDesired.y, 10, dt);
    _lookCurrent.z = THREE.MathUtils.damp(_lookCurrent.z, _lookDesired.z, 10, dt);
    this.camera.lookAt(_lookCurrent);

    const targetFov = 56 + dashAmt * 6;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private drawMinimap() {
    const canvas = this.minimapCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const scale = size / 236;
    const toMap = (v: number) => (v + 118) * scale;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Roads
    ctx.fillStyle = '#334155';
    ROAD_COORDS.forEach((r) => {
      ctx.fillRect(0, toMap(r) - 2, size, 4);
      ctx.fillRect(toMap(r) - 2, 0, 4, size);
    });

    // Zone markers
    this.world.zoneRings.forEach((zr) => {
      ctx.fillStyle =
        zr.kind === 'home_manage' || zr.kind === 'home_start'
          ? '#60a5fa'
          : zr.kind === 'phone'
            ? '#22d3ee'
            : '#fbbf24';
      ctx.beginPath();
      ctx.arc(toMap(zr.x), toMap(zr.z), 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Objective target
    const ob = this.computeObjective();
    if (ob.kind !== 'none') {
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(toMap(ob.x), toMap(ob.z), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Player marker
    const px = toMap(this.world.courier.root.position.x);
    const pz = toMap(this.world.courier.root.position.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, pz, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private emitSnapshot() {
    this.callbacks.onSnapshot({
      ...this.state,
      walletUpgrades: [...this.state.walletUpgrades] as [boolean, boolean, boolean],
      apps: { ...this.state.apps },
      availableGigs: [...this.state.availableGigs],
      unlockedAchievements: [...this.state.unlockedAchievements],
      activeGig: this.state.activeGig ? { ...this.state.activeGig } : null,
      dayStats: { ...this.state.dayStats },
      objective: this.computeObjective(),
    });
  }

  private saveState() {
    try {
      const payload: SavedData = {
        money: Math.round(this.state.money),
        totalEarned: Math.round(this.state.totalEarned),
        day: this.state.day,
        hasPhone: this.state.hasPhone,
        ownHome: this.state.ownHome,
        homeLevel: this.state.homeLevel,
        walletUpgrades: this.state.walletUpgrades,
        apps: this.state.apps,
        gearLevel: this.state.gearLevel,
        xp: this.state.xp,
        completedGigs: this.state.completedGigs,
        bestCombo: this.state.bestCombo,
        coinsCollected: this.state.coinsCollected,
        unlockedAchievements: this.state.unlockedAchievements,
        won: this.state.won,
        endlessMode: this.state.endlessMode,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }

  private loadSavedState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Partial<SavedData>;
      this.state.money = Number(d.money ?? 0);
      this.state.totalEarned = Number(d.totalEarned ?? 0);
      this.state.day = Number(d.day ?? 1);
      this.state.hasPhone = Boolean(d.hasPhone);
      this.state.ownHome = Boolean(d.ownHome);
      this.state.homeLevel = Math.min(5, Math.max(1, Number(d.homeLevel ?? 1)));
      this.state.walletUpgrades = Array.isArray(d.walletUpgrades) && d.walletUpgrades.length === 3
        ? (d.walletUpgrades as [boolean, boolean, boolean])
        : [false, false, false];
      this.state.apps = d.apps ?? { yw: false, bc: false, is: false };
      this.state.gearLevel = Math.min(3, Math.max(0, Number(d.gearLevel ?? 0)));
      this.state.xp = Number(d.xp ?? 0);
      this.state.completedGigs = Number(d.completedGigs ?? 0);
      this.state.bestCombo = Number(d.bestCombo ?? 0);
      this.state.coinsCollected = Number(d.coinsCollected ?? 0);
      this.state.unlockedAchievements = Array.isArray(d.unlockedAchievements) ? d.unlockedAchievements : [];
      this.state.endlessMode = Boolean(d.endlessMode);

      let lvl = 1;
      for (const cfg of LEVEL_CONFIGS) {
        if (this.state.xp >= cfg.xpRequired) lvl = cfg.level;
      }
      this.state.careerLevel = lvl;
    } catch {
      // ignore corrupt save
    }
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed || this.contextLost) return;

      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.elapsedTime;

      this.updateSimulation(dt, elapsed);
      this.drawMinimap();

      this.snapshotAccum += dt;
      if (this.snapshotAccum >= 0.12) {
        this.snapshotAccum = 0;
        this.emitSnapshot();
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private applyQualityAndResize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
    } else {
      const targetWidth = this.qualityTier === 'HD' ? 1280 : this.qualityTier === '2K' ? 2560 : 3840;
      const ratio = Math.min(2, Math.max(1, targetWidth / w));
      this.renderer.setPixelRatio(ratio);
    }
    this.renderer.setSize(w, h, false);
  }

  private handleResize = () => {
    this.applyQualityAndResize();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    this.callbacks.onContextLost(true);
  };

  private handleContextRestored = () => {
    this.contextLost = false;
    this.callbacks.onContextLost(false);
    this.startLoop();
  };

  public destroy() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.world.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
