import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.jsx';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;
  const label = theme === 'dark' ? '切换到浅色' : '切换到深色';

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full border border-border bg-surface">
      <button
        onClick={() => setTheme('light')}
        title="浅色"
        aria-label="浅色主题"
        className={`p-1.5 rounded-full transition-all ${
          theme === 'light'
            ? 'bg-background text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="深色"
        aria-label="深色主题"
        className={`p-1.5 rounded-full transition-all ${
          theme === 'dark'
            ? 'bg-background text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default ThemeToggle;
