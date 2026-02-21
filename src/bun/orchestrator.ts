import type {
	AgentConfig,
	DataPoint,
	OrchestratorResult,
} from "../shared/types";
import { computeDefaults } from "./defaults";

/* ------------------------------------------------------------------ */
/*  System prompt — structured JSON analysis output                     */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are a Solana memecoin analyst for Pump Studio. You receive a DataPoint snapshot of a token and must return a structured JSON analysis.

Respond ONLY with a valid JSON object — no markdown fences, no prose, no explanation. The JSON must have exactly these fields:

{
  "sentiment": "bullish" | "bearish" | "neutral",
  "score": <number 0-100>,
  "summary": "<2-3 sentence analysis>",
  "riskLevel": "critical" | "high" | "medium" | "low",
  "riskFactors": ["<factor>", ...],
  "buyPressure": <number 0-100>,
  "volatilityScore": <number 0-100>,
  "liquidityDepth": "deep" | "moderate" | "shallow" | "dry",
  "holderConcentration": "distributed" | "moderate" | "concentrated" | "whale_dominated",
  "trendDirection": "up" | "down" | "sideways" | "reversal",
  "volumeProfile": "surging" | "rising" | "stable" | "declining" | "dead"
}

Guidelines:
- score: 0 = extremely bearish, 50 = neutral, 100 = extremely bullish
- riskFactors: pick from whale_dominance, high_concentration, low_liquidity, declining_holders, bonding_curve_risk, dead_volume, smart_money_inflow, healthy_distribution, organic_volume, rug_pull_risk, pump_and_dump, wash_trading, dev_selling
- buyPressure: percentage of buys vs total trades (0-100)
- volatilityScore: 0 = stable, 100 = extreme volatility
- summary: concise, data-driven, mention key metrics. No hype or speculation.
- Be skeptical of tokens with very high concentration, very low liquidity, or suspicious volume patterns.`;

/* ------------------------------------------------------------------ */
/*  Build user prompt from DataPoint                                    */
/* ------------------------------------------------------------------ */

function buildUserPrompt(dp: DataPoint): string {
	const total = dp.buys24h + dp.sells24h;
	const buyRatio = total > 0 ? ((dp.buys24h / total) * 100).toFixed(1) : "N/A";

	return `Analyze this Solana token:

Token: ${dp.name} ($${dp.symbol})
Mint: ${dp.mint}
Price: $${dp.priceUsd}
24h Change: ${dp.priceChange24h >= 0 ? "+" : ""}${dp.priceChange24h.toFixed(2)}%
Market Cap: $${dp.marketCap.toLocaleString()}
24h Volume: $${dp.volume24h.toLocaleString()}
Liquidity: $${dp.liquidity.toLocaleString()}
Holders: ${dp.holderCount.toLocaleString()}
Top 10 Holder %: ${dp.top10HolderPct.toFixed(1)}%
24h Buys: ${dp.buys24h}
24h Sells: ${dp.sells24h}
Buy Ratio: ${buyRatio}%
Bonding Progress: ${dp.bondingProgress.toFixed(1)}%
Bonding Complete: ${dp.bondingComplete}
Currently Live: ${dp.isCurrentlyLive}${dp.description ? `\nDescription: ${dp.description}` : ""}`;
}

/* ------------------------------------------------------------------ */
/*  Claude — Anthropic Messages API                                     */
/* ------------------------------------------------------------------ */

async function analyzeWithClaude(
	dp: DataPoint,
	apiKey: string,
): Promise<OrchestratorResult> {
	const res = await fetch("https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model: "claude-sonnet-4-20250514",
			max_tokens: 1024,
			system: SYSTEM_PROMPT,
			messages: [{ role: "user", content: buildUserPrompt(dp) }],
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Claude API ${res.status}: ${text}`);
	}

	const data = await res.json();

	/* Extract text from the first content block */
	const content = data.content;
	if (!Array.isArray(content) || content.length === 0) {
		throw new Error("Claude returned empty content");
	}

	const text = content
		.filter((b: { type: string }) => b.type === "text")
		.map((b: { text: string }) => b.text)
		.join("");

	return parseOrchestratorResponse(text, dp);
}

/* ------------------------------------------------------------------ */
/*  Codex / OpenAI — Chat Completions API                               */
/* ------------------------------------------------------------------ */

