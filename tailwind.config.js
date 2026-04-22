/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#0A0C10',
        sidebar: 'rgba(20, 22, 31, 0.95)',
        border: '#2E3045',
        card: 'rgb(42, 45, 62)',
        panel: 'rgb(28, 30, 42)',
        accent: '#6366F1',
        'text-primary': '#FFFFFF',
        'text-secondary': '#C8CBE0',
        'text-muted': '#8A8FA8',
      },
    },
  },
  plugins: [],
}
