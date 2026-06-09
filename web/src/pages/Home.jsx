import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import CategoryCard from '../components/CategoryCard';
import PluginCard from '../components/PluginCard';
import { api } from '../api';
import { Search, Clock, Trophy, Sparkles, Package, ArrowRight, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'tools', name: '工具类' },
  { id: 'entertainment', name: '娱乐类' },
  { id: 'developer', name: '开发者工具' },
  { id: 'theme', name: '主题' },
  { id: 'productivity', name: '效率工具' },
  { id: 'accessibility', name: '无障碍' },
];

const CATEGORY_GRADIENT = {
  tools: 'from-blue-500 to-blue-600',
  entertainment: 'from-pink-500 to-rose-500',
  developer: 'from-violet-500 to-purple-600',
  theme: 'from-emerald-500 to-teal-500',
  productivity: 'from-amber-500 to-orange-500',
  accessibility: 'from-cyan-500 to-sky-500',
};

function Home() {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [loadedSections, setLoadedSections] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    loadPlugins();
  }, [category, searchQuery]);

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadedSections((prev) => ({ ...prev, [entry.target.dataset.section]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    return () => observer.disconnect();
  }, [plugins]);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);
      setLoadedSections({});
      const params = {};
      if (category !== 'all') params.category = category;
      if (searchQuery) params.search = searchQuery;
      const data = await api.getPlugins(params);
      setPlugins(data.plugins || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setSectionRef = (section) => (el) => {
    sectionRefs.current[section] = el;
  };

  const handleCategoryClick = (catId) => {
    setCategory(catId);
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  // Count per category (from full list, not search-filtered)
  const [allPlugins, setAllPlugins] = useState([]);
  useEffect(() => {
    api.getPlugins().then((d) => setAllPlugins(d.plugins || [])).catch(() => {});
  }, []);
  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.id] = allPlugins.filter((p) => p.category === c.id).length;
    return acc;
  }, {});

  // Sections
  const featured = plugins.slice(0, 6);
  const recent = [...plugins].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
  const topRated = [...plugins].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);

  const SkeletonCard = ({ index }) => (
    <div
      className="bg-surface border border-border rounded-2xl overflow-hidden animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="aspect-[16/10] skeleton" />
      <div className="p-3.5 space-y-2">
        <div className="w-3/4 h-4 skeleton" />
        <div className="w-1/2 h-3 skeleton" />
        <div className="w-2/3 h-3 skeleton" />
      </div>
    </div>
  );

  const renderSection = ({ key, title, subtitle, icon: Icon, items, gradient, action }) => {
    if (items.length === 0) return null;
    return (
      <section
        ref={setSectionRef(key)}
        data-section={key}
        className={`transition-all duration-700 ${
          loadedSections[key] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient}
                          flex items-center justify-center shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
            </div>
          </div>
          {action}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {items.map((plugin, i) => (
            <PluginCard key={plugin.id} plugin={plugin} index={i} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-10 md:space-y-12">
        {/* Hero — only on the no-search home */}
        {!searchQuery && <HeroBanner plugins={plugins} />}

        {/* Category grid */}
        {!searchQuery && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-text-primary">热门类别</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {CATEGORIES.map((c) => (
                <CategoryCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  count={categoryCounts[c.id] || 0}
                  onClick={handleCategoryClick.bind(null, c.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Search results header */}
        {searchQuery && (
          <div className="animate-slideUp">
            <div className="flex items-center gap-3 text-text-secondary mb-2">
              <Search className="w-5 h-5" />
              <span>搜索结果</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">"{searchQuery}"</h1>
            <p className="text-sm text-text-secondary mt-1">
              找到 {plugins.length} 个相关插件
            </p>
          </div>
        )}

        {/* Loading / Error / Empty / Content */}
        {loading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, si) => (
              <div key={si}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-xl skeleton" />
                  <div className="w-32 h-6 skeleton rounded" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} index={i + si * 6} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">😵</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">加载失败</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={loadPlugins}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl
                       hover:bg-primary-hover transition-all hover:-translate-y-0.5"
            >
              <Loader2 className="w-4 h-4" />
              重试
            </button>
          </div>
        ) : plugins.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-text-secondary" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {searchQuery ? '没有找到相关插件' : '暂无插件'}
            </h2>
            <p className="text-text-secondary mb-6 text-center max-w-md">
              {searchQuery
                ? `没有找到与 "${searchQuery}" 相关的插件，试试其他关键词`
                : '还没有插件上架，成为第一个提交插件的人吧！'}
            </p>
            <a
              href={searchQuery ? '/' : '/developer?action=add'}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl
                       hover:bg-primary-hover transition-all hover:-translate-y-0.5"
            >
              {searchQuery ? '查看全部插件' : '提交插件'}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <>
            {!searchQuery && (
              <>
                {renderSection({
                  key: 'featured',
                  title: '你玩，您可能会喜欢',
                  subtitle: '编辑精选推荐',
                  icon: Sparkles,
                  items: featured,
                  gradient: 'from-amber-400 to-orange-500',
                  action: (
                    <a href="/developer?action=add" className="text-sm text-primary hover:text-primary-hover
                                                          flex items-center gap-1 group">
                      全部 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ),
                })}

                {renderSection({
                  key: 'recent',
                  title: '近期更新',
                  subtitle: '保持最新，体验新功能',
                  icon: Clock,
                  items: recent,
                  gradient: 'from-blue-500 to-cyan-500',
                  action: (
                    <a href="/?sort=updated" className="text-sm text-primary hover:text-primary-hover
                                                    flex items-center gap-1 group">
                      查看全部 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ),
                })}

                {renderSection({
                  key: 'top',
                  title: '评分最高',
                  subtitle: '用户好评如潮',
                  icon: Trophy,
                  items: topRated,
                  gradient: 'from-purple-500 to-pink-500',
                  action: (
                    <a href="/?sort=rating" className="text-sm text-primary hover:text-primary-hover
                                                   flex items-center gap-1 group">
                      查看全部 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ),
                })}
              </>
            )}

            {searchQuery && (
              <section>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {plugins.map((plugin, i) => (
                    <PluginCard key={plugin.id} plugin={plugin} index={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
