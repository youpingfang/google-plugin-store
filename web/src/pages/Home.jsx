import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import PluginCard from '../components/PluginCard';
import { api } from '../api';
import { Search, Sparkles, Clock, Trophy, Package, ArrowRight, Loader2 } from 'lucide-react';

const CATEGORIES = ['all', 'tools', 'entertainment', 'developer', 'theme'];

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

  // Split plugins into sections
  const featured = plugins.slice(0, 5);
  const recent = [...plugins].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
  const topRated = [...plugins].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);

  // Skeleton loader
  const SkeletonCard = ({ index }) => (
    <div
      className="bg-white border border-border rounded-xl p-5 animate-fadeIn"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div className="w-20 h-20 mx-auto mb-4 skeleton rounded-2xl" />
      <div className="w-24 h-4 mx-auto mb-2 skeleton" />
      <div className="w-16 h-3 mx-auto skeleton" />
      <div className="flex justify-center gap-3 mt-3">
        <div className="w-12 h-3 skeleton" />
        <div className="w-12 h-3 skeleton" />
      </div>
    </div>
  );

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search results header */}
        {searchQuery && (
          <div className="mb-8 animate-slideUp">
            <div className="flex items-center gap-3 text-text-secondary mb-2">
              <Search className="w-5 h-5" />
              <span>搜索结果</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              "{searchQuery}"
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              找到 {plugins.length} 个相关插件
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div>
            {/* Featured skeleton */}
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <div className="w-20 h-6 skeleton rounded" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </div>
            </div>
            {/* More sections skeleton */}
            <div className="space-y-12">
              {[...Array(2)].map((_, si) => (
                <div key={si}>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <div className="w-24 h-6 skeleton rounded" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <SkeletonCard key={i} index={i + si * 5} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          /* Error state */
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
          /* Empty state */
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
          /* Content */
          <>
            {!searchQuery && (
              <>
                {/* Featured */}
                {featured.length > 0 && (
                  <section
                    ref={setSectionRef('featured')}
                    className={`mb-12 transition-all duration-700 ${loadedSections.featured ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    data-section="featured"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-text-primary">精选推荐</h2>
                          <p className="text-sm text-text-secondary">编辑推荐，不容错过</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {featured.map((plugin, i) => (
                        <div key={plugin.id} className="animate-fadeIn" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                          <PluginCard plugin={plugin} index={i} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recent */}
                {recent.length > 0 && (
                  <section
                    ref={setSectionRef('recent')}
                    className={`mb-12 transition-all duration-700 ${loadedSections.recent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    data-section="recent"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-text-primary">近期更新</h2>
                          <p className="text-sm text-text-secondary">保持最新，体验新功能</p>
                        </div>
                      </div>
                      <a
                        href="/?sort=updated"
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors group"
                      >
                        查看全部
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {recent.map((plugin, i) => (
                        <div key={plugin.id} className="animate-fadeIn" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                          <PluginCard plugin={plugin} index={i} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Top Rated */}
                {topRated.length > 0 && (
                  <section
                    ref={setSectionRef('top')}
                    className={`mb-12 transition-all duration-700 ${loadedSections.top ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    data-section="top"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-text-primary">评分最高</h2>
                          <p className="text-sm text-text-secondary">用户好评如潮</p>
                        </div>
                      </div>
                      <a
                        href="/?sort=rating"
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors group"
                      >
                        查看全部
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {topRated.map((plugin, i) => (
                        <div key={plugin.id} className="animate-fadeIn" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                          <PluginCard plugin={plugin} index={i} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Search results */}
            {searchQuery && (
              <section>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {plugins.map((plugin, i) => (
                    <div key={plugin.id} className="animate-fadeIn" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                      <PluginCard plugin={plugin} index={i} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-surface/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-text-primary">Plugin Store</span>
            </div>
            <p className="text-sm text-text-secondary">
              开源浏览器插件商店 · 让插件发现更简单
            </p>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <a href="#" className="hover:text-primary transition-colors">关于</a>
              <a href="#" className="hover:text-primary transition-colors">帮助</a>
              <a href="#" className="hover:text-primary transition-colors">联系我们</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
