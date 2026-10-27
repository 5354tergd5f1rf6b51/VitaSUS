// Formatos de resposta: nunca devolvem hash de senha.
const pacientePublico = (p) => ({
  id: p.idPaciente, nome: p.nome, cpf: p.cpf, email: p.email, telefone: p.telefone,
  dataNascimento: p.dataNascimento, endereco: p.endereco, nSus: p.nSus,
});

const profissionalPublico = (p, unidade = null) => ({
  id: p.idProfissionalSus, nome: p.nome, email: p.email, cargo: p.cargo,
  especialidade: p.especialidade, registroProfissional: p.registroProfissional, unidade,
});

const unidadePublica = (u) => (u ? { id: u.idUnidadeAtendimento, nome: u.nome, endereco: u.endereco } : null);

const STATUS_CANCELAVEIS = ['Solicitado', 'Confirmado'];

function agendamentoPaciente(a) {
  const prof = a.agenda?.profissional;
  return {
    id: a.idAgendamento,
    dataHora: a.dataHora,
    tipo: a.tipo,
    status: a.status,
    dataSolicitacao: a.dataSolicitacao,
    especialidade: prof?.especialidade ?? null,
    profissional: prof?.nome ?? null,
    unidade: unidadePublica(a.agenda?.unidade),
    podeCancelar: STATUS_CANCELAVEIS.includes(a.status),
  };
}

function agendamentoProfissional(a) {
  return {
    id: a.idAgendamento,
    codigo: `AT-${String(a.idAgendamento).padStart(4, '0')}`,
    dataHora: a.dataHora,
    tipo: a.tipo,
    status: a.status,
    especialidade: a.agenda?.profissional?.especialidade ?? null,
    unidade: unidadePublica(a.agenda?.unidade),
    paciente: { id: a.paciente.idPaciente, nome: a.paciente.nome },
    temRegistro: Boolean(a.atendimento),
  };
}

const registro = (r) => (r ? {
  id: r.idAtendimento, dataHora: r.dataHora, diagnostico: r.diagnostico,
  prescricao: r.prescricao, observacoes: r.observacoes,
} : null);

module.exports = {
  pacientePublico, profissionalPublico, unidadePublica, agendamentoPaciente,
  agendamentoProfissional, registro, STATUS_CANCELAVEIS,
};
