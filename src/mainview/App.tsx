import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { TokenBrowser } from "./components/TokenBrowser";
import { AnalysisWizard } from "./components/AnalysisWizard";
import { Leaderboard } from "./components/Leaderboard";
import { Settings } from "./components/Settings";
import { AutoTrainer } from "./components/AutoTrainer";
import { request, on } from "./lib/rpc";
import type { AgentConfig } from "../shared/types";

export type View = "browse" | "analyze" | "auto" | "leaderboard" | "settings";

export default function App() {
	const [view, setView] = useState<View>("browse");
	const [selectedMint, setSelectedMint] = useState<string | null>(null);
	const [config, setConfig] = useState<AgentConfig | null>(null);
	const [xpTotal, setXpTotal] = useState(0);

	useEffect(() => {
		request<{ config: AgentConfig }>("loadConfig").then((r) => setConfig(r.config)).catch(() => {});
		const unsub = on("configResult", (p: unknown) => setConfig((p as { config: AgentConfig }).config));
		return unsub;
	}, []);

	const handleSelect = (mint: string) => {
		setSelectedMint(mint);
		setView("analyze");
	};

	const handleXp = (xp: number) => setXpTotal((p) => p + xp);

	return (
		<div className="h-screen flex mesh-bg overflow-hidden">
			<Sidebar
				view={view}
				onNavigate={setView}
				xpTotal={xpTotal}
				connected={!!config?.apiKey}
			/>

			<main className="flex-1 overflow-hidden animate-fade-in">
				{view === "browse" && <TokenBrowser onSelect={handleSelect} />}
				{view === "analyze" && (
					<AnalysisWizard
						mint={selectedMint}
						onBack={() => setView("browse")}
						onXpEarned={handleXp}
						orchestrator={config?.orchestrator ?? "manual"}
					/>
				)}
				{view === "auto" && <AutoTrainer config={config} onXpEarned={handleXp} />}
				{view === "leaderboard" && <Leaderboard />}
				{view === "settings" && <Settings config={config} onSave={setConfig} />}
			</main>
		</div>
	);
}
