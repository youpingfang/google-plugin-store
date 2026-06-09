// CategoryCard — large colored tile for the home page category grid.
// Inspired by Chrome Web Store's category row: full-bleed color, large
// icon, category name, and a count badge.

import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const CATEGORY_THEMES = {
  tools: { gradient: 'from-blue-500 to-blue-600', icon: '🛠️' },
  entertainment: { gradient: 'from-pink-500 to-rose-500', icon: '🎬' },
  developer: { gradient: 'from-violet-500 to-purple-600', icon: '⌨️' },
  theme: { gradient: 'from-emerald-500 to-teal-500', icon: '🎨' },
  productivity: { gradient: 'from-amber-500 to-orange-500', icon: '⚡' },
  accessibility: { gradient: 'from-cyan-500 to-sky-500', icon: '♿' },
};

const CATEGORY_LABELS = {
  tools: '工具类',
  entertainment: '娱乐类',
  developer: '开发者工具',
  theme: '主题',
  productivity: '效率工具',
  accessibility: '无障碍',
};

function CategoryCard({ id, name, count, theme, href, onClick }) {
  const t = CATEGORY_THEMES[id] || { gradient: 'from-slate-500 to-slate-600' };
  const label = name || CATEGORY_LABELS[id] || id;
  const content = (
    <div
      className={`relative w-full h-28 rounded-2xl bg-gradient-to-br ${t.gradient}
                  flex flex-col items-start justify-between p-4
                  shadow-md hover:shadow-xl
                  transition-all duration-200 ease-out
                  hover:-translate-y-0.5
                  cursor-pointer overflow-hidden group`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Decorative shapes in background */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/15 blur-sm" />
      <div className="absolute right-2 bottom-2 w-10 h-10 rounded-full bg-white/10" />

      <div className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm
                    flex items-center justify-center text-lg shadow-inner">
        {t.icon}
      </div>

      <div className="relative flex items-end justify-between w-full">
        <div>
          <div className="text-base font-bold text-white leading-tight drop-shadow-sm">
            {label}
          </div>
          {typeof count === 'number' && (
            <div className="text-xs text-white/80 mt-0.5">
              {count} 个插件
            </div>
          )}
        </div>
        <ArrowUpRight strokeWidth={2.5} className="w-4 h-4 text-white/80 group-hover:translate-x-0.5
                                 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </div>
  );

  if (href) return <Link to={href} className="block">{content}</Link>;
  return content;
}

export default CategoryCard;
