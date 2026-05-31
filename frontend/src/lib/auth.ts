export const AUTH_TOKEN_KEYS = ["token", "access_token"] as const;

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getAuthToken() {
  if (!isBrowser()) return null;

  for (const key of AUTH_TOKEN_KEYS) {
    const token = window.localStorage.getItem(key);
    if (token) return token;
  }

  return null;
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  if (!isBrowser()) return false;

  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  if (typeof exp !== "number") return false;

  return Date.now() >= exp * 1000;
}

export function hasValidAuthToken() {
  const token = getAuthToken();

  if (!token) return false;

  if (isTokenExpired(token)) {
    clearAuthSession();
    return false;
  }

  return true;
}

export type CurrentUser = {
  username?: string | null;
  role?: string | null;
  is_superuser?: boolean | null;
};

export function getAuthPayload() {
  const token = getAuthToken();
  return token ? decodeJwtPayload(token) : null;
}

export function getUsernameFromAuthToken() {
  const payload = getAuthPayload();
  return typeof payload?.sub === "string" ? payload.sub : "";
}

export function isSuperAdminUser(user: CurrentUser | null | undefined) {
  const role = String(user?.role || "").trim().toLowerCase();
  const username = String(user?.username || "").trim().toLowerCase();

  return Boolean(user?.is_superuser || role === "admin" || username === "admin");
}

export async function fetchCurrentUser(apiBaseUrl: string): Promise<CurrentUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  const response = await fetch(`${apiBaseUrl}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;
  return response.json();
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  for (const key of AUTH_TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }

  window.localStorage.removeItem("activeClient");
  window.localStorage.removeItem("activeClientId");
}

export function redirectToLogin() {
  if (!isBrowser()) return;

  clearAuthSession();
  window.location.replace("/login");
}
