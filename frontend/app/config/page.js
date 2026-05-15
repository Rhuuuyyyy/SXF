"use client";

import AppShell from "../components/AppShell";
import Icons from "../components/Icons";
import { Card } from "../components/ui";

const cards = [
  {
    title: "Gerência de agenda",
    desc:  "Remarque, cancele ou reagende consultas já cadastradas no sistema.",
    icon:  Icons.calendar,
    tag:   "Clínico",
  },
  {
    title: "Relatórios e questionários",
    desc:  "Acesse os questionários respondidos pelos pacientes e gere relatórios.",
    icon:  Icons.file,
    tag:   "Análise",
  },
  {
    title: "Modelos de impressos",
    desc:  "Gerencie modelos de receitas, laudos e atestados médicos.",
    icon:  Icons.print,
    tag:   "Documentos",
  },
  {
    title: "Agenda telefônica",
    desc:  "Gerencie os contatos de telefone associados aos seus pacientes.",
    icon:  Icons.phone,
    tag:   "Contatos",
  },
  {
    title: "Parâmetros do escore",
    desc:  "Ajuste limiares de encaminhamento por sexo (♂ 0.56 · ♀ 0.55).",
    icon:  Icons.sparkle,
    tag:   "Avançado",
  },
  {
    title: "Equipe clínica",
    desc:  "Cadastre médicos, técnicos e gerencie permissões de acesso.",
    icon:  Icons.users,
    tag:   "Acesso",
  },
];

export default function ConfigPage() {
  return (
    <AppShell pageId="config">
      <div className="anim-fade-up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card
              key={card.title}
              interactive
              className="p-7"
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--ink)", color: "var(--on-ink)" }}
              >
                {card.icon}
              </div>

              {/* Tag */}
              <div
                className="text-[10px] font-mono uppercase tracking-[0.14em] mb-1.5"
                style={{ color: "var(--honey)" }}
              >
                {card.tag}
              </div>

              {/* Title */}
              <div
                className="font-display text-[20px] mb-2"
                style={{ color: "var(--ink)" }}
              >
                {card.title}
              </div>

              {/* Description */}
              <p
                className="text-[12.5px] leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {card.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
