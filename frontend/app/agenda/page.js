"use client";

import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import Icons from "../components/Icons";
import { Card, BtnPrimary, BtnGhost, Pill } from "../components/ui";
import CalendarWidget from "../components/CalendarWidget";

const agendaEvents = [
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

const legendItems = [
  { tone: "sage",    label: "Confirmado"      },
  { tone: "honey",   label: "Em atendimento"  },
  { tone: "rust",    label: "Pendente"        },
  { tone: "neutral", label: "Aguardando"      },
];

export default function AgendaPage() {
  const router = useRouter();

  return (
    <AppShell pageId="agenda">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 anim-fade-up">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Calendar card */}
          <Card className="p-5">
            <CalendarWidget marks={{ 14: true, 15: true, 17: true, 20: true, 22: true, 27: true }} />
            <div className="mt-5">
              <BtnPrimary className="w-full justify-center" onClick={() => {}}>
                {Icons.plus}
                Novo agendamento
              </BtnPrimary>
            </div>
          </Card>

          {/* Legend card */}
          <Card className="p-5">
            <p
              className="text-[10.5px] uppercase tracking-[0.14em] font-medium mb-3"
              style={{ color: "var(--muted)" }}
            >
              Legenda
            </p>
            <div className="space-y-2">
              {legendItems.map((item) => (
                <div key={item.tone} className="flex items-center gap-2.5">
                  <Pill tone={item.tone}>{item.label}</Pill>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <Card className="overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid var(--hair-soft)" }}
          >
            <div className="font-display text-[26px]" style={{ color: "var(--ink)" }}>
              14 de Maio, 2026
            </div>
            <BtnGhost onClick={() => window.print()}>
              {Icons.print}
              Imprimir
            </BtnGhost>
          </div>

          {/* Timeline */}
          <div className="px-8 py-6">
            <div
              className="relative pl-6"
              style={{ borderLeft: "1px dashed var(--hair)" }}
            >
              {agendaEvents.map((ev, i) => (
                <div
                  key={i}
                  className="relative mb-7 last:mb-0"
                >
                  {/* Timeline dot */}
                  <span
                    className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: "var(--ink)",
                      boxShadow: "0 0 0 4px var(--paper)",
                    }}
                  />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className="font-mono text-[11px] font-medium num-tabular mb-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {ev.hora}
                      </div>
                      <div
                        className="font-display text-[17px]"
                        style={{ color: "var(--ink)" }}
                      >
                        {ev.paciente}
                      </div>
                      <div className="text-[12.5px] mt-0.5" style={{ color: "var(--muted)" }}>
                        {ev.idade} · {ev.tipo}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Pill tone={ev.status}>{pillLabel[ev.status]}</Pill>
                      <button
                        className="text-[12px] lift"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
                      >
                        Abrir →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>
    </AppShell>
  );
}
