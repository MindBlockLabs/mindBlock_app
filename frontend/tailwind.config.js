/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        mb: {
          'electric-blue': 'var(--mb-electric-blue)',
          'neon-purple': 'var(--mb-neon-purple)',
          'vibrant-teal': 'var(--mb-vibrant-teal)',
          bg: {
            primary: 'var(--mb-bg-primary)',
            secondary: 'var(--mb-bg-secondary)',
            surface: 'var(--mb-bg-surface)',
            glass: 'var(--mb-bg-glass)',
            card: 'var(--mb-bg-card)',
          },
          text: {
            primary: 'var(--mb-text-primary)',
            secondary: 'var(--mb-text-secondary)',
            muted: 'var(--mb-text-muted)',
            accent: 'var(--mb-text-accent)',
          },
          border: {
            subtle: 'var(--mb-border-subtle)',
            glow: 'var(--mb-border-glow)',
            purple: 'var(--mb-border-purple)',
            teal: 'var(--mb-border-teal)',
          },
          status: {
            success: 'var(--mb-status-success)',
            warning: 'var(--mb-status-warning)',
            error: 'var(--mb-status-error)',
            info: 'var(--mb-status-info)',
          },
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        sans: ['var(--mb-font-sans)', 'sans-serif'],
        mono: ['var(--mb-font-mono)', 'monospace'],
      },
      spacing: {
        'mb-1': 'var(--mb-space-1)',
        'mb-2': 'var(--mb-space-2)',
        'mb-3': 'var(--mb-space-3)',
        'mb-4': 'var(--mb-space-4)',
        'mb-5': 'var(--mb-space-5)',
        'mb-6': 'var(--mb-space-6)',
        'mb-8': 'var(--mb-space-8)',
        'mb-10': 'var(--mb-space-10)',
        'mb-12': 'var(--mb-space-12)',
      },
      borderRadius: {
        'mb-sm': 'var(--mb-radius-sm)',
        'mb-md': 'var(--mb-radius-md)',
        'mb-lg': 'var(--mb-radius-lg)',
        'mb-xl': 'var(--mb-radius-xl)',
        'mb-2xl': 'var(--mb-radius-2xl)',
        'mb-full': 'var(--mb-radius-full)',
      },
      boxShadow: {
        'mb-glow-blue': 'var(--mb-glow-blue)',
        'mb-glow-purple': 'var(--mb-glow-purple)',
        'mb-glow-teal': 'var(--mb-glow-teal)',
        'mb-glass': 'var(--mb-shadow-glass)',
      },
      backgroundImage: {
        'mb-gradient-primary': 'var(--mb-gradient-primary)',
        'mb-gradient-accent': 'var(--mb-gradient-accent)',
        'mb-gradient-dark': 'var(--mb-gradient-dark)',
        'mb-gradient-glass': 'var(--mb-gradient-glass)',
      },
      zIndex: {
        'mb-dropdown': 'var(--mb-z-dropdown)',
        'mb-sticky': 'var(--mb-z-sticky)',
        'mb-modal': 'var(--mb-z-modal)',
        'mb-toast': 'var(--mb-z-toast)',
      },
    },
  },
  plugins: [],
};

export default config;
