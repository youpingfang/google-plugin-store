/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a73e8',
          hover: '#1557b0'
        },
        surface: '#f8f9fa',
        border: '#dadce0',
        'text-primary': '#202124',
        'text-secondary': '#5f6368',
        success: '#34a853',
        danger: '#ea4335',
        star: '#fbbc04'
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.1)',
        md: '0 4px 12px rgba(0,0,0,0.12)',
        lg: '0 8px 24px rgba(0,0,0,0.15)'
      }
    },
  },
  plugins: [],
}
