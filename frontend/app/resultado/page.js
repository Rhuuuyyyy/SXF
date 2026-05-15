"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import { Card, BtnPrimary, BtnGhost } from "../components/ui";
import Icons from "../components/Icons";

export default function ResultadoPage() {
  const router = useRouter();
  const [dados, setDados] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("triagem_resultado");
    if (!raw) {
      router.replace("/dashboard");
      return;
    }
    try {
      setDados(JSON.parse(raw));
    } catch {
      router.replace("/dashboard");
    }
  }, [router]);

  if (!dados) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--paper)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--muted)" }}>
          Carregando resultado…
        </p>
      </div>
    );
  }

  const { paciente, score, limiar, resultado, data, avaliacao_id } = dados;
  const encaminhar    = resultado === "encaminhar";
  const dataFormatada = new Date(data).toLocaleString("pt-BR");
  const scoreNum      = Number(score);
  const limiarNum     = Number(limiar);

  return (
    <AppShell pageId="triagem">
      <div className="max-w-xl mx-auto anim-fade-up">

        {/* ── Score card ── */}
        <Card
          className="p-8 mb-5"
          style={{
            border: encaminhar ? "1px solid var(--ink)" : "1px solid var(--hair-soft)",
          }}
        >
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2"
            style={{ color: "var(--muted)" }}
          >
            Resultado da Triagem
          </div>

          {/* Score */}
          <div
            className="font-display text-[48px] leading-none mb-4"
            style={{ color: "var(--ink)", letterSpacing: "-0.04em" }}
          >
            {scoreNum.toFixed(4)}
          </div>

          {/* Result badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium mb-5"
            style={{ background: "var(--ink)", color: "var(--on-ink)" }}
          >
            {encaminhar ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Encaminhar para teste genético FMR1
              </>
            ) : (
              <>
                {Icons.check}
                Baixo risco — manter acompanhamento clínico
              </>
            )}
          </div>

          {/* Threshold bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                Score: {scoreNum.toFixed(4)}
              </span>
              <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                Limiar: {limiarNum.toFixed(2)}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--hair)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((scoreNum / Math.max(limiarNum * 1.4, 0.01)) * 100, 100)}%`,
                  background: "var(--ink)",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        </Card>

        {/* ── Clinical detail ── */}
        <Card className="p-6 mb-5">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--muted)" }}
          >
            Detalhes clínicos
          </h3>
          <Row label="Paciente"          value={paciente.nome} />
          <Row label="Sexo"              value={paciente.sexo === "M" ? "Masculino" : "Feminino"} />
          <Row label="Score calculado"   value={scoreNum.toFixed(4)} />
          <Row label="Limiar de decisão" value={limiarNum.toFixed(2)} />
          <Row label="Score > Limiar"    value={scoreNum >= limiarNum ? "Sim" : "Não"} />
          {avaliacao_id && <Row label="ID da avaliação" value={`#${avaliacao_id}`} />}
          <Row label="Data e hora"       value={dataFormatada} />
        </Card>

        {/* ── Clinical guidance ── */}
        {encaminhar && (
          <Card className="p-5 mb-5">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              <span className="font-semibold">Orientação:</span> O score indica necessidade de
              encaminhamento para realização do teste molecular FMR1 (Southern Blot + PCR) em
              laboratório especializado. Registre no prontuário e oriente a família sobre o
              processo diagnóstico.
            </p>
          </Card>
        )}

        {/* ── LGPD notice ── */}
        <p className="text-[11px] text-center leading-relaxed mb-6" style={{ color: "var(--subtle)" }}>
          Esta triagem é de caráter preliminar e não substitui diagnóstico clínico definitivo.
          Dados armazenados conforme a LGPD · Lei nº 13.709/2018.
        </p>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-center">
          <BtnPrimary
            onClick={() => {
              sessionStorage.removeItem("triagem_resultado");
              router.push("/triagem");
            }}
          >
            {Icons.plus}
            Nova triagem
          </BtnPrimary>
          <BtnGhost onClick={() => router.push("/dashboard")}>
            Ir ao dashboard
          </BtnGhost>
        </div>

      </div>
    </AppShell>
  );
}

function Row({ label, value }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid var(--hair-soft)" }}
    >
      <span className="text-[12px]" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
