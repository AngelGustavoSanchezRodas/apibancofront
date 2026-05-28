/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['"Libre Franklin"', 'sans-serif'], 
        serif: ['"Playfair Display"', 'serif'] 
      },
      colors: {
        blue: {
          950: '#0a1b3f',
          900: '#0f2b6b',
          800: '#143a8a',
          700: '#1d4ed8',
          500: '#3b82f6',
        },
        gold: {
          500: '#d9b25b',
        }
      },
      boxShadow: {
        'strong': '0 24px 50px -26px rgba(15, 23, 42, 0.45)',
        'soft': '0 10px 30px -18px rgba(15, 23, 42, 0.35)',
      }
    },
  },
  plugins: [],
}