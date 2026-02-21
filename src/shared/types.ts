/* ------------------------------------------------------------------ */
/*  Shared types between Bun main process and webview                   */
/* ------------------------------------------------------------------ */

export interface MarketToken {
	mint: string;
	name: string;
	symbol: string;
	image_uri?: string;
	usd_market_cap?: number;
	priceUsd?: number;
	is_currently_live?: boolean;
	complete?: boolean;
	created_timestamp?: number;
}

export interface DataPoint {
	mint: string;
	name: string;
	symbol: string;
	imageUri?: string;
	priceUsd: number;
	marketCap: number;
	volume24h: number;
	liquidity: number;
	holderCount: number;
	top10HolderPct: number;
	buys24h: number;
	sells24h: number;
	bondingProgress: number;
	priceChange24h: number;
	bondingComplete: boolean;
	isCurrentlyLive: boolean;
	description?: string;
	[key: string]: unknown;
}

export interface LeaderboardEntry {
	mint: string;
	name?: string;
	symbol?: string;
	image?: string;
	count: number;
	lastSentiment?: string;
	lastScore?: number;
}

export interface SubmitResult {
	ok: boolean;
	error?: string;
	xpEarned?: number;
	xpTotal?: number;
	analysisId?: string;
	validated?: boolean;
	deviationPct?: number;
	warning?: string;
}

export interface AnalysisStats {
	ok: boolean;
	totalAnalyses: number;
	uniqueTokens: number;
	goal: number;
	progress: number;
	leaderboard: LeaderboardEntry[];
}

export interface AnalysisPayload {
	mint: string;
	sentiment: "bullish" | "bearish" | "neutral";
	score: number;
	summary: string;
	snapshot: {
		priceUsd: number;
		marketCap: number;
		volume24h: number;
		liquidity: number;
		holderCount: number;
		top10HolderPct: number;
		buys24h: number;
		sells24h: number;
		bondingProgress: number;
		snapshotAt: number;
	};
	quant: {
		riskLevel: string;
		riskFactors: string[];
		buyPressure: number;
		volatilityScore: number;
		liquidityDepth: string;
		holderConcentration: string;
		trendDirection: string;
		volumeProfile: string;
	};
}

export interface AgentConfig {
	apiKey: string;
	orchestrator: "claude" | "codex" | "manual";
	claudeApiKey?: string;
	codexApiKey?: string;
	autoAnalyze: boolean;
	analyzeInterval: number;
}

export interface OrchestratorResult {
	sentiment: "bullish" | "bearish" | "neutral";
	score: number;
	summary: string;
	riskLevel: string;
	riskFactors: string[];
	buyPressure: number;
	volatilityScore: number;
	liquidityDepth: string;
	holderConcentration: string;
	trendDirection: string;
	volumeProfile: string;
}
