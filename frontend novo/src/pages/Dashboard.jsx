// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
function DashboardPage({ onNav }) {
  const stats = [
    { label: 'Triagens hoje',     value: '14', delta: '+3 vs ontem',  tone: 'ink',   sub: 'Sessões clínicas' },
    { label: 'Encaminhamentos',   value: '4',  delta: 'limiar ≥ 0.56', tone: 'honey', sub: 'Para teste genético' },
    { label: 'Baixo risco',       value: '10', delta: 'acompanhar',    tone: 'sage',  sub: 'Após escore SXF' },
    { label: 'Pacientes ativos',  value: '362', delta: '+18 este mês', tone: 'neutral', sub: 'Em prontuário' },
  ];

  const appointments = [
    { time: '08:30', name: 'Lívia Andrade',     type: 'Triagem SXF',       status: 'sage',    statusLabel: 'Confirmado',   age: '7a 4m' },
    { time: '09:15', name: 'Joaquim Pessoa',    type: 'Retorno',           status: 'neutral', statusLabel: 'Aguardando',   age: '11a 2m' },
    { time: '10:00', name: 'Beatriz Coelho',    type: 'Primeira consulta', status: 'honey',   statusLabel: 'Em atendimento', age: '5a 9m' },
    { time: '10:45', name: 'Davi Reinaldo',     type: 'Triagem SXF',       status: 'sage',    statusLabel: 'Confirmado',   age: '8a 1m' },
    { time: '11:30', name: 'Sofia Vidigal',     type: 'Encaminhamento',    status: 'rust',    statusLabel: 'Pendente',     age: '6a 8m' },
    { time: '14:00', name: 'Théo Ramires',      type: 'Retorno',           status: 'sage',    statusLabel: 'Confirmado',   age: '9a 11m' },
  ];

  // Sparkline data for weekly chart
  const weekData = [
    { d: 'Seg', triagens: 8, encaminhamentos: 2 },
    { d: 'Ter', triagens: 11, encaminhamentos: 3 },
    { d: 'Qua', triagens: 14, encaminhamentos: 4 },
    { d: 'Qui', triagens: 9, encaminhamentos: 2 },
    { d: 'Sex', triagens: 12, encaminhamentos: 3 },
    { d: 'Sáb', triagens: 5, encaminhamentos: 1 },
  ];
  const maxV = Math.max(...weekData.map((w) => w.triagens));

  const recentTriagens = [
    { paciente: 'Lívia Andrade', sexo: 'F', score: 0.61, resultado: 'encaminhar', data: '14/05', hora: '08:30' },
    { paciente: 'Davi Reinaldo', sexo: 'M', score: 0.42, resultado: 'baixo', data: '13/05', hora: '16:20' },
    { paciente: 'Beatriz Coelho', sexo: 'F', score: 0.58, resultado: 'encaminhar', data: '13/05', hora: '14:10' },
    { paciente: 'Théo Ramires', sexo: 'M', score: 0.31, resultado: 'baixo', data: '12/05', hora: '11:00' },
  ];

  return (
    <div className="anim-fade-in space-y-6">

      {/* Hero / welcome strip */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <Card className="p-7 relative overflow-hidden" style={{ background: 'var(--ink)' }}>
          <div className="absolute -bottom-8 -right-6 pointer-events-none" style={{ opacity: 0.14, width: 380 }}>
            <img src="assets/cito-tight.png" alt="" className="cito-logo-img on-ink w-full select-none" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--on-ink-55)' }}>
                CITO · ferramenta de pré-diagnóstico
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--on-ink-35)' }} />
              <span className="text-[10.5px] font-mono" style={{ color: 'var(--on-ink-55)' }}>SUS · CAAE 47291</span>
            </div>
            <h2 className="font-display text-[40px] leading-[1.05] max-w-md" style={{ color: 'var(--on-ink)' }}>
              Painel clínico — CITO
            </h2>
            <p className="text-[13.5px] mt-3 max-w-md" style={{ color: 'var(--on-ink-55)' }}>
              Modelo estatístico validado para pré-diagnóstico da Síndrome do X Frágil. Limiares ativos: ♂ 0.56 · ♀ 0.55. Inicie uma nova avaliação ou continue uma triagem em curso.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button onClick={() => onNav('triagem')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-medium lift"
                style={{ background: 'var(--on-ink)', color: 'var(--ink)' }}>
                {Icon.cat} Nova triagem
              </button>
              <button onClick={() => onNav('agenda')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-medium lift"
                style={{ background: 'var(--on-ink-08)', color: 'var(--on-ink)', border: '1px solid var(--on-ink-14)' }}>
                {Icon.calendar} Ver agenda
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>Próximo agora</div>
              <div className="font-display text-[22px] mt-1">08:30 — Lívia Andrade</div>
            </div>
            <Pill tone="honey">Em 12 min</Pill>
          </div>
          <div className="space-y-2.5 text-[13px]" style={{ color: 'var(--ink-2)' }}>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Tipo</span>
              <span>Triagem SXF · 1ª avaliação</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Sexo · Idade</span>
              <span>F · 7 anos, 4 meses</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Acompanhante</span>
              <span>Mãe · Carla Andrade</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Encaminhamento</span>
              <span>UBS Vila Mariana</span>
            </div>
          </div>
          <div className="mt-5 pt-4 flex gap-2" style={{ borderTop: '1px solid var(--hair-soft)' }}>
            <button onClick={() => onNav('triagem')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[12.5px] font-medium lift"
              style={{ background: 'var(--ink)', color: 'var(--on-ink)' }}>
              Iniciar triagem {Icon.chevronRight}
            </button>
            <button className="px-4 py-2.5 rounded-full text-[12.5px] font-medium lift"
              style={{ border: '1px solid var(--hair)', color: 'var(--ink-2)' }}>Reagendar</button>
          </div>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                {s.label}
              </div>
              <Pill tone={s.tone} dot={false}>{s.delta}</Pill>
            </div>
            <div className="font-display text-[44px] leading-none num-tabular" style={{ color: 'var(--ink)' }}>
              {s.value}
            </div>
            <div className="text-[11.5px] mt-2" style={{ color: 'var(--muted)' }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Chart + Recent triagens */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <Card className="p-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Atividade semanal
              </div>
              <h3 className="font-display text-[24px] mt-1 leading-none">
                63 triagens · 15 encaminhamentos
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11.5px]">
              <span className="flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <span className="w-3 h-2 rounded-sm" style={{ background: 'var(--ink)' }} /> Triagens
              </span>
              <span className="flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <span className="w-3 h-2 rounded-sm border" style={{ background: 'var(--surface)', borderColor: 'var(--ink)' }} /> Encaminham.
              </span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-3 h-[200px] items-end">
            {weekData.map((w, i) => {
              const h1 = (w.triagens / maxV) * 100;
              const h2 = (w.encaminhamentos / maxV) * 100;
              return (
                <div key={w.d} className="flex flex-col items-center justify-end h-full gap-2">
                  <div className="text-[10.5px] font-mono num-tabular" style={{ color: 'var(--muted)' }}>
                    {w.triagens}
                  </div>
                  <div className="w-full flex gap-1 items-end h-[160px]">
                    <div className="flex-1 rounded-t-lg lift" style={{ background: 'var(--ink)', height: `${h1}%` }} />
                    <div className="flex-1 rounded-t-lg lift" style={{ background: 'var(--surface)', border: '1px solid var(--ink)', height: `${h2}%` }} />
                  </div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--ink-2)' }}>{w.d}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10.5px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                Triagens recentes
              </div>
              <h3 className="font-display text-[22px] mt-1 leading-none">Últimas avaliações</h3>
            </div>
            <button className="text-[12px] font-medium lift" style={{ color: 'var(--honey)' }}>
              Ver todas →
            </button>
          </div>
          <div className="space-y-3">
            {recentTriagens.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < recentTriagens.length - 1 ? '1px solid var(--hair-soft)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: 'var(--paper-2)', color: 'var(--ink-2)', border: '1px solid var(--hair)' }}>
                    {t.sexo}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium leading-tight">{t.paciente}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>
                      {t.data} · {t.hora}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono num-tabular text-[14px] font-medium"
                    style={{ color: t.resultado === 'encaminhar' ? 'var(--ink)' : 'var(--subtle)' }}>
                    {t.score.toFixed(2)}
                  </div>
                  <div className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
                    {t.resultado === 'encaminhar' ? 'Encaminhar' : 'Baixo risco'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's appointments table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-3" style={{ borderBottom: '1px solid var(--hair-soft)' }}>
          <div>
            <h3 className="font-display text-[22px] leading-none">Agenda de hoje</h3>
            <div className="text-[12px] mt-1.5" style={{ color: 'var(--muted)' }}>6 consultas agendadas · 2 em janela de urgência</div>
          </div>
          <div className="flex items-center gap-2">
            <BtnGhost>{Icon.print} Imprimir</BtnGhost>
            <BtnPrimary onClick={() => onNav('triagem')}>{Icon.plus} Nova triagem</BtnPrimary>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--paper-2)' }}>
              {['Horário','Paciente','Idade','Tipo','Status','Ações'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10.5px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--muted)', borderBottom: '1px solid var(--hair-soft)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.map((a, i) => (
              <tr key={i} className="lift" style={{ borderBottom: i < appointments.length - 1 ? '1px solid var(--hair-soft)' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <td className="px-6 py-4 font-mono num-tabular text-[13.5px]" style={{ color: 'var(--ink)' }}>{a.time}</td>
                <td className="px-6 py-4 text-[13.5px] font-medium">{a.name}</td>
                <td className="px-6 py-4 text-[13px] font-mono" style={{ color: 'var(--muted)' }}>{a.age}</td>
                <td className="px-6 py-4 text-[13px]" style={{ color: 'var(--ink-2)' }}>{a.type}</td>
                <td className="px-6 py-4"><Pill tone={a.status}>{a.statusLabel}</Pill></td>
                <td className="px-6 py-4">
                  <button className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--muted)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink)'; }}>
                    Abrir prontuário →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
