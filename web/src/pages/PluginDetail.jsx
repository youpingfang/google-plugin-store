import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Star, Users, Download, Shield, ChevronDown, ChevronUp,
  ExternalLink, Calendar, FileText, Tag
} from 'lucide-react';
import { api } from '../api';
import PluginCard from '../components/PluginCard';
import InstallGuide from '../components/InstallGuide';

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

function PluginDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllPermissions, setShowAllPermissions] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showAllVersions, setShowAllVersions] = useState(false);
  const [relatedPlugins, setRelatedPlugins] = useState([]);

  useEffect(() => {
    loadPlugin();
  }, [id]);

  const loadPlugin = async () => {
    try {
      setLoading(true);
      setImgError(false);
      const data = await api.getPlugin(id);
      setPlugin(data);
      
      // Load related plugins
      const all = await api.getPlugins({ category: data.category, limit: 6 });
      setRelatedPlugins((all.plugins || []).filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    // Record install
    try {
      await api.recordInstall(id);
    } catch (e) {
      console.error('Failed to record install:', e);
    }
    
    // Trigger download — use display name + version for friendlier filename
    const safeName = (plugin.name || plugin.id).replace(/[\\/:*?"<>|\s]+/g, '-');
    const version = plugin.version || '1.0.0';
    const link = document.createElement('a');
    link.href = plugin.crxUrl;
    link.download = `${safeName}-${version}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !plugin) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <p className="text-danger mb-4">{error || '插件不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const permissions = plugin.manifest?.permissions || [];
  const hostPermissions = plugin.manifest?.host_permissions || [];
  const visiblePermissions = showAllPermissions ? permissions : permissions.slice(0, 3);
  const visibleVersions = showAllVersions ? plugin.versions : (plugin.versions || []).slice(0, 3);

  return (
    <div>
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft strokeWidth={2.5} className="w-4 h-4" />
            返回
          </button>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <div className="w-40 h-40 md:w-48 md:h-48 shrink-0">
              {plugin.icon && !imgError ? (
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10">
                  <img
                    src={plugin.icon}
                    alt={plugin.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${getGradient(plugin.name)}
                               flex items-center justify-center shadow-lg ring-1 ring-black/10`}>
                  <span className="text-white font-bold text-4xl drop-shadow-md">
                    {plugin.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary">{plugin.name}</h1>
              <p className="text-text-secondary mt-1">
                <a 
                  href={plugin.authorUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {plugin.author}
                </a>
                <span className="mx-2">·</span>
                <span>{plugin.category}</span>
                <span className="mx-2">·</span>
                <span>v{plugin.version}</span>
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-3">
                <span className="flex items-center gap-2 text-base">
                  <Star strokeWidth={2.5} className="w-4 h-4 text-star fill-star" />
                  <span className="font-medium">{plugin.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-text-secondary">({plugin.ratingCount || 0} 条评分)</span>
                </span>
                <span className="flex items-center gap-2 text-base">
                  <Users strokeWidth={2.5} className="w-4 h-4 text-text-secondary" />
                  <span className="font-medium">{plugin.installCount || 0}</span>
                  <span className="text-text-secondary">用户</span>
                </span>
              </div>

              {/* Install Button */}
              <button
                onClick={handleInstall}
                className="mt-5 flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium
                         rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
              >
                <Download strokeWidth={2.5} className="w-5 h-5" />
                下载并安装
              </button>
              <p className="mt-2 text-sm text-text-secondary">
                下载后请看页面下方的《下载后如何安装？》说明。
              </p>
            </div>
          </div>

          {/* Description */}
          {(plugin.shortDescription || plugin.description) && (
            <div className="mt-6">
              <p className="text-text-primary leading-relaxed">
                {plugin.shortDescription || plugin.description}
              </p>
            </div>
          )}

          {/* Developer info moved to main column top */}
          {plugin.author && (
            <div className="mt-6 bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">{plugin.author.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-secondary">开发者</p>
                  <a
                    href={plugin.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-text-primary hover:text-primary truncate block"
                  >
                    {plugin.author}
                  </a>
                </div>
                <a
                  href={plugin.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
                >
                  <ExternalLink strokeWidth={2.5} className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Screenshots */}
            {plugin.screenshots?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-4">截图</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {plugin.screenshots.map((shot, i) => (
                    <img
                      key={i}
                      src={shot}
                      alt={`Screenshot ${i + 1}`}
                      className="w-64 h-40 object-cover rounded-lg border border-border shrink-0"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Details moved to sidebar — see below */}
            {/* Permissions */}
            {(permissions.length > 0 || hostPermissions.length > 0) && (
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-4">权限说明</h2>
                <div className="bg-surface rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Shield strokeWidth={2.5} className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm text-text-secondary">
                      <p>此插件请求以下权限：</p>
                      <ul className="mt-2 space-y-1.5">
                        {[...visiblePermissions, ...hostPermissions].map((perm, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{perm}</span>
                          </li>
                        ))}
                      </ul>
                      {(permissions.length > 3 || hostPermissions.length > 0) && (
                        <button
                          onClick={() => setShowAllPermissions(!showAllPermissions)}
                          className="mt-3 text-primary hover:underline flex items-center gap-1"
                        >
                          {showAllPermissions ? (
                            <>
                              <ChevronUp strokeWidth={2.5} className="w-4 h-4" />
                              收起
                            </>
                          ) : (
                            <>
                              <ChevronDown strokeWidth={2.5} className="w-4 h-4" />
                              显示全部权限
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Version History */}
            {plugin.versions?.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-text-primary mb-4">版本历史</h2>
                <div className="space-y-3">
                  {visibleVersions.map((ver, i) => (
                    <div key={i} className="bg-surface rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-text-primary">v{ver.version}</span>
                          <span className="text-sm text-text-secondary">{ver.date}</span>
                        </div>
                      </div>
                      {ver.note && (
                        <p className="mt-2 text-sm text-text-secondary">{ver.note}</p>
                      )}
                    </div>
                  ))}
                  {plugin.versions.length > 3 && (
                    <button
                      onClick={() => setShowAllVersions(!showAllVersions)}
                      className="w-full py-2 text-sm text-primary hover:bg-surface rounded-lg transition-colors"
                    >
                      {showAllVersions ? '收起' : `查看全部 ${plugin.versions.length} 个版本`}
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Combined info card: details + category + stats + tags */}
            <div className="bg-surface rounded-lg border border-border p-5">
              <h3 className="font-semibold text-text-primary mb-4">详细信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">版本</span>
                  <span className="text-text-primary font-medium">{plugin.version}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">大小</span>
                  <span className="text-text-primary">{formatSize(plugin.size)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">更新</span>
                  <span className="text-text-primary">{formatDate(plugin.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">语言</span>
                  <span className="text-text-primary truncate max-w-[10rem]">
                    {(plugin.languages || ['en']).join('、')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">分类</span>
                  <span className="text-text-primary capitalize">{plugin.category}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">安装量</span>
                  <span className="text-text-primary">{formatCount(plugin.installCount || 0)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-text-secondary">评分</span>
                  <span className="text-text-primary flex items-center gap-1">
                    {plugin.rating?.toFixed(1) || '0.0'}
                    <Star strokeWidth={2.5} className="w-3.5 h-3.5 text-star fill-star" />
                  </span>
                </div>
                {plugin.githubRepo && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">来源</span>
                    <a
                      href={plugin.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      GitHub
                      <ExternalLink strokeWidth={2.5} className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {plugin.tags?.length > 0 && (
                  <>
                    <div className="pt-3 mt-3 border-t border-border" />
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Tag strokeWidth={2.5} className="w-4 h-4" />
                      <span className="text-xs">标签</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {plugin.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-background border border-border rounded-full text-xs text-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Developer info moved to main column top */}
          </div>
        </div>

        {/* Install instructions */}
        <InstallGuide />

        {/* Related plugins */}
        {relatedPlugins.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-text-primary mb-4">相似插件</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedPlugins.slice(0, 5).map((p) => (
                <PluginCard key={p.id} plugin={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default PluginDetail;
