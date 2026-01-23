/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hunter: '#355E3B',
        cream: '#F1E3C6',
        navy: '#0B2545',
        gold: '#C6A564',
        bank: {
          primary: '#3a7ca5',
          primaryDark: '#336b8d',
          surface: '#e8edf3',
          card: '#f4f7fb',
          text: '#152032',
          muted: '#6b7a90',
          border: '#d6dde8',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        pill: '9999px',
      },
      boxShadow: {
        bank: '0 12px 30px rgba(21, 32, 50, 0.10)',
        bankSoft: '0 8px 20px rgba(21, 32, 50, 0.07)',
      },
    },
  },
  plugins: [],
}