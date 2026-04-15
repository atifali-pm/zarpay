/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#E8EEF7",
          100: "#E8EEF7",
          700: "#13315C",
          900: "#0B2545",
          DEFAULT: "#0B2545",
        },
        accent: {
          500: "#FFB400",
          600: "#E69F00",
          DEFAULT: "#FFB400",
        },
        success: {
          100: "#E6F4F0",
          500: "#1F8A70",
        },
        warning: {
          100: "#FFF7E0",
          500: "#E6A700",
        },
        danger: {
          100: "#FBEAEA",
          500: "#D64545",
          600: "#C13939",
        },
        bg: {
          0: "#FFFFFF",
          50: "#F6F8FB",
        },
        text: {
          900: "#0B1A2C",
          700: "#243447",
          500: "#5B6B7F",
          300: "#9BA8B8",
        },
        border: {
          DEFAULT: "#E6EAF0",
          strong: "#C9D1DC",
        },
      },
    },
  },
  plugins: [],
};
