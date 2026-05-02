/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        engine: {
          bg: 'rgb(var(--engine-bg-rgb) / <alpha-value>)',
          panel: 'rgb(var(--engine-panel-rgb) / <alpha-value>)',
          neon: 'rgb(var(--engine-neon-rgb) / <alpha-value>)',
          button: 'rgb(var(--engine-button-rgb) / <alpha-value>)',
          text: 'var(--engine-text)',
        }
      },
      fontFamily: {
        engine: ['var(--engine-font)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
