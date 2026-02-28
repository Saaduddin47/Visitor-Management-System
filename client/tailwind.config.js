export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F9FAFB',
        accent: '#1F4E79'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 6px 22px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
};
