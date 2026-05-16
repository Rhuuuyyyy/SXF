// ═══════════════════════════════════════════════════════════════════════
// PACIENTES
// ═══════════════════════════════════════════════════════════════════════
function PacientesPage() {
  const [q, setQ] = useState('');
  const pacientes = [
    { nome: 'Lívia Andrade',     nasc: '12/01/2019', cpf: '098.***.***-22', cel: '(11) 9 8847-2901', email: 'carla.a@exemplo.com', ult: '14/05/2026', risco: 'encaminhar', score: 0.61 },
    { nome: 'Joaquim Pessoa',    nasc: '03/03/2015', cpf: '124.***.***-09', cel: '(11) 9 9112-0044', email: 'familia.pessoa@uol', ult: '02/05/2026', risco: 'baixo', score: 0.28 },
    { nome: 'Beatriz Coelho',    nasc: '24/07/2020', cpf: '208.***.***-71', cel: '(21) 9 8222-1100', email: 'p.coelho@mail', ult: '13/05/2026', risco: 'encaminhar', score: 0.58 },
    { nome: 'Davi Reinaldo',     nasc: '11/04/2018', cpf: '311.***.***-65', cel: '(11) 9 7700-3290', email: 'rei.davi@gmail', ult: '13/05/2026', risco: 'baixo', score: 0.42 },
    { nome: 'Sofia Vidigal',     nasc: '18/09/2019', cpf: '423.***.***-31', cel: '(11) 9 9482-2210', email: 'vidigal.fam@mail', ult: '11/05/2026', risco: 'encaminhar', score: 0.67 },
    { nome: 'Théo Ramires',      nasc: '02/06/2016', cpf: '512.***.***-90', cel: '(11) 9 9091-7700', email: 'ramires.t@gmail', ult: '12/05/2026', risco: 'baixo', score: 0.31 },
    { nome: 'Marina Tobias',     nasc: '29/11/2017', cpf: '600.***.***-43', cel: '(11) 9 8131-6622', email: 'tobias.m@uol', ult: '09/05/2026', risco: 'baixo', score: 0.19 },
  ];
  const filtered = pacientes.filter((p) =>
    !q || p.nome.toLowerCase().includes(q.toLowerCase()) || p.cpf.includes(q)
  );

  return (
    <div className="anim-fade-in space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>{Icon.search}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome ou CPF…"
              className="w-full rounded-2xl pl-11 pr-4 py-3 text-[14px] outline-none focus-ink lift"
              style={inputStyle} />
          </div>
          <BtnGhost>{Icon.chevronDown} Filtros</BtnGhost>
          <BtnGhost>{Icon.chevronDown} Exportar CSV</BtnGhost>
          <BtnPrimary>{Icon.plus} Novo paciente</BtnPrimary>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--paper-2)' }}>
              {['#','Paciente','Nascimento','CPF','Celular','Último escore','Status','Ações'].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-[10.5px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--muted)', borderBottom: '1px solid var(--hair-soft)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i} className="lift" style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--hair-soft)' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--paper-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <td className="px-5 py-4 font-mono text-[12px]" style={{ color: 'var(--subtle)' }}>{String(i + 1).padStart(3, '0')}</td>
                <td className="px-5 py-4 text-[13.5px] font-medium">{p.nome}</td>
                <td className="px-5 py-4 text-[12.5px] font-mono" style={{ color: 'var(--ink-2)' }}>{p.nasc}</td>
                <td className="px-5 py-4 text-[12.5px] font-mono" style={{ color: 'var(--muted)' }}>{p.cpf}</td>
                <td className="px-5 py-4 text-[12.5px] font-mono" style={{ color: 'var(--ink-2)' }}>{p.cel}</td>
                <td className="px-5 py-4">
                  <span className="font-mono num-tabular text-[13px] font-medium"
                    style={{ color: p.risco === 'encaminhar' ? 'var(--ink)' : 'var(--subtle)' }}>
                    {p.score.toFixed(2)}
                  </span>
                  <span className="text-[11px] ml-2 font-mono" style={{ color: 'var(--muted)' }}>· {p.ult}</span>
                </td>
                <td className="px-5 py-4">
                  <Pill tone={p.risco === 'encaminhar' ? 'honey' : 'sage'}>
                    {p.risco === 'encaminhar' ? 'Encaminhar' : 'Baixo risco'}
                  </Pill>
                </td>
                <td className="px-5 py-4">
                  <button className="text-[12px] font-medium lift" style={{ color: 'var(--ink)' }}>Abrir →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
