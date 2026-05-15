"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import Icons from "../components/Icons";
import { Pill, BtnPrimary, BtnGhost, Card } from "../components/ui";
import { api } from "../lib/apiClient";
import { isAuthenticated } from "../lib/auth";

// ── Static sample data ─────────────────────────────────────────────────────
const weekData = [
  { d: "Seg", triagens: 8,  enc: 2 },
  { d: "Ter", triagens: 11, enc: 3 },
  { d: "Qua", triagens: 14, enc: 4 },
  { d: "Qui", triagens: 9,  enc: 2 },
  { d: "Sex", triagens: 12, enc: 3 },
  { d: "Sáb", triagens: 5,  enc: 1 },
];

const recentTriagens = [
  { paciente: "Lívia Andrade",  sexo: "F", score: 0.61, resultado: "encaminhar", data: "14/05", hora: "08:30" },
  { paciente: "Davi Reinaldo",  sexo: "M", score: 0.42, resultado: "baixo",      data: "13/05", hora: "16:20" },
  { paciente: "Beatriz Coelho", sexo: "F", score: 0.58, resultado: "encaminhar", data: "13/05", hora: "14:10" },
  { paciente: "Théo Ramires",   sexo: "M", score: 0.31, resultado: "baixo",      data: "12/05", hora: "11:00" },
];

const agendaRows = [
  { hora: "08:30", paciente: "Lívia Andrade",  idade: "7a",  tipo: "Primeira consulta",  status: "sage"    },
  { hora: "09:15", paciente: "Joaquim Pessoa",  idade: "11a", tipo: "Retorno",            status: "neutral" },
  { hora: "10:00", paciente: "Beatriz Coelho",  idade: "5a",  tipo: "Triagem SXF",        status: "honey"   },
  { hora: "11:30", paciente: "Davi Reinaldo",   idade: "8a",  tipo: "Retorno",            status: "neutral" },
  { hora: "14:00", paciente: "Sofia Vidigal",   idade: "6a",  tipo: "Primeira consulta",  status: "sage"    },
  { hora: "15:45", paciente: "Théo Ramires",    idade: "9a",  tipo: "Triagem SXF",        status: "rust"    },
];

const pillLabel = {
  sage:    "Confirmado",
  neutral: "Aguardando",
  honey:   "Em atendimento",
  rust:    "Pendente",
};

