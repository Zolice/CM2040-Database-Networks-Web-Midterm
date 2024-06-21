/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./views/**/*.{html,ejs,js}', './components/**/*.{html,ejs,js}'],
  content: [],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['bumblebee', 'light', 'dark']
  }
}

