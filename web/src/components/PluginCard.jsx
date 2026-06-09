import { Link } from 'react-router-dom';
import { Star, Users } from 'lucide-react';
import { useState } from 'react';

// Chrome Web Store style plugin card:
//   - Big 16:9-ish icon/cover at the top
//   - Title left-aligned, bold
//   - Author muted below
//   - Compact rating + install row at the bottom

function PluginCard({ plugin, index = 0, layout = 'grid' }) {
  const { id, name, author, icon, shortDescription, rating = 0, installCount = 0 } = plugin;
  const [imgError, setImgError] = useState(false);
  const hasIcon = icon && !imgError;

  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  // "row" layout: horizontal compact tile for narrow rows
  if (layout === 'row') {
    return (
      <Link to={`/plugin/${id}`}
        className="group flex items-center gap-3 p-3 bg-surface border border-border
                 rounded-2xl hover:border-primary/50 hover:shadow-md
                 transition-all duration-200 animate-fadeIn"
        style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
      >
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-2 shrink-0
                      ring-1 ring-border img-zoom">
          {hasIcon ? (
            <img src={icon} alt={name}
                 onError={() => setImgError(true)}
                 className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getGradient(name)}
                            flex items-center justify-center text-white font-bold text-xl`}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-text-primary truncate
                       group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-xs text-text-secondary truncate mt-0.5">
            {author}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Star strokeWidth={2.5} className="w-3 h-3 text-star fill-star" />
              <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users strokeWidth={2.5} className="w-3 h-3" />
              {formatCount(installCount)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Default: grid (big card) — Chrome Store style
  return (
    <Link to={`/plugin/${id}`}
      className="group block bg-surface border border-border rounded-2xl
               overflow-hidden hover:border-primary/40 hover:shadow-xl
               hover:-translate-y-1 transition-all duration-300
               animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      {/* Big cover area */}
      <div className="relative aspect-[16/10] bg-surface-2 overflow-hidden img-zoom">
        {hasIcon ? (
          <img
            src={icon}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getGradient(name)}
                          flex items-center justify-center`}>
            <span className="text-white font-bold text-5xl drop-shadow-md">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Subtle bottom gradient for legibility if we overlay text later */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent
                      pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-semibold text-[15px] text-text-primary truncate
                     group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-xs text-text-secondary truncate mt-0.5">
          {author}
        </p>
        {shortDescription && (
          <p className="text-xs text-text-secondary line-clamp-2 mt-1.5 leading-relaxed">
            {shortDescription}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2.5 text-xs">
          <span className="flex items-center gap-1">
            <Star strokeWidth={2.5} className="w-3.5 h-3.5 text-star fill-star" />
            <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
          </span>
          <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
          <span className="flex items-center gap-1 text-text-secondary">
            <Users strokeWidth={2.5} className="w-3.5 h-3.5" />
            {formatCount(installCount)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Same gradient palette as before, picked by first letter
const GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
];

function getGradient(name) {
  const index = (name || 'x').charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[index];
}

export default PluginCard;
