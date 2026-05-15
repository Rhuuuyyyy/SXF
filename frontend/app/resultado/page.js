"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className="min-h-screen bg-[#0d0d0c] flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Carregando resultado…</p>
      </div>
    );
  }

  const { paciente, score, limiar, resultado, data, avaliacao_id } = dados;
  const encaminhar = resultado === "encaminhar";
  const dataFormatada = new Date(data).toLocaleString("pt-BR");

  return (
    <div className="min-h-screen bg-[#0d0d0c] text-[#edead4]">

      {/* TOPBAR */}
      <header className="h-14 bg-[#141413] border-b border-white/[0.07] flex items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-[#edead4] text-[13px] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dashboard
          </button>
          <span className="text-white/10">/</span>
          <span className="text-sm font-semibold">Resultado da Triagem</span>
        </div>
        <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">SXF</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-12 space-y-5">

        {/* Score card */}
        <div className={`rounded-xl border p-7 ${encaminhar
          ? "bg-amber-500/[0.06] border-amber-500/25"
          : "bg-emerald-500/[0.06] border-emerald-500/25"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${encaminhar ? "text-amber-400/70" : "text-emerald-400/70"}`}>
            Resultado da Triagem
          </p>
          <p className={`text-4xl font-semibold mb-3 ${encaminhar ? "text-amber-400" : "text-emerald-400"}`}>
            {score.toFixed(4)}
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium ${encaminhar
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"}`}>
            {encaminhar ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Encaminhar para teste genético FMR1
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Baixo risco — manter acompanhamento clínico
              </>
            )}
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-[#141413] border border-white/[0.07] rounded-xl p-6 space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-3">Detalhes clínicos</h3>
          <Row label="Paciente"              value={paciente.nome} />
          <Row label="Sexo"                  value={paciente.sexo === "M" ? "Masculino" : "Feminino"} />
          <Row label="Score calculado"       value={score.toFixed(4)} />
          <Row label="Limiar de decisão"     value={limiar.toFixed(2)} />
          <Row label="Score > Limiar"        value={score >= limiar ? "Sim" : "Não"} />
          {avaliacao_id && <Row label="ID da avaliação" value={`#${avaliacao_id}`} />}
          <Row label="Data e hora"           value={dataFormatada} />
        </div>

        {/* Orientação clínica */}
        {encaminhar && (
          <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl px-5 py-4">
            <p className="text-[13px] text-blue-300 leading-relaxed">
              <span className="font-semibold">Orientação:</span> O score indica necessidade de encaminhamento para
              realização do teste molecular FMR1 (Southern Blot + PCR) em laboratório especializado.
              Registre no prontuário e oriente a família sobre o processo diagnóstico.
            </p>
          </div>
        )}

        {/* Aviso LGPD */}
        <p className="text-[11px] text-zinc-700 text-center leading-relaxed">
          Esta triagem é de caráter preliminar e não substitui diagnóstico clínico definitivo.
          Dados armazenados conforme a LGPD · Lei nº 13.709/2018.
        </p>

        {/* Ações */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => {
              sessionStorage.removeItem("triagem_resultado");
              router.push("/triagem");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova triagem
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 text-[#edead4] text-sm font-medium rounded-lg transition-colors">
            Ir ao dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.05] last:border-0">
      <span className="text-[12px] text-zinc-500">{label}</span>
      <span className="text-[13px] text-[#edead4] font-medium">{value}</span>
    </div>
  );
}
