import { useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS, formatMoney, getAchievementProgress } from '../game/constants';
import type { AchievementCategory, GameSnapshot } from '../game/types';

interface AchievementsModalProps {
  snapshot: GameSnapshot;
  onClose: () => void;
}

export function AchievementsModal({ snapshot, onClose }: AchievementsModalProps) {
  const [filter, setFilter] = useState<'all' | AchievementCategory>('all');

  const unlockedCount = snapshot.unlockedAchievements.length;
  const totalCount = ACHIEVEMENTS.length;
  const completionPct = Math.round((unlockedCount / totalCount) * 100);

  const visible = ACHIEVEMENTS.filter((a) => filter === 'all' || a.category === filter);

  const categories: Array<{ id: 'all' | AchievementCategory; label: string }> = [
    { id: 'all', label: 'الكل' },
    { id: 'deliveries', label: 'التوصيلات' },
    { id: 'earnings', label: 'الأرباح' },
    { id: 'progression', label: 'التقدم' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-amber-400/35 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">سجل الإنجازات</h2>
              <p className="text-xs text-slate-400 tabular-nums">
                مكتمل {unlockedCount} من {totalCount} ({completionPct}%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 p-2 text-slate-300 cursor-pointer"
            aria-label="إغلاق سجل الإنجازات"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overall Progress + Filter Tabs */}
        <div className="border-b border-white/10 bg-slate-900/95 px-5 py-3 space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-amber-400 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 p-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  filter === cat.id
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="game-scroll flex-1 overflow-y-auto p-4 space-y-2.5">
          {visible.map((ach) => {
            const done = snapshot.unlockedAchievements.includes(ach.id);
            const current = getAchievementProgress(ach, snapshot);
            const pct = Math.min(100, Math.round((current / ach.target) * 100));
            const progressText =
              ach.category === 'earnings'
                ? `${formatMoney(current)} / ${formatMoney(ach.target)}`
                : `${current} / ${ach.target}`;

            return (
              <div
                key={ach.id}
                className={`rounded-xl border p-3.5 transition-colors ${
                  done
                    ? 'border-emerald-400/45 bg-emerald-950/35'
                    : 'border-white/10 bg-slate-800/75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                        done ? 'bg-emerald-400/20' : 'bg-slate-900'
                      }`}
                    >
                      {ach.icon}
                    </div>
                    <div>
                      <h3 className={`text-sm font-extrabold ${done ? 'text-emerald-300' : 'text-white'}`}>
                        {ach.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-300">{ach.description}</p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-display text-xs font-bold text-amber-300 tabular-nums" dir="ltr">
                      +{formatMoney(ach.reward)}
                    </span>
                    <div className="mt-0.5 text-[11px] font-bold text-slate-400">
                      {done ? 'مكتمل ✔' : `${pct}%`}
                    </div>
                  </div>
                </div>

                {!done && (
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1 tabular-nums">
                      <span>التقدم</span>
                      <span dir="ltr">{progressText}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
