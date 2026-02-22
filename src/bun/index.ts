import Electrobun, { BrowserWindow, ApplicationMenu, Utils } from "electrobun/bun";
import { PumpStudioApi } from "./api";
import { Orchestrator } from "./orchestrator";
import { ConfigStore } from "./config";
import { buildSnapshot } from "./defaults";

/* ------------------------------------------------------------------ */
/*  Native macOS menus                                                  */
/* ------------------------------------------------------------------ */

ApplicationMenu.setApplicationMenu([
	{
		label: "Pump.studio",
		submenu: [
			{ role: "about", label: "About Pump.studio" },
			{ type: "separator" },
			{ role: "hide", label: "Hide Pump.studio", accelerator: "Command+H" },
			{ role: "hideOthers", label: "Hide Others", accelerator: "Command+Option+H" },
			{ role: "showAll", label: "Show All" },
			{ type: "separator" },
			{ role: "quit", label: "Quit Pump.studio", accelerator: "Command+Q" },
		],
	},
	{
		label: "Edit",
		submenu: [
			{ role: "undo", label: "Undo", accelerator: "Command+Z" },
			{ role: "redo", label: "Redo", accelerator: "Command+Shift+Z" },
			{ type: "separator" },
			{ role: "cut", label: "Cut", accelerator: "Command+X" },
			{ role: "copy", label: "Copy", accelerator: "Command+C" },
			{ role: "paste", label: "Paste", accelerator: "Command+V" },
			{ role: "selectAll", label: "Select All", accelerator: "Command+A" },
		],
	},
	{
		label: "View",
		submenu: [
			{ label: "Reload", accelerator: "Command+R", action: "view:reload" },
			{ label: "Hard Reload", accelerator: "Command+Shift+R", action: "view:hard-reload" },
			{ type: "separator" },
			{ label: "Market", accelerator: "Command+1", action: "nav:market" },
			{ label: "Livestreams", accelerator: "Command+2", action: "nav:streams" },
			{ label: "Leaderboard", accelerator: "Command+3", action: "nav:leaderboard" },
			{ label: "DataPoint", accelerator: "Command+4", action: "nav:datapoint" },
			{ type: "separator" },
			{ label: "Toggle Full Screen", role: "toggleFullScreen", accelerator: "Command+Control+F" },
		],
	},
	{
		label: "Go",
		submenu: [
			{ label: "Back", accelerator: "Command+[", action: "nav:back" },
			{ label: "Forward", accelerator: "Command+]", action: "nav:forward" },
			{ type: "separator" },
			{ label: "Home", accelerator: "Command+Shift+H", action: "nav:home" },
		],
	},
	{
		label: "Window",
		submenu: [
			{ role: "minimize", label: "Minimize", accelerator: "Command+M" },
			{ role: "zoom", label: "Zoom" },
			{ type: "separator" },
			{ role: "bringAllToFront", label: "Bring All to Front" },
		],
	},
	{
		label: "Help",
		submenu: [
			{ label: "Pump.studio Docs", action: "help:docs" },
			{ label: "Report Issue", action: "help:report" },
			{ type: "separator" },
			{ label: "Twitter @pumpdotstudio", action: "help:twitter" },
		],
	},
]);

/* ------------------------------------------------------------------ */
/*  Bootstrap                                                           */
/* ------------------------------------------------------------------ */

const BASE_URL = "https://pump.studio";

const win = new BrowserWindow({
	title: "Pump.studio",
	url: `${BASE_URL}/market`,
	frame: { width: 1280, height: 860, x: 100, y: 100 },
	titleBarStyle: "hiddenInset",
});

console.log(`[app] Loading: ${BASE_URL}/market`);

/* ------------------------------------------------------------------ */
/*  CSS injection — persistent across navigations                       */
/* ------------------------------------------------------------------ */

const INJECTED_CSS = `
	html { background: #0a0a0a; overflow: hidden !important; }
	body { margin-top: 28px !important; height: calc(100dvh - 28px) !important; overflow: hidden !important; }
	body > div:first-child { height: 100% !important; max-height: 100% !important; }
	/* Sidebar must respect the reduced viewport */
	aside { height: 100% !important; max-height: 100% !important; }
`;

function injectCSS() {
	try {
		win.webview.executeJavascript(`
			if (!document.getElementById('__ps_desktop')) {
				const s = document.createElement('style');
				s.id = '__ps_desktop';
				s.textContent = ${JSON.stringify(INJECTED_CSS)};
				document.head.appendChild(s);
			}
		`);
	} catch {}
}

/* Re-inject on every navigation */
setInterval(injectCSS, 1000);
setTimeout(injectCSS, 500);

/* ------------------------------------------------------------------ */
/*  Menu action handlers                                                */
/* ------------------------------------------------------------------ */

Electrobun.events.on("application-menu-clicked", (event: { data: { action: string } }) => {
	const { action } = event.data;

	switch (action) {
		case "view:reload":
			win.webview.executeJavascript("location.reload()");
			break;
		case "view:hard-reload":
			win.webview.executeJavascript("location.reload(true)");
			break;
		case "nav:market":
			win.webview.executeJavascript(`location.href='${BASE_URL}/market'`);
			break;
		case "nav:streams":
			win.webview.executeJavascript(`location.href='${BASE_URL}/streams'`);
			break;
		case "nav:leaderboard":
			win.webview.executeJavascript(`location.href='${BASE_URL}/leaderboard'`);
			break;
		case "nav:datapoint":
			win.webview.executeJavascript(`location.href='${BASE_URL}/datapoint'`);
			break;
		case "nav:back":
			win.webview.executeJavascript("history.back()");
			break;
		case "nav:forward":
			win.webview.executeJavascript("history.forward()");
			break;
		case "nav:home":
			win.webview.executeJavascript(`location.href='${BASE_URL}/market'`);
			break;
		case "help:docs":
			win.webview.executeJavascript(`window.open('https://pump.studio/docs','_blank')`);
			break;
		case "help:report":
			win.webview.executeJavascript(`window.open('https://github.com/pumpdotstudio/app/issues','_blank')`);
			break;
		case "help:twitter":
			win.webview.executeJavascript(`window.open('https://x.com/pumpdotstudio','_blank')`);
			break;
	}
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

console.log("[app] Pump.studio started");
