import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, LayoutDashboard, X, Menu, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import AuthModal from './AuthModal';
import ThemeToggle from './ThemeToggle';


function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

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

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    if (isDeveloperPage) navigate('/');
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="white" stroke="none" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.4" stroke="none" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.4" stroke="none" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="white" stroke="none" />
              </svg>
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
            {/* Theme toggle */}
            <ThemeToggle />

            {/* User pill + management link + logout, all inline (no dropdown) */}
            {user ? (
              <>
                {!isDeveloperPage && (
                  <Link
                    to="/developer"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                             bg-primary hover:bg-primary-hover rounded-xl shadow-md hover:shadow-lg
                             transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">插件管理后台</span>
                  </Link>
                )}
                <div
                  className="flex items-center gap-2 px-2 py-1 rounded-full bg-surface border border-border"
                  title={user.name || user.email}
                >
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-text-primary hidden md:inline max-w-[8rem] truncate">
                    {user.name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="p-1 rounded-full text-text-secondary hover:text-danger hover:bg-surface-2 transition-colors"
                    title="登出"
                    aria-label="登出"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : !isDeveloperPage && (
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                         bg-primary hover:bg-primary-hover rounded-xl shadow-md hover:shadow-lg
                         transition-all hover:-translate-y-0.5 active:translate-y-0"
                title="登录后进入插件管理后台"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">插件管理后台</span>
              </button>
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
        <div className="md:hidden border-t border-border bg-background animate-fadeIn">
          <div className="px-4 py-3 space-y-2">
            {isAdmin ? (
              <Link
                to="/developer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white
                         bg-primary rounded-lg"
              >
                <LayoutDashboard className="w-4 h-4" />
                插件管理后台
              </Link>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); setLoginOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white
                         bg-primary rounded-lg text-left"
              >
                <LayoutDashboard className="w-4 h-4" />
                插件管理后台
              </button>
            )}
          </div>
        </div>
      )}

    </header>

    <AuthModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default Header;
