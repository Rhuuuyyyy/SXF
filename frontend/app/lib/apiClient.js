"use client";

const BASE_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    : "http://localhost:8000";

async function request(path, options = {}) {
  const token =
    typeof window !== "undefined"
      ? sessionStorage.getItem("sxf_token")
      : null;

  const isForm = options.body instanceof URLSearchParams;

  const headers = {
    ...(isForm
      ? { "Content-Type": "application/x-www-form-urlencoded" }
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.title ?? detail;
    } catch {
      // ignore JSON parse failures on error responses
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Login uses OAuth2PasswordRequestForm (application/x-www-form-urlencoded).
// The `username` field is the email address — this is the OAuth2 standard.
export const api = {
  login: (username, password) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: new URLSearchParams({ username, password }),
    }),

  logout: (sessaoId) =>
    request(`/api/v1/auth/logout?sessao_id=${sessaoId}`, { method: "POST" }),

  createPatient: (data) =>
    request("/api/v1/pacientes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listPatients: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      )
    ).toString();
    return request(`/api/v1/pacientes${qs ? `?${qs}` : ""}`);
  },

  submitAnamnesis: (data) =>
    request("/api/v1/avaliacoes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPatientHistory: (pacienteId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(
      `/api/v1/pacientes/${pacienteId}/historico${qs ? `?${qs}` : ""}`
    );
  },

  getDashboardStats: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      )
    ).toString();
    return request(`/api/v1/dashboard/stats${qs ? `?${qs}` : ""}`);
  },
};
