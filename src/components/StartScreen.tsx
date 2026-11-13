import { Play, RotateCcw, ShieldAlert, Sparkles, Trophy, Zap } from 'lucide-react';
import { LEVEL_CONFIGS } from '../game/constants';

interface StartScreenProps {
  hasSave: boolean;
  onStartNew: () => void;
  onResume: () => void;
}

export function StartScreen({ hasSave, onStartNew, onResume }: StartScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-400/30 bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wide text-amber-400">
            محاكاة توصيل ثلاثية الأبعاد · 5 مستويات صعوبة متدرجة
          </p>
          <h1
            className="font-display mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-white"
            dir="ltr"
          >
            DELIVER &amp; DASH
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
            ابدأ من الصفر كساعٍ في شوارع المدينة، تفادَ حركة المرور وكلاب الحدائق، طوّر مركباتك ومنزلك للمستوى 5، واشترِ شركة{' '}
            <span className="font-display font-bold text-amber-400" dir="ltr">
              GIG
            </span>{' '}
            مقابل <span className="font-display font-bold text-emerald-400 tabular-nums" dir="ltr">$100,000</span>.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
          <div className="rounded-xl border border-white/10 bg-slate-800/75 p-3.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Zap className="w-4 h-4 shrink-0" />
              <span>اندفاع ومناورة</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              استخدم <span className="font-display text-white" dir="ltr">Shift / Space</span> للاندفاع السريع وكسب إكراميات الوقت.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800/75 p-3.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>تحديات متصاعدة</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              كل مستوى يزيد سرعة السيارات ويطلق كلاباً تطارد البيتزا الساخنة!
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800/75 p-3.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Trophy className="w-4 h-4 shrink-0" />
              <span>مركبات واستثمار</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              افتح لوح التزلج والسكوتر، واشترِ تطبيقات الدخل التلقائي.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              مسار التدرج المهني
            </span>
            <span>5 مستويات</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
            {LEVEL_CONFIGS.map((lvl, idx) => (
              <span key={lvl.level} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: lvl.accentHex }}
                />
                <span>
                  {lvl.level}. {lvl.title}
                </span>
                {idx < LEVEL_CONFIGS.length - 1 && <span className="text-slate-600">/</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {hasSave && (
            <button
              type="button"
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:translate-y-0.5 px-5 py-3.5 text-base font-extrabold text-slate-950 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>استكمال المسيرة</span>
            </button>
          )}
          <button
            type="button"
            onClick={onStartNew}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-extrabold transition-colors cursor-pointer whitespace-nowrap ${
              hasSave
                ? 'border border-white/15 bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
          >
            {hasSave ? <RotateCcw className="w-4 h-4" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{hasSave ? 'بدء لعبة جديدة' : 'ابدأ اللعب الآن'}</span>
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          التحكم: <span className="font-display text-slate-200" dir="ltr">WASD / Arrows</span> للحركة ·{' '}
          <span className="font-display text-slate-200" dir="ltr">Shift / Space</span> للاندفاع ·{' '}
          <span className="font-display text-slate-200" dir="ltr">P</span> للهاتف ·{' '}
          <span className="font-display text-slate-200" dir="ltr">E</span> للتفاعل
        </p>
      </div>
    </div>
  );
}
