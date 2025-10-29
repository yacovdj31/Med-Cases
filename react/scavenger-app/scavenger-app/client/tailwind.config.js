/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['class'], // enable .dark
  theme: {
    extend: {
      borderRadius: {
        'xl': 'var(--radius)',
        '2xl': 'calc(var(--radius) + 6px)',
      },
      colors: {
        // use via rgb(var(--var)) in CSS above; keep palette for utility fallbacks
        brand: {
          600: '#4f46e5', // indigo-600
          700: '#4338ca',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)',
      },
      container: {
        center: true,
        padding: '1rem',
        screens: { '2xl': '1200px' }, // a bit narrower for app UIs
      },
    },
  },
  plugins: [],
};
