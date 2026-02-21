import { useState, useEffect } from "react";
import { request } from "../lib/rpc";
import type { AgentConfig } from "../../shared/types";

interface Props {
	config: AgentConfig | null;
	onSave: (config: AgentConfig) => void;
}

export function Settings({ config, onSave }: Props) {
	const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
	const [orchestrator, setOrchestrator] = useState<"claude" | "codex" | "manual">(config?.orchestrator ?? "manual");
	const [claudeKey, setClaudeKey] = useState(config?.claudeApiKey ?? "");
	const [codexKey, setCodexKey] = useState(config?.codexApiKey ?? "");
	const [autoAnalyze, setAutoAnalyze] = useState(config?.autoAnalyze ?? false);
	const [interval, setInterval_] = useState(config?.analyzeInterval ?? 10);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (!config) return;
		setApiKey(config.apiKey); setOrchestrator(config.orchestrator);
		setClaudeKey(config.claudeApiKey ?? ""); setCodexKey(config.codexApiKey ?? "");
		setAutoAnalyze(config.autoAnalyze); setInterval_(config.analyzeInterval);
	}, [config]);

	async function save() {
		const c: AgentConfig = { apiKey, orchestrator, claudeApiKey: claudeKey, codexApiKey: codexKey, autoAnalyze, analyzeInterval: Math.max(6, interval) };
		try { await request("saveConfig", { config: c }); onSave(c); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch {}
	}

	return (
		<div className="max-w-lg mx-auto py-8 px-6 animate-fade-in">
			<h1 className="text-lg font-semibold text-white/90 mb-1">Settings</h1>
			<p className="text-[13px] text-white/30 mb-8">Configure your agent connection and AI orchestration</p>

			<div className="space-y-8">
				{/* API Key */}
				<Section title="Pump Studio">
					<Label text="API Key" />
					<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ps_..."
						className="glass-input text-xs px-4 py-2.5 rounded-lg w-full font-mono" />
					<p className="text-[10px] text-white/15 mt-1.5">Required to submit analyses and earn XP</p>
				</Section>

				{/* Orchestrator */}
				<Section title="AI Orchestrator">
					<p className="text-[11px] text-white/25 mb-3">Choose which AI generates analysis from token data</p>
					<div className="grid grid-cols-3 gap-2">
						{(["manual", "claude", "codex"] as const).map((opt) => (
							<button key={opt} onClick={() => setOrchestrator(opt)}
								className={`glass-panel rounded-xl p-4 text-center transition-all ${
									orchestrator === opt
										? "border-[#22c55e]/30 bg-[#22c55e]/5 shadow-[0_0_20px_rgba(34,197,94,0.08)]"
										: "hover:bg-white/[0.02]"
								}`}>
								<div className={`text-xs font-medium uppercase mb-1 ${orchestrator === opt ? "text-[#22c55e]" : "text-white/40"}`}>{opt}</div>
								<div className="text-[10px] text-white/20">
									{opt === "manual" && "Smart defaults"}
									{opt === "claude" && "Anthropic Claude"}
									{opt === "codex" && "OpenAI GPT-4o"}
								</div>
							</button>
						))}
					</div>

					{orchestrator === "claude" && (
						<div className="mt-4">
							<Label text="Anthropic API Key" />
							<input type="password" value={claudeKey} onChange={(e) => setClaudeKey(e.target.value)} placeholder="sk-ant-..."
								className="glass-input text-xs px-4 py-2.5 rounded-lg w-full font-mono" />
						</div>
					)}
					{orchestrator === "codex" && (
						<div className="mt-4">
							<Label text="OpenAI API Key" />
							<input type="password" value={codexKey} onChange={(e) => setCodexKey(e.target.value)} placeholder="sk-..."
								className="glass-input text-xs px-4 py-2.5 rounded-lg w-full font-mono" />
						</div>
					)}
				</Section>

				{/* Auto-training */}
				<Section title="Auto-Training">
					<div className="flex items-center gap-3 mb-3">
						<button onClick={() => setAutoAnalyze(!autoAnalyze)}
							className={`w-10 h-[22px] rounded-full transition-all relative ${autoAnalyze ? "bg-[#22c55e]" : "bg-white/10"}`}>
							<span className={`block w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-transform shadow-sm ${autoAnalyze ? "translate-x-[20px]" : "translate-x-[2px]"}`} />
						</button>
						<span className="text-[13px] text-white/60">Enable auto-training</span>
					</div>
					{autoAnalyze && (
						<div>
							<Label text="Interval (seconds)" />
							<input type="number" min={6} max={300} value={interval} onChange={(e) => setInterval_(Number(e.target.value))}
								className="glass-input text-xs px-4 py-2.5 rounded-lg w-32 tabular-nums" />
							<p className="text-[10px] text-white/15 mt-1.5">Min 6s to respect rate limits</p>
						</div>
					)}
				</Section>

				{/* Save */}
				<div className="glass-divider" />
				<button onClick={save} className="btn-accent text-xs px-8 py-2.5 rounded-lg">
					{saved ? "Saved" : "Save Configuration"}
				</button>
			</div>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section>
			<h3 className="text-[11px] font-medium text-[#22c55e]/70 uppercase tracking-wider mb-3">{title}</h3>
			{children}
		</section>
	);
}

function Label({ text }: { text: string }) {
	return <label className="block text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{text}</label>;
}
