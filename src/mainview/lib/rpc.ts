/* ------------------------------------------------------------------ */
/*  RPC bridge: Webview <-> Bun main process via postMessage             */
/* ------------------------------------------------------------------ */

type Handler = (payload: unknown) => void;
const handlers = new Map<string, Set<Handler>>();
let msgId = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

window.addEventListener("message", (event) => {
	try {
		const msg = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
		const { type, payload, id } = msg;

		if (id !== undefined && pending.has(id)) {
			const p = pending.get(id)!;
			pending.delete(id);
			type === "error" ? p.reject(new Error(payload?.message ?? "Error")) : p.resolve(payload);
			return;
		}

		handlers.get(type)?.forEach((h) => h(payload));
	} catch {}
});

export function request<T = unknown>(type: string, payload: unknown = {}): Promise<T> {
	return new Promise((resolve, reject) => {
		const id = ++msgId;
		pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
		setTimeout(() => {
			if (pending.has(id)) { pending.delete(id); reject(new Error(`${type} timed out`)); }
		}, 30_000);
		window.postMessage(JSON.stringify({ type, payload, id }), "*");
	});
}

export function send(type: string, payload: unknown = {}): void {
	window.postMessage(JSON.stringify({ type, payload }), "*");
}

export function on(type: string, handler: Handler): () => void {
	if (!handlers.has(type)) handlers.set(type, new Set());
	handlers.get(type)!.add(handler);
	return () => { handlers.get(type)?.delete(handler); };
}
