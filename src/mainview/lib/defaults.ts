import type { DataPoint } from "../../shared/types";

export function defaultSentiment(dp: DataPoint): "bullish" | "bearish" | "neutral" {
	if (dp.priceChange24h > 5) return "bullish";
	if (dp.priceChange24h < -5) return "bearish";
	return "neutral";
}

export function defaultScore(dp: DataPoint): number {
	return Math.max(0, Math.min(100, Math.round(50 + dp.priceChange24h * 2)));
}

export function defaultRiskLevel(dp: DataPoint): string {
	if (dp.top10HolderPct > 80 || dp.liquidity < 1000) return "critical";
	if (dp.top10HolderPct > 60 || dp.holderCount < 20) return "high";
	if (dp.top10HolderPct > 40) return "medium";
	return "low";
}

export function defaultRiskFactors(dp: DataPoint): string[] {
	const f: string[] = [];
	if (dp.top10HolderPct > 80) f.push("whale_dominance");
	if (dp.top10HolderPct > 50) f.push("high_concentration");
	if (dp.liquidity < 5000) f.push("low_liquidity");
	if (dp.holderCount < 50) f.push("declining_holders");
	if (!dp.bondingComplete) f.push("bonding_curve_risk");
	if (dp.volume24h < 100) f.push("dead_volume");
	if (dp.buys24h > dp.sells24h * 3) f.push("smart_money_inflow");
	if (dp.holderCount > 500 && dp.top10HolderPct < 30) f.push("healthy_distribution");
	if (dp.volume24h > dp.liquidity * 2) f.push("organic_volume");
	if (f.length === 0) f.push("healthy_distribution");
	return f.slice(0, 8);
}
