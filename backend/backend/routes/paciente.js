const express = require('express');
const router = express.Router();

// Usa o Prisma client centralizado, criado uma única vez para a aplicação.
const prisma = require('../prisma/client');
const {
  HttpErro, gerarHash, conferirSenha, HASH_FALSO, emitirToken, autenticar, exigirPapel, rota,
} = require('../lib/auth');
const {
  agoraLocal, hojeLocal, combinarDataHora, soDigitos, formatarCpf, cpfValido, emailValido,
  texto, cortar, exigirTexto, idDaRota,
} = require('../lib/util');
const { pacientePublico, unidadePublica, agendamentoPaciente, registro } = require('../lib/serializar');

const incluirAgenda = {
  agenda: { include: { profissional: true, unidade: true } },
};

// ---------------------------------------------------------------------------
// ROTAS PÚBLICAS
// ---------------------------------------------------------------------------

// CRIAR UM NOVO PACIENTE (cadastro)
// POST /pacientes
router.post('/', rota(async (req, res) => {
  const b = req.body || {};
  // Aceita também os nomes antigos do corpo (nomePaciente, emailPaciente, senhaPaciente).
  const nome = exigirTexto(b.nome ?? b.nomePaciente, 'Nome', { min: 3, max: 100 });
  const email = texto(b.email ?? b.emailPaciente).toLowerCase();
  const senha = String(b.senha ?? b.senhaPaciente ?? '');
  const cpf = formatarCpf(b.cpf);

  if (!cpfValido(cpf)) throw new HttpErro(400, 'CPF inválido.');
  if (!emailValido(email) || email.length > 100) throw new HttpErro(400, 'E-mail inválido.');
  if (senha.length < 6) throw new HttpErro(400, 'A senha deve ter pelo menos 6 caracteres.');

  const nascimento = new Date(`${texto(b.dataNascimento)}T00:00:00.000Z`);
  if (Number.isNaN(nascimento.getTime()) || nascimento > hojeLocal()) {
    throw new HttpErro(400, 'Data de nascimento inválida.');
  }

  const dados = {
    nome, cpf, email, dataNascimento: nascimento,
    telefone: exigirTexto(b.telefone, 'Telefone', { min: 8, max: 15 }),
    endereco: exigirTexto(b.endereco, 'Endereço', { max: 100 }),
    nSus: exigirTexto(b.nSus, 'Cartão SUS', { max: 45 }),
    senhaAcesso: await gerarHash(senha),
  };

  const paciente = await prisma.paciente.create({
    data: {
      ...dados,
      // Todo paciente nasce com um prontuário, onde os atendimentos serão registrados.
      prontuarios: {
        create: { dataCriacao: hojeLocal(), observacoesGerais: 'Prontuário aberto no cadastro.' },
      },
    },
  }).catch((e) => {
    if (e.code === 'P2002') throw new HttpErro(409, 'Já existe um paciente com esse CPF ou e-mail.');
    throw e;
  });

  res.status(201).json(pacientePublico(paciente));
}));

// LOGIN DO PACIENTE
// POST /pacientes/login  { identificador (CPF ou e-mail), senha }
router.post('/login', rota(async (req, res) => {
  const b = req.body || {};
  const identificador = texto(b.identificador ?? b.cpf ?? b.email);
  const senha = String(b.senha ?? '');
  if (!identificador || !senha) throw new HttpErro(400, 'Informe CPF (ou e-mail) e senha.');

  const where = identificador.includes('@')
    ? { email: identificador.toLowerCase() }
    : { cpf: formatarCpf(identificador) };
  const paciente = await prisma.paciente.findUnique({ where });

  const ok = await conferirSenha(senha, paciente?.senhaAcesso ?? HASH_FALSO);
  if (!paciente || !ok) throw new HttpErro(401, 'CPF/e-mail ou senha incorretos.');

  res.json({
    token: emitirToken('paciente', paciente.idPaciente),
    papel: 'paciente',
    usuario: pacientePublico(paciente),
  });
}));

