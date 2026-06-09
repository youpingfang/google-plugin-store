// HeroBanner — large top-of-page hero with gradient, headline, and a
// floating row of plugin icons. Modeled on the Chrome Web Store hero.
//
// All colors come from CSS variables / utility classes so it follows
// the active light/dark theme.

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const SLIDES = [
  {
    title: '每天都是世界地球日',
    subtitle: '种树插件，环保购物等',
    cta: '查看合集',
    gradient: 'from-emerald-400 via-emerald-300 to-sky-200',
  },
  {
    title: '为开发者打造的 AI 工具集',
    subtitle: 'Transformer、Agent、Prompt 工程全覆盖',
    cta: '立即查看',
    gradient: 'from-violet-500 via-purple-400 to-pink-300',
  },
  {
    title: '沉浸阅读，专注当下',
    subtitle: '深度阅读插件，护眼暗色主题',
    cta: '探索更多',
    gradient: 'from-amber-400 via-orange-300 to-rose-300',
  },
  {
    title: '效率工具，节省你的时间',
    subtitle: 'Tab 管理、快速笔记、自动化脚本',
    cta: '浏览全部',
    gradient: 'from-blue-500 via-cyan-400 to-teal-300',
  },
  {
    title: '让浏览器更懂你',
    subtitle: '主题、字体、布局个性化',
    cta: '开始定制',
    gradient: 'from-rose-400 via-pink-300 to-fuchsia-300',
  },
];

function HeroBanner({ plugins = [] }) {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Pick up to 6 plugins with icons for the floating icon row
  const icons = plugins
    .filter((p) => p.icon)
    .slice(0, 6);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, [playing]);

  const current = SLIDES[slide];

  return (
    <section
      className={`relative w-full h-72 md:h-80 rounded-3xl overflow-hidden
                  bg-gradient-to-br ${current.gradient}
                  transition-all duration-700 ease-out`}
    >
      {/* Decorative blurred orbs */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-48 h-48
                    rounded-full bg-white/30 blur-2xl pointer-events-none" />
      <div className="absolute right-1/3 -bottom-12 w-40 h-40
                    rounded-full bg-white/25 blur-2xl pointer-events-none" />

      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center gap-8">
        <h1 className="text-3xl md:text-5xl font-bold text-text-primary drop-shadow-sm
                     tracking-tight">
          {current.title}
        </h1>

        {/* Floating plugin icons — the main attraction */}
        {icons.length > 0 && (
          <div className="flex items-center justify-center gap-3 md:gap-4">
            {icons.map((p) => (
              <HeroIcon key={p.id} plugin={p} />
            ))}
          </div>
        )}
      </div>

      {/* Slide controls (bottom-right) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1
                    bg-black/30 backdrop-blur-sm rounded-full px-1 py-0.5">
        <button
          onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
          className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors"
          aria-label="上一张"
        >
          <ChevronLeft strokeWidth={2.5} className="w-4 h-4" />
        </button>
        <span className="text-white text-xs font-medium tabular-nums px-1">
          {slide + 1}/{SLIDES.length}
        </span>
        <button
          onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
          className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors"
          aria-label="下一张"
        >
          <ChevronLeft strokeWidth={2.5} className="w-4 h-4 rotate-180" />
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="p-1.5 rounded-full text-white hover:bg-white/20 transition-colors"
          aria-label={playing ? '暂停' : '播放'}
        >
          {playing ? <Pause strokeWidth={2.5} className="w-3.5 h-3.5" /> : <Play strokeWidth={2.5} className="w-3.5 h-3.5" />}
        </button>
      </div>
    </section>
  );
}

// Floating icon shown in the hero. Falls back to a colored tile
// with the first letter when the icon URL fails to load.
function HeroIcon({ plugin }) {
  const [err, setErr] = useState(false);
  const showImg = plugin.icon && !err;
  return (
    <a
      href={plugin.crxUrl}
      download
      className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white shadow-lg
               ring-1 ring-black/5 overflow-hidden flex items-center justify-center
               hover:-translate-y-1 transition-transform duration-200
               img-zoom"
      title={`下载 ${plugin.name}`}
    >
      {showImg ? (
        <img
          src={plugin.icon}
          alt={plugin.name}
          onError={() => setErr(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className={`w-full h-full bg-gradient-to-br ${getHeroGradient(plugin.name)}
                     flex items-center justify-center text-white font-bold text-lg drop-shadow-sm`}
        >
          {(plugin.name || '?').charAt(0).toUpperCase()}
        </span>
      )}
    </a>
  );
}

const HERO_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
];

function getHeroGradient(name) {
  const i = (name || 'x').charCodeAt(0) % HERO_GRADIENTS.length;
  return HERO_GRADIENTS[i];
}

export default HeroBanner;
