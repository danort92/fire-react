/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#111827',
        'dark-card': '#1f2937',
        'dark-border': '#374151',
        'dark-text': '#f9fafb',
        'dark-muted': '#9ca3af',
        'accent-blue': '#636EFA',
        'accent-green': '#00CC96',
        'accent-orange': '#FFA15A',
        'accent-red': '#EF553B',
        'accent-purple': '#AB63FA',
      },
    },
  },
  plugins: [],
}
