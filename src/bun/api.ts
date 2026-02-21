import type {
	MarketToken,
	DataPoint,
	AnalysisStats,
	AnalysisPayload,
	SubmitResult,
} from "../shared/types";

/* ------------------------------------------------------------------ */
/*  Pump Studio API client                                              */
/* ------------------------------------------------------------------ */

const BASE = "https://api.pump.studio";

export class PumpStudioApi {
	private getKey: () => string;

	constructor(getKey: () => string) {
		this.getKey = getKey;
	}

	private headers(): Record<string, string> {
		const key = this.getKey();
		return {
			"Content-Type": "application/json",
			...(key
				? { "X-API-Key": key, Authorization: `Bearer ${key}` }
				: {}),
		};
	}

	async getMarket(tab = "all", limit = 50): Promise<MarketToken[]> {
		const res = await fetch(
			`${BASE}/api/v1/market?tab=${tab}&limit=${limit}`,
			{ headers: this.headers() },
		);
		if (!res.ok) throw new Error(`Market fetch failed: ${res.status}`);
		const data = await res.json();
		return data.tokens ?? data.items ?? [];
	}

	async getDataPoint(mint: string): Promise<DataPoint> {
		const res = await fetch(
			`${BASE}/api/v1/datapoint?mint=${mint}`,
			{ headers: this.headers() },
		);
		if (!res.ok) throw new Error(`DataPoint fetch failed: ${res.status}`);
		return res.json();
	}

	async getAnalysisStats(limit = 10): Promise<AnalysisStats> {
		const res = await fetch(
			`${BASE}/api/v1/analysis?limit=${limit}`,
			{ headers: this.headers() },
		);
		if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
		return res.json();
	}

	async submitAnalysis(payload: AnalysisPayload): Promise<SubmitResult> {
		const res = await fetch(`${BASE}/api/v1/analysis/submit`, {
			method: "POST",
			headers: this.headers(),
			body: JSON.stringify(payload),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Submit failed (${res.status}): ${text}`);
		}
		return res.json();
	}

	async getContext(mint: string): Promise<string> {
		const res = await fetch(
			`${BASE}/api/v1/chat/context?mint=${mint}`,
			{ headers: this.headers() },
		);
		if (!res.ok) throw new Error(`Context fetch failed: ${res.status}`);
		const data = await res.json();
		return data.context ?? "";
	}
}
