/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0f172a',
        panel: '#111827',
        line: '#1f2937',
        ink: '#e5e7eb',
        muted: '#94a3b8',
        accent: '#14b8a6'
      }
    }
  },
  plugins: []
};
