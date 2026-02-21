import { useState, useEffect } from "react";
import { request } from "../lib/rpc";
import type { AnalysisStats } from "../../shared/types";

export function Leaderboard() {
	const [stats, setStats] = useState<AnalysisStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => { load(); }, []);

	async function load() {
		setLoading(true);
		try {
			const r = await request<{ stats: AnalysisStats }>("getAnalysisStats", { limit: 25 });
			setStats(r.stats);
		} catch {} finally { setLoading(false); }
	}

	if (loading) {
		return (
			<div className="p-6 space-y-4">
				{Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-20 rounded-xl" />)}
			</div>
		);
	}

	if (!stats) {
		return <div className="flex items-center justify-center h-full text-[13px] text-white/30">Failed to load</div>;
	}

	return (
		<div className="flex flex-col h-full animate-fade-in">
			<div className="px-6 pt-6 pb-2">
				<h1 className="text-lg font-semibold text-white/90 mb-1">Leaderboard</h1>
				<p className="text-[13px] text-white/30">Global analysis stats and rankings</p>
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-4 gap-3 px-6 py-4">
				<GlassCard label="Total Analyses" value={stats.totalAnalyses.toLocaleString()} />
				<GlassCard label="Unique Tokens" value={stats.uniqueTokens.toLocaleString()} />
				<GlassCard label="Goal" value={stats.goal.toLocaleString()} />
				<GlassCard label="Progress" value={`${stats.progress.toFixed(1)}%`} accent />
			</div>

			{/* Progress bar */}
			<div className="mx-6 mb-4">
				<div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
					<div
						className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#06b6d4] transition-all duration-700"
						style={{ width: `${Math.min(stats.progress, 100)}%` }}
					/>
				</div>
			</div>

			{/* Table */}
			<div className="flex-1 overflow-y-auto px-4">
				<div className="space-y-0.5">
					{stats.leaderboard.map((entry, i) => (
						<div
							key={entry.mint}
							className="flex items-center gap-3 px-4 py-3 rounded-xl glass-panel-hover transition-all"
							style={{ animationDelay: `${i * 30}ms` }}
						>
							<span className="text-[13px] font-semibold text-white/15 w-6 text-right tabular-nums">
								{i + 1}
							</span>

							{entry.image ? (
								<img src={entry.image} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/[0.06]" />
							) : (
								<div className="w-8 h-8 rounded-full bg-white/[0.04]" />
							)}

							<div className="flex-1 min-w-0">
								<div className="text-[13px] text-white/70 font-medium">{entry.symbol ?? "Unknown"}</div>
								<div className="text-[11px] text-white/20 truncate">{entry.name}</div>
							</div>

							<div className="text-right">
								<div className="text-[13px] text-white/60 font-mono tabular-nums">{entry.count}</div>
								<div className="text-[10px] text-white/20">analyses</div>
							</div>

							{entry.lastSentiment && (
								<span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md ${
									entry.lastSentiment === "bullish" ? "bg-[#22c55e]/10 text-[#22c55e]/70" :
									entry.lastSentiment === "bearish" ? "bg-red-500/10 text-red-400/70" :
									"bg-yellow-500/10 text-yellow-500/60"
								}`}>
									{entry.lastSentiment}
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function GlassCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
	return (
		<div className="glass-panel rounded-xl p-4">
			<div className="text-[10px] text-white/20 uppercase tracking-wider mb-1">{label}</div>
			<div className={`text-xl font-semibold tabular-nums ${accent ? "text-[#22c55e]" : "text-white/70"}`}>{value}</div>
		</div>
	);
}
