/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#2E7D32',
        pine: '#1B4D2E',
        ink: '#20241F',
        paper: '#FAFAF6',
        leaf: '#E8F0E4',
        amber: '#C9802D',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        money: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
