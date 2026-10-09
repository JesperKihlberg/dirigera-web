import { useAuthStore } from "@/features/auth";

/**
 * Calls the admin REST API (`/api/admin/*`), attaching the same JWT used by
 * the GraphQL client. Throws on non-ok responses. Leaves `Content-Type`
 * unset when the caller doesn't provide one, so `FormData` bodies (file
 * uploads) get the correct multipart boundary set by the browser.
 */
export async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token;

  const response = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      "x-token": token ?? "",
    },
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Admin API request failed (${response.status}): ${message || response.statusText}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
