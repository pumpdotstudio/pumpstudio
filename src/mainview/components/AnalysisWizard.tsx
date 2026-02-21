import { useState, useEffect } from "react";
import { request } from "../lib/rpc";
import { formatUsd, formatPct } from "../lib/format";
import { defaultSentiment, defaultScore, defaultRiskLevel, defaultRiskFactors } from "../lib/defaults";
import type { DataPoint, OrchestratorResult, SubmitResult } from "../../shared/types";

const RISK_FACTORS = [
	"whale_dominance", "creator_holds_majority", "low_liquidity", "no_liquidity_lock",
	"high_concentration", "rug_pattern", "honeypot_risk", "wash_trading",
	"bonding_curve_risk", "rapid_sell_off", "no_social_presence", "fake_volume",
	"supply_manipulation", "dev_wallet_active", "copy_token", "no_website",
	"new_deployer", "single_holder_majority", "declining_holders", "dead_volume",
	"healthy_distribution", "strong_community", "organic_volume", "locked_liquidity",
	"verified_socials", "active_development", "growing_holders", "smart_money_inflow",
];

interface Props {
	mint: string | null;
	onBack: () => void;
	onXpEarned: (xp: number) => void;
	orchestrator: string;
}

type Step = "loading" | "form" | "orchestrating" | "submitted";

