import { useState } from 'react';
import { X, Github, KeyRound, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

function LoginModal({ open, onClose }) {
  const { login } = useAuth();
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await login(token.trim());
      setToken('');
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-surface rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">管理员登录</h2>
            <p className="text-xs text-text-secondary">使用 GitHub Personal Access Token</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-1.5">
              <KeyRound className="w-4 h-4" />
              <span>GitHub Token</span>
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 border border-border rounded-lg
                       focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       font-mono text-sm"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="mt-1.5 text-xs text-text-secondary">
              需要 <code className="px-1 py-0.5 bg-surface rounded text-[11px]">read:user</code> 权限即可。
              Token 仅存在你本地浏览器，不会上传到服务器。
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-danger/5 border border-danger/20 rounded-lg text-sm text-danger">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!token.trim() || submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-primary text-white font-medium rounded-lg
                     hover:bg-primary-hover transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Github className="w-4 h-4" />
            {submitting ? '验证中…' : '登录'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-border text-xs text-text-secondary space-y-1.5">
          <p className="font-medium text-text-primary">如何获取 Token？</p>
          <ol className="list-decimal list-inside space-y-0.5 pl-1">
            <li>打开 GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)</li>
            <li>Generate new token，只需要勾选 <code className="px-1 py-0.5 bg-surface rounded">read:user</code></li>
            <li>复制 token 粘贴到上面</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
