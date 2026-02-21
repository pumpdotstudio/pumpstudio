/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/mainview/**/*.{html,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				glass: {
					bg: "rgba(255, 255, 255, 0.03)",
					border: "rgba(255, 255, 255, 0.06)",
					hover: "rgba(255, 255, 255, 0.08)",
					active: "rgba(255, 255, 255, 0.12)",
					text: "rgba(255, 255, 255, 0.87)",
					muted: "rgba(255, 255, 255, 0.45)",
					dim: "rgba(255, 255, 255, 0.2)",
				},
				accent: {
					green: "#22c55e",
					glow: "rgba(34, 197, 94, 0.15)",
					red: "#ef4444",
					yellow: "#eab308",
					blue: "#3b82f6",
					purple: "#a855f7",
					cyan: "#06b6d4",
				},
			},
			fontFamily: {
				mono: [
					"SF Mono",
					"JetBrains Mono",
					"Monaco",
					"Cascadia Code",
					"Consolas",
					"monospace",
				],
				sans: [
					"SF Pro Display",
					"Inter",
					"-apple-system",
					"BlinkMacSystemFont",
					"system-ui",
					"sans-serif",
				],
			},
			backdropBlur: {
				xs: "2px",
				"2xl": "40px",
				"3xl": "64px",
			},
			animation: {
				"glow-pulse": "glow-pulse 3s ease-in-out infinite",
				"fade-in": "fade-in 0.3s ease-out",
				"slide-up": "slide-up 0.4s ease-out",
				"slide-in-right": "slide-in-right 0.3s ease-out",
				shimmer: "shimmer 2s linear infinite",
			},
			keyframes: {
				"glow-pulse": {
					"0%, 100%": { opacity: "0.4" },
					"50%": { opacity: "0.8" },
				},
				"fade-in": {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				"slide-up": {
					"0%": { opacity: "0", transform: "translateY(12px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"slide-in-right": {
					"0%": { opacity: "0", transform: "translateX(12px)" },
					"100%": { opacity: "1", transform: "translateX(0)" },
				},
				shimmer: {
					"0%": { backgroundPosition: "-200% 0" },
					"100%": { backgroundPosition: "200% 0" },
				},
			},
		},
	},
	plugins: [],
};
