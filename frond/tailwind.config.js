/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.tsx', './{auth.store,helpers,http,index}.ts', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // Light theme base
        canvas:  '#f1f5f9',   // page background (slate-100)
        surface: '#f8fafc',   // alternate/inner sections (slate-50)
        card:    '#ffffff',   // card background
        border:  '#e2e8f0',   // subtle borders (slate-200)
        muted:   '#cbd5e1',   // disabled/muted (slate-300)
        // Accents
        sage:  { DEFAULT: '#16a34a', light: '#22c55e', dark: '#15803d' },
        gold:  { DEFAULT: '#d97706', light: '#f59e0b', dark: '#b45309' },
        ember: { DEFAULT: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
        sky:   { DEFAULT: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' },
        // Text
        ink:     '#0f172a',   // slate-900
        'ink-2': '#475569',   // slate-600
        'ink-3': '#94a3b8',   // slate-400
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)',
        modal: '0 10px 40px -6px rgba(0,0,0,0.15)',
        glow: '0 0 24px -4px rgba(22,163,74,0.2)',
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease forwards',
        'fade-in': 'fadeIn 0.25s ease forwards',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseSoft: { '0%,100%': { opacity: 0.6 }, '50%': { opacity: 1 } },
      },
    },
  },
  plugins: [],
}
