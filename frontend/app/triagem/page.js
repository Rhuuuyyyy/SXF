"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/apiClient";
import { getSessaoId } from "../lib/auth";
import { SINTOMA_ID_MAP } from "../lib/sintomaIds";

// ── SINTOMAS COM PESOS POR SEXO ───────────────────────────────────────────
const SINTOMAS = [
  { id: "deficiencia_intelectual",    label: "Deficiência intelectual",      pesoM: 0.32, pesoF: 0.20 },
  { id: "face_alongada_orelhas",      label: "Face alongada / orelhas",      pesoM: 0.29, pesoF: 0.09 },
  { id: "macroorquidismo",            label: "Macroorquidismo",              pesoM: 0.26, pesoF: null  },
  { id: "hipermobilidade_articular",  label: "Hipermobilidade articular",    pesoM: 0.19, pesoF: 0.04 },
  { id: "dificuldades_aprendizagem",  label: "Dificuldades de aprendizagem", pesoM: 0.18, pesoF: 0.28 },
  { id: "deficit_atencao",            label: "Déficit de atenção",           pesoM: 0.17, pesoF: 0.12 },
  { id: "movimentos_repetitivos",     label: "Movimentos repetitivos",       pesoM: 0.17, pesoF: 0.05 },
  { id: "atraso_fala",                label: "Atraso na fala",               pesoM: 0.14, pesoF: 0.01 },
  { id: "hiperatividade",             label: "Hiperatividade",               pesoM: 0.12, pesoF: 0.04 },
  { id: "evita_contato_visual",       label: "Evita contato visual",         pesoM: 0.06, pesoF: 0.08 },
  { id: "evita_contato_fisico",       label: "Evita contato físico",         pesoM: 0.04, pesoF: 0.07 },
  { id: "agressividade",              label: "Agressividade",                pesoM: 0.01, pesoF: 0.02 },
];

const LIMIAR_M = 0.56;
const LIMIAR_F = 0.55;

const STEPS = ["Paciente", "Acompanhante", "Questionário", "Revisão"];

const UFS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const ETNIAS = [
  { value: "BRANCA",        label: "Branca" },
  { value: "PARDA",         label: "Parda" },
  { value: "PRETA",         label: "Preta" },
  { value: "AMARELA",       label: "Amarela" },
  { value: "INDIGENA",      label: "Indígena" },
  { value: "NAO_DECLARADO", label: "Não declarado" },
];

