const TOKEN_KEY = "sxf_token";
const SESSAO_KEY = "sxf_sessao_id";
// Cookie name used only by middleware for server-side route protection.
// It holds a presence flag (not the token) so it can be non-HttpOnly.
const AUTH_COOKIE = "sxf_auth";

export function saveAuth({ access_token, sessao_id }) {
  sessionStorage.setItem(TOKEN_KEY, access_token);
  sessionStorage.setItem(SESSAO_KEY, String(sessao_id));
  document.cookie = `${AUTH_COOKIE}=1; path=/; SameSite=Strict`;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getSessaoId() {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(SESSAO_KEY);
  return v !== null ? parseInt(v, 10) : null;
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSAO_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}
