import { useState, useEffect } from "react";
import { request } from "../lib/rpc";
import { formatUsd } from "../lib/format";
import type { MarketToken } from "../../shared/types";

interface Props {
	onSelect: (mint: string) => void;
}

const TABS = ["all", "live", "new", "graduated"] as const;

export function TokenBrowser({ onSelect }: Props) {
	const [tokens, setTokens] = useState<MarketToken[]>([]);
	const [tab, setTab] = useState("all");
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	useEffect(() => { load(); }, [tab]);

	async function load() {
		setLoading(true);
		try {
			const r = await request<{ tokens: MarketToken[] }>("getMarket", { tab, limit: 50 });
			setTokens(r.tokens);
		} catch {} finally { setLoading(false); }
	}

	const filtered = search
		? tokens.filter((t) =>
				t.name.toLowerCase().includes(search.toLowerCase()) ||
				t.symbol.toLowerCase().includes(search.toLowerCase()) ||
				t.mint.toLowerCase().includes(search.toLowerCase()),
			)
		: tokens;

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="px-6 pt-6 pb-4">
				<h1 className="text-lg font-semibold text-white/90 mb-1">Tokens</h1>
				<p className="text-[13px] text-white/30">Select a token to analyze and earn XP</p>
			</div>

			{/* Toolbar */}
			<div className="flex items-center gap-3 px-6 pb-4">
				<div className="flex gap-0.5 glass-panel rounded-lg p-0.5">
					{TABS.map((t) => (
						<button
							key={t}
							onClick={() => setTab(t)}
							className={`px-3 py-1.5 text-xs rounded-md capitalize transition-all ${
								tab === t
									? "bg-white/[0.07] text-white/80 shadow-sm"
									: "text-white/30 hover:text-white/50"
							}`}
						>
							{t}
						</button>
					))}
				</div>

				<div className="flex-1" />

				<input
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search..."
					className="glass-input text-xs px-3 py-2 rounded-lg w-56"
				/>

				<button
					onClick={load}
					className="btn-ghost text-xs px-3 py-2 rounded-lg"
				>
					Refresh
				</button>
			</div>

			{/* Table */}
			<div className="flex-1 overflow-y-auto px-4">
				{loading ? (
					<div className="space-y-2 px-2 pt-2">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="shimmer h-12 rounded-lg" />
						))}
					</div>
				) : (
					<div className="space-y-0.5">
						{filtered.map((token, i) => (
							<button
								key={token.mint}
								onClick={() => onSelect(token.mint)}
								className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
									glass-panel-hover transition-all duration-200
									hover:shadow-[0_2px_12px_rgba(0,0,0,0.3)] group animate-fade-in"
								style={{ animationDelay: `${i * 20}ms` }}
							>
								<span className="text-[11px] text-white/15 w-5 tabular-nums">
									{i + 1}
								</span>

								{token.image_uri ? (
									<img src={token.image_uri} alt="" className="w-8 h-8 rounded-full ring-1 ring-white/[0.06]" />
								) : (
									<div className="w-8 h-8 rounded-full bg-white/[0.04] ring-1 ring-white/[0.06]" />
								)}

								<div className="flex-1 text-left min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-[13px] font-medium text-white/80">
											{token.symbol}
										</span>
										{token.is_currently_live && (
											<span className="px-1.5 py-0.5 text-[9px] font-medium bg-red-500/15 text-red-400 rounded-full uppercase tracking-wider">
												Live
											</span>
										)}
										{token.complete === false && (
											<span className="px-1.5 py-0.5 text-[9px] font-medium bg-yellow-500/10 text-yellow-500/60 rounded-full uppercase tracking-wider">
												Curve
											</span>
										)}
									</div>
									<div className="text-[11px] text-white/25 truncate">
										{token.name}
									</div>
								</div>

								<div className="text-right">
									<div className="text-[13px] text-white/50 tabular-nums font-mono">
										{token.usd_market_cap ? formatUsd(token.usd_market_cap) : "—"}
									</div>
									<div className="text-[11px] text-white/20 tabular-nums font-mono">
										{token.priceUsd ? formatUsd(token.priceUsd) : ""}
									</div>
								</div>

								<span className="text-[10px] text-[#22c55e]/0 group-hover:text-[#22c55e]/80 transition-all font-medium uppercase tracking-wider">
									Analyze
								</span>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
