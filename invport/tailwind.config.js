/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: { sans: ['Segoe UI', 'Arial', 'sans-serif'] },
      colors: {
        'theme-dark': '#1e293b',
        'theme-bg': '#f9fafb',
        'theme-white': '#ffffff',
        'theme-red': '#334155',
        'theme-cream': '#f8fafc',
        'theme-navy': '#475569',
        'theme-text': '#111827',
        brand: { black: '#1e293b', cream: '#f9fafb', blue: '#64748b' },
      },
    },
  },
  plugins: [],
};