async function analyzeWithCodex(
	dp: DataPoint,
	apiKey: string,
): Promise<OrchestratorResult> {
	const res = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: "gpt-4o",
			temperature: 0.3,
			max_tokens: 1024,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: buildUserPrompt(dp) },
			],
		}),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`OpenAI API ${res.status}: ${text}`);
	}

	const data = await res.json();

	const text = data.choices?.[0]?.message?.content;
	if (!text) {
		throw new Error("OpenAI returned empty response");
	}

	return parseOrchestratorResponse(text, dp);
}

/* ------------------------------------------------------------------ */
/*  Response parser — extract JSON, validate, fallback to defaults      */
/* ------------------------------------------------------------------ */

export function parseOrchestratorResponse(
	raw: string,
	dp: DataPoint,
): OrchestratorResult {
	const defaults = computeDefaults(dp);

	try {
		/* Strip markdown code fences if present */
		let cleaned = raw.trim();
		if (cleaned.startsWith("```")) {
			cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
		}

		const parsed = JSON.parse(cleaned);

		/* Validate + merge with defaults for any missing fields */
		return {
			sentiment: validateEnum(
				parsed.sentiment,
				["bullish", "bearish", "neutral"],
				defaults.sentiment,
			),
			score: validateNumber(parsed.score, 0, 100, defaults.score),
			summary:
				typeof parsed.summary === "string" && parsed.summary.length > 0
					? parsed.summary
					: defaults.summary,
			riskLevel: validateEnum(
				parsed.riskLevel,
				["critical", "high", "medium", "low"],
				defaults.riskLevel,
			),
			riskFactors: validateStringArray(
				parsed.riskFactors,
				defaults.riskFactors,
			),
			buyPressure: validateNumber(
				parsed.buyPressure,
				0,
				100,
				defaults.buyPressure,
			),
			volatilityScore: validateNumber(
				parsed.volatilityScore,
				0,
				100,
				defaults.volatilityScore,
			),
			liquidityDepth: validateEnum(
				parsed.liquidityDepth,
				["deep", "moderate", "shallow", "dry"],
				defaults.liquidityDepth,
			),
			holderConcentration: validateEnum(
				parsed.holderConcentration,
				["distributed", "moderate", "concentrated", "whale_dominated"],
				defaults.holderConcentration,
			),
			trendDirection: validateEnum(
				parsed.trendDirection,
				["up", "down", "sideways", "reversal"],
				defaults.trendDirection,
			),
			volumeProfile: validateEnum(
				parsed.volumeProfile,
				["surging", "rising", "stable", "declining", "dead"],
				defaults.volumeProfile,
			),
		};
	} catch {
		/* JSON parse failed entirely — fall back to computed defaults */
		console.error("[orchestrator] Failed to parse AI response, using defaults");
		return defaults;
	}
}

/* ------------------------------------------------------------------ */
/*  Validation helpers                                                  */
/* ------------------------------------------------------------------ */

function validateEnum<T extends string>(
	value: unknown,
	allowed: T[],
	fallback: T,
): T {
	if (typeof value === "string" && allowed.includes(value as T)) {
		return value as T;
	}
	return fallback;
}

function validateNumber(
	value: unknown,
	min: number,
	max: number,
	fallback: number,
): number {
	if (typeof value === "number" && !isNaN(value)) {
		return Math.max(min, Math.min(max, Math.round(value)));
	}
	return fallback;
}

function validateStringArray(value: unknown, fallback: string[]): string[] {
	if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string")) {
		return value.slice(0, 8) as string[];
	}
	return fallback;
}

/* ------------------------------------------------------------------ */
/*  Orchestrator class — dispatches to the configured provider          */
/* ------------------------------------------------------------------ */

export class Orchestrator {
	private getConfig: () => AgentConfig;

	constructor(getConfig: () => AgentConfig) {
		this.getConfig = getConfig;
	}

	async analyze(dp: DataPoint): Promise<OrchestratorResult> {
		const cfg = this.getConfig();

		try {
			switch (cfg.orchestrator) {
				case "claude": {
					if (!cfg.claudeApiKey) {
						console.warn("[orchestrator] No Claude API key, using defaults");
						return computeDefaults(dp);
					}
					return await analyzeWithClaude(dp, cfg.claudeApiKey);
				}
				case "codex": {
					if (!cfg.codexApiKey) {
						console.warn("[orchestrator] No OpenAI API key, using defaults");
						return computeDefaults(dp);
					}
					return await analyzeWithCodex(dp, cfg.codexApiKey);
				}
				case "manual":
				default:
					return computeDefaults(dp);
			}
		} catch (err) {
			console.error(
				"[orchestrator] AI analysis failed, falling back to defaults:",
				err instanceof Error ? err.message : err,
			);
			return computeDefaults(dp);
		}
	}
}
