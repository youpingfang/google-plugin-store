import { Link } from 'react-router-dom';
import { Star, Users, Download } from 'lucide-react';
import { useState } from 'react';

// Gradients for placeholder icons (Chrome Web Store style)
const PLACEHOLDER_GRADIENTS = [
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
  const index = name.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[index];
}

function PluginCard({ plugin, index = 0 }) {
  const { id, name, author, icon, shortDescription, rating = 0, installCount = 0 } = plugin;
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  const hasIcon = icon && !imgError;

  return (
    <div
      className="animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <Link
        to={`/plugin/${id}`}
        className="group relative block bg-white border border-border rounded-2xl p-5 
                 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1.5
                 transition-all duration-300 ease-out"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon Container - Chrome Web Store style */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          {hasIcon ? (
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
              <img 
                src={icon} 
                alt={name} 
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            /* Placeholder icon - gradient + letter */
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${getGradient(name)} 
                           flex items-center justify-center shadow-lg ring-1 ring-black/10
                           transform transition-transform duration-300 group-hover:scale-105`}>
              <span className="text-white font-bold text-3xl drop-shadow-md">
                {name.charAt(0).toUpperCase()}
              </span>
              {/* Subtle shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="font-semibold text-text-primary truncate group-hover:text-primary 
                        transition-colors duration-200 text-[15px]">
            {name}
          </h3>
          <p className="text-xs text-text-secondary mt-1 truncate">{author}</p>

          {/* Rating & Downloads */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="flex items-center gap-1 text-xs">
              <Star className="w-3.5 h-3.5 text-star fill-star" />
              <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-text-secondary/40" />
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <Users className="w-3.5 h-3.5" />
              {formatCount(installCount)}
            </span>
          </div>
        </div>

        {/* Hover indicator */}
        <div 
          className={`mt-4 flex items-center justify-center gap-1.5 text-sm text-primary 
                     font-medium transition-all duration-300
                     ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          <Download className="w-4 h-4" />
          <span>查看详情</span>
        </div>

        {/* Subtle glow on hover */}
        <div 
          className={`absolute inset-0 rounded-2xl bg-primary/5 transition-opacity duration-300 pointer-events-none
            ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />
      </Link>
    </div>
  );
}

export default PluginCard;
