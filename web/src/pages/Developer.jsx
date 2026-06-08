import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Plus, Github, Settings, 
  Upload, Search, Trash2, Edit, ChevronDown, X, Loader2,
  AlertCircle, CheckCircle, ExternalLink, Shield
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';
import AuthModal from '../components/AuthModal';

// Gradients for placeholder icons
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

function getDevGradient(name) {
  const index = name.charCodeAt(0) % PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[index];
}

const CATEGORIES = [
  { id: 'tools', name: '工具类' },
  { id: 'entertainment', name: '娱乐类' },
  { id: 'developer', name: '开发者工具' },
  { id: 'theme', name: '主题' }
];

function Developer() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('action') === 'add' ? 'add' : 'overview');
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add plugin form
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [formData, setFormData] = useState({
    name: '',
    author: '',
    category: 'tools',
    shortDescription: '',
    description: '',
    zipFile: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // GitHub import
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubPreview, setGithubPreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [importing, setImporting] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);

  // Auth gating
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const data = await api.getPlugins({ limit: 100 });
      setPlugins(data.plugins || []);
    } catch (err) {
      showNotification('加载插件失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        setFormData({ ...formData, zipFile: file });
      } else {
        showNotification('请上传 ZIP 格式的文件', 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.zipFile) {
      showNotification('请选择插件包文件', 'error');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress('正在上传插件包...');
      
      const result = await api.uploadPackage(formData.zipFile, {
        name: formData.name,
        author: formData.author,
        category: formData.category,
        shortDescription: formData.shortDescription,
        description: formData.description
      });
      
      setUploadProgress('插件处理完成！');
      showNotification(`${result.name} 添加成功！`);
      setShowAddModal(false);
      setFormData({ name: '', author: '', category: 'tools', shortDescription: '', description: '', zipFile: null });
      loadPlugins();
    } catch (err) {
      showNotification(err.message || '上传失败', 'error');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleGithubDetect = async () => {
    if (!githubUrl) return;
    
    try {
      setDetecting(true);
      const data = await api.detectGitHub(githubUrl, githubToken || null);
      setGithubPreview(data);
    } catch (err) {
      showNotification(err.message || '检测失败，请确认仓库地址和权限', 'error');
      setGithubPreview(null);
    } finally {
      setDetecting(false);
    }
  };

  const handleGithubImport = async () => {
    if (!githubPreview) return;
    
    try {
      setImporting(true);
      await api.importGitHub({
        repoUrl: githubUrl,
        token: githubToken || null,
        category: githubPreview.category || 'tools',
        shortDescription: githubPreview.description || ''
      });
      
      showNotification(`${githubPreview.name} 导入成功！`);
      setGithubUrl('');
      setGithubPreview(null);
      loadPlugins();
    } catch (err) {
      showNotification(err.message || '导入失败', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (plugin) => {
    if (!confirm(`确定删除 "${plugin.name}" 吗？此操作不可撤销。`)) return;
    
    try {
      await api.deletePlugin(plugin.id);
      showNotification(`${plugin.name} 已删除`);
      loadPlugins();
    } catch (err) {
      showNotification(err.message || '删除失败', 'error');
    }
  };

  // Stats
  const totalInstalls = plugins.reduce((sum, p) => sum + (p.installCount || 0), 0);
  const avgRating = plugins.length > 0 
    ? (plugins.reduce((sum, p) => sum + (p.rating || 0), 0) / plugins.length).toFixed(1)
    : '0.0';

  // Auth gate
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-md mx-auto pt-24 px-4">
          <div className="bg-surface rounded-2xl border border-border p-8 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">需要管理员登录</h2>
            <p className="text-sm text-text-secondary mb-6">
              提交插件、修改、删除插件都需要管理员身份。使用你的 GitHub Personal Access Token 登录。
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                       bg-primary text-white font-medium rounded-lg
                       hover:bg-primary-hover transition-colors"
            >
              <Shield className="w-4 h-4" />
              登录
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full mt-2 px-4 py-2 text-sm text-text-secondary
                       hover:text-text-primary transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
        <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slideUp
          ${notification.type === 'error' ? 'bg-danger text-white' : 'bg-success text-white'}`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-surface border-r border-border min-h-screen sticky top-0">
          <div className="p-6">
            <h1 className="text-lg font-bold text-text-primary">开发者后台</h1>
          </div>
          <nav className="px-3">
            {[
              { id: 'overview', icon: LayoutDashboard, label: '概览' },
              { id: 'plugins', icon: Package, label: '我的插件' },
              { id: 'add', icon: Plus, label: '添加插件' },
              { id: 'github', icon: Github, label: 'GitHub 导入' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setShowAddModal(id === 'add'); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors
                  ${activeTab === id ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface'}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">概览</h2>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-surface rounded-xl border border-border p-6">
                  <p className="text-text-secondary text-sm">总安装量</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">{totalInstalls.toLocaleString()}</p>
                </div>
                <div className="bg-surface rounded-xl border border-border p-6">
                  <p className="text-text-secondary text-sm">插件数量</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">{plugins.length}</p>
                </div>
                <div className="bg-surface rounded-xl border border-border p-6">
                  <p className="text-text-secondary text-sm">平均评分</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">{avgRating} ⭐</p>
                </div>
              </div>

              {/* Recent plugins */}
              <div className="bg-surface rounded-xl border border-border">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-text-primary">我的插件</h3>
                </div>
                <div className="divide-y divide-border">
                  {plugins.slice(0, 5).map((plugin) => (
                    <div key={plugin.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 shrink-0">
                        {plugin.icon ? (
                          <div className="w-full h-full rounded-xl overflow-hidden shadow-sm">
                            <img src={plugin.icon} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getDevGradient(plugin.name)} flex items-center justify-center shadow-sm`}>
                            <span className="text-white font-bold text-lg">{plugin.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{plugin.name}</p>
                        <p className="text-sm text-text-secondary">v{plugin.version} · {plugin.installCount || 0} 安装</p>
                      </div>
                      <Link
                        to={`/plugin/${plugin.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        查看
                      </Link>
                    </div>
                  ))}
                  {plugins.length === 0 && (
                    <div className="px-6 py-8 text-center text-text-secondary">
                      还没有插件，<button onClick={() => setActiveTab('add')} className="text-primary hover:underline">添加一个</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plugins list */}
          {activeTab === 'plugins' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">我的插件</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="bg-surface rounded-xl border border-border">
                  {plugins.map((plugin, i) => (
                    <div key={plugin.id} className={`px-6 py-4 flex items-center gap-4 ${i > 0 ? 'border-t border-border' : ''}`}>
                      <div className="w-14 h-14 shrink-0">
                        {plugin.icon ? (
                          <div className="w-full h-full rounded-xl overflow-hidden shadow-sm">
                            <img src={plugin.icon} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-full h-full rounded-xl bg-gradient-to-br ${getDevGradient(plugin.name)} flex items-center justify-center shadow-sm`}>
                            <span className="text-white font-bold text-xl">{plugin.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">{plugin.name}</p>
                        <p className="text-sm text-text-secondary">
                          v{plugin.version} · {plugin.category} · {plugin.installCount || 0} 安装 · 评分 {plugin.rating?.toFixed(1) || '0.0'}
                        </p>
                        {plugin.githubRepo && (
                          <a 
                            href={plugin.githubRepo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <Github className="w-3 h-3" />
                            {plugin.githubRepo.replace('https://github.com/', '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/plugin/${plugin.id}`}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(plugin)}
                          className="p-2 text-text-secondary hover:text-danger hover:bg-surface rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {plugins.length === 0 && (
                    <div className="px-6 py-12 text-center text-text-secondary">
                      还没有插件
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add plugin */}
          {activeTab === 'add' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">添加插件</h2>
              
              <div className="bg-surface rounded-xl border border-border p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      插件名称 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-lg
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="我的插件"
                      required
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      作者 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-lg
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="GitHub 用户名"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      分类 <span className="text-danger">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-lg
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Short description */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      简短描述 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-lg
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="一句话描述插件功能（80字内）"
                      maxLength={80}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      详细描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-lg resize-none
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="详细描述插件功能、使用方法等"
                      rows={4}
                    />
                  </div>

                  {/* ZIP file */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      插件包 (ZIP) <span className="text-danger">*</span>
                    </label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center
                                  hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        className="hidden"
                        id="zip-upload"
                      />
                      <label htmlFor="zip-upload" className="cursor-pointer">
                        {formData.zipFile ? (
                          <div className="flex items-center justify-center gap-2 text-success">
                            <CheckCircle className="w-5 h-5" />
                            <span>{formData.zipFile.name}</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-text-secondary mx-auto mb-2" />
                            <p className="text-text-secondary">
                              点击选择或拖拽 ZIP 文件到此处
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                              最大 100MB，包含 manifest.json
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-3 bg-primary text-white font-medium rounded-lg
                               hover:bg-primary-hover transition-colors disabled:opacity-50
                               flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {uploadProgress || '处理中...'}
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          上传并发布
                        </>
                      )}
                    </button>
                    <span className="text-sm text-text-secondary">
                      上传后插件将立即出现在商店中
                    </span>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* GitHub import */}
          {activeTab === 'github' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">从 GitHub 导入</h2>
              
              <div className="bg-surface rounded-xl border border-border p-6 max-w-2xl mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      仓库地址
                    </label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => { setGithubUrl(e.target.value); setGithubPreview(null); }}
                      className="w-full px-4 py-2.5 border border-border rounded-lg
                               focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="https://github.com/user/repo 或 user/repo"
                    />
                  </div>
                  <div>
                    <details className="group">
                      <summary className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary select-none">
                        <svg
                          className="w-4 h-4 transition-transform group-open:rotate-90"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span>
                          私有仓库？添加 GitHub Token
                          <span className="ml-1.5 text-xs text-text-secondary font-normal">
                            （公开仓库可跳过）
                          </span>
                        </span>
                      </summary>
                      <div className="mt-2.5 pl-5.5">
                        <input
                          type="password"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          className="w-full px-4 py-2.5 border border-border rounded-lg
                                   focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          placeholder="ghp_xxxx 或 ghp_xxx"
                        />
                        <p className="mt-1.5 text-xs text-text-secondary">
                          需要 <code className="px-1 py-0.5 bg-surface rounded text-[11px]">repo</code> 权限即可。Token 不会保存到服务器。
                        </p>
                      </div>
                    </details>
                  </div>
                  <button
                    onClick={handleGithubDetect}
                    disabled={!githubUrl || detecting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-lg
                             hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {detecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        检测中...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        检测插件信息
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {githubPreview && (
                <div className="bg-surface rounded-xl border border-border p-6 max-w-2xl">
                  <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    检测到插件
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary w-16">名称</span>
                      <span className="font-medium text-text-primary">{githubPreview.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary w-16">作者</span>
                      <span className="text-text-primary">{githubPreview.owner}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary w-16">版本</span>
                      <span className="text-text-primary">{githubPreview.version}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-text-secondary w-16">描述</span>
                      <span className="text-text-primary">{githubPreview.description || '无'}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleGithubImport}
                    disabled={importing}
                    className="mt-5 flex items-center gap-2 px-6 py-3 bg-success text-white font-medium rounded-lg
                             hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Github className="w-5 h-5" />
                        确认导入
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Developer;
