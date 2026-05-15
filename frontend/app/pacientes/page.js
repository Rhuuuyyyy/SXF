"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import Icons from "../components/Icons";
import { Card, BtnPrimary, BtnGhost, Pill, inputCls, inputStyle } from "../components/ui";
import { api } from "../lib/apiClient";

const SAMPLE = [
  { nome: "Lívia Andrade",  nasc: "12/01/2019", cpf: "098.***.***-22", cel: "(11) 9 8847-2901", ult: "14/05/2026", risco: "encaminhar", score: 0.61 },
  { nome: "Joaquim Pessoa", nasc: "03/03/2015", cpf: "124.***.***-09", cel: "(11) 9 9112-0044", ult: "02/05/2026", risco: "baixo",      score: 0.28 },
  { nome: "Beatriz Coelho", nasc: "24/07/2020", cpf: "208.***.***-71", cel: "(21) 9 8222-1100", ult: "13/05/2026", risco: "encaminhar", score: 0.58 },
  { nome: "Davi Reinaldo",  nasc: "11/04/2018", cpf: "311.***.***-65", cel: "(11) 9 7700-3290", ult: "13/05/2026", risco: "baixo",      score: 0.42 },
  { nome: "Sofia Vidigal",  nasc: "18/09/2019", cpf: "423.***.***-31", cel: "(11) 9 9482-2210", ult: "11/05/2026", risco: "encaminhar", score: 0.67 },
  { nome: "Théo Ramires",   nasc: "02/06/2016", cpf: "512.***.***-90", cel: "(11) 9 9091-7700", ult: "12/05/2026", risco: "baixo",      score: 0.31 },
];

export default function PacientesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listPatients({ limit: 50 })
      .then((res) => {
        setPatients(res?.items ?? []);
      })
      .catch(() => {
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Use API data if available, otherwise fall back to sample
  const sourceData =
    patients.length > 0
      ? patients.map((p) => ({
          nome:  p.nome,
          nasc:  p.data_nascimento
            ? new Date(p.data_nascimento).toLocaleDateString("pt-BR")
            : "—",
          cpf:   "—",
          cel:   "—",
          ult:   "—",
          risco: "baixo",
          score: null,
        }))
      : SAMPLE;

  const filtered = sourceData.filter((p) =>
    !q || p.nome.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell pageId="pacientes">
      <div className="space-y-4 anim-fade-up">

        {/* ── Search / actions bar ── */}
        <Card className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search input */}
            <div className="relative flex-1 min-w-[220px]">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--subtle)" }}
              >
                {Icons.search}
              </span>
              <input
                type="text"
                className={inputCls + " pl-11"}
                style={inputStyle}
                placeholder="Buscar por nome…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex gap-2 ml-auto flex-shrink-0">
              <BtnGhost onClick={() => {}}>
                {Icons.chevronDown}
                Filtros
              </BtnGhost>
              <BtnGhost onClick={() => {}}>
                Exportar CSV
              </BtnGhost>
              <BtnPrimary onClick={() => router.push("/triagem")}>
                {Icons.plus}
                Novo paciente
              </BtnPrimary>
            </div>
          </div>
        </Card>

        {/* ── Table card ── */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-[14px]" style={{ color: "var(--muted)" }}>
                Carregando pacientes…
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: "var(--paper-2)" }}>
                    {["#", "Paciente", "Nascimento", "CPF", "Celular", "Último escore", "Status", "Ações"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          color: "var(--muted)",
                          borderBottom: "1px solid var(--hair-soft)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-[14px]" style={{ color: "var(--muted)" }}>
                        Nenhum paciente encontrado.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, i) => (
                      <tr
                        key={i}
                        className="lift"
                        style={{ borderBottom: "1px solid var(--hair-soft)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--paper-2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <td className="px-5 py-3.5 font-mono text-[12px] num-tabular" style={{ color: "var(--subtle)" }}>
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                          {p.nome}
                        </td>
                        <td className="px-5 py-3.5 text-[12.5px] font-mono num-tabular" style={{ color: "var(--muted)" }}>
                          {p.nasc}
                        </td>
                        <td className="px-5 py-3.5 text-[12.5px] font-mono" style={{ color: "var(--subtle)" }}>
                          {p.cpf}
                        </td>
                        <td className="px-5 py-3.5 text-[12.5px]" style={{ color: "var(--muted)" }}>
                          {p.cel}
                        </td>
                        <td className="px-5 py-3.5">
                          {p.score != null ? (
                            <span
                              className="font-mono num-tabular text-[13px] font-medium"
                              style={{
                                color: p.risco === "encaminhar" ? "var(--ink)" : "var(--subtle)",
                              }}
                            >
                              {p.score.toFixed(2)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--subtle)" }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <Pill tone={p.risco === "encaminhar" ? "honey" : "sage"}>
                            {p.risco === "encaminhar" ? "Encaminhar" : "Baixo risco"}
                          </Pill>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </AppShell>
  );
}
