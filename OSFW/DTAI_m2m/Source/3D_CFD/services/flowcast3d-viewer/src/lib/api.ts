let csrfToken = "";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
let sessionRequest: Promise<{ csrfToken: string }> | undefined;
export async function session(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
  if (!sessionRequest)
    sessionRequest = (async () => {
      const response = await fetch("/app-api/session", {
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new ApiError("Workspace session unavailable", response.status);
      const value = await response.json();
      if (typeof value.csrfToken !== "string" || !value.csrfToken)
        throw new ApiError(
          "Invalid workspace session response",
          response.status,
        );
      csrfToken = value.csrfToken;
      return value as { csrfToken: string };
    })().finally(() => {
      sessionRequest = undefined;
    });
  return sessionRequest;
}
export function csrf() {
  return csrfToken;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method ?? "GET";
  if (method !== "GET" && !csrfToken)
    await session(options.signal ?? undefined);
  const response = await fetch(`/app-api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(method === "GET" ? {} : { "X-CSRF-Token": csrfToken }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const value = await response.json().catch(() => ({}));
    throw new ApiError(
      typeof value.detail === "string"
        ? value.detail
        : (value.error ?? `Request failed (${response.status})`),
      response.status,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function post<T>(path: string, body: unknown, signal?: AbortSignal) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body), signal });
}
