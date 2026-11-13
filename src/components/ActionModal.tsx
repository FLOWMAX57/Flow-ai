import { Award, CheckCircle2, Home, Play, RotateCcw, Smartphone, Trophy } from 'lucide-react';
import {
  GIG_COMPANY_COST,
  HOME_PURCHASE_COST,
  HOME_UPGRADE_COSTS,
  PHONE_COST,
  formatMoney,
} from '../game/constants';
import type { ActiveDialog, GameSnapshot } from '../game/types';

interface ActionModalProps {
  dialog: ActiveDialog;
  snapshot: GameSnapshot;
  readyForGigCompany: boolean;
  onClose: () => void;
  onBuyPhone: () => void;
  onBuyHome: () => void;
  onUpgradeHome: () => void;
  onStartDay: () => void;
  onBuyGigCompany: () => void;
  onContinueEndless: () => void;
  onRestart: () => void;
}

export function ActionModal({
  dialog,
  snapshot,
  readyForGigCompany,
  onClose,
  onBuyPhone,
  onBuyHome,
  onUpgradeHome,
  onStartDay,
  onBuyGigCompany,
  onContinueEndless,
  onRestart,
}: ActionModalProps) {
  // Victory Overlay
  if (snapshot.won) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-400/50 bg-slate-900 p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-400">
            <Trophy className="w-9 h-9" />
          </div>
          <h2 className="mt-4 text-3xl font-black text-amber-400">أصبحت مالك GIG!</h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            تهانينا! حققت حلم الإمبراطورية اللوجستية في <span className="font-bold text-white">{snapshot.day}</span> أيام
            بإجمالي أرباح{' '}
            <span className="font-display font-bold text-emerald-400 tabular-nums" dir="ltr">
              {formatMoney(snapshot.totalEarned)}
            </span>{' '}
            وبأفضل سلسلة توصيل <span className="font-bold text-amber-300">×{snapshot.bestCombo}</span>.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onContinueEndless}
              className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-3 text-sm font-extrabold text-slate-950 cursor-pointer"
            >
              متابعة اللعب الحر في المدينة
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="w-full rounded-xl border border-white/15 bg-slate-800 hover:bg-slate-700 py-3 text-sm font-bold text-white cursor-pointer"
            >
              بدء تحدٍ جديد من الصفر
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dialog) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/65 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl">
        {dialog.type === 'welcome' && (
          <>
            <h3 className="text-lg font-black text-amber-400">مرحباً بك في DELIVER &amp; DASH</h3>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">
              تقف الآن أمام بيتك! ابدأ بأخذ أول مهمة يدوية من <b>مركز الطرود 📦</b> لكسب <b>$25</b>، ثم اشترِ هاتفاً
              من <b>متجر الهواتف 📱</b> مقابل <b>$15</b> لفتح عالم الطلبات المتدرجة في الصعوبة.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
            >
              هيا ننطلق!
            </button>
          </>
        )}

        {dialog.type === 'level_up' && (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/20 text-amber-400">
              <Award className="w-7 h-7" />
            </div>
            <h3 className="mt-3 text-xl font-black text-amber-400">
              ترقية للمستوى {dialog.level.level}: {dialog.level.title}
            </h3>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">{dialog.level.subtitle}</p>
            <div className="mt-3 rounded-xl border border-white/10 bg-slate-800/80 p-3 text-xs text-slate-300">
              أجور العقود الجديدة:{' '}
              <span className="font-display font-bold text-emerald-400" dir="ltr">
                {formatMoney(dialog.level.payRange[0])} – {formatMoney(dialog.level.payRange[1])}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
            >
              جاهز للتحدي!
            </button>
          </div>
        )}

        {dialog.type === 'day_summary' && (
          <>
            <h3 className="text-lg font-black text-amber-400">
              🌙 ملخص اليوم {dialog.dayCompleted}
            </h3>
            <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-slate-800/80 p-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-300">التوصيلات المكتملة</span>
                <span className="font-display font-bold text-white tabular-nums">{dialog.deliveries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">أرباح اليوم</span>
                <span className="font-display font-bold text-emerald-400 tabular-nums" dir="ltr">
                  +{formatMoney(dialog.earned)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">إكراميات السرعة</span>
                <span className="font-display font-bold text-amber-300 tabular-nums" dir="ltr">
                  +{formatMoney(dialog.tips)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-slate-300">الإيجار</span>
                <span className="font-display font-bold text-slate-200 tabular-nums" dir="ltr">
                  {dialog.rentPaid > 0 ? `-${formatMoney(dialog.rentPaid)}` : 'معفى'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              عُد إلى الدائرة الزرقاء في بيتك لبدء اليوم {snapshot.day} متى شئت.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
            >
              حسناً
            </button>
          </>
        )}

        {dialog.type === 'pause' && (
          <>
            <h3 className="text-lg font-black text-white">إيقاف مؤقت</h3>
            <p className="mt-1.5 text-xs text-slate-400">
              يتم حفظ تقدمك تلقائياً بعد كل توصيل وترقية.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>استئناف اللعب</span>
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 py-2.5 text-sm font-bold text-rose-200 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة اللعب من البداية</span>
              </button>
            </div>
          </>
        )}

        {dialog.type === 'zone' && dialog.kind === 'phone' && (
          <>
            <h3 className="flex items-center gap-2 text-lg font-black text-sky-400">
              <Smartphone className="w-5 h-5" />
              <span>متجر الهواتف الذكية</span>
            </h3>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">
              {snapshot.hasPhone
                ? 'لديك هاتفك الذكي بالفعل! اضغط على زر الهاتف لفتح GigFinder ومتجر المركبات.'
                : `اشترِ هاتفك الذكي مقابل ${formatMoney(PHONE_COST)} لفتح تطبيقات التوصيل والترقيات والمركبات.`}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {!snapshot.hasPhone && (
                <button
                  type="button"
                  disabled={snapshot.money < PHONE_COST}
                  onClick={() => {
                    onBuyPhone();
                    onClose();
                  }}
                  className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                >
                  شراء الهاتف {formatMoney(PHONE_COST)}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-white/15 bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-bold text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </>
        )}

        {dialog.type === 'zone' && dialog.kind === 'home_manage' && (
          <>
            <h3 className="flex items-center gap-2 text-lg font-black text-amber-400">
              <Home className="w-5 h-5" />
              <span>إدارة وتطوير بيتك (المستوى {snapshot.homeLevel}/5)</span>
            </h3>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">
              {snapshot.ownHome
                ? 'أنت تملك هذا المنزل! طوّره إلى المستوى 5 لترتقي بمكانتك وتؤهل نفسك لامتلاك شركة GIG.'
                : `أنت تستأجر مقابل ${formatMoney(50)} يومياً (بعد اليوم الأول). اشترِ البيت مقابل ${formatMoney(HOME_PURCHASE_COST)}.`}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {!snapshot.ownHome ? (
                <button
                  type="button"
                  disabled={snapshot.money < HOME_PURCHASE_COST}
                  onClick={onBuyHome}
                  className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                >
                  شراء البيت {formatMoney(HOME_PURCHASE_COST)}
                </button>
              ) : snapshot.homeLevel < 5 ? (
                <button
                  type="button"
                  disabled={snapshot.money < HOME_UPGRADE_COSTS[snapshot.homeLevel - 1]}
                  onClick={onUpgradeHome}
                  className="w-full rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
                >
                  ترقية للمستوى {snapshot.homeLevel + 1} —{' '}
                  {formatMoney(HOME_UPGRADE_COSTS[snapshot.homeLevel - 1])}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-950/50 border border-emerald-400/40 p-3 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>البيت مطور بالكامل!</span>
                </div>
              )}

              {!snapshot.dayOn && (
                <button
                  type="button"
                  onClick={() => {
                    onStartDay();
                    onClose();
                  }}
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
                >
                  ☀️ بدء يوم جديد
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-white/15 bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-bold text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </>
        )}

        {dialog.type === 'zone' && (dialog.kind === 'pizza' || dialog.kind === 'hub') && (
          <>
            <h3 className="text-lg font-black text-amber-400">
              {dialog.kind === 'pizza' ? "🍕 مطعم Terry's Pizza" : '📦 مركز الطرود الرئيسي'}
            </h3>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">
              {dialog.kind === 'pizza'
                ? 'اقبل طلب بيتزا من تطبيق GigFinder في هاتفك، ثم عُد إلى هنا لاستلام البيتزا ساخنة!'
                : 'افتح تطبيق GigFinder في هاتفك واقبل مهمة طرد أو VIP، ثم عُد إلى هنا لاستلام الشحنة.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-xl bg-amber-400 hover:bg-amber-300 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer"
            >
              فهمت
            </button>
          </>
        )}

        {dialog.type === 'zone' && dialog.kind === 'gig' && (
          <>
            <h3 className="text-lg font-black text-amber-400">🏢 مقر GIG Company</h3>
            <p className="mt-2 text-sm text-slate-200">
              شروط الاستحواذ على الشركة الكبرى مقابل{' '}
              <span className="font-display font-bold text-emerald-400" dir="ltr">
                {formatMoney(GIG_COMPANY_COST)}
              </span>
              :
            </p>
            <ul className="mt-3 space-y-2 rounded-xl border border-white/10 bg-slate-800/80 p-3 text-xs">
              <li className="flex justify-between">
                <span>منزل مملوك ومطوّر للمستوى 5</span>
                <span>{snapshot.ownHome && snapshot.homeLevel >= 5 ? '✅' : '❌'}</span>
              </li>
              <li className="flex justify-between">
                <span>جميع ترقيات المحفظة (3/3)</span>
                <span>{snapshot.walletUpgrades.every(Boolean) ? '✅' : '❌'}</span>
              </li>
              <li className="flex justify-between">
                <span>توفير $100,000 نقداً</span>
                <span>{snapshot.money >= GIG_COMPANY_COST ? '✅' : '❌'}</span>
              </li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                disabled={!readyForGigCompany || snapshot.money < GIG_COMPANY_COST}
                onClick={() => {
                  onBuyGigCompany();
                  onClose();
                }}
                className="w-full rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 py-2.5 text-sm font-extrabold text-slate-950 cursor-pointer disabled:cursor-not-allowed"
              >
                إتمام شراء GIG Company
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-white/15 bg-slate-800 hover:bg-slate-700 py-2.5 text-sm font-bold text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
