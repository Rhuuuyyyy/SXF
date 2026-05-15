"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/apiClient";
import { getSessaoId } from "../lib/auth";
import { SINTOMA_ID_MAP } from "../lib/sintomaIds";
import AppShell from "../components/AppShell";
import Icons from "../components/Icons";
import { Card, BtnPrimary, BtnGhost, Field, Pill, inputCls, inputStyle, selectCls } from "../components/ui";

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

// Values must match the Etnia StrEnum in app/domain/entities/patient.py (lowercase)
const ETNIAS = [
  { value: "branca",        label: "Branca" },
  { value: "parda",         label: "Parda" },
  { value: "preta",         label: "Preta" },
  { value: "amarela",       label: "Amarela" },
  { value: "indigena",      label: "Indígena" },
  { value: "nao_declarado", label: "Não declarado" },
];

// ── STEP INDICATOR ────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold lift"
                style={{
                  background: done
                    ? "var(--sage)"
                    : active
                    ? "var(--ink)"
                    : "transparent",
                  color: done || active ? "var(--on-ink)" : "var(--subtle)",
                  border: !done && !active ? "1px solid var(--hair)" : "none",
                }}
              >
                {done ? Icons.check : i + 1}
              </div>
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{
                  color: active
                    ? "var(--ink)"
                    : done
                    ? "var(--sage)"
                    : "var(--subtle)",
                }}
              >
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-16 h-px mx-2 mb-4"
                style={{ background: done ? "var(--sage)" : "var(--hair)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════
export default function TriagemPage() {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [errors, setErrors] = useState({});

  // Dados do paciente
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

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Sintomas filtrados pelo sexo
  const sintomasFiltrados = SINTOMAS.filter((s) => {
    if (paciente.sexo === "M") return true;
    if (paciente.sexo === "F") return s.pesoF !== null;
    return true;
  });

  // Cálculo do score
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

  // Validações
  function validarStep0() {
    const e = {};
    if (!paciente.nome.trim())        e.nome        = "Nome é obrigatório.";
    if (!paciente.dataNasc)           e.dataNasc    = "Data de nascimento é obrigatória.";
    if (!paciente.sexo)               e.sexo        = "Sexo é obrigatório.";
    if (!paciente.responsavel.trim()) e.responsavel = "Responsável é obrigatório.";
    if (!paciente.etnia)              e.etnia       = "Etnia é obrigatória.";
    if (!paciente.uf)                 e.uf          = "Estado de residência é obrigatório.";
    if (!paciente.municipio.trim())   e.municipio   = "Município é obrigatório.";
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

  // Submissão final — chama a API
  async function submeter() {
    setSubmitting(true);
    setSubmitError("");

    try {
      const sessaoId = getSessaoId();

      const patientPayload = {
        nome:                    paciente.nome,
        data_nascimento:         paciente.dataNasc,
        sexo:                    paciente.sexo,
        etnia:                   paciente.etnia,
        uf_nascimento:           paciente.uf,
        municipio_residencia:    paciente.municipio,
        uf_residencia:           paciente.uf,
        grau_parentesco:         acomp.relacao || null,
        prematuro:               false,
        tem_diagnostico_autismo: false,
        tem_diagnostico_tdah:    false,
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

      const registeredPatient = await api.createPatient(patientPayload);

      const pacienteDbId = registeredPatient?.db_id;
      if (!pacienteDbId) {
        throw new Error("ID do paciente não retornado pelo servidor. Contate o suporte.");
      }

      const respostasPayload = sintomasFiltrados.map((s) => ({
        sintoma_id: SINTOMA_ID_MAP[s.id],
        presente:   respostas[s.id] === 1,
        observacao: "",
      }));

      const avalResult = await api.submitAnamnesis({
        paciente_id:            pacienteDbId,
        sessao_id:              sessaoId,
        observacoes:            "",
        diagnostico_previo_fxs: false,
        respostas:              respostasPayload,
      });

      const scoreLocal = calcularScore();
      const limiarLocal = getLimiar();

      const dados = {
        paciente,
        acompanhante:  acomp,
        respostas,
        score:         avalResult?.score_final    ?? scoreLocal,
        limiar:        avalResult?.limiar_usado   ?? limiarLocal,
        resultado:     avalResult?.recomenda_exame ? "encaminhar" : "baixo_risco",
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

  function setResposta(id, valor) {
    setRespostas((prev) => ({ ...prev, [id]: valor }));
    if (errors.questionario) setErrors({});
  }

  const totalRespondidas = sintomasFiltrados.filter((s) => respostas[s.id] !== null).length;
  const progresso = Math.round((totalRespondidas / sintomasFiltrados.length) * 100);

  return (
    <AppShell pageId="triagem">
      <div className="max-w-3xl mx-auto pb-12">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--ink)", color: "var(--on-ink)" }}
            >
              {Icons.cat}
            </span>
          </div>
          <h1
            className="font-display text-[44px] leading-[1.0]"
            style={{ color: "var(--ink)" }}
          >
            Triagem
            <br />— Síndrome do X Frágil
          </h1>
          <p className="text-[13.5px] mt-3" style={{ color: "var(--muted)" }}>
            Modelo validado · AUC 0,73 (♂) e 0,76 (♀)
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* ══ STEP 0 — DADOS DO PACIENTE ══ */}
        {step === 0 && (
          <Card className="p-7">
            <h2
              className="font-display text-[22px] mb-1"
              style={{ color: "var(--ink)" }}
            >
              Dados do paciente
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--muted)" }}>
              Informe os dados do paciente que será avaliado.
            </p>

            <Field label="Nome completo" required error={errors.nome}>
              <input
                className={inputCls}
                style={inputStyle}
                type="text"
                placeholder="Nome do paciente"
                value={paciente.nome}
                onChange={(e) => setPaciente({ ...paciente, nome: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Data de nascimento" required error={errors.dataNasc}>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="date"
                  value={paciente.dataNasc}
                  onChange={(e) => setPaciente({ ...paciente, dataNasc: e.target.value })}
                />
              </Field>

              <Field label="Sexo biológico" required error={errors.sexo}>
                <div className="flex gap-2">
                  {[
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Feminino" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaciente({ ...paciente, sexo: opt.value })}
                      className="flex-1 py-3 rounded-2xl text-[14px] font-medium lift"
                      style={{
                        background: paciente.sexo === opt.value ? "var(--ink)" : "var(--surface)",
                        color: paciente.sexo === opt.value ? "var(--on-ink)" : "var(--ink)",
                        border: `1px solid ${paciente.sexo === opt.value ? "var(--ink)" : "var(--hair)"}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Nome do responsável" required error={errors.responsavel}>
              <input
                className={inputCls}
                style={inputStyle}
                type="text"
                placeholder="Pai, mãe ou tutor legal"
                value={paciente.responsavel}
                onChange={(e) => setPaciente({ ...paciente, responsavel: e.target.value })}
              />
            </Field>

            <Field label="Etnia" required error={errors.etnia}>
              <select
                className={selectCls}
                style={inputStyle}
                value={paciente.etnia}
                onChange={(e) => setPaciente({ ...paciente, etnia: e.target.value })}
              >
                <option value="">Selecione</option>
                {ETNIAS.map((et) => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Estado de residência (UF)" required error={errors.uf}>
                <select
                  className={selectCls}
                  style={inputStyle}
                  value={paciente.uf}
                  onChange={(e) => setPaciente({ ...paciente, uf: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {UFS_BR.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </Field>

              <Field label="Município de residência" required error={errors.municipio}>
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="text"
                  placeholder="Cidade"
                  value={paciente.municipio}
                  onChange={(e) => setPaciente({ ...paciente, municipio: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        )}

        {/* ══ STEP 1 — DADOS DO ACOMPANHANTE ══ */}
        {step === 1 && (
          <Card className="p-7">
            <h2 className="font-display text-[22px] mb-1" style={{ color: "var(--ink)" }}>
              Dados do acompanhante
            </h2>
            <p className="text-[13px] mb-6" style={{ color: "var(--muted)" }}>
              O acompanhante é quem responderá o questionário de sintomas.
            </p>

            <Field label="Nome completo" required error={errors.nomeAcomp}>
              <input
                className={inputCls}
                style={inputStyle}
                type="text"
                placeholder="Nome do acompanhante"
                value={acomp.nome}
                onChange={(e) => setAcomp({ ...acomp, nome: e.target.value })}
              />
            </Field>

            <Field label="Relação com o paciente" required error={errors.relacaoAcomp}>
              <select
                className={selectCls}
                style={inputStyle}
                value={acomp.relacao}
                onChange={(e) => setAcomp({ ...acomp, relacao: e.target.value })}
              >
                <option value="">Selecione</option>
                <option>Mãe</option>
                <option>Pai</option>
                <option>Avó / Avô</option>
                <option>Tio / Tia</option>
                <option>Irmão / Irmã</option>
                <option>Cuidador(a)</option>
                <option>Outro</option>
              </select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Telefone">
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="tel"
                  placeholder="(00) 9 0000-0000"
                  value={acomp.telefone}
                  onChange={(e) => setAcomp({ ...acomp, telefone: e.target.value })}
                />
              </Field>
              <Field label="E-mail">
                <input
                  className={inputCls}
                  style={inputStyle}
                  type="email"
                  placeholder="email@exemplo.com"
                  value={acomp.email}
                  onChange={(e) => setAcomp({ ...acomp, email: e.target.value })}
                />
              </Field>
            </div>

            {/* Patient summary pill */}
            <div
              className="rounded-2xl px-4 py-3 mt-2"
              style={{
                background: "var(--paper-2)",
                border: "1px solid var(--hair-soft)",
              }}
            >
              <p className="text-[13px]" style={{ color: "var(--ink)" }}>
                <span style={{ color: "var(--muted)" }}>Paciente: </span>
                {paciente.nome} ·{" "}
                {paciente.sexo === "M" ? "Masculino" : "Feminino"} ·{" "}
                {paciente.dataNasc && new Date(paciente.dataNasc + "T00:00").toLocaleDateString("pt-BR")}
              </p>
            </div>

            <p className="text-[11.5px] mt-3" style={{ color: "var(--subtle)" }}>
              Telefone e e-mail são opcionais, mas necessários para vincular o acompanhante ao registro do paciente.
            </p>
          </Card>
        )}

        {/* ══ STEP 2 — QUESTIONÁRIO ══ */}
        {step === 2 && (
          <div>
            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {totalRespondidas} de {sintomasFiltrados.length} respondidas
                </span>
                <span className="text-[12px]" style={{ color: "var(--muted)" }}>
                  {progresso}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--hair)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progresso}%`,
                    background: "var(--ink)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {errors.questionario && (
              <div
                className="rounded-2xl px-4 py-3 mb-4 text-[13px]"
                style={{ background: "var(--rust-soft)", color: "var(--rust)" }}
              >
                {errors.questionario}
              </div>
            )}

            <Card className="overflow-hidden !p-0">
              {/* Card header */}
              <div
                className="px-6 py-4"
                style={{
                  background: "var(--paper-2)",
                  borderBottom: "1px solid var(--hair-soft)",
                }}
              >
                <p className="text-[13px]" style={{ color: "var(--muted)" }}>
                  Responda com base no comportamento habitual de{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{paciente.nome}</span>.
                  Acompanhante:{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{acomp.nome}</span>.
                </p>
              </div>

              {/* Symptom rows */}
              <div>
                {sintomasFiltrados.map((s, idx) => {
                  const resp = respostas[s.id];
                  const peso = paciente.sexo === "M" ? s.pesoM : s.pesoF;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between px-6 py-4"
                      style={{
                        borderBottom: idx < sintomasFiltrados.length - 1 ? "1px solid var(--hair-soft)" : "none",
                        background: resp === 1
                          ? "var(--paper-2)"
                          : "transparent",
                      }}
                    >
                      <div className="flex-1 pr-6">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-[10px] w-5"
                            style={{ color: "var(--subtle)" }}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[14px]" style={{ color: "var(--ink)" }}>
                            {s.label}
                          </span>
                        </div>
                        <span className="text-[10.5px] ml-7" style={{ color: "var(--subtle)" }}>
                          Peso: {peso?.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Não */}
                        <button
                          onClick={() => setResposta(s.id, 0)}
                          className="w-14 h-9 rounded-xl text-[12px] font-medium lift"
                          style={{
                            background: resp === 0 ? "var(--ink)" : "transparent",
                            color: resp === 0 ? "var(--on-ink)" : "var(--muted)",
                            border: `1px solid ${resp === 0 ? "var(--ink)" : "var(--hair)"}`,
                          }}
                        >
                          Não
                        </button>
                        {/* Sim */}
                        <button
                          onClick={() => setResposta(s.id, 1)}
                          className="w-14 h-9 rounded-xl text-[12px] font-medium lift"
                          style={{
                            background: resp === 1 ? "var(--ink)" : "transparent",
                            color: resp === 1 ? "var(--on-ink)" : "var(--muted)",
                            border: `1px solid ${resp === 1 ? "var(--ink)" : "var(--hair)"}`,
                          }}
                        >
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
            <Card className="p-6">
              <h3
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-4"
                style={{ color: "var(--muted)" }}
              >
                Paciente
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  ["Nome",        paciente.nome],
                  ["Sexo",        paciente.sexo === "M" ? "Masculino" : "Feminino"],
                  ["Nascimento",  new Date(paciente.dataNasc + "T00:00").toLocaleDateString("pt-BR")],
                  ["Responsável", paciente.responsavel],
                  ["Etnia",       paciente.etnia],
                  ["UF / Município", `${paciente.uf} · ${paciente.municipio}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[11px] block" style={{ color: "var(--subtle)" }}>{k}</span>
                    <span className="text-[13px]" style={{ color: "var(--ink)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Resumo acompanhante */}
            <Card className="p-6">
              <h3
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-4"
                style={{ color: "var(--muted)" }}
              >
                Acompanhante
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <span className="text-[11px] block" style={{ color: "var(--subtle)" }}>Nome</span>
                  <span className="text-[13px]" style={{ color: "var(--ink)" }}>{acomp.nome}</span>
                </div>
                <div>
                  <span className="text-[11px] block" style={{ color: "var(--subtle)" }}>Relação</span>
                  <span className="text-[13px]" style={{ color: "var(--ink)" }}>{acomp.relacao}</span>
                </div>
                {acomp.telefone && (
                  <div>
                    <span className="text-[11px] block" style={{ color: "var(--subtle)" }}>Telefone</span>
                    <span className="text-[13px]" style={{ color: "var(--ink)" }}>{acomp.telefone}</span>
                  </div>
                )}
                {acomp.email && (
                  <div>
                    <span className="text-[11px] block" style={{ color: "var(--subtle)" }}>E-mail</span>
                    <span className="text-[13px]" style={{ color: "var(--ink)" }}>{acomp.email}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Resumo sintomas */}
            <Card className="p-6">
              <h3
                className="text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-4"
                style={{ color: "var(--muted)" }}
              >
                Sintomas informados
              </h3>
              <div className="space-y-0">
                {sintomasFiltrados.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2"
                    style={{
                      borderBottom: i < sintomasFiltrados.length - 1 ? "1px solid var(--hair-soft)" : "none",
                    }}
                  >
                    <span className="text-[13px]" style={{ color: "var(--muted)" }}>{s.label}</span>
                    <span
                      className="text-[12px] font-medium"
                      style={{
                        color: respostas[s.id] === 1 ? "var(--ink)" : "var(--subtle)",
                      }}
                    >
                      {respostas[s.id] === 1 ? "Presente" : "Ausente"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Score preview */}
            <Card
              className="p-7"
              style={{ background: "var(--ink)", border: "none" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-[10.5px] uppercase tracking-[0.14em] mb-2"
                    style={{ color: "var(--on-ink-55)" }}
                  >
                    Score calculado
                  </p>
                  <div
                    className="font-display text-[64px] leading-none num-tabular"
                    style={{ color: "var(--on-ink)" }}
                  >
                    {calcularScore().toFixed(4)}
                  </div>
                  <p className="text-[12px] mt-2" style={{ color: "var(--on-ink-55)" }}>
                    Limiar de encaminhamento: {getLimiar()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className="text-[10.5px] uppercase tracking-[0.14em] mb-2"
                    style={{ color: "var(--on-ink-55)" }}
                  >
                    Resultado preliminar
                  </p>
                  {calcularScore() >= getLimiar() ? (
                    <Pill tone="neutral">Encaminhar para teste</Pill>
                  ) : (
                    <Pill tone="neutral">Baixo risco</Pill>
                  )}
                </div>
              </div>
            </Card>

            {/* Submit error */}
            {submitError && (
              <div
                className="rounded-2xl px-4 py-3 text-[13px]"
                style={{ background: "var(--rust-soft)", color: "var(--rust)" }}
              >
                {submitError}
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step === 0 ? (
              <BtnGhost onClick={() => router.push("/dashboard")}>
                {Icons.chevronLeft}
                Cancelar
              </BtnGhost>
            ) : (
              !submitting && (
                <BtnGhost onClick={voltar}>
                  {Icons.chevronLeft}
                  Voltar
                </BtnGhost>
              )
            )}
          </div>

          <div>
            {step < 3 && (
              <BtnPrimary onClick={avancar}>
                Continuar
                {Icons.chevronRight}
              </BtnPrimary>
            )}
            {step === 3 && (
              <BtnPrimary onClick={submeter} disabled={submitting}>
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Enviando…
                  </>
                ) : (
                  <>
                    Gerar resultado
                    {Icons.check}
                  </>
                )}
              </BtnPrimary>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
