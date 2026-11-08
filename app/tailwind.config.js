/** Colors and type follow LGS Bid Intelligence (navy + gold on a neutral ground, Archivo). */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Archivo", "system-ui", "sans-serif"] },
      colors: {
        ground: "#f3f2f2",
        hover: "#f0efef",
        line: "#e3e1e1",
        ink: "#14161a",
        body: "#55585f",
        navy: { DEFAULT: "#0a2a4d", 900: "#061d36", 700: "#163f6b" },
        gold: { DEFAULT: "#f5d90a", dark: "#8a7500", press: "#6b5a00" },
        red: { DEFAULT: "#b3261e", soft: "#fdecea" },
        amber: { DEFAULT: "#9a5b00", soft: "#fdf3dc" },
        green: { DEFAULT: "#1f7a3a", soft: "#e6f4ea" },
      },
      borderRadius: { card: "1rem" },
    },
  },
  plugins: [],
};
