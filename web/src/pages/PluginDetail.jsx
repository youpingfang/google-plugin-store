import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Star, Users, Download, ExternalLink, Calendar, FileText, Tag, RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';
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

// Lightweight markdown renderer for the README block.
// Supports: # ## ### headings, **bold**, `code`, [text](url), - / * / 1. lists,
// > blockquote, --- hr, blank-line paragraph breaks.
// No external deps; intentionally minimal (we don't need full CommonMark).
function RenderMarkdown({ text }) {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  const blocks = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) { i++; continue; }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) { blocks.push(<hr key={key++} className="my-3 border-border" />); i++; continue; }

    // Heading 1-3
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const cls = level === 1 ? 'text-lg font-bold mt-3 mb-1' :
                  level === 2 ? 'text-base font-semibold mt-3 mb-1' :
                                'text-sm font-semibold mt-2 mb-1';
      blocks.push(<div key={key++} className={cls}>{renderInline(h[2])}</div>);
      i++; continue;
    }

    // Unordered list (- or *)
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 my-2 space-y-1">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list (1. 2. ...)
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 my-2 space-y-1">
          {items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote key={key++} className="border-l-4 border-border pl-3 my-2 text-text-secondary">
          {buf.map((q, k) => <div key={k}>{renderInline(q)}</div>)}
        </blockquote>
      );
      continue;
    }

    // Paragraph: consume consecutive non-empty, non-special lines
    const para = [];
    while (i < lines.length && lines[i].trim() &&
           !/^#{1,3}\s+/.test(lines[i]) &&
           !/^[-*]\s+/.test(lines[i]) &&
           !/^\d+\.\s+/.test(lines[i]) &&
           !/^>\s?/.test(lines[i]) &&
           !/^---+\s*$/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-2">{renderInline(para.join(' '))}</p>
    );
  }

  return <div className="text-sm text-text-primary leading-relaxed">{blocks}</div>;
}

// Render inline markdown: **bold**, `code`, [text](url), images ![alt](url)
function renderInline(text) {
  if (!text) return null;
  const parts = [];
  let buf = '';
  let i = 0;
  let key = 0;

  const flushBuf = () => {
    if (buf) { parts.push(<span key={key++}>{buf}</span>); buf = ''; }
  };

  while (i < text.length) {
    // Image ![alt](url)
    if (text[i] === '!' && text[i + 1] === '[') {
      const m = text.slice(i).match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
      if (m) {
        flushBuf();
        parts.push(<img key={key++} src={m[2]} alt={m[1]} className="inline-block max-h-32 my-1 rounded" />);
        i += m[0].length;
        continue;
      }
    }
    // Link [text](url)
    if (text[i] === '[') {
      const m = text.slice(i).match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
      if (m) {
        flushBuf();
        const href = m[2];
        const isExternal = /^https?:\/\//.test(href);
        parts.push(
          <a key={key++} href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noopener noreferrer' : undefined}
             className="text-primary hover:underline">{m[1]}</a>
        );
        i += m[0].length;
        continue;
      }
    }
    // Bold **text**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        flushBuf();
        parts.push(<strong key={key++}>{renderInline(text.slice(i + 2, end))}</strong>);
        i = end + 2;
        continue;
      }
    }
    // Inline code `text`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        flushBuf();
        parts.push(<code key={key++} className="px-1 py-0.5 bg-background border border-border rounded text-xs">{text.slice(i + 1, end)}</code>);
        i = end + 1;
        continue;
      }
    }
    buf += text[i];
    i++;
  }
  flushBuf();
  return parts;
}

function PluginDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [imgError, setImgError] = useState(false);
  const [showFullReadme, setShowFullReadme] = useState(false);
  const { isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);
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

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await api.syncRunOne(id);
      const item = result?.summary?.items?.[0];
      if (!item) {
        setSyncMessage({ type: 'error', text: '未拿到同步结果' });
      } else if (item.action === 'updated') {
        setSyncMessage({ type: 'success', text: `已从 ${item.from} 更新到 ${item.to}` });
        setLastSyncedAt(new Date().toISOString());
        loadPlugin();
      } else if (item.action === 'skipped') {
        setSyncMessage({ type: 'info', text: `已经是最新版本（${item.reason || ''}）` });
        setLastSyncedAt(new Date().toISOString());
      } else {
        setSyncMessage({ type: 'error', text: `同步失败：${item.error || '未知错误'}` });
      }
    } catch (e) {
      setSyncMessage({ type: 'error', text: e.message || '同步失败' });
    } finally {
      setSyncing(false);
    }
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
            <div className="flex-1 min-w-0">
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
              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium
                           rounded-lg hover:bg-primary-hover transition-colors shadow-sm"
                >
                  <Download strokeWidth={2.5} className="w-5 h-5" />
                  下载并安装
                </button>
                {plugin.githubRepo && isAdmin && (
                  <button
                    onClick={handleManualSync}
                    disabled={syncing}
                    title="拉取 GitHub 最新版本并更新此插件"
                    className="flex items-center gap-2 px-5 py-3 bg-surface text-text-primary
                             font-medium rounded-lg border border-border hover:border-primary
                             hover:text-primary transition-colors shadow-sm
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw strokeWidth={2.5} className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? '同步中…' : '手动更新'}
                  </button>
                )}
                {plugin.githubRepo && (
                  <a
                    href={plugin.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 bg-surface text-text-primary
                             font-medium rounded-lg border border-border hover:border-primary
                             hover:text-primary transition-colors shadow-sm"
                  >
                    <ExternalLink strokeWidth={2.5} className="w-4 h-4" />
                    项目地址
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                {plugin.githubRepo && lastSyncedAt && (
                  <>上次同步：{new Date(lastSyncedAt).toLocaleString('zh-CN')}</>
                )}
              </p>
              {syncMessage && (
                <div
                  className={`mt-2 text-sm px-3 py-2 rounded-lg ${
                    syncMessage.type === 'success' ? 'bg-success/10 text-success' :
                    syncMessage.type === 'info' ? 'bg-surface-2 text-text-secondary' :
                    'bg-danger/10 text-danger'
                  }`}
                >
                  {syncMessage.text}
                </div>
              )}
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
            {/* Readme */}
            {(() => {
              // Prefer the dedicated readme field (fetched from GitHub README.md).
              // Fall back to description / shortDescription for legacy plugins.
              const candidates = [
                plugin.readme,
                plugin.description,
                plugin.shortDescription,
              ];
              const raw = candidates
                .map((s) => (s || '').trim())
                .find((s) => s && !/^__MSG_/i.test(s)) || '';
              if (!raw) return null;
              // Split into "lines" by sentence or by hard wraps, capped at ~80 chars per line
              const wrapped = raw
                .replace(/\r\n/g, '\n')
                .split(/(\n|(?<=[。！？!?；;]))/)
                .reduce((acc, seg) => {
                  if (!seg) return acc;
                  if (seg === '\n') { acc.push(''); return acc; }
                  // Wrap by 80-char soft breaks
                  let s = seg;
                  while (s.length > 80) {
                    acc.push(s.slice(0, 80));
                    s = s.slice(80);
                  }
                  if (s) acc.push(s);
                  return acc;
                }, [])
                .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''));
              if (wrapped.length === 0) return null;
              const MAX_LINES = 10;
              const isLong = wrapped.length > MAX_LINES;
              const visible = showFullReadme ? wrapped : wrapped.slice(0, MAX_LINES);
              return (
                <section>
                  <h2 className="text-lg font-semibold text-text-primary mb-4">项目说明</h2>
                  <div className="bg-surface rounded-lg border border-border p-5">
                    <RenderMarkdown text={visible.join('\n')} />
                    {isLong && (
                      <button
                        onClick={() => setShowFullReadme(v => !v)}
                        className="mt-3 text-sm text-primary hover:underline"
                      >
                        {showFullReadme ? '收起' : '展开插件详情'}
                      </button>
                    )}
                  </div>
                </section>
              );
            })()}

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
    </div>
  );
}

export default PluginDetail;
