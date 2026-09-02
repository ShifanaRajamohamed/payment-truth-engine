/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#d9e8ff',
          200: '#bcd4ff',
          300: '#8eb6ff',
          400: '#598dff',
          500: '#2f62f5',   // flashy vivid blue
          600: '#1a46e8',
          700: '#1536cc',
          800: '#1630a6',
          900: '#142d83',
          950: '#0e1d57',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
