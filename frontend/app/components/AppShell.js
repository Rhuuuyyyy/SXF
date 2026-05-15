"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, clearAuth, getSessaoId } from "../lib/auth";
import { api } from "../lib/apiClient";
import Icons from "./Icons";
import ThemeToggle from "./ThemeToggle";

const pageMeta = {
  dashboard: { title: "Visão geral",   subtitle: "CITO · pré-diagnóstico SXF" },
  agenda:    { title: "Agenda",        subtitle: "Suas consultas e janelas livres" },
  triagem:   { title: "Nova triagem",  subtitle: "Checklist da Síndrome do X Frágil" },
  pacientes: { title: "Pacientes",     subtitle: "Prontuários ativos e histórico clínico" },
  config:    { title: "Configurações", subtitle: "Preferências do módulo clínico" },
};

const NAV_SECTIONS = [
  {
    label: "Painel",
    items: [
      { id: "dashboard",   icon: "grid",     label: "Visão geral",  accent: false },
      { id: "agenda",      icon: "calendar", label: "Agenda",       accent: false },
      { id: "triagem",     icon: "cat",      label: "Nova triagem", accent: true  },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { id: "pacientes",    icon: "users",  label: "Pacientes",     accent: false },
      { id: "atendimentos", icon: "heart",  label: "Atendimentos",  accent: false },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "config",     icon: "settings", label: "Configurações", accent: false },
      { id: "relatorios", icon: "file",     label: "Relatórios",    accent: false },
    ],
  },
];

function getNavRoute(id) {
  if (id === "triagem")     return "/triagem";
  if (id === "atendimentos") return "/pacientes";
  if (id === "relatorios")  return "/config";
  return "/" + id;
}

export default function AppShell({ children, pageId }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  async function handleLogout() {
    const sessaoId = getSessaoId();
    try {
      if (sessaoId !== null) await api.logout(sessaoId);
    } catch (_) {
      // proceed regardless
    } finally {
      clearAuth();
      router.push("/");
    }
  }

  const meta = pageMeta[pageId] || { title: "CITO", subtitle: "" };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--paper)", color: "var(--ink)" }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-40 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{
          width: "252px",
          background: "var(--surface-2)",
          borderRight: "1px solid var(--hair-soft)",
        }}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-5" style={{ borderBottom: "1px solid var(--hair-soft)" }}>
          <div
            className="font-display text-[32px] leading-none"
            style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}
          >
            cito
          </div>
          <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
            · pré-diagnóstico SXF
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em] px-3 mb-1.5"
                style={{ color: "var(--subtle)" }}
              >
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive = item.id === pageId;
                const route = getNavRoute(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(route);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13.5px] mb-0.5 relative lift text-left"
                    style={{
                      background: isActive ? "var(--ink)" : "transparent",
                      color: isActive ? "var(--on-ink)" : "var(--ink-2)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "var(--hover-tint)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      className="flex-shrink-0"
                      style={{ color: isActive ? "var(--on-ink-55)" : "var(--muted)" }}
                    >
                      {Icons[item.icon]}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {/* Accent dot for "Nova triagem" when not active */}
                    {item.accent && !isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--ink)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="px-3 pb-4">
          <div
            className="rounded-2xl p-3.5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--hair)",
            }}
          >
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
                style={{ background: "var(--ink)", color: "var(--on-ink)" }}
              >
                DR
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
                  Dr. Médico
                </div>
                <div className="text-[11px] truncate" style={{ color: "var(--muted)" }}>
                  Clínico Geral
                </div>
              </div>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full mt-3 py-2 rounded-xl text-[12px] lift flex items-center justify-center gap-1.5"
              style={{
                color: "var(--muted)",
                border: "1px solid var(--hair-soft)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--rust)";
                e.currentTarget.style.borderColor = "var(--rust-soft)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.borderColor = "var(--hair-soft)";
              }}
            >
              {Icons.logout}
              Sair do sistema
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:ml-[252px]">

        {/* TOPBAR */}
        <header
          className="sticky top-0 z-20 h-[68px] flex items-center justify-between px-5 lg:px-8"
          style={{
            background: "var(--topbar-bg)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid var(--hair-soft)",
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              className="lg:hidden flex flex-col gap-1.5 p-1.5"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <span className="w-5 h-[1.5px] block rounded" style={{ background: "var(--ink)" }} />
              <span className="w-5 h-[1.5px] block rounded" style={{ background: "var(--ink)" }} />
              <span className="w-4 h-[1.5px] block rounded" style={{ background: "var(--ink)" }} />
            </button>

            <div>
              <div
                className="font-display text-[26px] leading-none"
                style={{ color: "var(--ink)" }}
              >
                {meta.title}
              </div>
              <div className="text-[12px] mt-1" style={{ color: "var(--muted)" }}>
                {meta.subtitle}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Bell */}
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center lift relative"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--hair)",
                color: "var(--ink)",
              }}
            >
              {Icons.bell}
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ background: "var(--ink)", border: "2px solid var(--paper)" }}
              />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
