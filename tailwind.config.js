/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette selaras dengan referensi floral green
        primary: {
          DEFAULT: '#092620', // Deep Slate Green
          light: '#E1D7D7', // Pink Organdy
        },
        secondary: {
          DEFAULT: '#27513D', // Springbok Green
          light: '#A0A98F', // Sagey
        },
        tertiary: {
          DEFAULT: '#5C7B62', // Korean Mint
          light: '#A0A98F', // Sagey
        },
        neutral: {
          surface: '#E1D7D7', // Pink Organdy
          muted: '#A0A98F', // Sagey
        },
        accent: {
          straken: '#5D7E2D',
          viola: '#9288A6',
          rosemary: '#809752',
          texture: '#61536F',
          melrose: '#C2B4E2',
        }
      },
      borderRadius: {
        '4xl': '2.5rem', // Sesuai permintaan Anda untuk lekukan modal yang dalam
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], 
      },
    },
  },
  plugins: [],
};
