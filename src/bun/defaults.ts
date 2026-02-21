import type { DataPoint, OrchestratorResult } from "../shared/types";

/* ------------------------------------------------------------------ */
/*  Smart defaults — pre-populate quant fields from DataPoint           */
/* ------------------------------------------------------------------ */

export function defaultSentiment(dp: DataPoint): "bullish" | "bearish" | "neutral" {
	if (dp.priceChange24h > 5) return "bullish";
	if (dp.priceChange24h < -5) return "bearish";
	return "neutral";
}

export function defaultScore(dp: DataPoint): number {
	return Math.max(0, Math.min(100, Math.round(50 + dp.priceChange24h * 2)));
}

export function defaultRiskLevel(dp: DataPoint): "critical" | "high" | "medium" | "low" {
	if (dp.top10HolderPct > 80 || dp.liquidity < 1000) return "critical";
	if (dp.top10HolderPct > 60 || dp.holderCount < 20) return "high";
	if (dp.top10HolderPct > 40) return "medium";
	return "low";
}

export function defaultRiskFactors(dp: DataPoint): string[] {
	const factors: string[] = [];
	if (dp.top10HolderPct > 80) factors.push("whale_dominance");
	if (dp.top10HolderPct > 50) factors.push("high_concentration");
	if (dp.liquidity < 5000) factors.push("low_liquidity");
	if (dp.holderCount < 50) factors.push("declining_holders");
	if (!dp.bondingComplete) factors.push("bonding_curve_risk");
	if (dp.volume24h < 100) factors.push("dead_volume");
	if (dp.buys24h > dp.sells24h * 3) factors.push("smart_money_inflow");
	if (dp.holderCount > 500 && dp.top10HolderPct < 30) factors.push("healthy_distribution");
	if (dp.volume24h > dp.liquidity * 2) factors.push("organic_volume");
	if (factors.length === 0) factors.push("healthy_distribution");
	return factors.slice(0, 8);
}

export function defaultHolderConcentration(
	dp: DataPoint,
): "distributed" | "moderate" | "concentrated" | "whale_dominated" {
	if (dp.top10HolderPct > 80) return "whale_dominated";
	if (dp.top10HolderPct > 50) return "concentrated";
	if (dp.top10HolderPct > 30) return "moderate";
	return "distributed";
}

export function defaultTrendDirection(
	dp: DataPoint,
): "up" | "down" | "sideways" | "reversal" {
	if (dp.priceChange24h > 10) return "up";
	if (dp.priceChange24h < -10) return "down";
	return "sideways";
}

export function defaultVolumeProfile(
	dp: DataPoint,
): "surging" | "rising" | "stable" | "declining" | "dead" {
	if (dp.liquidity > 0 && dp.volume24h > dp.liquidity * 2) return "surging";
	if (dp.liquidity > 0 && dp.volume24h > dp.liquidity) return "rising";
	if (dp.volume24h > 1000) return "stable";
	if (dp.volume24h > 100) return "declining";
	return "dead";
}

export function defaultLiquidityDepth(
	dp: DataPoint,
): "deep" | "moderate" | "shallow" | "dry" {
	if (dp.liquidity > 100_000) return "deep";
	if (dp.liquidity > 10_000) return "moderate";
	if (dp.liquidity > 1_000) return "shallow";
	return "dry";
}

export function defaultBuyPressure(dp: DataPoint): number {
	const total = dp.buys24h + dp.sells24h;
	if (total === 0) return 50;
	return Math.round((dp.buys24h / total) * 100);
}

export function defaultVolatilityScore(dp: DataPoint): number {
	const absChange = Math.abs(dp.priceChange24h);
	return Math.min(100, Math.round(absChange * 2));
}

/* ------------------------------------------------------------------ */
/*  Build snapshot object from DataPoint                                */
/* ------------------------------------------------------------------ */

export function buildSnapshot(dp: DataPoint) {
	return {
		priceUsd: dp.priceUsd,
		marketCap: dp.marketCap,
		volume24h: dp.volume24h,
		liquidity: dp.liquidity,
		holderCount: dp.holderCount,
		top10HolderPct: dp.top10HolderPct,
		buys24h: dp.buys24h,
		sells24h: dp.sells24h,
		bondingProgress: dp.bondingProgress,
		snapshotAt: Date.now(),
	};
}

/* ------------------------------------------------------------------ */
/*  Compute full OrchestratorResult from DataPoint (deterministic)      */
/* ------------------------------------------------------------------ */

export function computeDefaults(dp: DataPoint): OrchestratorResult {
	return {
		sentiment: defaultSentiment(dp),
		score: defaultScore(dp),
		summary: buildDefaultSummary(dp),
		riskLevel: defaultRiskLevel(dp),
		riskFactors: defaultRiskFactors(dp),
		buyPressure: defaultBuyPressure(dp),
		volatilityScore: defaultVolatilityScore(dp),
		liquidityDepth: defaultLiquidityDepth(dp),
		holderConcentration: defaultHolderConcentration(dp),
		trendDirection: defaultTrendDirection(dp),
		volumeProfile: defaultVolumeProfile(dp),
	};
}

/* ------------------------------------------------------------------ */
/*  Build a human-readable default summary                              */
/* ------------------------------------------------------------------ */

export function buildDefaultSummary(dp: DataPoint): string {
	const sentiment = defaultSentiment(dp);
	const risk = defaultRiskLevel(dp);
	const trend = defaultTrendDirection(dp);
	const volume = defaultVolumeProfile(dp);
	const holders = defaultHolderConcentration(dp);
	const liq = defaultLiquidityDepth(dp);

	const parts: string[] = [];

	/* Lead with name + sentiment */
	parts.push(
		`${dp.symbol} is ${sentiment} with a ${risk} risk profile.`,
	);

	/* Price action */
	const dir = dp.priceChange24h >= 0 ? "up" : "down";
	parts.push(
		`Price ${dir} ${Math.abs(dp.priceChange24h).toFixed(1)}% over 24h.`,
	);

	/* Volume + liquidity */
	parts.push(
		`Volume is ${volume} ($${fmtNum(dp.volume24h)}) against ${liq} liquidity ($${fmtNum(dp.liquidity)}).`,
	);

	/* Holders */
	parts.push(
		`${dp.holderCount.toLocaleString()} holders with ${holders} concentration (top 10 hold ${dp.top10HolderPct.toFixed(1)}%).`,
	);

	/* Trend */
	if (trend !== "sideways") {
		parts.push(`Trend direction: ${trend}.`);
	}

	/* Bonding */
	if (!dp.bondingComplete) {
		parts.push(`Bonding curve at ${dp.bondingProgress.toFixed(1)}%.`);
	}

	return parts.join(" ");
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtNum(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toFixed(2);
}
