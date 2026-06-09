import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.jsx';

// Simple two-button toggle. No wrapping pill — we render the two
// buttons inline in the header so they sit flush with the rest of
// the action row.
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-1" data-component="theme-toggle">
      <button
        onClick={() => setTheme('light')}
        title="浅色主题"
        aria-label="切换到浅色"
        className={`p-2 rounded-lg transition-colors ${
          !isDark
            ? 'bg-surface-2 text-text-primary'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="深色主题"
        aria-label="切换到深色"
        className={`p-2 rounded-lg transition-colors ${
          isDark
            ? 'bg-surface-2 text-text-primary'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ThemeToggle;
