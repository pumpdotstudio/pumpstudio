export function formatUsd(n: number): string {
	if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
	if (n >= 1) return `$${n.toFixed(2)}`;
	if (n >= 0.01) return `$${n.toFixed(4)}`;
	return `$${n.toFixed(6)}`;
}

export function formatCompact(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return n.toFixed(0);
}

export function formatPct(n: number): string {
	return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function truncate(s: string, len: number): string {
	return s.length > len ? s.slice(0, len - 1) + "\u2026" : s;
}
