/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0b0f19',
        surface: '#111827',
        card: '#1e293b',
        border: '#334155',
        primary: '#3b82f6',
        accent: '#10b981',
      },
    },
  },
  plugins: [],
}

