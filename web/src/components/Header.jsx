import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Puzzle, Plus, LayoutDashboard, X, Menu, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import LoginModal from './LoginModal';

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'tools', name: '工具类' },
  { id: 'entertainment', name: '娱乐类' },
  { id: 'developer', name: '开发者工具' },
  { id: 'theme', name: '主题' }
];

function Header({ activeCategory, onCategoryChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    navigate('/');
    searchRef.current?.blur();
  };

  const isDeveloperPage = location.pathname === '/developer';

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    if (isDeveloperPage) navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Puzzle className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary hidden sm:block">Plugin Store</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className={`flex-1 max-w-xl transition-all duration-200 ${searchFocused ? 'scale-[1.02]' : ''}`}>
            <div className={`relative transition-all duration-200 ${searchFocused ? 'shadow-md' : 'shadow-sm'}`}>
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchFocused ? 'text-primary' : 'text-text-secondary'}`} />
              <input
                ref={searchRef}
                type="text"
                placeholder="搜索插件... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-12 pr-10 py-2.5 bg-surface border border-border rounded-xl
                         text-text-primary placeholder-text-secondary
                         focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
                         transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-border rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {!isDeveloperPage && (
              <>
                <Link
                  to="/developer"
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary
                           hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>开发者</span>
                </Link>
                {isAdmin ? (
                  <Link
                    to="/developer?action=add"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                             bg-primary hover:bg-primary-hover rounded-xl shadow-md hover:shadow-lg
                             transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">提交插件</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                             bg-primary hover:bg-primary-hover rounded-xl shadow-md hover:shadow-lg
                             transition-all hover:-translate-y-0.5 active:translate-y-0"
                    title="需要管理员登录"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">提交插件</span>
                  </button>
                )}
              </>
            )}

            {/* User pill (when logged in) */}
            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-surface transition-colors"
                  title={user.login}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.login} className="w-7 h-7 rounded-full ring-1 ring-border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                      {user.login?.[0]?.toUpperCase()}
                    </div>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-2 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-border">
                      <div className="text-sm font-semibold text-text-primary">{user.name || user.login}</div>
                      <div className="text-xs text-text-secondary">@{user.login}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:bg-surface hover:text-danger transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-surface rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white animate-fadeIn">
          <div className="px-4 py-3 space-y-2">
            <Link
              to="/developer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-secondary
                       hover:text-primary hover:bg-surface rounded-lg transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              开发者后台
            </Link>
            <Link
              to="/developer?action=add"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white
                       bg-primary rounded-lg"
            >
              <Plus className="w-4 h-4" />
              提交插件
            </Link>
          </div>
        </div>
      )}

      {/* Category tabs */}
      {!isDeveloperPage && (
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange && onCategoryChange(cat.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all
                           ${activeCategory === cat.id
                             ? 'text-primary border-primary'
                             : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border'
                           }`}
                >
                  <span className="relative">
                    {cat.name}
                    {activeCategory === cat.id && (
                      <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>

    <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
  );
}

export default Header;
