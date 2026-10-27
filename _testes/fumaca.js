// Teste de fumaça de autenticação/autorização com Prisma SIMULADO (sem MySQL).
const path = require('path');
const B = '/home/claude/work/VitaSUS/VitaSUS/backend/backend';
const bcrypt = require(B + '/node_modules/bcrypt');
const clientePath = require.resolve(B + '/prisma/client.js');

const pac = { idPaciente: 1, nome: 'Maria Teste', cpf: '529.982.247-25', email: 'maria@teste.com', telefone: '84999990000',
  dataNascimento: new Date('1990-01-01'), endereco: 'Rua A, 1', nSus: '123', senhaAcesso: bcrypt.hashSync('segredo1', 4) };
const prof = { idProfissionalSus: 7, nome: 'Dra. Fictícia', cpf: '111.444.777-35', email: 'dra@vitasus.demo', cargo: 'Médica',
  especialidade: 'Clínica Geral', registroProfissional: 'CRM-DEMO', senhaAcesso: bcrypt.hashSync('profsenha', 4) };
const agDeOutro = { idAgendamento: 9, agenda: { profissionalId: 99 } };

require.cache[clientePath] = { id: clientePath, filename: clientePath, loaded: true, exports: {
  paciente: {
    findUnique: async ({ where }) => (where.email === pac.email || where.cpf === pac.cpf || where.idPaciente === 1 ? pac : null),
    findFirst: async () => null, findMany: async () => [],
    create: async ({ data }) => ({ ...pac, ...data, idPaciente: 2 }),
  },
  profissionalSus: { findUnique: async ({ where }) => (where.email === prof.email || where.cpf === prof.cpf || where.idProfissionalSus === 7 ? prof : null) },
  agenda: { findFirst: async () => null },
  agendamento: {
    // simula o filtro do banco: só devolve se pertencer ao profissional logado
    findFirst: async ({ where }) => (where.agenda?.profissionalId === agDeOutro.agenda.profissionalId ? agDeOutro : null),
    findMany: async () => [],
  },
}};

const app = require(B + '/app.js');
const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const chamar = async (m, u, corpo, token) => {
    const r = await fetch(base + u, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
    return { s: r.status, j: await r.json().catch(() => ({})) };
  };
  let falhas = 0;
  const t = (nome, ok, extra = '') => { if (!ok) falhas++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome} ${extra}`); };

  let r = await chamar('POST', '/pacientes/login', { identificador: '529.982.247-25', senha: 'errada' });
  t('login paciente com senha errada -> 401', r.s === 401);
  r = await chamar('POST', '/pacientes/login', { identificador: '52998224725', senha: 'segredo1' });
  // CPF sem máscara deve ser normalizado
  t('login paciente por CPF sem máscara -> 200 + token', r.s === 200 && !!r.j.token, `(status ${r.s})`);
  t('resposta de login NÃO traz hash de senha', r.j.usuario && !('senhaAcesso' in r.j.usuario));
  const tokP = r.j.token;
  r = await chamar('POST', '/pacientes/login', { identificador: 'maria@teste.com', senha: 'segredo1' });
  t('login paciente por e-mail -> 200', r.s === 200);
  r = await chamar('POST', '/pacientes/login', { identificador: 'ninguem@x.com', senha: 'x' });
  t('login usuário inexistente -> 401 (mesma mensagem)', r.s === 401);

  r = await chamar('GET', '/pacientes/me');
  t('GET /pacientes/me sem token -> 401', r.s === 401);
  r = await chamar('GET', '/pacientes/me', null, tokP);
  t('GET /pacientes/me com token de paciente -> 200', r.s === 200 && r.j.nome === 'Maria Teste' && !('senhaAcesso' in r.j));
  r = await chamar('GET', '/pacientes/me', null, 'token.invalido.aqui');
  t('token adulterado -> 401', r.s === 401);

  r = await chamar('GET', '/profissionais/me', null, tokP);
  t('PACIENTE em rota de profissional -> 403', r.s === 403);
  r = await chamar('GET', '/profissionais/me/agendamentos', null, tokP);
  t('PACIENTE na agenda do profissional -> 403', r.s === 403);
  r = await chamar('GET', '/pacientes', null, tokP);
  t('PACIENTE listando todos os pacientes -> 403', r.s === 403);
  r = await chamar('GET', '/profissionais/me');
  t('profissional sem token -> 401', r.s === 401);

  r = await chamar('POST', '/profissionais/login', { identificador: 'dra@vitasus.demo', senha: 'profsenha' });
  t('login profissional -> 200 + papel profissional', r.s === 200 && r.j.papel === 'profissional');
  const tokF = r.j.token;
  r = await chamar('GET', '/pacientes/me', null, tokF);
  t('PROFISSIONAL em rota /pacientes/me -> 403', r.s === 403);
  r = await chamar('GET', '/profissionais/me', null, tokF);
  t('profissional em /profissionais/me -> 200', r.s === 200 && r.j.nome === 'Dra. Fictícia');
  r = await chamar('GET', '/profissionais/me/agendamentos/9', null, tokF);
  t('atendimento de OUTRO profissional -> 404', r.s === 404);
  r = await chamar('PATCH', '/profissionais/me/agendamentos/9/status', { status: 'Confirmado' }, tokF);
  t('alterar status de atendimento alheio -> 404', r.s === 404);
  r = await chamar('PATCH', '/profissionais/me/agendamentos/abc/status', { status: 'x' }, tokF);
  t('id inválido -> 400', r.s === 400);

  r = await chamar('POST', '/pacientes', { nome: 'Fulano Teste', cpf: '111.111.111-11', email: 'a@b.co', senha: '123456', dataNascimento: '2000-01-01', telefone: '84999990000', endereco: 'x', nSus: '1' });
  t('cadastro com CPF inválido -> 400', r.s === 400, r.j.error);
  r = await chamar('POST', '/pacientes', { nome: 'Fulano Teste', cpf: '529.982.247-25', email: 'a@b.co', senha: '123', dataNascimento: '2000-01-01', telefone: '84999990000', endereco: 'x', nSus: '1' });
  t('cadastro com senha curta -> 400', r.s === 400, r.j.error);
  r = await chamar('POST', '/pacientes', { nome: 'Fulano Teste', cpf: '529.982.247-25', email: 'a@b.co', senha: '123456', dataNascimento: '2999-01-01', telefone: '84999990000', endereco: 'x', nSus: '1' });
  t('cadastro com nascimento no futuro -> 400', r.s === 400, r.j.error);
  r = await chamar('POST', '/pacientes', { nome: 'Fulano Teste', cpf: '52998224725', email: 'a@b.co', senha: '123456', dataNascimento: '2000-01-01', telefone: '84999990000', endereco: 'Rua X', nSus: '1' });
  t('cadastro válido -> 201 sem hash', r.s === 201 && !('senhaAcesso' in r.j), `(status ${r.s})`);
  r = await chamar('GET', '/rota-inexistente');
  console.log(falhas === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${falhas} FALHA(S)`);
  server.close(); process.exit(falhas ? 1 : 0);
});
