/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2c3db8',
        black: '#000',
        white: '#fff',
      },
      fontFamily: {
        sans: ['Pretendard', 'sans-serif'],
      },
      height: {
        '18': '62px',
      },
    },
  },
  plugins: [],
}

