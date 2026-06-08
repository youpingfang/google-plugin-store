/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Map Tailwind color tokens to CSS variables so they automatically
        // follow the active theme (light / dark).
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
        },
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        star: 'var(--color-star)',
        background: 'var(--color-background)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        sm: '0 1px 2px var(--color-shadow)',
        md: '0 4px 12px var(--color-shadow)',
        lg: '0 8px 24px var(--color-shadow)',
      }
    },
  },
  plugins: [],
}
