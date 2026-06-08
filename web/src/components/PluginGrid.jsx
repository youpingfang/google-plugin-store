import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PluginCard from './PluginCard';

function PluginGrid({ title, plugins, viewAllUrl, showViewAll = true }) {
  if (!plugins || plugins.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {showViewAll && viewAllUrl && (
          <Link
            to={viewAllUrl}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
          >
            查看更多
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {plugins.slice(0, 10).map((plugin) => (
          <PluginCard key={plugin.id} plugin={plugin} />
        ))}
      </div>
    </section>
  );
}

export default PluginGrid;