// ── COMPONENTES UTILITÁRIOS ───────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all
                ${done   ? "bg-emerald-500 border-emerald-500 text-white" : ""}
                ${active ? "bg-blue-600 border-blue-600 text-white" : ""}
                ${!done && !active ? "bg-white/[0.04] border-white/10 text-zinc-600" : ""}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? "text-blue-400" : done ? "text-emerald-400" : "text-zinc-600"}`}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-px mx-1 mb-4 transition-all ${done ? "bg-emerald-500" : "bg-white/[0.07]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11.5px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400 normal-case">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls  = "w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[#edead4] text-sm placeholder-zinc-600 outline-none focus:border-blue-500/50 focus:bg-white/[0.06] transition-colors";
const selectCls = inputCls + " appearance-none";

function BtnPrimary({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-medium rounded-lg transition-colors">
      {children}
    </button>
  );
}

function BtnOutline({ children, onClick }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-white/10 hover:bg-white/5 text-[#edead4] text-sm font-medium rounded-lg transition-colors">
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#141413] border border-white/[0.07] rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
export default function TriagemPage() {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [errors, setErrors] = useState({});

  // Dados do paciente — inclui campos obrigatórios para o backend
  const [paciente, setPaciente] = useState({
    nome: "", dataNasc: "", sexo: "", responsavel: "",
    etnia: "", uf: "", municipio: "",
  });

  // Dados do acompanhante
  const [acomp, setAcomp] = useState({
    nome: "", relacao: "", telefone: "", email: "",
  });

  // Respostas do questionário (1 = presente, 0 = ausente)
  const [respostas, setRespostas] = useState(
    Object.fromEntries(SINTOMAS.map((s) => [s.id, null]))
  );

  // Estado de submissão
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Sintomas filtrados pelo sexo ──
  const sintomasFiltrados = SINTOMAS.filter((s) => {
    if (paciente.sexo === "M") return true;
    if (paciente.sexo === "F") return s.pesoF !== null;
    return true;
  });

  // ── Cálculo do score ──
  function calcularScore() {
    const isMasc = paciente.sexo === "M";
    let score = 0;
    sintomasFiltrados.forEach((s) => {
      const resp = respostas[s.id];
      const peso = isMasc ? s.pesoM : s.pesoF;
      if (resp === 1 && peso) score += peso;
    });
    return parseFloat(score.toFixed(4));
  }

  function getLimiar() {
    return paciente.sexo === "M" ? LIMIAR_M : LIMIAR_F;
  }

  // ── Validações ──
  function validarStep0() {
    const e = {};
    if (!paciente.nome.trim())       e.nome       = "Nome é obrigatório.";
    if (!paciente.dataNasc)          e.dataNasc   = "Data de nascimento é obrigatória.";
    if (!paciente.sexo)              e.sexo       = "Sexo é obrigatório.";
    if (!paciente.responsavel.trim()) e.responsavel = "Responsável é obrigatório.";
    if (!paciente.etnia)             e.etnia      = "Etnia é obrigatória.";
    if (!paciente.uf)                e.uf         = "Estado de residência é obrigatório.";
    if (!paciente.municipio.trim())  e.municipio  = "Município é obrigatório.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validarStep1() {
    const e = {};
    if (!acomp.nome.trim())    e.nomeAcomp    = "Nome é obrigatório.";
    if (!acomp.relacao.trim()) e.relacaoAcomp = "Relação é obrigatória.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validarStep2() {
    const naoRespondidos = sintomasFiltrados.filter((s) => respostas[s.id] === null);
    if (naoRespondidos.length > 0) {
      setErrors({ questionario: `${naoRespondidos.length} pergunta(s) não respondida(s).` });
      return false;
    }
    setErrors({});
    return true;
  }

  // ── Navegação ──
  function avancar() {
    if (step === 0 && !validarStep0()) return;
    if (step === 1 && !validarStep1()) return;
    if (step === 2 && !validarStep2()) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function voltar() {
    setErrors({});
    setSubmitError("");
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Submissão final — chama a API ──
  async function submeter() {
    setSubmitting(true);
    setSubmitError("");

    try {
      const sessaoId = getSessaoId();

      // 1. Registrar o paciente
      const patientPayload = {
        nome:                  paciente.nome,
        data_nascimento:       paciente.dataNasc,
        sexo:                  paciente.sexo,
        etnia:                 paciente.etnia,
        uf_nascimento:         paciente.uf,   // padrão: mesmo estado de residência
        municipio_residencia:  paciente.municipio,
        uf_residencia:         paciente.uf,
        // campos opcionais com defaults
        prematuro:             false,
        tem_diagnostico_autismo: false,
        tem_diagnostico_tdah:    false,
        // acompanhante (somente se telefone e e-mail preenchidos)
        ...(acomp.telefone && acomp.email
          ? {
              acompanhante: {
                nome:     acomp.nome,
                telefone: acomp.telefone,
                email:    acomp.email,
              },
            }
          : {}),
      };

      await api.createPatient(patientPayload);

      // 2. Recuperar o ID inteiro do paciente recém-criado via listagem por nome
      // O backend retorna UUID no POST mas o endpoint de avaliações precisa do ID serial.
      const listResult = await api.listPatients({ nome: paciente.nome, limit: 10 });
      const found = listResult?.items?.find((p) =>
        p.nome.toLowerCase().startsWith(paciente.nome.split(" ")[0].toLowerCase())
      );
      if (!found) {
        throw new Error("Paciente registrado, mas não foi possível recuperar seu ID. Tente novamente.");
      }

      // 3. Submeter a anamnese
      const respostasPayload = sintomasFiltrados.map((s) => ({
        sintoma_id: SINTOMA_ID_MAP[s.id],
        presente:   respostas[s.id] === 1,
        observacao: "",
      }));

      const avalResult = await api.submitAnamnesis({
        paciente_id:           found.id,
        sessao_id:             sessaoId,
        observacoes:           "",
        diagnostico_previo_fxs: false,
        respostas:             respostasPayload,
      });

      // 4. Salvar resultado e navegar para a página de resultado
      const scoreLocal = calcularScore();
      const limiarLocal = getLimiar();

      const dados = {
        paciente,
        acompanhante:  acomp,
        respostas,
        score:         avalResult?.score_final    ?? scoreLocal,
        limiar:        avalResult?.limiar_usado   ?? limiarLocal,
        resultado:     avalResult?.recomenda_exame
          ? "encaminhar"
          : "baixo_risco",
        data:          new Date().toISOString(),
        avaliacao_id:  avalResult?.avaliacao_id,
      };

      sessionStorage.setItem("triagem_resultado", JSON.stringify(dados));
      router.push("/resultado");

    } catch (err) {
      setSubmitError(err.message || "Erro ao enviar triagem. Verifique sua conexão e tente novamente.");
      setSubmitting(false);
    }
  }

  // ── Resposta do questionário ──
  function setResposta(id, valor) {
    setRespostas((prev) => ({ ...prev, [id]: valor }));
    if (errors.questionario) setErrors({});
  }

  const totalRespondidas = sintomasFiltrados.filter((s) => respostas[s.id] !== null).length;
  const progresso        = Math.round((totalRespondidas / sintomasFiltrados.length) * 100);

  return (
    <div className="min-h-screen bg-[#0d0d0c] text-[#edead4]">

      {/* TOPBAR */}
      <header className="sticky top-0 z-20 h-14 bg-[#141413] border-b border-white/[0.07] flex items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-[#edead4] text-[13px] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dashboard
          </button>
          <span className="text-white/10">/</span>
          <span className="text-sm font-semibold">Nova Triagem</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">SXF</span>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Título */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-serif text-[#edead4] mb-1">Checklist de Triagem</h1>
          <p className="text-sm text-zinc-500">Síndrome do X Frágil · Modelo validado com AUC 0,73 (♂) e 0,76 (♀)</p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* ══ STEP 0 — DADOS DO PACIENTE ══ */}
        {step === 0 && (
          <Card>
            <h2 className="text-base font-semibold mb-1">Dados do paciente</h2>
            <p className="text-[12.5px] text-zinc-500 mb-6">Informe os dados do paciente que será avaliado.</p>

            <Field label="Nome completo" required>
              <input className={inputCls} type="text" placeholder="Nome do paciente"
                value={paciente.nome} onChange={(e) => setPaciente({ ...paciente, nome: e.target.value })} />
              {errors.nome && <p className="text-red-400 text-[11.5px] mt-1">{errors.nome}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Data de nascimento" required>
                <input className={inputCls} type="date"
                  value={paciente.dataNasc} onChange={(e) => setPaciente({ ...paciente, dataNasc: e.target.value })} />
                {errors.dataNasc && <p className="text-red-400 text-[11.5px] mt-1">{errors.dataNasc}</p>}
              </Field>

              <Field label="Sexo biológico" required>
                <select className={selectCls}
                  value={paciente.sexo} onChange={(e) => setPaciente({ ...paciente, sexo: e.target.value })}>
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
                {errors.sexo && <p className="text-red-400 text-[11.5px] mt-1">{errors.sexo}</p>}
              </Field>
            </div>

            <Field label="Nome do responsável" required>
              <input className={inputCls} type="text" placeholder="Pai, mãe ou tutor legal"
                value={paciente.responsavel} onChange={(e) => setPaciente({ ...paciente, responsavel: e.target.value })} />
              {errors.responsavel && <p className="text-red-400 text-[11.5px] mt-1">{errors.responsavel}</p>}
            </Field>

            <Field label="Etnia" required>
              <select className={selectCls}
                value={paciente.etnia} onChange={(e) => setPaciente({ ...paciente, etnia: e.target.value })}>
                <option value="">Selecione</option>
                {ETNIAS.map((et) => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
              {errors.etnia && <p className="text-red-400 text-[11.5px] mt-1">{errors.etnia}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Estado de residência (UF)" required>
                <select className={selectCls}
                  value={paciente.uf} onChange={(e) => setPaciente({ ...paciente, uf: e.target.value })}>
                  <option value="">Selecione</option>
                  {UFS_BR.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
                {errors.uf && <p className="text-red-400 text-[11.5px] mt-1">{errors.uf}</p>}
              </Field>

              <Field label="Município de residência" required>
                <input className={inputCls} type="text" placeholder="Cidade"
                  value={paciente.municipio} onChange={(e) => setPaciente({ ...paciente, municipio: e.target.value })} />
                {errors.municipio && <p className="text-red-400 text-[11.5px] mt-1">{errors.municipio}</p>}
              </Field>
            </div>
          </Card>
        )}

        {/* ══ STEP 1 — DADOS DO ACOMPANHANTE ══ */}
        {step === 1 && (
          <Card>
            <h2 className="text-base font-semibold mb-1">Dados do acompanhante</h2>
            <p className="text-[12.5px] text-zinc-500 mb-6">
              O acompanhante é quem responderá o questionário de sintomas.
              Cada avaliação deve ser feita com um acompanhante diferente.
            </p>

            <Field label="Nome completo" required>
              <input className={inputCls} type="text" placeholder="Nome do acompanhante"
                value={acomp.nome} onChange={(e) => setAcomp({ ...acomp, nome: e.target.value })} />
              {errors.nomeAcomp && <p className="text-red-400 text-[11.5px] mt-1">{errors.nomeAcomp}</p>}
            </Field>

            <Field label="Relação com o paciente" required>
              <select className={selectCls}
                value={acomp.relacao} onChange={(e) => setAcomp({ ...acomp, relacao: e.target.value })}>
                <option value="">Selecione</option>
                <option>Mãe</option>
                <option>Pai</option>
                <option>Avó / Avô</option>
                <option>Tio / Tia</option>
                <option>Irmão / Irmã</option>
                <option>Cuidador(a)</option>
                <option>Outro</option>
              </select>
              {errors.relacaoAcomp && <p className="text-red-400 text-[11.5px] mt-1">{errors.relacaoAcomp}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone">
                <input className={inputCls} type="tel" placeholder="(00) 9 0000-0000"
                  value={acomp.telefone} onChange={(e) => setAcomp({ ...acomp, telefone: e.target.value })} />
              </Field>
              <Field label="E-mail">
                <input className={inputCls} type="email" placeholder="email@exemplo.com"
                  value={acomp.email} onChange={(e) => setAcomp({ ...acomp, email: e.target.value })} />
              </Field>
            </div>

            <div className="mt-2 bg-blue-500/[0.07] border border-blue-500/20 rounded-lg px-4 py-3">
              <p className="text-[12.5px] text-blue-400">
                <span className="font-semibold">Paciente:</span> {paciente.nome} ·{" "}
                {paciente.sexo === "M" ? "Masculino" : "Feminino"} ·{" "}
                {paciente.dataNasc && new Date(paciente.dataNasc).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <p className="text-[11.5px] text-zinc-600 mt-3">
              Telefone e e-mail são opcionais, mas necessários para vincular o acompanhante ao registro do paciente.
            </p>
          </Card>
        )}

        {/* ══ STEP 2 — QUESTIONÁRIO ══ */}
        {step === 2 && (
          <div>
            {/* Progresso */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-zinc-500">{totalRespondidas} de {sintomasFiltrados.length} respondidas</span>
                <span className="text-[12px] text-zinc-500">{progresso}%</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${progresso}%` }} />
              </div>
            </div>

            {errors.questionario && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-400 text-[12.5px]">{errors.questionario}</p>
              </div>
            )}

            <Card className="!p-0 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/[0.07] bg-white/[0.02]">
                <p className="text-[12.5px] text-zinc-400">
                  Responda com base no comportamento habitual de{" "}
                  <span className="text-[#edead4] font-medium">{paciente.nome}</span>.
                  Acompanhante: <span className="text-[#edead4] font-medium">{acomp.nome}</span>.
                </p>
              </div>

              {/* Legenda */}
              <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-4 flex-wrap">
                <span className="text-[10.5px] text-zinc-600 uppercase tracking-wider font-semibold">Legenda:</span>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-emerald-400">
                  <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[9px]">✓</span>
                  Presente
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-zinc-500">
                  <span className="w-3 h-3 rounded bg-white/5 border border-white/10 flex items-center justify-center text-[9px]">✕</span>
                  Ausente
                </span>
              </div>

              {/* Sintomas */}
              <div>
                {sintomasFiltrados.map((s, idx) => {
                  const resp = respostas[s.id];
                  const peso = paciente.sexo === "M" ? s.pesoM : s.pesoF;
                  return (
                    <div key={s.id}
                      className={`flex items-center justify-between px-5 py-4 border-b border-white/[0.07] last:border-0 transition-colors
                        ${resp === 1 ? "bg-emerald-500/[0.04]" : resp === 0 ? "bg-white/[0.01]" : "hover:bg-white/[0.02]"}`}>
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-700 font-mono w-4">{String(idx + 1).padStart(2, "0")}</span>
                          <span className="text-sm text-[#edead4]">{s.label}</span>
                        </div>
                        <span className="text-[10.5px] text-zinc-600 ml-6">Peso: {peso?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setResposta(s.id, 0)}
                          className={`w-10 h-9 rounded-lg border text-[12px] font-medium transition-all
                            ${resp === 0
                              ? "bg-zinc-700 border-zinc-600 text-white"
                              : "bg-white/[0.03] border-white/[0.07] text-zinc-600 hover:border-white/15 hover:text-[#edead4]"}`}>
                          Não
                        </button>
                        <button onClick={() => setResposta(s.id, 1)}
                          className={`w-10 h-9 rounded-lg border text-[12px] font-medium transition-all
                            ${resp === 1
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : "bg-white/[0.03] border-white/[0.07] text-zinc-600 hover:border-emerald-500/30 hover:text-emerald-400"}`}>
                          Sim
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ══ STEP 3 — REVISÃO ══ */}
        {step === 3 && (
          <div className="space-y-4">

            {/* Resumo paciente */}
            <Card>
              <h3 className="text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider text-[11px]">Paciente</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div><span className="text-[11px] text-zinc-600">Nome</span><p className="text-sm">{paciente.nome}</p></div>
                <div><span className="text-[11px] text-zinc-600">Sexo</span><p className="text-sm">{paciente.sexo === "M" ? "Masculino" : "Feminino"}</p></div>
                <div><span className="text-[11px] text-zinc-600">Nascimento</span><p className="text-sm">{new Date(paciente.dataNasc).toLocaleDateString("pt-BR")}</p></div>
                <div><span className="text-[11px] text-zinc-600">Responsável</span><p className="text-sm">{paciente.responsavel}</p></div>
                <div><span className="text-[11px] text-zinc-600">Etnia</span><p className="text-sm">{paciente.etnia}</p></div>
                <div><span className="text-[11px] text-zinc-600">UF / Município</span><p className="text-sm">{paciente.uf} · {paciente.municipio}</p></div>
              </div>
            </Card>

            {/* Resumo acompanhante */}
            <Card>
              <h3 className="text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider text-[11px]">Acompanhante</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div><span className="text-[11px] text-zinc-600">Nome</span><p className="text-sm">{acomp.nome}</p></div>
                <div><span className="text-[11px] text-zinc-600">Relação</span><p className="text-sm">{acomp.relacao}</p></div>
                {acomp.telefone && <div><span className="text-[11px] text-zinc-600">Telefone</span><p className="text-sm">{acomp.telefone}</p></div>}
                {acomp.email    && <div><span className="text-[11px] text-zinc-600">E-mail</span><p className="text-sm">{acomp.email}</p></div>}
              </div>
            </Card>

            {/* Resumo respostas */}
            <Card>
              <h3 className="text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider text-[11px]">Sintomas informados</h3>
              <div className="space-y-2">
                {sintomasFiltrados.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-1 border-b border-white/[0.05] last:border-0">
                    <span className="text-[13px] text-zinc-400">{s.label}</span>
                    <span className={`text-[12px] font-medium ${respostas[s.id] === 1 ? "text-emerald-400" : "text-zinc-600"}`}>
                      {respostas[s.id] === 1 ? "Presente" : "Ausente"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Preview do score */}
            <Card className="bg-blue-500/[0.06] border-blue-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-blue-400/70 uppercase tracking-wider font-semibold mb-1">Score calculado</p>
                  <p className="text-3xl font-semibold text-blue-400">{calcularScore().toFixed(4)}</p>
                  <p className="text-[11.5px] text-zinc-500 mt-1">Limiar de encaminhamento: {getLimiar()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Resultado preliminar</p>
                  {calcularScore() >= getLimiar() ? (
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[12.5px] font-medium">
                      Encaminhar para teste genético
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12.5px] font-medium">
                      Baixo risco — acompanhamento
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Erro de submissão */}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-4 py-3">
                <p className="text-red-400 text-[13px]">{submitError}</p>
              </div>
            )}

          </div>
        )}

        {/* ── NAVEGAÇÃO ── */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 && !submitting && (
              <BtnOutline onClick={voltar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Voltar
              </BtnOutline>
            )}
          </div>
          <div>
            {step < 3 && (
              <BtnPrimary onClick={avancar}>
                Continuar
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </BtnPrimary>
            )}
            {step === 3 && (
              <BtnPrimary onClick={submeter} disabled={submitting}>
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Enviando…
                  </>
                ) : (
                  <>
                    Gerar resultado
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </>
                )}
              </BtnPrimary>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
