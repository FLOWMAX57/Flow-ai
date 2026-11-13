import { useCallback, useEffect, useRef, useState } from 'react';
import { AchievementsModal } from './components/AchievementsModal';
import { ActionModal } from './components/ActionModal';
import { GameHUD } from './components/GameHUD';
import { PhoneModal } from './components/PhoneModal';
import { StartScreen } from './components/StartScreen';
import { soundEngine } from './game/audio';
import { GameEngine } from './game/engine';
import type { AchievementDef, ActiveDialog, CameraMode, GameSnapshot, QualityTier, ToastMessage } from './game/types';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const toastIdRef = useRef(1);

  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [achievementQueue, setAchievementQueue] = useState<AchievementDef[]>([]);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('medium');
  const [quality, setQuality] = useState<QualityTier>('2K');
  const [muted, setMuted] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [hasSave, setHasSave] = useState(() => GameEngine.hasSavedGame());

  const pushToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const pushAchievementBanner = useCallback((ach: AchievementDef) => {
    setAchievementQueue((prev) => [...prev, ach]);
  }, []);

  useEffect(() => {
    if (achievementQueue.length === 0) return;
    const timer = window.setTimeout(() => {
      setAchievementQueue((prev) => prev.slice(1));
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [achievementQueue]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onSnapshot: (snap) => setSnapshot(snap),
      onToast: pushToast,
      onDialog: (dlg) => setDialog(dlg),
      onAchievementUnlocked: pushAchievementBanner,
      onContextLost: (lost) => setContextLost(lost),
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [pushToast, pushAchievementBanner]);

  // Keyboard shortcuts for Phone (P / Tab), Interact (E), Pause/Close (Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng || !snapshot?.started) return;

      const k = e.key.toLowerCase();
      if (k === 'p' || e.key === 'Tab') {
        if (snapshot.hasPhone && !snapshot.won) {
          e.preventDefault();
          setPhoneOpen((prev) => !prev);
          soundEngine.playClick();
        }
      } else if (k === 'e') {
        eng.interactNearby();
      } else if (e.key === 'Escape') {
        if (achievementsOpen) {
          setAchievementsOpen(false);
        } else if (phoneOpen) {
          setPhoneOpen(false);
        } else if (dialog) {
          setDialog(null);
          eng.setPaused(false);
        } else if (!snapshot.won) {
          eng.setPaused(true);
          setDialog({ type: 'pause' });
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [snapshot?.started, snapshot?.hasPhone, snapshot?.won, phoneOpen, achievementsOpen, dialog]);

  const bindMinimap = useCallback((canvas: HTMLCanvasElement | null) => {
    engineRef.current?.setMinimapCanvas(canvas);
  }, []);

  const handleCloseDialog = () => {
    setDialog(null);
    engineRef.current?.setPaused(false);
  };

  const handleRestart = () => {
    setPhoneOpen(false);
    setAchievementsOpen(false);
    setAchievementQueue([]);
    setDialog(null);
    engineRef.current?.startNewGame();
    setHasSave(false);
  };

  const handleToggleMute = () => {
    const next = !muted;
    soundEngine.muted = next;
    setMuted(next);
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      {/* Isolated WebGL Mount Container */}
      <div ref={mountRef} className="fixed inset-0 h-full w-full" />

      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-6 text-center">
          <div className="max-w-sm rounded-2xl border border-rose-500/40 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-rose-400">توقف العرض الرسومي مؤقتاً</h2>
            <p className="mt-2 text-xs text-slate-300">
              فُقد سياق WebGL. يمكنك تحديث الصفحة لاستعادة العرض ثلاثي الأبعاد مع حفظ تقدمك.
            </p>
          </div>
        </div>
      )}

      {snapshot && !snapshot.started && (
        <StartScreen
          hasSave={hasSave}
          onStartNew={() => {
            setDialog(null);
            setPhoneOpen(false);
            engineRef.current?.startNewGame();
          }}
          onResume={() => {
            engineRef.current?.resumeGame();
          }}
        />
      )}

      {snapshot && snapshot.started && (
        <GameHUD
          snapshot={snapshot}
          toasts={toasts}
          activeAchievementBanner={achievementQueue[0] ?? null}
          cameraMode={cameraMode}
          quality={quality}
          muted={muted}
          onBindMinimap={bindMinimap}
          onJoystickMove={(x, z) => engineRef.current?.setJoystick(x, z)}
          onDashChange={(active) => engineRef.current?.setDash(active)}
          onOpenPhone={() => {
            soundEngine.playClick();
            setPhoneOpen(true);
          }}
          onOpenAchievements={() => {
            soundEngine.playClick();
            setAchievementsOpen(true);
          }}
          onDismissAchievementBanner={() => {
            setAchievementQueue((prev) => prev.slice(1));
          }}
          onCycleCamera={() => {
            if (engineRef.current) setCameraMode(engineRef.current.cycleCameraMode());
          }}
          onCycleQuality={() => {
            if (engineRef.current) setQuality(engineRef.current.cycleQuality());
          }}
          onToggleMute={handleToggleMute}
          onPause={() => {
            engineRef.current?.setPaused(true);
            setDialog({ type: 'pause' });
          }}
          onInteractNearby={() => engineRef.current?.interactNearby()}
        />
      )}

      {snapshot && snapshot.started && achievementsOpen && (
        <AchievementsModal
          snapshot={snapshot}
          onClose={() => {
            soundEngine.playClick();
            setAchievementsOpen(false);
          }}
        />
      )}

      {snapshot && snapshot.started && phoneOpen && (
        <PhoneModal
          snapshot={snapshot}
          incomeMultiplier={engineRef.current?.getIncomeMultiplier() ?? 1}
          readyForGigCompany={engineRef.current?.isReadyForGigCompany() ?? false}
          onClose={() => {
            soundEngine.playClick();
            setPhoneOpen(false);
          }}
          onAcceptGig={(id) => {
            engineRef.current?.acceptGig(id);
            setPhoneOpen(false);
          }}
          onCancelGig={() => engineRef.current?.cancelActiveGig()}
          onRefreshGigs={() => engineRef.current?.refreshGigs()}
          onBuyWallet={(idx) => engineRef.current?.buyWalletUpgrade(idx)}
          onBuyGear={(lvl) => engineRef.current?.buyGear(lvl)}
          onBuyApp={(id) => engineRef.current?.buyApp(id)}
          onBuyHome={() => engineRef.current?.buyHome()}
          onUpgradeHome={() => engineRef.current?.upgradeHome()}
          onBuyGigCompany={() => {
            setPhoneOpen(false);
            engineRef.current?.buyGigCompany();
          }}
        />
      )}

      {snapshot && snapshot.started && (
        <ActionModal
          dialog={dialog}
          snapshot={snapshot}
          readyForGigCompany={engineRef.current?.isReadyForGigCompany() ?? false}
          onClose={handleCloseDialog}
          onBuyPhone={() => engineRef.current?.buyPhone()}
          onBuyHome={() => engineRef.current?.buyHome()}
          onUpgradeHome={() => engineRef.current?.upgradeHome()}
          onStartDay={() => engineRef.current?.startDay()}
          onBuyGigCompany={() => engineRef.current?.buyGigCompany()}
          onContinueEndless={() => engineRef.current?.continueEndless()}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