export function AnalysisWizard({ mint, onBack, onXpEarned, orchestrator }: Props) {
	const [step, setStep] = useState<Step>("loading");
	const [dp, setDp] = useState<DataPoint | null>(null);
	const [mintInput, setMintInput] = useState(mint ?? "");
	const [error, setError] = useState<string | null>(null);

	// Form
	const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral">("neutral");
	const [score, setScore] = useState(50);
	const [summary, setSummary] = useState("");
	const [riskLevel, setRiskLevel] = useState("medium");
	const [riskFactors, setRiskFactors] = useState<string[]>(["healthy_distribution"]);
	const [buyPressure, setBuyPressure] = useState(50);
	const [volatilityScore, setVolatilityScore] = useState(20);
	const [liquidityDepth, setLiquidityDepth] = useState("moderate");
	const [holderConcentration, setHolderConcentration] = useState("distributed");
	const [trendDirection, setTrendDirection] = useState("sideways");
	const [volumeProfile, setVolumeProfile] = useState("stable");
	const [result, setResult] = useState<SubmitResult | null>(null);

	useEffect(() => { if (mint) loadToken(mint); }, [mint]);

	async function loadToken(m: string) {
		setStep("loading");
		setError(null);
		try {
			const r = await request<{ dataPoint: DataPoint }>("getDataPoint", { mint: m });
			setDp(r.dataPoint);
			const d = r.dataPoint;
			setSentiment(defaultSentiment(d));
			setScore(defaultScore(d));
			setRiskLevel(defaultRiskLevel(d));
			setRiskFactors(defaultRiskFactors(d));
			setStep("form");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setStep("form");
		}
	}

	async function handleOrchestrate() {
		if (!dp) return;
		setStep("orchestrating");
		try {
			const r = await request<{ result: OrchestratorResult }>("orchestrateAnalysis", { mint: dp.mint, dataPoint: dp });
			const a = r.result;
			setSentiment(a.sentiment); setScore(a.score); setSummary(a.summary);
			setRiskLevel(a.riskLevel); setRiskFactors(a.riskFactors);
			setBuyPressure(a.buyPressure); setVolatilityScore(a.volatilityScore);
			setLiquidityDepth(a.liquidityDepth); setHolderConcentration(a.holderConcentration);
			setTrendDirection(a.trendDirection); setVolumeProfile(a.volumeProfile);
			setStep("form");
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setStep("form");
		}
	}

	async function handleSubmit() {
		if (!dp) return;
		setError(null);
		try {
			const r = await request<{ result: SubmitResult }>("submitAnalysis", {
				payload: {
					mint: dp.mint, sentiment, score, summary,
					snapshot: {
						priceUsd: dp.priceUsd, marketCap: dp.marketCap, volume24h: dp.volume24h,
						liquidity: dp.liquidity, holderCount: dp.holderCount, top10HolderPct: dp.top10HolderPct,
						buys24h: dp.buys24h, sells24h: dp.sells24h, bondingProgress: dp.bondingProgress,
						snapshotAt: Date.now(),
					},
					quant: { riskLevel, riskFactors, buyPressure, volatilityScore, liquidityDepth, holderConcentration, trendDirection, volumeProfile },
				},
			});
			setResult(r.result);
			if (r.result.xpEarned) onXpEarned(r.result.xpEarned);
			setStep("submitted");
		} catch (e) { setError(e instanceof Error ? e.message : String(e)); }
	}

	function toggleFactor(f: string) {
		setRiskFactors((prev) =>
			prev.includes(f) ? prev.filter((x) => x !== f) : prev.length < 8 ? [...prev, f] : prev,
		);
	}

	// No mint — prompt for one
	if (!mint && step !== "loading") {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in">
				<div className="text-center">
					<h2 className="text-lg font-semibold text-white/80 mb-1">Analyze a Token</h2>
					<p className="text-[13px] text-white/30">Paste a mint address to get started</p>
				</div>
				<div className="flex gap-2">
					<input
						value={mintInput}
						onChange={(e) => setMintInput(e.target.value)}
						placeholder="Token mint address..."
						className="glass-input text-xs px-4 py-2.5 rounded-lg w-96 font-mono"
					/>
					<button onClick={() => loadToken(mintInput)} disabled={!mintInput} className="btn-accent text-xs px-5 py-2.5 rounded-lg">
						Load
					</button>
				</div>
				<button onClick={onBack} className="text-[13px] text-white/25 hover:text-white/40 transition-colors">
					Back to tokens
				</button>
			</div>
		);
	}

	if (step === "loading") {
		return <div className="flex items-center justify-center h-full"><div className="shimmer w-48 h-8 rounded-lg" /></div>;
	}

	// Success screen
	if (step === "submitted" && result) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-8 animate-slide-up">
				<div className="glass-panel rounded-2xl p-10 text-center glow-green">
					<div className={`text-5xl font-bold mb-3 ${result.ok ? "text-[#22c55e]" : "text-red-400"}`}>
						{result.ok ? `+${result.xpEarned} XP` : "Rejected"}
					</div>
					<div className="text-[13px] text-white/40 space-y-1">
						<div>{result.validated ? "Validated" : "Unvalidated"} &middot; Deviation: {result.deviationPct?.toFixed(1)}%</div>
						{result.warning && <div className="text-yellow-400/70">{result.warning}</div>}
						{result.error && <div className="text-red-400/70">{result.error}</div>}
					</div>
				</div>
				<div className="flex gap-3">
					<button onClick={onBack} className="btn-ghost text-xs px-5 py-2.5 rounded-lg">Back to Tokens</button>
					<button onClick={() => { setResult(null); setStep("form"); }} className="btn-accent text-xs px-5 py-2.5 rounded-lg">Analyze Again</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full animate-fade-in">
			{/* Token info sidebar */}
			<div className="w-72 border-r border-white/[0.04] overflow-y-auto p-5">
				{dp && (
					<div className="space-y-5">
						<div className="flex items-center gap-3">
							{dp.imageUri ? (
								<img src={dp.imageUri} alt="" className="w-10 h-10 rounded-full ring-1 ring-white/[0.06]" />
							) : (
								<div className="w-10 h-10 rounded-full bg-white/[0.04]" />
							)}
							<div>
								<div className="text-[15px] font-semibold text-white/90">{dp.symbol}</div>
								<div className="text-[11px] text-white/30">{dp.name}</div>
							</div>
						</div>

						<div className="space-y-2.5">
							<Stat label="Price" value={formatUsd(dp.priceUsd)} />
							<Stat label="24h" value={formatPct(dp.priceChange24h)} color={dp.priceChange24h > 0 ? "#22c55e" : "#ef4444"} />
							<Stat label="MCap" value={formatUsd(dp.marketCap)} />
							<Stat label="Volume" value={formatUsd(dp.volume24h)} />
							<Stat label="Liquidity" value={formatUsd(dp.liquidity)} />
							<div className="glass-divider" />
							<Stat label="Holders" value={dp.holderCount.toLocaleString()} />
							<Stat label="Top 10%" value={`${dp.top10HolderPct.toFixed(1)}%`} />
							<Stat label="Buys/Sells" value={`${dp.buys24h}/${dp.sells24h}`} />
							<Stat label="Bonding" value={`${dp.bondingProgress.toFixed(0)}%`} color={dp.bondingComplete ? "#22c55e" : "#eab308"} />
						</div>

						<div className="text-[10px] text-white/15 font-mono break-all">{dp.mint}</div>
					</div>
				)}
			</div>

			{/* Form */}
			<div className="flex-1 overflow-y-auto p-6">
				{error && (
					<div className="glass-panel border-red-500/20 bg-red-500/5 text-red-400 text-xs p-3 rounded-lg mb-5">
						{error}
					</div>
				)}

				{step === "orchestrating" ? (
					<div className="flex flex-col items-center justify-center h-48 gap-3">
						<div className="shimmer w-32 h-6 rounded-lg" />
						<div className="text-[13px] text-white/30">AI analyzing {dp?.symbol}...</div>
					</div>
				) : (
					<div className="space-y-7 max-w-2xl">
						{/* AI button */}
						{orchestrator !== "manual" && (
							<button onClick={handleOrchestrate}
								className="w-full glass-panel rounded-xl py-3.5 text-xs text-purple-400/80 border-purple-500/20 hover:bg-purple-500/5 hover:border-purple-500/30 transition-all">
								Auto-analyze with {orchestrator.toUpperCase()}
							</button>
						)}

						{/* Sentiment + Score */}
						<Section title="Sentiment & Conviction">
							<div className="grid grid-cols-2 gap-4">
								<Field label="Sentiment">
									<select value={sentiment} onChange={(e) => setSentiment(e.target.value as typeof sentiment)} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full">
										<option value="bullish">Bullish</option>
										<option value="bearish">Bearish</option>
										<option value="neutral">Neutral</option>
									</select>
								</Field>
								<Field label="Score (0-100)">
									<input type="number" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full tabular-nums" />
								</Field>
							</div>
						</Section>

						{/* Summary */}
						<Section title="Summary">
							<textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4}
								placeholder="Describe your analysis thesis (min 50 chars)..."
								className="glass-input text-xs px-3 py-2.5 rounded-lg w-full resize-none leading-relaxed" />
							<div className="text-[10px] text-white/20 mt-1.5">{summary.length}/2000 {summary.length < 50 && "(min 50)"}</div>
						</Section>

						{/* Risk */}
						<Section title="Risk Assessment">
							<div className="grid grid-cols-2 gap-4">
								<Field label="Risk Level">
									<select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full">
										<option value="critical">Critical</option>
										<option value="high">High</option>
										<option value="medium">Medium</option>
										<option value="low">Low</option>
									</select>
								</Field>
								<Field label="Holder Concentration">
									<select value={holderConcentration} onChange={(e) => setHolderConcentration(e.target.value)} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full">
										<option value="distributed">Distributed</option>
										<option value="moderate">Moderate</option>
										<option value="concentrated">Concentrated</option>
										<option value="whale_dominated">Whale Dominated</option>
									</select>
								</Field>
							</div>
							<Field label="Risk Factors (1-8)">
								<div className="flex flex-wrap gap-1.5 mt-1">
									{RISK_FACTORS.map((f) => (
										<button key={f} onClick={() => toggleFactor(f)}
											className={`glass-tag px-2 py-1 rounded-md ${riskFactors.includes(f) ? "glass-tag-active" : "text-white/30 hover:text-white/50"}`}>
											{f.replace(/_/g, " ")}
										</button>
									))}
								</div>
							</Field>
						</Section>

						{/* Market Dynamics */}
						<Section title="Market Dynamics">
							<div className="grid grid-cols-3 gap-4">
								<Field label="Trend">
									<select value={trendDirection} onChange={(e) => setTrendDirection(e.target.value)} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full">
										{["up", "down", "sideways", "reversal"].map((v) => <option key={v} value={v}>{v}</option>)}
									</select>
								</Field>
								<Field label="Volume Profile">
									<select value={volumeProfile} onChange={(e) => setVolumeProfile(e.target.value)} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full">
										{["surging", "rising", "stable", "declining", "dead"].map((v) => <option key={v} value={v}>{v}</option>)}
									</select>
								</Field>
								<Field label="Liquidity Depth">
									<select value={liquidityDepth} onChange={(e) => setLiquidityDepth(e.target.value)} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full">
										{["deep", "moderate", "shallow", "dry"].map((v) => <option key={v} value={v}>{v}</option>)}
									</select>
								</Field>
							</div>
							<div className="grid grid-cols-2 gap-4 mt-3">
								<Field label="Buy Pressure (0-100)">
									<input type="number" min={0} max={100} value={buyPressure} onChange={(e) => setBuyPressure(Number(e.target.value))} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full tabular-nums" />
								</Field>
								<Field label="Volatility (0-100)">
									<input type="number" min={0} max={100} value={volatilityScore} onChange={(e) => setVolatilityScore(Number(e.target.value))} className="glass-input text-xs px-3 py-2.5 rounded-lg w-full tabular-nums" />
								</Field>
							</div>
						</Section>

						{/* Actions */}
						<div className="flex gap-3 pt-4">
							<button onClick={onBack} className="btn-ghost text-xs px-5 py-2.5 rounded-lg">Back</button>
							<div className="flex-1" />
							<button onClick={handleSubmit} disabled={summary.length < 50}
								className="btn-accent text-xs px-8 py-2.5 rounded-lg">
								Submit Analysis
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
	return (
		<div className="flex justify-between items-center">
			<span className="text-[11px] text-white/25">{label}</span>
			<span className="text-[12px] font-mono tabular-nums" style={{ color: color ?? "rgba(255,255,255,0.6)" }}>{value}</span>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div>
			<label className="block text-[10px] text-white/25 uppercase tracking-wider mb-1.5">{label}</label>
			{children}
		</div>
	);
}
