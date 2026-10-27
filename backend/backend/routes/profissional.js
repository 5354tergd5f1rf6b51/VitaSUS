const express = require('express');
const router = express.Router();

const prisma = require('../prisma/client');
const {
  HttpErro, conferirSenha, HASH_FALSO, emitirToken, autenticar, exigirPapel, rota,
} = require('../lib/auth');
const { hojeLocal, formatarCpf, texto, cortar, exigirTexto, idDaRota } = require('../lib/util');
const {
  profissionalPublico, unidadePublica, agendamentoProfissional, registro,
} = require('../lib/serializar');

const incluirLista = {
  paciente: true,
  atendimento: true,
  agenda: { include: { profissional: true, unidade: true } },
};

// Unidade principal = a da primeira agenda do profissional que tenha unidade.
async function unidadeDo(profissionalId) {
  const agenda = await prisma.agenda.findFirst({
    where: { profissionalId, unidadeId: { not: null } },
    include: { unidade: true },
    orderBy: { data: 'asc' },
  });
  return unidadePublica(agenda?.unidade);
}

// LOGIN DO PROFISSIONAL
// POST /profissionais/login  { identificador (CPF ou e-mail), senha }
// Profissionais NÃO se cadastram sozinhos: contas são criadas pela administração.
router.post('/login', rota(async (req, res) => {
  const b = req.body || {};
  const identificador = texto(b.identificador ?? b.cpf ?? b.email);
  const senha = String(b.senha ?? '');
  if (!identificador || !senha) throw new HttpErro(400, 'Informe CPF (ou e-mail) e senha.');

  const where = identificador.includes('@')
    ? { email: identificador.toLowerCase() }
    : { cpf: formatarCpf(identificador) };
  const prof = await prisma.profissionalSus.findUnique({ where });

  const ok = await conferirSenha(senha, prof?.senhaAcesso ?? HASH_FALSO);
  if (!prof || !ok) throw new HttpErro(401, 'CPF/e-mail ou senha incorretos.');

  res.json({
    token: emitirToken('profissional', prof.idProfissionalSus),
    papel: 'profissional',
    usuario: profissionalPublico(prof, await unidadeDo(prof.idProfissionalSus)),
  });
}));

// Tudo abaixo exige token de PROFISSIONAL (papel vem do token assinado pelo servidor).
router.use(autenticar, exigirPapel('profissional'));

// Garante que a conta ainda existe e a disponibiliza em req.prof.
router.use(rota(async (req, res, next) => {
  req.prof = await prisma.profissionalSus.findUnique({ where: { idProfissionalSus: req.auth.id } });
  if (!req.prof) throw new HttpErro(401, 'Sessão inválida. Entre novamente.');
  next();
}));

const meusAgendamentos = (req) => ({ agenda: { profissionalId: req.auth.id } });

router.get('/me', rota(async (req, res) => {
  res.json(profissionalPublico(req.prof, await unidadeDo(req.auth.id)));
}));

// Agenda / atendimentos: só os agendamentos dos horários DESTE profissional.
// Filtros opcionais: ?de=AAAA-MM-DD&ate=AAAA-MM-DD&status=Confirmado
router.get('/me/agendamentos', rota(async (req, res) => {
  const where = meusAgendamentos(req);
  const { de, ate, status } = req.query;
  const faixa = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(de || '')) faixa.gte = new Date(`${de}T00:00:00.000Z`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ate || '')) faixa.lte = new Date(`${ate}T23:59:59.999Z`);
  if (faixa.gte || faixa.lte) where.dataHora = faixa;
  if (status) where.status = String(status);

  const lista = await prisma.agendamento.findMany({ where, include: incluirLista, orderBy: { dataHora: 'asc' } });
  res.json(lista.map(agendamentoProfissional));
}));

async function buscarMeuAgendamento(req) {
  const a = await prisma.agendamento.findFirst({
    where: { idAgendamento: idDaRota(req.params.id), ...meusAgendamentos(req) },
    include: incluirLista,
  });
  if (!a) throw new HttpErro(404, 'Atendimento não encontrado.'); // inclui "não é seu"
  return a;
}

router.get('/me/agendamentos/:id', rota(async (req, res) => {
  const a = await buscarMeuAgendamento(req);
  res.json({
    ...agendamentoProfissional(a),
    dataSolicitacao: a.dataSolicitacao,
    // Somente o necessário para identificar o paciente no atendimento.
    paciente: {
      id: a.paciente.idPaciente, nome: a.paciente.nome,
      dataNascimento: a.paciente.dataNascimento, nSus: a.paciente.nSus,
    },
    registro: registro(a.atendimento),
  });
}));

const TRANSICOES = {
  Solicitado: ['Confirmado', 'Cancelado'],
  Confirmado: ['Concluído', 'Cancelado'],
};

