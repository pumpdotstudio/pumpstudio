import { useState, useEffect } from "react";
import type { View } from "../App";

interface SidebarProps {
	view: View;
	onNavigate: (v: View) => void;
	xpTotal: number;
	connected: boolean;
}

const NAV: { key: View; label: string; icon: string }[] = [
	{ key: "browse", label: "Tokens", icon: "grid" },
	{ key: "analyze", label: "Analyze", icon: "zap" },
	{ key: "auto", label: "Auto Train", icon: "cpu" },
	{ key: "leaderboard", label: "Leaderboard", icon: "trophy" },
	{ key: "settings", label: "Settings", icon: "sliders" },
];

const ICONS: Record<string, JSX.Element> = {
	grid: (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
		</svg>
	),
	zap: (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
		</svg>
	),
	cpu: (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<rect x="4" y="4" width="16" height="16" rx="2" />
			<rect x="9" y="9" width="6" height="6" />
			<path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
		</svg>
	),
	trophy: (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
			<path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
			<path d="M4 22h16" />
			<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
			<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
			<path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
		</svg>
	),
	sliders: (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<line x1="4" x2="4" y1="21" y2="14" />
			<line x1="4" x2="4" y1="10" y2="3" />
			<line x1="12" x2="12" y1="21" y2="12" />
			<line x1="12" x2="12" y1="8" y2="3" />
			<line x1="20" x2="20" y1="21" y2="16" />
			<line x1="20" x2="20" y1="12" y2="3" />
			<line x1="2" x2="6" y1="14" y2="14" />
			<line x1="10" x2="14" y1="8" y2="8" />
			<line x1="18" x2="22" y1="16" y2="16" />
		</svg>
	),
};

export function Sidebar({ view, onNavigate, xpTotal, connected }: SidebarProps) {
	const [time, setTime] = useState(new Date());
	useEffect(() => {
		const i = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(i);
	}, []);

	return (
		<aside className="w-56 flex flex-col glass-panel border-r border-white/[0.04] select-none">
			{/* Brand */}
			<div className="px-5 pt-6 pb-4">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center glow-green">
						<span className="text-black text-xs font-bold">P</span>
					</div>
					<div>
						<div className="text-[13px] font-semibold text-white/90 tracking-tight">
							Pump Studio
						</div>
						<div className="text-[10px] text-white/30 font-medium tracking-wider uppercase">
							Trainer
						</div>
					</div>
				</div>
			</div>

			<div className="glass-divider mx-4" />

			{/* Navigation */}
			<nav className="flex-1 px-3 py-3 space-y-0.5">
				{NAV.map((item) => (
					<button
						key={item.key}
						onClick={() => onNavigate(item.key)}
						className={`
							w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px]
							transition-all duration-200 group
							${view === item.key
								? "bg-white/[0.06] text-white/90 shadow-sm shadow-black/20"
								: "text-white/40 hover:bg-white/[0.03] hover:text-white/60"
							}
						`}
					>
						<span className={`transition-colors ${view === item.key ? "text-[#22c55e]" : "text-white/25 group-hover:text-white/40"}`}>
							{ICONS[item.icon]}
						</span>
						{item.label}
					</button>
				))}
			</nav>

			<div className="glass-divider mx-4" />

			{/* Status */}
			<div className="px-5 py-4 space-y-3">
				{/* XP */}
				<div className="flex items-baseline justify-between">
					<span className="text-[10px] text-white/25 uppercase tracking-wider">XP</span>
					<span className="text-sm font-semibold text-[#22c55e] tabular-nums">
						{xpTotal.toLocaleString()}
					</span>
				</div>

				{/* Connection */}
				<div className="flex items-center gap-2">
					<span
						className={`w-1.5 h-1.5 rounded-full ${
							connected
								? "bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.5)]"
								: "bg-white/15"
						}`}
					/>
					<span className="text-[10px] text-white/30">
						{connected ? "Connected" : "No API key"}
					</span>
				</div>

				{/* Clock */}
				<div className="text-[10px] text-white/20 tabular-nums font-mono">
					{time.toLocaleTimeString("en-US", { hour12: false })}
				</div>
			</div>
		</aside>
	);
}
