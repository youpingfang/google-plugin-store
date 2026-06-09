// AuthModal — login / signup dialog with two tabs.
//
// On the very first signup (no admin exists yet) the new account is
// promoted to admin automatically. The frontend checks
// /api/auth/setup-status on open and pre-selects the right tab
// accordingly.

import { useState, useEffect } from 'react';
import { X, Mail, KeyRound, User, Shield, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { api, auth as authStore } from '../api';
import { useAuth } from '../hooks/useAuth.jsx';

const TABS = [
  { id: 'login',    label: '登录',   icon: KeyRound },
  { id: 'register', label: '注册',   icon: User },
];

function AuthModal({ open, onClose, initialTab = 'login', reason }) {
  const { login } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [setupMode, setSetupMode] = useState(false);

  // form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);

  // ui state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Detect first-run mode on open
  useEffect(() => {
    if (!open) return;
    setError('');
    api.setupStatus()
      .then(({ needsSetup }) => {
        setSetupMode(needsSetup);
        if (needsSetup) setTab('register');
        else setTab(initialTab);
      })
      .catch(() => {/* non-fatal */});
  }, [open, initialTab]);

  if (!open) return null;

  const handleClose = () => {
    if (setupMode && submitting) return; // don't allow closing mid-setup
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    try {
      setSubmitting(true);
      let result;
      if (tab === 'register') {
        result = await api.register({ email: email.trim(), password, name: name.trim() });
      } else {
        result = await api.loginPassword({ email: email.trim(), password });
      }
      // Persist JWT and update auth context
      authStore.setToken(result.token);
      // The AuthProvider's `login` helper expects a github PAT — for
      // the email flow we already have the user object, just push it
      // in via a small helper instead. useAuth doesn't expose a
      // direct setter, so we reload the page to let AuthProvider
      // re-validate the new token.
      window.location.reload();
    } catch (err) {
      setError(err.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close (hidden in setup mode while submitting) */}
        {!setupMode && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-surface rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md">
            {setupMode ? <Sparkles className="w-5 h-5 text-white" /> : <Shield className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {setupMode ? '欢迎，创建第一个管理员' : '账号登录'}
            </h2>
            <p className="text-xs text-text-secondary">
              {setupMode
                ? '这个 store 还没有任何账号，你将成为管理员。'
                : reason || '登录后可管理你上传的插件'}
            </p>
          </div>
        </div>

        {/* Tabs (hidden in setup mode — only register makes sense) */}
        {!setupMode && (
          <div className="flex items-center gap-1 mt-4 mb-4 p-0.5 rounded-lg bg-surface border border-border">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setError(''); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all
                            ${active
                              ? 'bg-background text-primary shadow-sm'
                              : 'text-text-secondary hover:text-text-primary'
                            }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-1.5">
              <Mail className="w-4 h-4" />
              <span>邮箱</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              autoFocus
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background
                       focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                       text-text-primary placeholder-text-secondary/50"
              placeholder="you@example.com"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-1.5">
                <User className="w-4 h-4" />
                <span>昵称 <span className="text-xs text-text-secondary font-normal">（可选）</span></span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="nickname"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background
                         focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                         text-text-primary placeholder-text-secondary/50"
                placeholder="昵称会显示在插件作者位"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-1.5">
              <KeyRound className="w-4 h-4" />
              <span>密码</span>
              {tab === 'register' && (
                <span className="text-xs text-text-secondary font-normal">（至少 6 位）</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                required
                minLength={tab === 'register' ? 6 : undefined}
                className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background
                         focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                         text-text-primary placeholder-text-secondary/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-text-primary rounded transition-colors"
                aria-label={showPw ? '隐藏密码' : '显示密码'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password || submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-primary text-white font-medium rounded-lg
                     hover:bg-primary-hover transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '处理中…' : tab === 'register' ? '创建账号' : '登录'}
          </button>
        </form>

        {/* Footer switch */}
        {!setupMode && (
          <p className="mt-4 text-center text-xs text-text-secondary">
            {tab === 'login' ? '还没有账号？' : '已经有账号了？'}{' '}
            <button
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-primary hover:text-primary-hover font-medium"
            >
              {tab === 'login' ? '去注册' : '去登录'}
            </button>
          </p>
        )}

        {setupMode && (
          <p className="mt-4 text-center text-xs text-text-secondary">
            后续注册的用户都是普通身份。管理员可在「开发者」后台邀请新用户（开发中）。
          </p>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
