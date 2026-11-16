import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Poppins", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Gilda Display", "Cormorant Garamond", "Georgia", "serif"],
        // Labels/IDs previously used a monospace face; the brand uses Poppins with tabular figures.
        mono: ["Poppins", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        xs: "8px",
      },
      colors: {
        // Varnika brand (shared with design/store-blueprint.html)
        black: "#241B18", // ink: every text-black / hover:text-black becomes warm ink
        white: "#FAF9F5", // paper: cards and text on wine
        ink: "#241B18",
        ivory: "#F1F0EA",
        paper: "#FAF9F5",
        sunk: "#E9E7DF",
        line: { DEFAULT: "#DFDBCF", soft: "#E8E5DC" },
        wine: { DEFAULT: "#4A0E19", 2: "#6B1A28", soft: "#F4E7E8" },
        gold: { DEFAULT: "#8C5A2B", soft: "#EFE3D3" },
        sage: { DEFAULT: "#3E5F4F", soft: "#DDE5DD" },
        blush: "#E8CFD2",
        neutral: {
          50: "#F7F6F2", 100: "#EFEDE7", 200: "#E2DFD7", 300: "#C9C3BA", 400: "#A39B93",
          500: "#6E6560", 600: "#5A524D", 700: "#463F3B", 800: "#332C29", 900: "#241B18", 950: "#1A1311",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cream: {
          DEFAULT: "#F1F0EA",
          surface: "#E9E7DF",
          muted: "#E9E7DF",
          border: "#DFDBCF",
          dark: "#C9C3BA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