// ---------------------------------------------------------------------------
// ÁREA DO PACIENTE LOGADO  (/pacientes/me/...)
// Declaradas antes de "/:cpf" para que "me" não seja tratado como CPF.
// ---------------------------------------------------------------------------
const me = express.Router();
me.use(autenticar, exigirPapel('paciente'));

me.get('/', rota(async (req, res) => {
  const paciente = await prisma.paciente.findUnique({ where: { idPaciente: req.auth.id } });
  if (!paciente) throw new HttpErro(401, 'Sessão inválida. Entre novamente.');
  res.json(pacientePublico(paciente));
}));

// Horários cadastrados e com vaga (ambiente demonstrativo, não são vagas reais do SUS).
me.get('/opcoes-agendamento', rota(async (req, res) => {
  const horarios = await prisma.agenda.findMany({
    where: { data: { gte: hojeLocal() }, vagasDisponiveis: { gt: 0 }, profissionalId: { not: null } },
    include: { profissional: true, unidade: true },
    orderBy: [{ data: 'asc' }, { horario: 'asc' }],
  });
  const limite = agoraLocal();
  res.json(
    horarios
      .filter((h) => combinarDataHora(h.data, h.horario) > limite)
      .map((h) => ({
        idAgenda: h.idAgenda,
        data: h.data,
        horario: h.horario,
        vagas: h.vagasDisponiveis,
        especialidade: h.profissional.especialidade,
        profissional: h.profissional.nome,
        unidade: unidadePublica(h.unidade),
      })),
  );
}));

me.get('/agendamentos', rota(async (req, res) => {
  const lista = await prisma.agendamento.findMany({
    where: { pacienteId: req.auth.id },
    include: incluirAgenda,
    orderBy: { dataHora: 'desc' },
  });
  res.json(lista.map(agendamentoPaciente));
}));

me.get('/agendamentos/:id', rota(async (req, res) => {
  const a = await prisma.agendamento.findFirst({
    where: { idAgendamento: idDaRota(req.params.id), pacienteId: req.auth.id },
    include: incluirAgenda,
  });
  if (!a) throw new HttpErro(404, 'Consulta não encontrada.');
  res.json(agendamentoPaciente(a));
}));

// Solicitar agendamento: reserva uma vaga de forma atômica.
me.post('/agendamentos', rota(async (req, res) => {
  const agendaId = idDaRota(req.body?.agendaId);
  const tipo = ['Consulta', 'Retorno'].includes(req.body?.tipo) ? req.body.tipo : 'Consulta';

  const agenda = await prisma.agenda.findUnique({ where: { idAgenda: agendaId }, include: { profissional: true } });
  if (!agenda || !agenda.profissional) throw new HttpErro(404, 'Horário não encontrado.');
  const dataHora = combinarDataHora(agenda.data, agenda.horario);
  if (dataHora <= agoraLocal()) throw new HttpErro(400, 'Este horário já passou.');

  const repetido = await prisma.agendamento.findFirst({
    where: { pacienteId: req.auth.id, agendaId, status: { not: 'Cancelado' } },
  });
  if (repetido) throw new HttpErro(409, 'Você já tem uma solicitação para este horário.');

  const criado = await prisma.$transaction(async (tx) => {
    const reserva = await tx.agenda.updateMany({
      where: { idAgenda: agendaId, vagasDisponiveis: { gt: 0 } },
      data: { vagasDisponiveis: { decrement: 1 } },
    });
    if (reserva.count === 0) throw new HttpErro(409, 'Este horário não tem mais vagas.');

    const novo = await tx.agendamento.create({
      data: { dataSolicitacao: hojeLocal(), dataHora, tipo, status: 'Solicitado', agendaId, pacienteId: req.auth.id },
      include: incluirAgenda,
    });
    await tx.notificacao.createMany({
      data: [
        { mensagem: cortar(`Solicitação de ${tipo.toLowerCase()} enviada. Aguarde a confirmação.`, 100), dataEnvio: hojeLocal(), statusLeitura: 'Não lida', pacienteId: req.auth.id },
        { mensagem: cortar('Nova solicitação de atendimento na sua agenda.', 100), dataEnvio: hojeLocal(), statusLeitura: 'Não lida', profissionalId: agenda.profissionalId },
      ],
    });
    return novo;
  });

  res.status(201).json(agendamentoPaciente(criado));
}));