// ── Bar chart component ────────────────────────────────────────────────────
function WeekBarChart({ data }) {
  const maxVal = Math.max(...data.map((d) => d.triagens));
  return (
    <div className="flex items-end gap-3 h-[200px]">
      {data.map((item) => (
        <div key={item.d} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
          <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: "160px" }}>
            {/* Triagens bar */}
            <div
              className="flex-1 rounded-t-lg lift"
              style={{
                height: `${(item.triagens / maxVal) * 100}%`,
                background: "var(--ink)",
                opacity: 0.9,
              }}
            />
            {/* Encaminhamentos bar */}
            <div
              className="flex-1 rounded-t-lg lift"
              style={{
                height: `${(item.enc / maxVal) * 100}%`,
                background: "transparent",
                border: "1px solid var(--ink)",
                borderBottom: "none",
                opacity: 0.5,
              }}
            />
          </div>
          <span className="text-[10px]" style={{ color: "var(--muted)" }}>{item.d}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) return;
    api.getDashboardSummary()
      .then((res) => setSummary(res))
      .catch(() => {});
  }, []);

  return (
    <AppShell pageId="dashboard">
      <div className="space-y-5 anim-fade-up">

        {/* ── 1. Hero strip ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">

          {/* Left — main hero card */}
          <Card className="p-8" style={{ background: "var(--ink)", border: "none" }}>
            <div
              className="font-display text-[40px] leading-[1.05] mb-3"
              style={{ color: "var(--on-ink)" }}
            >
              Painel clínico<br />— CITO
            </div>
            <p className="text-[13.5px] mb-1" style={{ color: "var(--on-ink-55)" }}>
              Triagens ativas · Síndrome do X Frágil
            </p>
            <p
              className="font-mono text-[10.5px] mb-6"
              style={{ color: "var(--on-ink-55)" }}
            >
              CITO · ferramenta de pré-diagnóstico
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push("/triagem")}
                className="rounded-full px-4 py-2.5 text-[13px] font-medium lift inline-flex items-center gap-2"
                style={{ background: "var(--on-ink)", color: "var(--ink)" }}
              >
                {Icons.plus}
                Nova triagem
              </button>
              <button
                onClick={() => router.push("/agenda")}
                className="rounded-full px-4 py-2.5 text-[13px] font-medium lift inline-flex items-center gap-2"
                style={{
                  background: "var(--on-ink-08)",
                  border: "1px solid var(--on-ink-14)",
                  color: "var(--on-ink)",
                }}
              >
                {Icons.calendar}
                Ver agenda
              </button>
            </div>
          </Card>

          {/* Right — próximo agora */}
          <Card className="p-6">
            <p className="text-[10.5px] uppercase tracking-[0.14em] font-medium mb-4" style={{ color: "var(--muted)" }}>
              Próximo agora
            </p>
            <div className="font-display text-[22px] mb-4" style={{ color: "var(--ink)" }}>
              08:30 — Lívia Andrade
            </div>
            <div className="space-y-2 mb-5">
              {[
                ["Tipo",      "Primeira consulta"],
                ["Sexo/Idade","F · 7 anos"],
                ["Status",    "Confirmado"],
                ["Sala",      "Sala 2"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-[13px]">
                  <span style={{ color: "var(--muted)" }}>{k}</span>
                  <span style={{ color: "var(--ink)" }}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <BtnPrimary className="flex-1 justify-center" onClick={() => router.push("/triagem")}>
                {Icons.cat}
                Iniciar triagem
              </BtnPrimary>
              <BtnGhost onClick={() => router.push("/agenda")}>
                {Icons.calendar}
              </BtnGhost>
            </div>
          </Card>
        </div>

        {/* ── 2. Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Triagens hoje",
              value: summary?.avaliacoes_hoje ?? "—",
              sub: "avaliações realizadas hoje",
            },
            {
              label: "Esta semana",
              value: summary?.avaliacoes_semana ?? "—",
              sub: "últimos 7 dias",
            },
            {
              label: "Encaminhamentos",
              value:
                summary?.taxa_recomendacao_exame != null
                  ? `${(summary.taxa_recomendacao_exame * 100).toFixed(1)}%`
                  : "—",
              sub: "taxa de recomendação",
            },
            {
              label: "Total pacientes",
              value: summary?.total_pacientes ?? "—",
              sub: "pacientes cadastrados",
            },
          ].map((stat) => (
            <Card key={stat.label} className="p-5">
              <div
                className="text-[10.5px] uppercase tracking-[0.16em] mb-2"
                style={{ color: "var(--muted)" }}
              >
                {stat.label}
              </div>
              <div
                className="font-display text-[44px] leading-none num-tabular mb-1"
                style={{ color: "var(--ink)" }}
              >
                {String(stat.value)}
              </div>
              <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
                {stat.sub}
              </div>
            </Card>
          ))}
        </div>

        {/* ── 3. Chart + Recent triagens ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">

          {/* Bar chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-display text-[18px]" style={{ color: "var(--ink)" }}>
                  Triagens por dia
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>
                  Semana atual
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--muted)" }}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--ink)" }} />
                  Triagens
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ border: "1px solid var(--ink)" }} />
                  Enc.
                </span>
              </div>
            </div>
            <WeekBarChart data={weekData} />
          </Card>

          {/* Recent triagens */}
          <Card className="p-6">
            <div className="font-display text-[18px] mb-4" style={{ color: "var(--ink)" }}>
              Triagens recentes
            </div>
            <div className="space-y-3">
              {recentTriagens.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < recentTriagens.length - 1 ? "1px solid var(--hair-soft)" : "none" }}
                >
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                      {t.paciente}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                      {t.sexo} · {t.data} {t.hora}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[13px] num-tabular" style={{ color: "var(--ink)" }}>
                      {t.score.toFixed(2)}
                    </div>
                    <Pill tone={t.resultado === "encaminhar" ? "honey" : "sage"} className="mt-1">
                      {t.resultado === "encaminhar" ? "Encaminhar" : "Baixo risco"}
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── 4. Agenda table ── */}
        <Card className="overflow-hidden">
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--hair-soft)" }}
          >
            <div className="font-display text-[18px]" style={{ color: "var(--ink)" }}>
              Agenda de hoje
            </div>
            <div className="flex gap-2">
              <BtnGhost onClick={() => router.push("/agenda")}>
                Ver tudo {Icons.chevronRight}
              </BtnGhost>
              <BtnPrimary onClick={() => router.push("/triagem")}>
                {Icons.plus}
                Nova triagem
              </BtnPrimary>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--paper-2)" }}>
                  {["Horário", "Paciente", "Idade", "Tipo", "Status", "Ações"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--muted)", borderBottom: "1px solid var(--hair-soft)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agendaRows.map((row, i) => (
                  <tr
                    key={i}
                    className="lift"
                    style={{ borderBottom: "1px solid var(--hair-soft)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td className="px-5 py-3.5 font-mono text-[13px] num-tabular" style={{ color: "var(--ink)" }}>
                      {row.hora}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                      {row.paciente}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: "var(--muted)" }}>
                      {row.idade}
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px]" style={{ color: "var(--muted)" }}>
                      {row.tipo}
                    </td>
                    <td className="px-5 py-3.5">
                      <Pill tone={row.status}>{pillLabel[row.status]}</Pill>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        className="text-[12px] font-medium lift"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
                      >
                        Abrir →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </AppShell>
  );
}
