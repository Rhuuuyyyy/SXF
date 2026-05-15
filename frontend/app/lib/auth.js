const TOKEN_KEY = "sxf_token";
const SESSAO_KEY = "sxf_sessao_id";

export function saveAuth({ access_token, sessao_id }) {
  sessionStorage.setItem(TOKEN_KEY, access_token);
  sessionStorage.setItem(SESSAO_KEY, String(sessao_id));
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
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return Boolean(sessionStorage.getItem(TOKEN_KEY));
}
