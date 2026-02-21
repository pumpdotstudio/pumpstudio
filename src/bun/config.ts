import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AgentConfig } from "../shared/types";

/* ------------------------------------------------------------------ */
/*  Persistent JSON config — ~/.pump-studio/trainer.json                */
/* ------------------------------------------------------------------ */

const CONFIG_DIR = join(homedir(), ".pump-studio");
const CONFIG_FILE = join(CONFIG_DIR, "trainer.json");

const DEFAULT_CONFIG: AgentConfig = {
	apiKey: process.env.PUMP_STUDIO_API_KEY ?? "",
	orchestrator: "manual",
	claudeApiKey: process.env.ANTHROPIC_API_KEY ?? "",
	codexApiKey: process.env.OPENAI_API_KEY ?? "",
	autoAnalyze: false,
	analyzeInterval: 10,
};

export class ConfigStore {
	private config: AgentConfig;

	constructor() {
		this.config = this.load();
	}

	get(): AgentConfig {
		return { ...this.config };
	}

	save(partial: Partial<AgentConfig>): void {
		this.config = { ...this.config, ...partial };
		try {
			if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
			writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
		} catch (err) {
			console.error("[config] save failed:", err);
		}
	}

	private load(): AgentConfig {
		try {
			if (existsSync(CONFIG_FILE)) {
				const raw = readFileSync(CONFIG_FILE, "utf-8");
				return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
			}
		} catch (err) {
			console.error("[config] load failed:", err);
		}
		return { ...DEFAULT_CONFIG };
	}
}
