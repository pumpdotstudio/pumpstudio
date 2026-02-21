import { BrowserWindow, Updater, Utils } from "electrobun/bun";
import { PumpStudioApi } from "./api";
import { Orchestrator } from "./orchestrator";
import { ConfigStore } from "./config";
import { buildSnapshot } from "./defaults";

/* ------------------------------------------------------------------ */
/*  Bootstrap                                                           */
/* ------------------------------------------------------------------ */

const DEV_PORT = 5173;

async function resolveUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(`http://localhost:${DEV_PORT}`, { method: "HEAD" });
			console.log(`[trainer] HMR: http://localhost:${DEV_PORT}`);
			return `http://localhost:${DEV_PORT}`;
		} catch {}
	}
	return "views://mainview/index.html";
}

const url = await resolveUrl();

const win = new BrowserWindow({
	title: "Pump Studio Trainer",
	url,
	frame: { width: 1280, height: 860, x: 100, y: 100 },
	titleBarStyle: "hiddenInset",
	transparent: false,
});

/* ------------------------------------------------------------------ */
/*  Services                                                            */
/* ------------------------------------------------------------------ */

const config = new ConfigStore();
const api = new PumpStudioApi(() => config.get().apiKey);
const orchestrator = new Orchestrator(() => config.get());
let autoActive = false;

/* ------------------------------------------------------------------ */
/*  IPC handler                                                         */
/* ------------------------------------------------------------------ */

win.on("message", async (event: { data: string }) => {
	try {
		const { type, payload, id } = JSON.parse(event.data);
		const reply = (t: string, d: unknown) =>
			win.postMessage(JSON.stringify({ type: t, payload: d, id }));

		switch (type) {
			case "getMarket": {
				const tokens = await api.getMarket(payload.tab, payload.limit);
				reply("marketResult", { tokens });
				break;
			}
			case "getDataPoint": {
				const dataPoint = await api.getDataPoint(payload.mint);
				reply("dataPointResult", { dataPoint });
				break;
			}
			case "getAnalysisStats": {
				const stats = await api.getAnalysisStats(payload.limit);
				reply("statsResult", { stats });
				break;
			}
			case "submitAnalysis": {
				const result = await api.submitAnalysis(payload.payload);
				reply("submitResult", { result });
				break;
			}
			case "orchestrateAnalysis": {
				const result = await orchestrator.analyze(payload.dataPoint);
				reply("orchestratorResult", { result });
				break;
			}
			case "saveConfig": {
				config.save(payload.config);
				reply("configResult", { config: config.get() });
				break;
			}
			case "loadConfig": {
				reply("configResult", { config: config.get() });
				break;
			}
			case "startAutoTraining": {
				autoActive = true;
				runAutoTraining(payload.mints, reply);
				break;
			}
			case "stopAutoTraining": {
				autoActive = false;
				break;
			}
			default:
				reply("error", { message: `Unknown: ${type}` });
		}
	} catch (err) {
		win.postMessage(
			JSON.stringify({
				type: "error",
				payload: { message: err instanceof Error ? err.message : String(err) },
			}),
		);
	}
});

/* ------------------------------------------------------------------ */
/*  Auto-training loop                                                  */
/* ------------------------------------------------------------------ */

async function runAutoTraining(
	mints: string[],
	reply: (t: string, d: unknown) => void,
) {
	let totalXp = 0;
	let count = 0;

	for (const mint of mints) {
		if (!autoActive) break;
		try {
			reply("trainingProgress", { mint, step: "fetching" });
			const dp = await api.getDataPoint(mint);

			reply("trainingProgress", { mint, step: "analyzing" });
			const analysis = await orchestrator.analyze(dp);

			reply("trainingProgress", { mint, step: "submitting" });
			const result = await api.submitAnalysis({
				mint,
				sentiment: analysis.sentiment,
				score: analysis.score,
				summary: analysis.summary,
				snapshot: buildSnapshot(dp),
				quant: {
					riskLevel: analysis.riskLevel,
					riskFactors: analysis.riskFactors,
					buyPressure: analysis.buyPressure,
					volatilityScore: analysis.volatilityScore,
					liquidityDepth: analysis.liquidityDepth,
					holderConcentration: analysis.holderConcentration,
					trendDirection: analysis.trendDirection,
					volumeProfile: analysis.volumeProfile,
				},
			});

			if (result.xpEarned) totalXp += result.xpEarned;
			count++;
			reply("trainingProgress", { mint, step: "done", xpEarned: result.xpEarned });

			const delay = Math.max(config.get().analyzeInterval * 1000, 6000);
			await new Promise((r) => setTimeout(r, delay));
		} catch (err) {
			reply("trainingProgress", {
				mint,
				step: "error",
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	reply("trainingComplete", { totalXp, tokensAnalyzed: count });
	autoActive = false;
}

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                           */
/* ------------------------------------------------------------------ */

win.on("close", () => {
	autoActive = false;
	Utils.quit();
});

console.log("[trainer] Pump Studio Trainer started");
