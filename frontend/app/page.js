"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./lib/apiClient";
import { saveAuth } from "./lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email, password);
      saveAuth(data);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Credenciais inválidas. Verifique e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0c] flex">

      {/* ── PAINEL ESQUERDO — visual (apenas desktop) ── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-[#141413] border-r border-white/[0.07] px-14 py-12">

        {/* Logo */}
        <div>
          <span className="font-serif text-3xl text-[#edead4] tracking-tight">SXF</span>
          <span className="block text-[11px] text-[#edead4]/30 uppercase tracking-widest mt-1">
            Síndrome do X Frágil · Sistema Médico
          </span>
        </div>

        {/* Citação */}
        <div className="border-l-2 border-[#4a8de8]/30 pl-5 max-w-md">
          <p className="text-[#edead4]/65 text-xl leading-relaxed italic font-serif">
            "O diagnóstico precoce é a ferramenta mais poderosa que temos para mudar
            o curso da vida de uma criança com SXF."
          </p>
          <span className="block text-[12px] text-[#edead4]/30 mt-4 tracking-wide">
            — Projeto de Extensão · Brasil
          </span>
        </div>

        {/* Estatísticas */}
        <div className="flex gap-10">
          <div>
            <span className="block text-3xl font-semibold text-[#edead4] font-serif">300k+</span>
            <span className="block text-[11px] text-[#edead4]/30 uppercase tracking-wider mt-1">
              Afetados no Brasil
            </span>
          </div>
          <div>
            <span className="block text-3xl font-semibold text-[#edead4] font-serif">1:4.000</span>
            <span className="block text-[11px] text-[#edead4]/30 uppercase tracking-wider mt-1">
              Nascimentos masculinos
            </span>
          </div>
          <div>
            <span className="block text-3xl font-semibold text-[#edead4] font-serif">&lt;30%</span>
            <span className="block text-[11px] text-[#edead4]/30 uppercase tracking-wider mt-1">
              Diagnósticos confirmados
            </span>
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO — formulário ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[480px] lg:flex-shrink-0 px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="text-center mb-10 lg:hidden">
            <span className="font-serif text-3xl text-[#edead4]">SXF</span>
            <span className="block text-[11px] text-[#edead4]/30 uppercase tracking-widest mt-1">
              Sistema Médico · Acesso Restrito
            </span>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#4a8de8]/10 border border-[#4a8de8]/20 rounded-full px-3 py-1 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a8de8] animate-pulse" />
            <span className="text-[11px] text-[#4a8de8] uppercase tracking-widest font-medium">
              Acesso restrito · Médicos
            </span>
          </div>

          <h1 className="text-[#edead4] text-2xl font-serif mb-1">
            Bem-vindo de volta
          </h1>
          <p className="text-[#edead4]/45 text-sm mb-7 leading-relaxed">
            Insira suas credenciais para acessar o painel de triagem.
          </p>

          {/* Erro */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3 mb-5">
              <p className="text-red-400 text-[13px]">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* E-mail */}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#edead4]/50 uppercase tracking-wider mb-2">
                E-mail profissional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.nome@hospital.com"
                autoComplete="email"
                className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-3 text-[#edead4] text-sm placeholder-[#edead4]/20 outline-none transition-all focus:border-[#4a8de8]/50 focus:bg-white/[0.06]"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-[11.5px] font-semibold text-[#edead4]/50 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-4 py-3 pr-16 text-[#edead4] text-sm placeholder-[#edead4]/20 outline-none transition-all focus:border-[#4a8de8]/50 focus:bg-white/[0.06]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#edead4]/35 uppercase tracking-wider hover:text-[#edead4]/70 transition-colors"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {/* Esqueceu a senha */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-[12px] text-[#edead4]/35 hover:text-[#edead4]/65 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão de login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4a8de8] hover:bg-[#3a7dd8] active:scale-[0.98] text-white font-medium text-sm rounded-lg py-3.5 transition-all relative overflow-hidden disabled:pointer-events-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Verificando...
                </span>
              ) : (
                "Entrar no sistema"
              )}
            </button>

          </form>

          {/* Rodapé */}
          <p className="text-center text-[12px] text-[#edead4]/25 mt-8 leading-relaxed">
            Acesso exclusivo para profissionais credenciados.{" "}
            <button className="text-[#edead4]/40 hover:text-[#edead4]/65 transition-colors underline">
              Entre em contato
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}