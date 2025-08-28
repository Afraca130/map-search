/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/views/**/*.ejs',
    './public/javascripts/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light'],
  },
};
