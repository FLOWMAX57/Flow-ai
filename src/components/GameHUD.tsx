import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  Camera,
  Compass,
  Flame,
  Pause,
  Smartphone,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { ACHIEVEMENTS, GEAR_ITEMS, LEVEL_CONFIGS, formatClock, formatMoney } from '../game/constants';
import type { AchievementDef, CameraMode, GameSnapshot, QualityTier, ToastMessage } from '../game/types';

interface GameHUDProps {
  snapshot: GameSnapshot;
  toasts: ToastMessage[];
  activeAchievementBanner: AchievementDef | null;
  cameraMode: CameraMode;
  quality: QualityTier;
  muted: boolean;
  onBindMinimap: (canvas: HTMLCanvasElement | null) => void;
  onJoystickMove: (x: number, z: number) => void;
  onDashChange: (active: boolean) => void;
  onOpenPhone: () => void;
  onOpenAchievements: () => void;
  onDismissAchievementBanner: () => void;
  onCycleCamera: () => void;
  onCycleQuality: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onInteractNearby: () => void;
}

export function GameHUD({
  snapshot,
  toasts,
  activeAchievementBanner,
  cameraMode,
  quality,
  muted,
  onBindMinimap,
  onJoystickMove,
  onDashChange,
  onOpenPhone,
  onOpenAchievements,
  onDismissAchievementBanner,
  onCycleCamera,
  onCycleQuality,
  onToggleMute,
  onPause,
  onInteractNearby,
}: GameHUDProps) {
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const joyRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);

  useEffect(() => {
    onBindMinimap(minimapRef.current);
    return () => onBindMinimap(null);
  }, [onBindMinimap]);

  const currentLvl = LEVEL_CONFIGS[snapshot.careerLevel - 1] ?? LEVEL_CONFIGS[0];
  const nextLvl = LEVEL_CONFIGS[snapshot.careerLevel] ?? null;
  const xpProgress = nextLvl
    ? Math.min(
        100,
        Math.max(
          0,
          ((snapshot.xp - currentLvl.xpRequired) / (nextLvl.xpRequired - currentLvl.xpRequired)) * 100,
        ),
      )
    : 100;

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const maxR = 40;
    const clamped = Math.min(dist, maxR);
    const nx = (dx / dist) * (clamped / maxR);
    const ny = (dy / dist) * (clamped / maxR);
    setKnobPos({ x: nx * maxR, y: ny * maxR });
    onJoystickMove(nx, ny);
  };

  const handleJoyDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setJoyActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!joyActive) return;
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyUp = () => {
    setJoyActive(false);
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const cameraLabel: Record<CameraMode, string> = {
    close: 'قريب',
    medium: 'متوسط',
    high: 'علوي',
  };

  const activeGear = GEAR_ITEMS[snapshot.gearLevel];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* Top Row: Left & Right Anchors with open center */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Right in RTL: Cash, Career Level, Day Clock */}
        <div className="pointer-events-auto flex flex-col gap-2 max-w-[235px]">
          <div className="rounded-xl border border-white/12 bg-slate-950/90 px-3.5 py-2.5 shadow-lg">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-2xl font-bold text-emerald-400 tabular-nums" dir="ltr">
                {formatMoney(snapshot.money)}
              </span>
              {snapshot.combo > 1 && (
                <span className="flex items-center gap-1 text-xs font-extrabold text-amber-400 tabular-nums">
                  <Flame className="w-3.5 h-3.5" />
                  ×{snapshot.combo}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-300 tabular-nums">
              <span>اليوم {snapshot.day}</span>
              <span className="text-slate-600">·</span>
              <span>{formatClock(snapshot.dayMinutes)}</span>
              <span className="text-slate-600">·</span>
              <span className={snapshot.dayOn ? 'text-amber-300 font-semibold' : 'text-sky-300'}>
                {snapshot.dayOn ? 'العمل جارٍ' : 'في الانتظار'}
              </span>
            </div>

            {/* Level & XP Bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">
                  م{snapshot.careerLevel}: {currentLvl.title}
                </span>
                <span className="font-display text-slate-400 tabular-nums" dir="ltr">
                  {snapshot.xp} XP
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${xpProgress}%`, backgroundColor: currentLvl.accentHex }}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{activeGear.icon} {activeGear.name}</span>
              <span>البيت {snapshot.homeLevel}/5</span>
            </div>
          </div>
        </div>

        {/* Top-Center: Active Gig Banner (only when active) */}
        <div className="hidden md:flex flex-col items-center gap-2 max-w-md flex-1">
          {snapshot.activeGig && (
            <div className="pointer-events-auto w-full rounded-xl border border-amber-400/35 bg-slate-950/92 px-4 py-2.5 shadow-lg">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-amber-300 truncate">{snapshot.activeGig.title}</span>
                <span
                  className={`font-display font-bold tabular-nums shrink-0 ${
                    snapshot.activeGig.remainingSec <= 10 ? 'text-rose-400' : 'text-white'
                  }`}
                  dir="ltr"
                >
                  {Math.ceil(snapshot.activeGig.remainingSec)}s
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all duration-200 ${
                    snapshot.activeGig.remainingSec <= 10 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (snapshot.activeGig.remainingSec / snapshot.activeGig.timeLimitSec) * 100),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                <span>
                  {snapshot.activeGig.stage === 0
                    ? 'الخطوة 1/2: استلم الطلب من المتجر'
                    : `الخطوة 2/2: سلّم إلى ${snapshot.activeGig.targetHouse.label}`}
                </span>
                <span className="tabular-nums text-emerald-400 font-bold">
                  جودة {snapshot.activeGig.integrity}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Left in RTL: Minimap + Compact Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <canvas
            ref={minimapRef}
            width={116}
            height={116}
            className="rounded-xl border-2 border-slate-700 bg-slate-950 shadow-lg"
          />
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onOpenAchievements}
              title="الإنجازات"
              className="flex items-center gap-1 rounded-lg border border-amber-400/40 bg-slate-950/90 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="font-display tabular-nums" dir="ltr">
                {snapshot.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
            </button>
            <button
              type="button"
              onClick={onCycleCamera}
              title="زاوية الكاميرا"
              className="flex items-center gap-1 rounded-lg border border-white/12 bg-slate-950/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{cameraLabel[cameraMode]}</span>
            </button>
            <button
              type="button"
              onClick={onCycleQuality}
              title="دقة العرض"
              className="rounded-lg border border-white/12 bg-slate-950/90 px-2.5 py-1.5 font-display text-[11px] font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap"
            >
              {quality}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
              className="rounded-lg border border-white/12 bg-slate-950/90 p-1.5 text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              title="إيقاف مؤقت"
              className="rounded-lg border border-white/12 bg-slate-950/90 p-1.5 text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Active Gig Strip */}
      {snapshot.activeGig && (
        <div className="md:hidden pointer-events-auto mx-auto mt-1 w-full max-w-sm rounded-xl border border-amber-400/35 bg-slate-950/92 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-amber-300 truncate">{snapshot.activeGig.title}</span>
            <span className="font-display font-bold tabular-nums text-white" dir="ltr">
              {Math.ceil(snapshot.activeGig.remainingSec)}s
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-amber-400"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (snapshot.activeGig.remainingSec / snapshot.activeGig.timeLimitSec) * 100),
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Celebratory Achievement Unlocked Notification */}
      {activeAchievementBanner && (
        <div className="pointer-events-auto fixed top-20 left-1/2 -translate-x-1/2 z-35 w-[min(92vw,400px)]">
          <button
            type="button"
            onClick={() => {
              onDismissAchievementBanner();
              onOpenAchievements();
            }}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-amber-400 bg-slate-950/95 px-4 py-3 text-right shadow-2xl hover:bg-slate-900 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-2xl">
                {activeAchievementBanner.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-amber-400">
                  🏆 إنجاز جديد مفتوح!
                </p>
                <p className="truncate text-sm font-black text-white">
                  {activeAchievementBanner.title}
                </p>
                <p className="truncate text-[11px] text-slate-300">
                  {activeAchievementBanner.description}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-left">
              <span className="font-display text-sm font-bold text-emerald-400 tabular-nums" dir="ltr">
                +{formatMoney(activeAchievementBanner.reward)}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 w-[min(92vw,380px)]">
        {toasts.map((t) => {
          const toneStyle =
            t.tone === 'success'
              ? 'border-emerald-400/50 bg-slate-950/95 text-emerald-300'
              : t.tone === 'danger'
                ? 'border-rose-400/50 bg-slate-950/95 text-rose-300'
                : t.tone === 'warning'
                  ? 'border-amber-400/50 bg-slate-950/95 text-amber-300'
                  : 'border-sky-400/50 bg-slate-950/95 text-sky-200';
          return (
            <div
              key={t.id}
              className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-bold shadow-xl text-center ${toneStyle}`}
            >
              {t.text}
            </div>
          );
        })}
      </div>

      {/* Bottom Row: Touch Controls + Objective Compass + Bottom Action Dock */}
      <div className="flex items-end justify-between gap-3">
        {/* Right in RTL: Phone & Dash Actions */}
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          {snapshot.nearbyZone && (
            <button
              type="button"
              onClick={onInteractNearby}
              className="rounded-xl border border-amber-300 bg-amber-400 px-3.5 py-2 text-xs font-extrabold text-slate-950 shadow-lg hover:bg-amber-300 cursor-pointer whitespace-nowrap"
            >
              تفاعل مع الموقع (E)
            </button>
          )}

          {/* Stamina Bar + Dash Button */}
          <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-slate-950/90 p-2 shadow-lg">
            <button
              type="button"
              onPointerDown={() => onDashChange(true)}
              onPointerUp={() => onDashChange(false)}
              onPointerCancel={() => onDashChange(false)}
              onPointerLeave={() => onDashChange(false)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
                snapshot.isDashing
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>اندفاع</span>
            </button>
            <div className="w-20 sm:w-24">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>اللياقة</span>
                <span className="font-display tabular-nums">{Math.round(snapshot.stamina)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${snapshot.stamina}%` }}
                />
              </div>
            </div>
          </div>

          {snapshot.hasPhone && (
            <button
              type="button"
              onClick={onOpenPhone}
              className="flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg cursor-pointer whitespace-nowrap"
            >
              <Smartphone className="w-4 h-4" />
              <span>الهاتف</span>
              {snapshot.dayOn && !snapshot.activeGig && snapshot.availableGigs.length > 0 && (
                <span className="font-display text-xs bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-md tabular-nums">
                  {snapshot.availableGigs.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Bottom-Center: Compact Objective Compass */}
        {snapshot.objective.kind !== 'none' && (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2.5 rounded-xl border border-white/15 bg-slate-950/92 px-4 py-2 shadow-lg">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-white whitespace-nowrap">
              {snapshot.objective.label}
            </span>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 font-bold text-sm"
              style={{ transform: `rotate(${snapshot.objective.angleDeg}deg)` }}
            >
              ↑
            </span>
            <span className="font-display text-xs font-bold text-emerald-400 tabular-nums" dir="ltr">
              {snapshot.objective.distance}m
            </span>
          </div>
        )}

        {/* Left in RTL: Virtual Touch Joystick */}
        <div
          ref={joyRef}
          onPointerDown={handleJoyDown}
          onPointerMove={handleJoyMove}
          onPointerUp={handleJoyUp}
          onPointerCancel={handleJoyUp}
          className="pointer-events-auto relative w-28 h-28 rounded-full border border-white/25 bg-slate-950/45 touch-none shrink-0"
          aria-label="عصا التحكم بالاتجاه"
        >
          <div
            className="absolute left-1/2 top-1/2 w-11 h-11 -ml-5.5 -mt-5.5 rounded-full border border-amber-300/60 bg-amber-400/85 shadow-md"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
