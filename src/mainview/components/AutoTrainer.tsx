import { useState, useEffect, useRef } from "react";
import { request, on, send } from "../lib/rpc";
import { formatUsd } from "../lib/format";
import type { AgentConfig, MarketToken } from "../../shared/types";

interface Props {
	config: AgentConfig | null;
	onXpEarned: (xp: number) => void;
}

interface Log {
	ts: number;
	mint: string;
	step: string;
	xpEarned?: number;
	error?: string;
}

export function AutoTrainer({ config, onXpEarned }: Props) {
	const [running, setRunning] = useState(false);
	const [tokens, setTokens] = useState<MarketToken[]>([]);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [logs, setLogs] = useState<Log[]>([]);
	const [totalXp, setTotalXp] = useState(0);
	const [count, setCount] = useState(0);
	const [tab, setTab] = useState("live");
	const endRef = useRef<HTMLDivElement>(null);

	useEffect(() => { loadTokens(); }, [tab]);

	useEffect(() => {
		const u1 = on("trainingProgress", (p: unknown) => {
			const d = p as Log;
			setLogs((prev) => [...prev.slice(-99), { ...d, ts: Date.now() }]);
			if (d.xpEarned) { setTotalXp((p) => p + d.xpEarned!); onXpEarned(d.xpEarned); }
			if (d.step === "done") setCount((p) => p + 1);
		});
		const u2 = on("trainingComplete", () => setRunning(false));
		return () => { u1(); u2(); };
	}, [onXpEarned]);

	useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

	async function loadTokens() {
		try {
			const r = await request<{ tokens: MarketToken[] }>("getMarket", { tab, limit: 50 });
			setTokens(r.tokens);
		} catch {}
	}

	function toggle(m: string) {
		setSelected((s) => { const n = new Set(s); n.has(m) ? n.delete(m) : n.add(m); return n; });
	}

	const canStart = !!config?.apiKey && selected.size > 0 && !running;

	return (
		<div className="flex h-full">
			{/* Token picker */}
			<div className="w-80 border-r border-white/[0.04] flex flex-col">
				<div className="px-5 pt-5 pb-3">
					<h2 className="text-[15px] font-semibold text-white/80 mb-1">Select Tokens</h2>
					<div className="flex items-center gap-2 text-[11px] text-white/25">
						<span>{selected.size} selected</span>
						<span>&middot;</span>
						<button onClick={() => setSelected(new Set(tokens.map((t) => t.mint)))} className="hover:text-white/50 transition-colors">All</button>
						<button onClick={() => setSelected(new Set())} className="hover:text-white/50 transition-colors">None</button>
					</div>

					<div className="flex gap-0.5 glass-panel rounded-lg p-0.5 mt-3">
						{["live", "all", "new", "graduated"].map((t) => (
							<button key={t} onClick={() => setTab(t)}
								className={`flex-1 px-2 py-1 text-[10px] rounded-md capitalize transition-all ${
									tab === t ? "bg-white/[0.07] text-white/70" : "text-white/25 hover:text-white/40"
								}`}>
								{t}
							</button>
						))}
					</div>
				</div>

				<div className="flex-1 overflow-y-auto px-2">
					{tokens.map((t) => (
						<button key={t.mint} onClick={() => toggle(t.mint)}
							className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
								selected.has(t.mint) ? "bg-[#22c55e]/5 border-l-2 border-l-[#22c55e]/50" : "hover:bg-white/[0.02]"
							}`}>
							<span className={`w-3 h-3 rounded border flex-shrink-0 transition-all ${
								selected.has(t.mint) ? "border-[#22c55e] bg-[#22c55e]" : "border-white/10"
							}`} />
							{t.image_uri && <img src={t.image_uri} alt="" className="w-5 h-5 rounded-full" />}
							<div className="flex-1 min-w-0">
								<span className="text-[12px] text-white/70">{t.symbol}</span>
								<span className="text-[10px] text-white/20 ml-1 truncate">{t.name}</span>
							</div>
							<span className="text-[10px] text-white/20 font-mono tabular-nums">
								{t.usd_market_cap ? formatUsd(t.usd_market_cap) : ""}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Console */}
			<div className="flex-1 flex flex-col">
				{/* Stats */}
				<div className="flex items-center gap-8 px-6 py-4 border-b border-white/[0.04]">
					<StatChip label="Status" value={running ? "Training" : "Idle"} color={running ? "#22c55e" : undefined} />
					<StatChip label="XP Earned" value={`+${totalXp}`} color="#22c55e" />
					<StatChip label="Tokens" value={String(count)} />
					<StatChip label="Orchestrator" value={config?.orchestrator ?? "manual"} color="#a855f7" />
					<div className="flex-1" />
					{running ? (
						<button onClick={() => { send("stopAutoTraining"); setRunning(false); }}
							className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-5 py-2.5 rounded-lg hover:bg-red-500/20 transition-all">
							Stop
						</button>
					) : (
						<button onClick={() => { setRunning(true); setLogs([]); setTotalXp(0); setCount(0); send("startAutoTraining", { mints: Array.from(selected) }); }}
							disabled={!canStart} className="btn-accent text-xs px-5 py-2.5 rounded-lg">
							Start Training
						</button>
					)}
				</div>

				{/* Log output */}
				<div className="flex-1 overflow-y-auto bg-black/30 p-5 font-mono text-[11px] leading-relaxed">
					{logs.length === 0 ? (
						<div className="text-white/15">
							{!config?.apiKey ? "Set your API key in Settings to begin" : "Select tokens and start training"}
						</div>
					) : (
						logs.map((log, i) => (
							<div key={i} className="flex gap-3 animate-fade-in">
								<span className="text-white/15 tabular-nums flex-shrink-0">
									{new Date(log.ts).toLocaleTimeString("en-US", { hour12: false })}
								</span>
								<span className={`flex-shrink-0 ${
									log.step === "error" ? "text-red-400/70" : log.step === "done" ? "text-[#22c55e]/70" : "text-yellow-400/50"
								}`}>
									[{log.step}]
								</span>
								<span className="text-white/40">
									{log.mint.slice(0, 8)}
									{log.xpEarned !== undefined && <span className="text-[#22c55e]/80 ml-2">+{log.xpEarned} XP</span>}
									{log.error && <span className="text-red-400/60 ml-2">{log.error}</span>}
								</span>
							</div>
						))
					)}
					<div ref={endRef} />
				</div>
			</div>
		</div>
	);
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
	return (
		<div>
			<div className="text-[9px] text-white/20 uppercase tracking-wider">{label}</div>
			<div className="text-[13px] font-medium capitalize" style={{ color: color ?? "rgba(255,255,255,0.6)" }}>{value}</div>
		</div>
	);
}