me.patch('/agendamentos/:id/cancelar', rota(async (req, res) => {
  const id = idDaRota(req.params.id);
  const a = await prisma.agendamento.findFirst({
    where: { idAgendamento: id, pacienteId: req.auth.id },
    include: incluirAgenda,
  });
  if (!a) throw new HttpErro(404, 'Consulta não encontrada.');
  if (!agendamentoPaciente(a).podeCancelar) throw new HttpErro(409, 'Esta consulta não pode mais ser cancelada.');

  const atualizado = await prisma.$transaction(async (tx) => {
    const r = await tx.agendamento.updateMany({
      where: { idAgendamento: id, status: { in: ['Solicitado', 'Confirmado'] } },
      data: { status: 'Cancelado' },
    });
    if (r.count === 0) throw new HttpErro(409, 'Esta consulta não pode mais ser cancelada.');
    await tx.agenda.update({ where: { idAgenda: a.agendaId }, data: { vagasDisponiveis: { increment: 1 } } });
    if (a.agenda.profissionalId) {
      await tx.notificacao.create({
        data: { mensagem: cortar('Um paciente cancelou um atendimento da sua agenda.', 100), dataEnvio: hojeLocal(), statusLeitura: 'Não lida', profissionalId: a.agenda.profissionalId },
      });
    }
    return tx.agendamento.findUnique({ where: { idAgendamento: id }, include: incluirAgenda });
  });
  res.json(agendamentoPaciente(atualizado));
}));

me.get('/historico', rota(async (req, res) => {
  const lista = await prisma.atendimento.findMany({
    where: { prontuario: { pacienteId: req.auth.id } },
    include: { profissional: true, agendamento: true },
    orderBy: { dataHora: 'desc' },
  });
  res.json(lista.map((r) => ({
    ...registro(r),
    tipo: r.agendamento?.tipo ?? 'Atendimento',
    profissional: r.profissional?.nome ?? null,
    especialidade: r.profissional?.especialidade ?? null,
  })));
}));

me.get('/exames', rota(async (req, res) => {
  const lista = await prisma.exame.findMany({ where: { pacienteId: req.auth.id }, orderBy: { dataSolicitacao: 'desc' } });
  res.json(lista.map((e) => ({
    id: e.idExame, nome: e.nome, dataSolicitacao: e.dataSolicitacao, status: e.status, resultado: e.resultado,
  })));
}));

me.get('/notificacoes', rota(async (req, res) => {
  const lista = await prisma.notificacao.findMany({
    where: { pacienteId: req.auth.id },
    orderBy: [{ dataEnvio: 'desc' }, { idNotificacao: 'desc' }],
  });
  res.json(lista.map((n) => ({ id: n.idNotificacao, mensagem: n.mensagem, dataEnvio: n.dataEnvio, lida: n.statusLeitura === 'Lida' })));
}));

me.patch('/notificacoes/:id/lida', rota(async (req, res) => {
  const r = await prisma.notificacao.updateMany({
    where: { idNotificacao: idDaRota(req.params.id), pacienteId: req.auth.id },
    data: { statusLeitura: 'Lida' },
  });
  if (r.count === 0) throw new HttpErro(404, 'Notificação não encontrada.');
  res.json({ ok: true });
}));

router.use('/me', me);

// ---------------------------------------------------------------------------
// ROTAS ORIGINAIS (preservadas e corrigidas). Agora exigem autenticação:
// o paciente acessa apenas o próprio cadastro; o profissional, apenas
// pacientes que têm atendimento na sua agenda.
// ---------------------------------------------------------------------------

