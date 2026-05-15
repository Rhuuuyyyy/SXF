"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/apiClient";
import { isAuthenticated, getSessaoId, clearAuth } from "../lib/auth";

// ── ÍCONES SVG inline ──────────────────────────────────────────────────────
const Icon = {
  grid: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  users: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20.9 10.5H19M5 10.5H3.1M17.66 17.66l1.41 1.41M6.34 6.34L4.93 4.93M12 19v2M12 3v2"/>
    </svg>
  ),
  bell: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  msg: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  plus: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  chevronDown: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  check: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  file: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  back: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  logout: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

// ── PILL de status ─────────────────────────────────────────────────────────
const pillStyles = {
  blue:   "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  green:  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  red:    "bg-red-500/10 text-red-400 border border-red-500/20",
  yellow: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  gray:   "bg-white/5 text-zinc-500 border border-white/10",
};

function Pill({ color = "gray", children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${pillStyles[color]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

// ── MODAL ──────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#141413] border border-white/10 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-[fadeUp_0.18s_ease]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <span className="text-[#edead4] font-semibold text-sm">{title}</span>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.07] text-zinc-500 hover:text-[#edead4] hover:bg-white/5 transition-all">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-white/[0.07] flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

// ── FORM FIELD ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-[#edead4] text-sm placeholder-zinc-600 outline-none focus:border-blue-500/50 transition-colors";
const selectCls = inputCls + " appearance-none";

// ── BOTÕES ─────────────────────────────────────────────────────────────────
function BtnPrimary({ children, onClick, type = "button", className = "" }) {
  return (
    <button type={type} onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium rounded-lg transition-colors ${className}`}>
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick, className = "" }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 bg-transparent border border-white/10 hover:bg-white/5 text-[#edead4] text-[13px] font-medium rounded-lg transition-colors ${className}`}>
      {children}
    </button>
  );
}

// ── EMPTY STATE ────────────────────────────────────────────────────────────
function EmptyState({ message = "Nenhum registro encontrado." }) {
  return (
    <div className="text-center py-14 text-zinc-600">
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── STAT CARD ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  const accents = {
    blue:  "text-blue-400",
    green: "text-emerald-400",
    red:   "text-red-400",
    default: "text-[#edead4]",
  };
  return (
    <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-5">
      <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wide mb-2">{label}</div>
      <div className={`text-3xl font-semibold leading-none ${accents[accent] || accents.default}`}>{value}</div>
      <div className="text-[11.5px] text-zinc-600 mt-1.5">{sub}</div>
    </div>
  );
}

// ── BARCHART placeholder ───────────────────────────────────────────────────
function BarChart({ labels }) {
  return (
    <div className="flex items-end gap-1.5 h-36 relative">
      <div className="absolute bottom-6 left-0 right-0 h-px bg-white/[0.06]" />
      {labels.map((l) => (
        <div key={l} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
          <div className="w-full rounded-t border border-dashed border-blue-500/20 bg-blue-500/5" style={{ height: "8%" }} />
          <span className="text-[10px] text-zinc-600">{l}</span>
        </div>
      ))}
      <p className="absolute top-0 left-0 text-[11px] text-zinc-600">Sem dados.</p>
    </div>
  );
}

// ── CONFIG CARD ────────────────────────────────────────────────────────────
function ConfigCard({ icon, iconColor, title, desc, onClick }) {
  const colors = {
    blue:   "bg-blue-500/10 text-blue-400",
    green:  "bg-emerald-500/10 text-emerald-400",
    yellow: "bg-amber-500/10 text-amber-400",
    red:    "bg-red-500/10 text-red-400",
  };
  return (
    <div onClick={onClick}
      className="bg-[#141413] border border-white/[0.07] rounded-xl p-6 cursor-pointer hover:border-white/15 hover:bg-[#1c1c1a] hover:-translate-y-0.5 transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[iconColor]}`}>{icon}</div>
      <div className="text-[#edead4] text-sm font-semibold mb-1">{title}</div>
      <div className="text-zinc-500 text-[12px] leading-relaxed">{desc}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const [page, setPage] = useState("dashboard");
  const [modalAgendar, setModalAgendar] = useState(false);
  const [modalPaciente, setModalPaciente] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // API data state
  const [patients, setPatients]               = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [summary, setSummary]                 = useState(null);

  // Auth guard — redirect to login if no token
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  // Load patient list when the Pacientes section is activated
  useEffect(() => {
    if (page !== "pacientes") return;
    setPatientsLoading(true);
    api.listPatients({ limit: 50 })
      .then((res) => {
        setPatients(res?.items ?? []);
        setTotalPatients(res?.total ?? 0);
      })
      .catch(() => {
        setPatients([]);
      })
      .finally(() => setPatientsLoading(false));
  }, [page]);

  // Load operational summary on mount (powers the four stat cards)
  useEffect(() => {
    if (!isAuthenticated()) return;
    api.getDashboardSummary()
      .then((res) => setSummary(res))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    const sessaoId = getSessaoId();
    try {
      if (sessaoId !== null) await api.logout(sessaoId);
    } catch {
      // proceed regardless of API error
    } finally {
      clearAuth();
      router.push("/");
    }
  }

  const pageTitles = {
    dashboard:          ["Dashboard",                  "Painel Médico"],
    agenda:             ["Agenda",                     "Módulo Clínico"],
    atendimentos:       ["Atendimentos",               "Módulo Clínico"],
    pacientes:          ["Pacientes",                  "Módulo Clínico"],
    config:             ["Configurações",              "Módulo Clínico"],
    "config-agenda":    ["Gerência de Agenda",         "Configurações"],
    "config-relatorio": ["Relatórios e Questionários", "Configurações"],
  };

  const [title, subtitle] = pageTitles[page] || ["—", "—"];

  // ── NAV ITEM ──
  function NavItem({ id, icon, label }) {
    const active = page === id;
    return (
      <button onClick={() => { 
        if (id === "triagem") { router.push("/triagem"); return; }
        setPage(id); 
        setSidebarOpen(false); 
      }}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-normal transition-all mb-0.5
          ${active
            ? "bg-blue-500/10 text-blue-400 font-medium"
            : "text-zinc-500 hover:bg-white/5 hover:text-[#edead4]"}`}>
        <span className={active ? "opacity-100" : "opacity-60"}>{icon}</span>
        {label}
      </button>
    );
  }

  // ── TABLE WRAPPER ──
  function TableWrap({ headers, children, empty }) {
    return (
      <div className="bg-[#141413] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1c1c1a]">
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-widest text-zinc-600 border-b border-white/[0.07]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empty
                ? <tr><td colSpan={headers.length}><EmptyState /></td></tr>
                : children}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0c] flex text-[#edead4]">

      {/* ── OVERLAY mobile ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════════════════════════════════
          SIDEBAR
      ════════════════════════════════ */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-[220px] bg-[#141413] border-r border-white/[0.07]
        flex flex-col z-40 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/[0.07]">
          <span className="font-serif text-xl text-[#edead4]">SXF</span>
          <span className="block text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">Módulo Clínico</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 px-3 pt-2 pb-1.5">Principal</p>
          <NavItem id="dashboard"    icon={Icon.grid}     label="Dashboard" />
          <NavItem id="agenda"       icon={Icon.calendar} label="Agenda" />
          <NavItem id="triagem" icon={Icon.plus} label="Nova Triagem" />

          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 px-3 pt-4 pb-1.5">Cadastros</p>
          <NavItem id="pacientes" icon={Icon.users} label="Pacientes" />

          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-700 px-3 pt-4 pb-1.5">Sistema</p>
          <NavItem id="config" icon={Icon.settings} label="Configurações" />
        </nav>

        {/* Footer médico */}
        <div className="px-4 py-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-semibold text-blue-400 flex-shrink-0">
              DR
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#edead4]">Médico</div>
              <div className="text-[11px] text-zinc-600">Clínico Geral</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-white/[0.07] text-zinc-500 hover:text-red-400 hover:border-red-500/25 text-[12.5px] transition-all">
            {Icon.logout} Sair do sistema
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════
          MAIN
      ════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:ml-[220px]">

        {/* TOPBAR */}
        <header className="sticky top-0 z-20 h-14 bg-[#141413] border-b border-white/[0.07] flex items-center justify-between px-5 lg:px-7">
          <div className="flex items-center gap-3">
            {/* hambúrguer mobile */}
            <button className="lg:hidden flex flex-col gap-1 p-1.5" onClick={() => setSidebarOpen(true)}>
              <span className="w-5 h-px bg-zinc-400 block" />
              <span className="w-5 h-px bg-zinc-400 block" />
              <span className="w-5 h-px bg-zinc-400 block" />
            </button>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-[11px] text-zinc-600">{subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-[#edead4] hover:bg-white/[0.06] transition-all relative">
              {Icon.bell}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#141413]" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-[#edead4] hover:bg-white/[0.06] transition-all">
              {Icon.msg}
            </button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <main className="flex-1 p-5 lg:p-7">

          {/* ══ DASHBOARD ══ */}
          {page === "dashboard" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  label="Triagens hoje"
                  value={summary ? String(summary.avaliacoes_hoje) : "—"}
                  sub="avaliações realizadas hoje"
                  accent="blue"
                />
                <StatCard
                  label="Esta semana"
                  value={summary ? String(summary.avaliacoes_semana) : "—"}
                  sub="avaliações nos últimos 7 dias"
                  accent="green"
                />
                <StatCard
                  label="Taxa de encaminhamento"
                  value={
                    summary && summary.taxa_recomendacao_exame !== null
                      ? `${(summary.taxa_recomendacao_exame * 100).toFixed(1)}%`
                      : "—"
                  }
                  sub="recomendações de exame genético"
                  accent="red"
                />
                <StatCard
                  label="Total de pacientes"
                  value={summary ? String(summary.total_pacientes) : "—"}
                  sub="pacientes cadastrados"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-5">
                <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-5">
                  <div className="text-sm font-semibold mb-4">Consultas por dia — semana atual</div>
                  <BarChart labels={["Seg","Ter","Qua","Qui","Sex","Sáb"]} />
                </div>
                <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-5">
                  <div className="text-sm font-semibold mb-4">Consultas por mês — ano atual</div>
                  <BarChart labels={["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]} />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Próximos agendamentos — hoje</span>
                <BtnPrimary onClick={() => router.push("/triagem")}>{Icon.plus} Nova Triagem</BtnPrimary>
              </div>
              <TableWrap headers={["Paciente","Horário","Tipo","Status","Ações"]} empty />
            </div>
          )}

          {/* ══ AGENDA ══ */}
          {page === "agenda" && (
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3.5">
              {/* Calendário */}
              <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-5">
                <CalendarWidget />
                <div className="border-t border-white/[0.07] mt-4 pt-4">
                  <BtnPrimary className="w-full justify-center" onClick={() => setModalAgendar(true)}>
                    {Icon.plus} Novo agendamento
                  </BtnPrimary>
                </div>
              </div>
              {/* Painel do dia */}
              <div className="bg-[#141413] border border-white/[0.07] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                  <div>
                    <div className="text-sm font-semibold">Selecione um dia</div>
                    <div className="text-[11.5px] text-zinc-600">Nenhuma consulta agendada</div>
                  </div>
                  <BtnOutline>Imprimir</BtnOutline>
                </div>
                <EmptyState message="Nenhuma consulta registrada para este dia." />
              </div>
            </div>
          )}

          {/* ══ ATENDIMENTOS ══ */}
          {page === "atendimentos" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Atendimentos do dia</span>
                <select className={`${selectCls} w-40 text-[13px]`}>
                  <option>Todos os status</option>
                  <option>Atendido</option>
                  <option>Pendente</option>
                  <option>Faltou</option>
                  <option>Desmarcado</option>
                </select>
              </div>
              <TableWrap headers={["#","Paciente","Horário","Tipo de consulta","Status","Ações"]} empty />
            </div>
          )}

          {/* ══ PACIENTES ══ */}
          {page === "pacientes" && (
            <div>
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">{Icon.search}</span>
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                    className={`${inputCls} pl-9`}
                    placeholder="Buscar por nome…" />
                </div>
                <BtnPrimary onClick={() => router.push("/triagem")}>{Icon.plus} Nova triagem</BtnPrimary>
                <BtnOutline>{Icon.chevronDown} Exportar</BtnOutline>
              </div>
              {patientsLoading ? (
                <div className="text-center py-14 text-zinc-600">
                  <p className="text-sm">Carregando pacientes…</p>
                </div>
              ) : (
                <TableWrap
                  headers={["#","Paciente","Sexo","Data de nascimento",""]}
                  empty={patients.filter((p) =>
                    !searchQ || p.nome.toLowerCase().includes(searchQ.toLowerCase())
                  ).length === 0}
                >
                  {patients
                    .filter((p) => !searchQ || p.nome.toLowerCase().includes(searchQ.toLowerCase()))
                    .map((p) => (
                      <tr key={p.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[12.5px] text-zinc-500 font-mono">{p.id}</td>
                        <td className="px-4 py-3 text-[13px] text-[#edead4]">{p.nome}</td>
                        <td className="px-4 py-3 text-[12.5px] text-zinc-400">{p.sexo === "M" ? "Masculino" : p.sexo === "F" ? "Feminino" : p.sexo ?? "—"}</td>
                        <td className="px-4 py-3 text-[12.5px] text-zinc-400">{p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString("pt-BR") : "—"}</td>
                        <td className="px-4 py-3">
                          <button className="text-[12px] text-blue-400 hover:text-blue-300 transition-colors">Ver histórico</button>
                        </td>
                      </tr>
                    ))}
                </TableWrap>
              )}
            </div>
          )}

          {/* ══ CONFIGURAÇÕES ══ */}
          {page === "config" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <ConfigCard
                icon={Icon.calendar} iconColor="blue"
                title="Gerência de agenda"
                desc="Remarque, cancele ou reagende consultas já cadastradas no sistema."
                onClick={() => setPage("config-agenda")}
              />
              <ConfigCard
                icon={Icon.file} iconColor="green"
                title="Relatórios e questionários"
                desc="Acesse os questionários respondidos pelos pacientes e gere relatórios."
                onClick={() => setPage("config-relatorio")}
              />
              <ConfigCard
                icon={Icon.settings} iconColor="yellow"
                title="Modelos de impressos"
                desc="Gerencie modelos de receitas, laudos e atestados médicos."
                onClick={() => {}}
              />
              <ConfigCard
                icon={Icon.phone} iconColor="red"
                title="Agenda telefônica"
                desc="Gerencie os contatos de telefone associados aos seus pacientes."
                onClick={() => {}}
              />
            </div>
          )}

          {/* ══ CONFIG: GERÊNCIA DE AGENDA ══ */}
          {page === "config-agenda" && (
            <div>
              <button onClick={() => setPage("config")}
                className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-[#edead4] mb-4 transition-colors">
                {Icon.back} Voltar
              </button>
              <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-4 flex flex-wrap gap-3 items-end mb-3">
                <div>
                  <p className="text-[10.5px] text-zinc-600 uppercase tracking-wider font-semibold mb-1.5">Status</p>
                  <select className={`${selectCls} w-36 text-[13px]`}>
                    <option>Todos</option><option>Confirmado</option>
                    <option>Pendente</option><option>Desmarcado</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10.5px] text-zinc-600 uppercase tracking-wider font-semibold mb-1.5">Período</p>
                  <select className={`${selectCls} w-40 text-[13px]`}>
                    <option>Este mês</option>
                    <option>Próximos 7 dias</option>
                    <option>Próximos 30 dias</option>
                  </select>
                </div>
                <BtnPrimary>Filtrar</BtnPrimary>
              </div>
              <TableWrap headers={["Paciente","Data","Horário","Status","Gerenciar"]} empty />
            </div>
          )}

          {/* ══ CONFIG: RELATÓRIOS ══ */}
          {page === "config-relatorio" && (
            <div>
              <button onClick={() => setPage("config")}
                className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-[#edead4] mb-4 transition-colors">
                {Icon.back} Voltar
              </button>
              <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-4 flex flex-wrap gap-3 items-end mb-3">
                <div>
                  <p className="text-[10.5px] text-zinc-600 uppercase tracking-wider font-semibold mb-1.5">Paciente</p>
                  <select className={`${selectCls} w-40 text-[13px]`}><option>Todos</option></select>
                </div>
                <div>
                  <p className="text-[10.5px] text-zinc-600 uppercase tracking-wider font-semibold mb-1.5">Período</p>
                  <select className={`${selectCls} w-44 text-[13px]`}>
                    <option>Últimos 30 dias</option>
                    <option>Últimos 90 dias</option>
                    <option>Este ano</option>
                  </select>
                </div>
                <BtnPrimary>Filtrar</BtnPrimary>
              </div>
              <TableWrap headers={["Paciente","Data preenchimento","Questionário","Nota geral","Ação"]} empty />
            </div>
          )}

        </main>
      </div>

      {/* ════════════════════════════════
          MODAIS
      ════════════════════════════════ */}
      <Modal open={modalAgendar} onClose={() => setModalAgendar(false)} title="Novo agendamento"
        footer={
          <>
            <BtnOutline onClick={() => setModalAgendar(false)}>Cancelar</BtnOutline>
            <BtnPrimary onClick={() => setModalAgendar(false)}>Salvar agendamento</BtnPrimary>
          </>
        }>
        <Field label="Paciente">
          <select className={selectCls}><option value="">Selecione um paciente…</option></select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data"><input className={inputCls} type="date" /></Field>
          <Field label="Horário"><input className={inputCls} type="time" /></Field>
        </div>
        <Field label="Tipo de consulta">
          <select className={selectCls}>
            <option>Primeira consulta</option>
            <option>Retorno</option>
            <option>Exame de rotina</option>
            <option>Urgência</option>
          </select>
        </Field>
        <Field label="Observações">
          <textarea className={inputCls + " resize-none min-h-[72px]"} placeholder="Observações adicionais…" />
        </Field>
      </Modal>

      <Modal open={modalPaciente} onClose={() => setModalPaciente(false)} title="Novo paciente"
        footer={
          <>
            <BtnOutline onClick={() => setModalPaciente(false)}>Cancelar</BtnOutline>
            <BtnPrimary onClick={() => setModalPaciente(false)}>Cadastrar paciente</BtnPrimary>
          </>
        }>
        <Field label="Nome completo">
          <input className={inputCls} type="text" placeholder="Nome completo do paciente" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de nascimento"><input className={inputCls} type="date" /></Field>
          <Field label="CPF"><input className={inputCls} type="text" placeholder="000.000.000-00" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Celular"><input className={inputCls} type="tel" placeholder="(00) 9 0000-0000" /></Field>
          <Field label="Telefone fixo"><input className={inputCls} type="tel" placeholder="(00) 0000-0000" /></Field>
        </div>
        <Field label="E-mail">
          <input className={inputCls} type="email" placeholder="email@exemplo.com" />
        </Field>
        <Field label="Observações clínicas">
          <textarea className={inputCls + " resize-none min-h-[72px]"} placeholder="Alergias, histórico, etc." />
        </Field>
      </Modal>

    </div>
  );
}

// ── CALENDÁRIO ─────────────────────────────────────────────────────────────
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function CalendarWidget() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.getDate());

  function changeMonth(dir) {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setMonth(m); setYear(y);
  }

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays    = new Date(year, month, 0).getDate();
  const cells       = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, current: false });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, current: true });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ day: d, current: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeMonth(-1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-[#edead4] hover:bg-white/[0.06] transition-all text-sm">
          ‹
        </button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button onClick={() => changeMonth(1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-zinc-500 hover:text-[#edead4] hover:bg-white/[0.06] transition-all text-sm">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9.5px] font-semibold text-zinc-700 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          const isToday   = c.current && c.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSel     = c.current && c.day === selected;
          return (
            <button key={i} onClick={() => c.current && setSelected(c.day)}
              className={`aspect-square flex items-center justify-center text-[12px] rounded-md transition-all
                ${!c.current ? "text-zinc-800 cursor-default" : "cursor-pointer"}
                ${isToday   ? "bg-blue-600 text-white font-semibold" : ""}
                ${isSel && !isToday ? "bg-blue-500/10 text-blue-400 font-semibold outline outline-1 outline-blue-500/30" : ""}
                ${c.current && !isToday && !isSel ? "text-[#edead4] hover:bg-white/5" : ""}`}>
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}