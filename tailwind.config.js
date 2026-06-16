/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        maze: {
          ink: "#211A12",
          parchment: "#F7F0DF",
          sand: "#E8D7B8",
          moss: "#647A4D",
          ember: "#D46A35",
          slate: "#2C3A3A"
        }
      }
    }
  },
  plugins: []
};
