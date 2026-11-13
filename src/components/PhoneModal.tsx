import { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Home,
  Lock,
  MessageSquare,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import {
  ACHIEVEMENTS,
  APPS_CONFIG,
  GEAR_ITEMS,
  GIG_COMPANY_COST,
  HOME_PURCHASE_COST,
  HOME_UPGRADE_COSTS,
  WALLET_UPGRADES,
  formatClock,
  formatMoney,
  getAchievementProgress,
} from '../game/constants';
import type { GameSnapshot, PhoneTab } from '../game/types';

interface PhoneModalProps {
  snapshot: GameSnapshot;
  incomeMultiplier: number;
  readyForGigCompany: boolean;
  onClose: () => void;
  onAcceptGig: (id: string) => void;
  onCancelGig: () => void;
  onRefreshGigs: () => void;
  onBuyWallet: (idx: 0 | 1 | 2) => void;
  onBuyGear: (level: number) => void;
  onBuyApp: (id: 'yw' | 'bc' | 'is') => void;
  onBuyHome: () => void;
  onUpgradeHome: () => void;
  onBuyGigCompany: () => void;
}

export function PhoneModal({
  snapshot,
  incomeMultiplier,
  readyForGigCompany,
  onClose,
  onAcceptGig,
  onCancelGig,
  onRefreshGigs,
  onBuyWallet,
  onBuyGear,
  onBuyApp,
  onBuyHome,
  onUpgradeHome,
  onBuyGigCompany,
}: PhoneModalProps) {
  const [tab, setTab] = useState<PhoneTab>('gigs');

  const tabs: Array<{ id: PhoneTab; label: string; Icon: typeof Briefcase }> = [
    { id: 'gigs', label: 'المهام', Icon: Briefcase },
    { id: 'wallet', label: 'المعدات', Icon: Wallet },
    { id: 'apps', label: 'الاستثمار', Icon: TrendingUp },
    { id: 'property', label: 'العقار', Icon: Home },
    { id: 'social', label: 'السجل', Icon: MessageSquare },
  ];

  const chatMessages = [
    {
      sender: 'GIG Dispatch',
      text: 'مرحباً بك في الشبكة! أكمل المهام بسرعة للحصول على إكرامية ومضاعف سلسلة التوصيل.',
    },
    {
      sender: 'المالك العقاري',
      text: snapshot.ownHome
        ? 'بيتك الآن ملكك بالكامل! استمر بتطويره حتى المستوى 5.'
        : 'الإيجار اليومي $50 بدءاً من اليوم الثاني. اشترِ البيت بـ $5,000 لتتخلص من الإيجار.',
    },
    ...(snapshot.careerLevel >= 2
      ? [
          {
            sender: 'الشيف تيري 🍕',
            text: 'انتبه! كلاب الحدائق بدأت تلاحق رائحة البيتزا الساخنة — استخدم الاندفاع للهرب!',
          },
        ]
      : []),
    ...(readyForGigCompany
      ? [
          {
            sender: 'مجلس إدارة GIG',
            text: 'أنت مؤهل الآن لشراء شركة GIG مقابل $100,000! توجّه للمقر أو أكمل الصفقة من تبويب العقار.',
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center sm:justify-start bg-slate-950/60 p-3 sm:p-6">
      <div className="flex h-[min(86vh,660px)] w-full max-w-[360px] flex-col overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-900 shadow-2xl">
        {/* Phone Top Status Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-5 py-3 text-xs">
          <span className="font-bold text-amber-400 tabular-nums">{formatClock(snapshot.dayMinutes)}</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>هاتف الساعي</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 p-1 text-slate-200 cursor-pointer"
            aria-label="إغلاق الهاتف"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Screen */}
        <div className="game-scroll flex-1 overflow-y-auto p-3.5 space-y-3">
          {tab === 'gigs' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-white">طلبات GigFinder</h2>
                  <p className="text-[11px] text-slate-400">
                    المنجز: {snapshot.completedGigs} · المضاعف ×{incomeMultiplier.toFixed(2)}
                  </p>
                </div>
                {snapshot.dayOn && !snapshot.activeGig && (
                  <button
                    type="button"
                    onClick={onRefreshGigs}
                    className="flex items-center gap-1 rounded-lg border border-white/12 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث</span>
                  </button>
                )}
              </div>

              {!snapshot.dayOn ? (
                <div className="rounded-xl border border-amber-400/25 bg-slate-800/80 p-4 text-center">
                  <p className="text-sm font-bold text-amber-300">اليوم لم يبدأ بعد</p>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    قف في الدائرة الزرقاء أمام بيتك لبدء يوم عمل جديد واستلام الطلبات.
                  </p>
                </div>
              ) : snapshot.activeGig ? (
                <div className="rounded-xl border border-amber-400/50 bg-slate-800 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                    <span>مهمة نشطة الآن</span>
                    <span className="font-display tabular-nums" dir="ltr">
                      {Math.ceil(snapshot.activeGig.remainingSec)}s
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-white">{snapshot.activeGig.title}</p>
                  <p className="text-xs text-slate-300">
                    {snapshot.activeGig.stage === 0
                      ? snapshot.activeGig.pickupType === 'pizza'
                        ? "توجّه إلى Terry's Pizza لاستلام الطلب"
                        : 'توجّه إلى مركز الطرود لاستلام الشحنة'
                      : `سلّم إلى ${snapshot.activeGig.targetHouse.label} (${snapshot.activeGig.targetHouse.district})`}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span>الأجر المتوقع</span>
                    <span className="font-display font-bold text-emerald-400 tabular-nums" dir="ltr">
                      {formatMoney(snapshot.activeGig.basePay * incomeMultiplier)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelGig}
                    className="w-full rounded-xl bg-rose-600/90 hover:bg-rose-500 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    إلغاء المهمة
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {snapshot.availableGigs.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl border border-white/10 bg-slate-800/85 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-white leading-snug">{g.title}</span>
                        <span className="font-display text-sm font-bold text-emerald-400 tabular-nums shrink-0" dir="ltr">
                          {formatMoney(g.basePay * incomeMultiplier)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          الصعوبة: {'★'.repeat(g.difficulty)}
                          {'☆'.repeat(5 - g.difficulty)}
                        </span>
                        <span className="tabular-nums">
                          {g.timeLimitSec} ثانية · +{g.xpReward} XP
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAcceptGig(g.id)}
                        className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 py-2 text-xs font-extrabold text-slate-950 cursor-pointer"
                      >
                        قبول الطلب
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'wallet' && (
            <>
              <div className="rounded-xl border border-white/10 bg-slate-800/90 p-3.5 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>الرصيد الحالي</span>
                  <span className="font-display font-bold text-emerald-400 tabular-nums" dir="ltr">
                    {formatMoney(snapshot.money)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>إجمالي الأرباح</span>
                  <span className="font-display font-bold text-white tabular-nums" dir="ltr">
                    {formatMoney(snapshot.totalEarned)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>مضاعف الأجر الحالي</span>
                  <span className="font-display font-bold text-amber-400 tabular-nums" dir="ltr">
                    ×{incomeMultiplier.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-amber-300 mb-2">ترقيات المركبات والسرعة</h3>
                <div className="space-y-2">
                  {GEAR_ITEMS.slice(1).map((item) => {
                    const owned = snapshot.gearLevel >= item.id;
                    const locked = snapshot.gearLevel < item.id - 1;
                    return (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-slate-800/85 p-3">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span>
                            {item.icon} {item.name}
                          </span>
                          <span className="font-display text-sky-400 tabular-nums" dir="ltr">
                            {item.speed} SPD
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">{item.description}</p>
                        <button
                          type="button"
                          disabled={owned || locked || snapshot.money < item.cost}
                          onClick={() => onBuyGear(item.id)}
                          className="mt-2 w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-1.5 text-xs font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {owned ? '✔ مجهز' : locked ? 'افتح المستوى السابق أولاً' : `شراء ${formatMoney(item.cost)}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-emerald-300 mb-2">ترقيات المحفظة (+25% لكل ترقية)</h3>
                <div className="space-y-2">
                  {WALLET_UPGRADES.map((w, idx) => {
                    const owned = snapshot.walletUpgrades[idx];
                    const locked = idx > 0 && !snapshot.walletUpgrades[idx - 1];
                    return (
                      <div key={w.id} className="rounded-xl border border-white/10 bg-slate-800/85 p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-white">{w.name}</p>
                          <p className="text-[11px] text-emerald-400">+25% أرباح التوصيل</p>
                        </div>
                        <button
                          type="button"
                          disabled={owned || locked || snapshot.money < w.cost}
                          onClick={() => onBuyWallet(idx as 0 | 1 | 2)}
                          className="rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400 px-3 py-1.5 text-xs font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed shrink-0"
                        >
                          {owned ? '✔ مفعّل' : formatMoney(w.cost)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'apps' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-300">
                استثمر أرباحك في التطبيقات الرقمية لتحقيق دخل تلقائي مستمر خلال ساعات العمل اليومية.
              </p>
              {APPS_CONFIG.map((app) => {
                const owned = snapshot.apps[app.id];
                const locked = Boolean(app.requires && !snapshot.apps[app.requires]);
                return (
                  <div key={app.id} className="rounded-xl border border-white/10 bg-slate-800/90 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-white" dir="ltr">
                        {app.name}
                      </span>
                      <span className="font-display text-xs font-bold text-emerald-400 tabular-nums" dir="ltr">
                        +{formatMoney(app.incomePerMin)}/min
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{app.subtitle}</p>
                    {locked && (
                      <p className="flex items-center gap-1 text-[11px] text-amber-300">
                        <Lock className="w-3 h-3" />
                        <span>يتطلب تفعيل التطبيق السابق أولاً</span>
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={owned || locked || snapshot.money < app.cost}
                      onClick={() => onBuyApp(app.id)}
                      className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-2 text-xs font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {owned ? '✔ يعمل الآن' : `استثمار ${formatMoney(app.cost)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'property' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-800/90 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white">🏠 منزلك الخاص</span>
                  <span className="text-xs font-bold text-amber-400">المستوى {snapshot.homeLevel}/5</span>
                </div>
                <p className="text-xs text-slate-300">
                  {snapshot.ownHome
                    ? 'أنت تملك المنزل! استمر في التطوير للمستوى 5 للوصول إلى صفقة GIG.'
                    : 'حالياً تستأجر بـ $50 يومياً. اشترِ البيت بـ $5,000.'}
                </p>
                {!snapshot.ownHome ? (
                  <button
                    type="button"
                    disabled={snapshot.money < HOME_PURCHASE_COST}
                    onClick={onBuyHome}
                    className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-2 text-xs font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                  >
                    شراء المنزل {formatMoney(HOME_PURCHASE_COST)}
                  </button>
                ) : snapshot.homeLevel < 5 ? (
                  <button
                    type="button"
                    disabled={snapshot.money < HOME_UPGRADE_COSTS[snapshot.homeLevel - 1]}
                    onClick={onUpgradeHome}
                    className="w-full rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400 py-2 text-xs font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                  >
                    تطوير للمستوى {snapshot.homeLevel + 1} —{' '}
                    {formatMoney(HOME_UPGRADE_COSTS[snapshot.homeLevel - 1])}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>المنزل مطور لأقصى مستوى!</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-amber-400/35 bg-slate-800/95 p-3.5 space-y-2">
                <h3 className="text-sm font-extrabold text-amber-300">🏢 الاستحواذ على GIG Company</h3>
                <ul className="space-y-1.5 text-xs text-slate-200">
                  <li className="flex items-center justify-between">
                    <span>تطوير البيت للمستوى 5</span>
                    <span>{snapshot.ownHome && snapshot.homeLevel >= 5 ? '✅' : '❌'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>جميع ترقيات المحفظة (3/3)</span>
                    <span>{snapshot.walletUpgrades.every(Boolean) ? '✅' : '❌'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>رأس المال المطلوب</span>
                    <span className="font-display tabular-nums" dir="ltr">
                      {formatMoney(GIG_COMPANY_COST)}
                    </span>
                  </li>
                </ul>
                <button
                  type="button"
                  disabled={!readyForGigCompany || snapshot.money < GIG_COMPANY_COST || snapshot.endlessMode}
                  onClick={onBuyGigCompany}
                  className="w-full rounded-lg bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-2.5 text-xs font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                >
                  {snapshot.endlessMode
                    ? '✔ أنت مالك شركة GIG'
                    : `شراء شركة GIG (${formatMoney(GIG_COMPANY_COST)})`}
                </button>
              </div>
            </div>
          )}

          {tab === 'social' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-extrabold text-amber-300 mb-2">الرسائل والتوجيهات</h3>
                <div className="space-y-2">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-slate-800/85 p-3">
                      <p className="text-[11px] font-extrabold text-amber-400">{m.sender}</p>
                      <p className="mt-1 text-xs text-slate-200 leading-relaxed">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-emerald-300 mb-2">
                  الإنجازات ({snapshot.unlockedAchievements.length}/{ACHIEVEMENTS.length})
                </h3>
                <div className="space-y-2">
                  {ACHIEVEMENTS.map((ach) => {
                    const done = snapshot.unlockedAchievements.includes(ach.id);
                    const cur = getAchievementProgress(ach, snapshot);
                    const pct = Math.min(100, Math.round((cur / ach.target) * 100));
                    return (
                      <div
                        key={ach.id}
                        className={`rounded-xl border p-2.5 ${
                          done
                            ? 'border-emerald-400/40 bg-emerald-950/35'
                            : 'border-white/10 bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={done ? 'text-emerald-300' : 'text-slate-100'}>
                            {ach.icon} {ach.title}
                          </span>
                          <span className="font-display text-amber-300 tabular-nums" dir="ltr">
                            +{formatMoney(ach.reward)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">{ach.description}</p>
                        {!done && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900">
                              <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-display text-[10px] text-slate-400 tabular-nums" dir="ltr">
                              {pct}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phone Bottom Tab Bar */}
        <div className="grid grid-cols-5 border-t border-white/10 bg-slate-950">
          {tabs.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold cursor-pointer transition-colors ${
                  active ? 'text-amber-400 bg-slate-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
