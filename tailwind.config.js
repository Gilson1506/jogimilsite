/** Design tokens: paleta: azul-marinho, azul e branco + neutros derivados. */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        card: v('card'),
        blue: v('blue'),
        accent: v('accent'),
        brand: '#0066FF',
        navy: '#000000',
        black: '#000000',
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
