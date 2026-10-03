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
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Playfair Display",
          "Didot",
          "Bodoni MT",
          "Georgia",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
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
          DEFAULT: "#FAF9F6",
          surface: "#F4F2ED",
          muted: "#ECE9E2",
          border: "#E6E3DB",
          dark: "#D6D1C4",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
        },
        "kanban-board-circle-primary": "var(--kanban-board-circle-primary)",
        "kanban-board-circle-gray": "var(--kanban-board-circle-gray)",
        "kanban-board-circle-red": "var(--kanban-board-circle-red)",
        "kanban-board-circle-yellow": "var(--kanban-board-circle-yellow)",
        "kanban-board-circle-green": "var(--kanban-board-circle-green)",
        "kanban-board-circle-cyan": "var(--kanban-board-circle-cyan)",
        "kanban-board-circle-blue": "var(--kanban-board-circle-blue)",
        "kanban-board-circle-indigo": "var(--kanban-board-circle-indigo)",
        "kanban-board-circle-violet": "var(--kanban-board-circle-violet)",
        "kanban-board-circle-purple": "var(--kanban-board-circle-purple)",
        "kanban-board-circle-pink": "var(--kanban-board-circle-pink)",
      },
    },
  },
  plugins: [],
};

export default config;
