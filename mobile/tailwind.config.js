/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['OneUISans', 'sans-serif'],
        medium: ['OneUISans', 'sans-serif'],
        semibold: ['OneUISans-Bold', 'sans-serif'],
        bold: ['OneUISans-Bold', 'sans-serif'],
        extrabold: ['OneUISans-Bold', 'sans-serif'],
        sf: ['SFProDisplay-Bold', 'sans-serif'],
        'sf-medium': ['SFProDisplay-Medium', 'sans-serif'],
      },
      colors: {
        // Vibrant Sky Blue gradient brand requested by user
        sky: {
          primary: '#1993FA',
          light: '#6FBAFC',
          soft: '#E8F4FF',
        },
        // Spec Colors
        white: '#FFFFFF',
        mint: '#F2F6F3',
        charcoal: '#000000',
        sage: '#99A69D',
        royal: '#027BFF',

        // AMOLED dark mode
        amoled: {
          bg: '#000000',
          surface: '#0D0D0D',
          card: '#141414',
          border: '#1F1F1F',
          text: '#FFFFFF',
          muted: '#8E9A96',
          subtle: '#2A2A2A',
        },
      },
    },
  },
  plugins: [],
};
