/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./views/**/*.{html,ejs,js}', './components/**/*.{html,ejs,js}'],
  content: [],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/line-clamp')
  ],
  daisyui: {
    themes: ['bumblebee', 'light', 'dark']
  }
}

