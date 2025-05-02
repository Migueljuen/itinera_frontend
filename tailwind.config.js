/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
     extend: {
      fontFamily: {
        onest: ['Onest-Regular', 'sans-serif'],
        "onest-medium": ['Onest-medium', 'sans-serif'],
        "onest-semibold": ['Onest-SemiBold', 'sans-serif'],
        "onest-extrabold": ['Onest-ExtraBold', 'sans-serif'],
        "onest-bold": ['Onest-Bold', 'sans-serif'],
        "onest-light": ['Onest-Light', 'sans-serif'],
      },
      colors: {
        primary: '#274b46',
        white: '#fbfbfe',
        dirtyWhite:'#E3E8E8',
        accent: '#e4c947',
        normal: '#1f2937',
        grey: "#6b7280"
      },
      backgroundColor: {
        primary: '#376a63',
         accent: '#fdd744',
          buttonPrimary: '#274b46',
          buttonSecondary: '#7dcb80'
      }
    },
  },
  plugins: [],
}