router.patch('/me/agendamentos/:id/status', rota(async (req, res) => {
  const a = await buscarMeuAgendamento(req);
  const novo = texto(req.body?.status);
  if (!(TRANSICOES[a.status] || []).includes(novo)) {
    throw new HttpErro(409, `Não é possível mudar de "${a.status}" para "${novo || '—'}".`);
  }

  await prisma.$transaction(async (tx) => {
    const r = await tx.agendamento.updateMany({
      where: { idAgendamento: a.idAgendamento, status: a.status },
      data: { status: novo },
    });
    if (r.count === 0) throw new HttpErro(409, 'O atendimento foi alterado por outra ação. Atualize a página.');
    if (novo === 'Cancelado') {
      await tx.agenda.update({ where: { idAgenda: a.agendaId }, data: { vagasDisponiveis: { increment: 1 } } });
    }
    await tx.notificacao.create({
      data: {
        mensagem: cortar(`Sua consulta foi atualizada para: ${novo}.`, 100),
        dataEnvio: hojeLocal(), statusLeitura: 'Não lida', pacienteId: a.pacienteId,
      },
    });
  });

  const atualizado = await prisma.agendamento.findUnique({ where: { idAgendamento: a.idAgendamento }, include: incluirLista });
  res.json(agendamentoProfissional(atualizado));
}));

// Registro (resumo) do atendimento — vinculado ao agendamento correto.
router.put('/me/agendamentos/:id/registro', rota(async (req, res) => {
  const a = await buscarMeuAgendamento(req);
  if (!['Confirmado', 'Concluído'].includes(a.status)) {
    throw new HttpErro(409, 'Só é possível registrar atendimentos confirmados ou concluídos.');
  }
  const b = req.body || {};
  const diagnostico = exigirTexto(b.diagnostico, 'Resumo do atendimento', { max: 45 });
  const prescricao = texto(b.prescricao);
  const observacoes = texto(b.observacoes);
  if (prescricao.length > 100) throw new HttpErro(400, 'Orientações devem ter no máximo 100 caracteres.');
  if (observacoes.length > 100) throw new HttpErro(400, 'Observações devem ter no máximo 100 caracteres.');

  let prontuario = await prisma.prontuario.findFirst({ where: { pacienteId: a.pacienteId }, orderBy: { idProntuario: 'asc' } });
  if (!prontuario) {
    prontuario = await prisma.prontuario.create({
      data: { dataCriacao: hojeLocal(), observacoesGerais: 'Prontuário aberto no atendimento.', pacienteId: a.pacienteId },
    });
  }

  const dados = { dataHora: a.dataHora, diagnostico, prescricao, observacoes };
  const salvo = await prisma.atendimento.upsert({
    where: { agendamentoId: a.idAgendamento },
    update: dados,
    create: { ...dados, agendamentoId: a.idAgendamento, profissionalId: req.auth.id, prontuarioId: prontuario.idProntuario },
  });
  res.json(registro(salvo));
}));

// Registros feitos por este profissional.
router.get('/me/registros', rota(async (req, res) => {
  const lista = await prisma.atendimento.findMany({
    where: { profissionalId: req.auth.id },
    include: { agendamento: { include: { paciente: true } } },
    orderBy: { dataHora: 'desc' },
  });
  res.json(lista.map((r) => ({
    ...registro(r),
    agendamentoId: r.agendamentoId,
    tipo: r.agendamento?.tipo ?? null,
    paciente: r.agendamento ? { id: r.agendamento.paciente.idPaciente, nome: r.agendamento.paciente.nome } : null,
  })));
}));

// Pacientes autorizados = quem tem atendimento na agenda deste profissional.
router.get('/me/pacientes', rota(async (req, res) => {
  const pacientes = await prisma.paciente.findMany({
    where: { agendamentos: { some: meusAgendamentos(req) } },
    include: { agendamentos: { where: meusAgendamentos(req), orderBy: { dataHora: 'desc' } } },
    orderBy: { nome: 'asc' },
  });
  res.json(pacientes.map((p) => ({
    id: p.idPaciente, nome: p.nome, dataNascimento: p.dataNascimento, nSus: p.nSus,
    totalAtendimentos: p.agendamentos.length,
    ultimoAtendimento: p.agendamentos[0]?.dataHora ?? null,
  })));
}));

router.get('/me/pacientes/:id', rota(async (req, res) => {
  const id = idDaRota(req.params.id);
  const paciente = await prisma.paciente.findFirst({
    where: { idPaciente: id, agendamentos: { some: meusAgendamentos(req) } },
  });
  if (!paciente) throw new HttpErro(404, 'Paciente não encontrado entre os seus pacientes autorizados.');

  const ags = await prisma.agendamento.findMany({
    where: { pacienteId: id, ...meusAgendamentos(req) },
    include: incluirLista,
    orderBy: { dataHora: 'desc' },
  });
  res.json({
    paciente: { id: paciente.idPaciente, nome: paciente.nome, dataNascimento: paciente.dataNascimento, nSus: paciente.nSus },
    atendimentos: ags.map((a) => ({ ...agendamentoProfissional(a), registro: registro(a.atendimento) })),
  });
}));

router.get('/me/notificacoes', rota(async (req, res) => {
  const lista = await prisma.notificacao.findMany({
    where: { profissionalId: req.auth.id },
    orderBy: [{ dataEnvio: 'desc' }, { idNotificacao: 'desc' }],
  });
  res.json(lista.map((n) => ({ id: n.idNotificacao, mensagem: n.mensagem, dataEnvio: n.dataEnvio, lida: n.statusLeitura === 'Lida' })));
}));

router.patch('/me/notificacoes/:id/lida', rota(async (req, res) => {
  const r = await prisma.notificacao.updateMany({
    where: { idNotificacao: idDaRota(req.params.id), profissionalId: req.auth.id },
    data: { statusLeitura: 'Lida' },
  });
  if (r.count === 0) throw new HttpErro(404, 'Notificação não encontrada.');
  res.json({ ok: true });
}));

module.exports = router;
