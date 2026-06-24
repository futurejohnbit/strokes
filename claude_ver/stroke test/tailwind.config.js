/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'draw': 'draw 1s ease-in-out forwards',
      },
      keyframes: {
        draw: {
          '0%': { strokeDasharray: '0 100', opacity: '0.5' },
          '100%': { strokeDasharray: '100 0', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
