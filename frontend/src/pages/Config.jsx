// ═══════════════════════════════════════════════════════════════════════
// CONFIG (simple)
// ═══════════════════════════════════════════════════════════════════════
function ConfigPage() {
  const cards = [
    { title: 'Gerência de agenda',   desc: 'Remarque, cancele ou reagende consultas já cadastradas no sistema.', icon: Icon.calendar, tag: 'Clínico' },
    { title: 'Relatórios e questionários', desc: 'Acesse os questionários respondidos pelos pacientes e gere relatórios.', icon: Icon.file, tag: 'Análise' },
    { title: 'Modelos de impressos', desc: 'Gerencie modelos de receitas, laudos e atestados médicos.',           icon: Icon.print, tag: 'Documentos' },
    { title: 'Agenda telefônica',    desc: 'Gerencie os contatos de telefone associados aos seus pacientes.',     icon: Icon.phone, tag: 'Contatos' },
    { title: 'Parâmetros do escore', desc: 'Ajuste limiares de encaminhamento por sexo (♂ 0.56 · ♀ 0.55).',       icon: Icon.sparkle, tag: 'Avançado' },
    { title: 'Equipe clínica',       desc: 'Cadastre médicos, técnicos e gerencie permissões de acesso.',          icon: Icon.users, tag: 'Acesso' },
  ];
  return (
    <div className="anim-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c, i) => (
        <Card key={i} interactive className="p-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--ink)', color: 'var(--on-ink)' }}>{c.icon}</div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: 'var(--honey)' }}>{c.tag}</span>
          </div>
          <h3 className="font-display text-[20px] leading-tight mb-1.5">{c.title}</h3>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{c.desc}</p>
        </Card>
      ))}
    </div>
  );
}
