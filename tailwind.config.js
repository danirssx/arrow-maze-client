/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          900: "#3744D9",
          700: "#5262FB",
          500: "#6B78FF",
          300: "#9DA6FB",
          100: "#DDE2FF"
        },
        background: {
          DEFAULT: "#F4F5FF",
          soft: "#E9EBFA",
          card: "#FFFFFF"
        },
        text: {
          primary: "#0F0F0F",
          secondary: "#6B6F8A",
          muted: "#A1A6C3",
          inverse: "#FFFFFF"
        },
        border: {
          soft: "#D6DAF5"
        },
        reward: {
          gold: "#FFC83D",
          orange: "#F6A700",
          green: "#56D879"
        }
      }
    }
  },
  plugins: []
};
