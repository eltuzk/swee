/**
 * Backend fetch helper (unused while the site is fully static).
 *
 * - Reads `PUBLIC_API_URL` from env (see `.env.example`). Empty = no backend yet.
 * - Defaults to `credentials: "include"` so session cookies are sent.
 * - Never throws: returns `{ ok: false }` when the API is not configured, on network errors,
 *   timeouts or HTTP errors. Islands that call the API should hide themselves when `ok === false`,
 *   while the lesson content stays readable.
 */

export type ApiResult<T> =
	{ ok: true; data: T; status: number } | { ok: false; error: string; status?: number };

const DEFAULT_TIMEOUT_MS = 8000;

export function getApiBaseUrl(): string | null {
	const url = import.meta.env.PUBLIC_API_URL as string | undefined;
	return url && url.trim() ? url.trim().replace(/\/+$/, '') : null;
}

export function isApiConfigured(): boolean {
	return getApiBaseUrl() !== null;
}

export async function apiFetch<T = unknown>(
	path: string,
	init: RequestInit & { timeoutMs?: number } = {},
): Promise<ApiResult<T>> {
	const base = getApiBaseUrl();
	if (!base) return { ok: false, error: 'api-not-configured' };

	const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
			credentials: 'include',
			...rest,
			headers: { Accept: 'application/json', ...headers },
			signal: init.signal ?? controller.signal,
		});

		if (!res.ok) return { ok: false, error: `http-${res.status}`, status: res.status };
		if (res.status === 204) return { ok: true, data: undefined as T, status: res.status };

		const isJson = res.headers.get('content-type')?.includes('application/json');
		const data = (isJson ? await res.json() : await res.text()) as T;
		return { ok: true, data, status: res.status };
	} catch (err) {
		const aborted = err instanceof DOMException && err.name === 'AbortError';
		return { ok: false, error: aborted ? 'timeout' : 'network-error' };
	} finally {
		clearTimeout(timer);
	}
}
