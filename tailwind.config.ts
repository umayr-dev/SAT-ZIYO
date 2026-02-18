import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Safelist - CSS uzilishini oldini olish uchun
  safelist: [
    // Common utility classes
    "bg-white",
    "bg-gray-50",
    "bg-gray-100",
    "bg-gray-200",
    "bg-gray-900",
    "text-white",
    "text-gray-700",
    "text-gray-900",
    "border-gray-200",
    "border-gray-300",
    // Brand (logo) colors
    "bg-brand-orange",
    "bg-brand-orange-light",
    "bg-brand-orange-50",
    "bg-brand-blue",
    "bg-brand-blue-light",
    "bg-brand-blue-50",
    "text-brand-orange",
    "text-brand-blue",
    "border-brand-blue",
    "border-brand-blue-light",
    "border-brand-orange",
    "border-brand-orange-light",
    "hover:bg-brand-orange",
    "hover:bg-brand-blue",
    "hover:bg-brand-orange-light",
    "hover:bg-brand-blue-light",
    // Orange theme colors
    "bg-orange-500",
    "bg-orange-600",
    "text-orange-500",
    "text-orange-600",
    "hover:bg-orange-50",
    "hover:bg-orange-600",
    "from-orange-500",
    "to-orange-600",
    // Blue theme colors
    "bg-blue-600",
    "bg-blue-700",
    "hover:bg-blue-700",
    // Spacing
    "px-4",
    "px-5",
    "px-6",
    "py-2",
    "py-4",
    // Responsive
    "hidden",
    "sm:block",
    "lg:hidden",
    "lg:flex",
    // Animations
    "animate-in",
    "slide-in-from-top-2",
  ],
  theme: {
    extend: {
      colors: {
        // Brand: blue #261CC1, orange #e6712c
        brand: {
          orange: "#e6712c",
          "orange-light": "#fce8dc",
          "orange-50": "#fff6f0",
          blue: "#261CC1",
          "blue-light": "#e0ddf9",
          "blue-50": "#f2f0fd",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