// Pacientes com algum atendimento na agenda deste profissional.
const pacientesDoProfissional = (profissionalId) => ({
  agendamentos: { some: { agenda: { profissionalId } } },
});

// LISTAR PACIENTES  (GET /pacientes) — somente profissional, só os autorizados
router.get('/', autenticar, exigirPapel('profissional'), rota(async (req, res) => {
  const pacientes = await prisma.paciente.findMany({
    where: pacientesDoProfissional(req.auth.id),
    orderBy: { nome: 'asc' },
  });
  res.json(pacientes.map((p) => ({ id: p.idPaciente, nome: p.nome, dataNascimento: p.dataNascimento, nSus: p.nSus })));
}));

// BUSCAR UM PACIENTE POR CPF  (GET /pacientes/:cpf)
router.get('/:cpf', autenticar, rota(async (req, res) => {
  const cpf = formatarCpf(req.params.cpf);
  const where = req.auth.papel === 'profissional'
    ? { cpf, ...pacientesDoProfissional(req.auth.id) }
    : { cpf, idPaciente: req.auth.id };
  const paciente = await prisma.paciente.findFirst({ where });
  // 404 também para "sem permissão", para não revelar quais CPFs existem.
  if (!paciente) throw new HttpErro(404, 'Paciente não encontrado.');
  if (req.auth.papel === 'profissional') {
    return res.json({ id: paciente.idPaciente, nome: paciente.nome, dataNascimento: paciente.dataNascimento, nSus: paciente.nSus });
  }
  return res.json(pacientePublico(paciente));
}));

// ATUALIZAR UM PACIENTE  (PUT /pacientes/:cpf) — somente o próprio paciente
router.put('/:cpf', autenticar, exigirPapel('paciente'), rota(async (req, res) => {
  const cpf = formatarCpf(req.params.cpf);
  const atual = await prisma.paciente.findFirst({ where: { cpf, idPaciente: req.auth.id } });
  if (!atual) throw new HttpErro(404, 'Paciente não encontrado para atualizar.');

  const b = req.body || {};
  const dados = {};
  const nome = b.nome ?? b.nomePaciente;
  const email = b.email ?? b.emailPaciente;
  const senha = b.senha ?? b.senhaPaciente;
  if (nome !== undefined) dados.nome = exigirTexto(nome, 'Nome', { min: 3, max: 100 });
  if (email !== undefined) {
    const e = texto(email).toLowerCase();
    if (!emailValido(e) || e.length > 100) throw new HttpErro(400, 'E-mail inválido.');
    dados.email = e;
  }
  if (b.telefone !== undefined) dados.telefone = exigirTexto(b.telefone, 'Telefone', { min: 8, max: 15 });
  if (b.endereco !== undefined) dados.endereco = exigirTexto(b.endereco, 'Endereço', { max: 100 });
  if (senha !== undefined) {
    if (String(senha).length < 6) throw new HttpErro(400, 'A senha deve ter pelo menos 6 caracteres.');
    dados.senhaAcesso = await gerarHash(String(senha));
  }

  const atualizado = await prisma.paciente.update({ where: { idPaciente: atual.idPaciente }, data: dados });
  res.status(200).json(pacientePublico(atualizado));
}));

// EXCLUIR UM PACIENTE  (DELETE /pacientes/:cpf) — somente o próprio paciente
router.delete('/:cpf', autenticar, exigirPapel('paciente'), rota(async (req, res) => {
  const cpf = formatarCpf(req.params.cpf);
  const atual = await prisma.paciente.findFirst({ where: { cpf, idPaciente: req.auth.id } });
  if (!atual) throw new HttpErro(404, 'Paciente não encontrado para deletar.');
  try {
    await prisma.paciente.delete({ where: { idPaciente: atual.idPaciente } });
  } catch (e) {
    if (e.code === 'P2003') {
      throw new HttpErro(409, 'Não é possível excluir: há consultas, exames ou registros vinculados a este cadastro.');
    }
    throw e;
  }
  res.status(200).json({ message: 'Paciente deletado com sucesso' });
}));

module.exports = router;
