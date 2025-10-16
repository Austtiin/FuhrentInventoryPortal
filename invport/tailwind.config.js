/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          black: '#32292F',
          cream: '#F0F7F4', 
          blue: '#99E1D9',
        },
        // Extend existing color palette with brand colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#32292F', // Using brand black
          950: '#111827',
        },
        blue: {
          50: '#f0fdfc',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#99E1D9', // Using brand blue
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      backgroundColor: {
        'brand-cream': '#F0F7F4',
        'brand-black': '#32292F',
        'brand-blue': '#99E1D9',
      },
      textColor: {
        'brand-cream': '#F0F7F4',
        'brand-black': '#32292F', 
        'brand-blue': '#99E1D9',
      },
      borderColor: {
        'brand-cream': '#F0F7F4',
        'brand-black': '#32292F',
        'brand-blue': '#99E1D9',
      },
    },
  },
  plugins: [],
}