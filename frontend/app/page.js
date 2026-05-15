"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./lib/apiClient";
import { saveAuth } from "./lib/auth";
import ThemeToggle from "./components/ThemeToggle";
import { BtnPrimary, Field, inputCls, inputStyle } from "./components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      saveAuth(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative"
      style={{ background: "var(--paper)" }}
    >
      {/* Theme toggle — top right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="font-display text-[40px] leading-none"
          style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}
        >
          cito
        </div>
        <div
          className="text-[12px] uppercase tracking-[0.18em] mt-2"
          style={{ color: "var(--muted)" }}
        >
          Síndrome do X Frágil
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl card-shadow p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--hair-soft)",
        }}
      >
        <h1
          className="font-display text-[28px] mb-6"
          style={{ color: "var(--ink)" }}
        >
          Entrar na plataforma
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="E-mail" required>
            <input
              type="email"
              className={inputCls}
              style={inputStyle}
              placeholder="dr.nome@hospital.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field label="Senha" required>
            <input
              type="password"
              className={inputCls}
              style={inputStyle}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-[13px]"
              style={{ background: "var(--rust-soft)", color: "var(--rust)" }}
            >
              {error}
            </div>
          )}

          <BtnPrimary
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verificando…
              </>
            ) : (
              "Entrar"
            )}
          </BtnPrimary>
        </form>

        <p className="text-[11px] text-center mt-4" style={{ color: "var(--subtle)" }}>
          LGPD · Lei nº 13.709/2018 · Dados protegidos
        </p>
      </div>
    </div>
  );
}
