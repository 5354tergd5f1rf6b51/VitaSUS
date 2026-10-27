// Dados DEMONSTRATIVOS e FICTÍCIOS para o ambiente acadêmico do VitaSUS.
// Nada aqui representa pessoas, unidades ou vagas reais do SUS.
// Uso:  npm run seed   (depois de aplicar o schema no banco)
const prisma = require('./client');
const { gerarHash } = require('../lib/auth');

const SENHA_DEMO = 'Demo@1234';
const DIA = 24 * 3600 * 1000;
const hoje = (() => { const d = new Date(Date.now() - 3 * 3600 * 1000); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); })();
const somarDias = (n) => new Date(hoje.getTime() + n * DIA);
const dia = (d) => d.toISOString().slice(0, 10);
const quando = (d, hhmm) => new Date(`${dia(d)}T${hhmm}:00.000Z`);

// Gera CPFs com dígitos verificadores válidos (apenas para teste).
function cpfDemo(base9) {
  const n = String(base9).padStart(9, '0').split('').map(Number);
  const dv = (arr) => { const s = arr.reduce((a, v, i) => a + v * (arr.length + 1 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  const d1 = dv(n); const d2 = dv([...n, d1]);
  const c = [...n, d1, d2].join('');
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function main() {
  if (await prisma.profissionalSus.findUnique({ where: { email: 'helena.demo@vitasus.demo' } })) {
    console.log('Dados de demonstração já existem. Nada a fazer.');
    return;
  }
  const hash = await gerarHash(SENHA_DEMO);

  const fila = await prisma.filaEspera.create({ data: { tipoAtendimento: 'Consulta', data: hoje } });
  const [centro, poli] = await Promise.all([
    prisma.unidadeAtendimento.create({ data: { nome: 'UBS Demonstração Centro', tipo: 'UBS', endereco: 'Rua Fictícia, 100 (demo)', telefone: '(00) 0000-0001', filaEsperaId: fila.idFilaEspera } }),
    prisma.unidadeAtendimento.create({ data: { nome: 'Policlínica Demonstração', tipo: 'Policlínica', endereco: 'Av. Exemplo, 200 (demo)', telefone: '(00) 0000-0002', filaEsperaId: fila.idFilaEspera } }),
  ]);

  // Horário-base exigido pelo vínculo original ProfissionalSus -> Agenda.
  const base = await prisma.agenda.create({ data: { data: hoje, horario: '00:00', vagasDisponiveis: 0 } });
  const mk = (nome, n, registro, especialidade, email) => prisma.profissionalSus.create({
    data: { nome, cpf: cpfDemo(n), registroProfissional: registro, cargo: 'Profissional de saúde (demo)', especialidade, email, senhaAcesso: hash, agendaId: base.idAgenda },
  });
  const helena = await mk('Dra. Helena Souza (demo)', 100000001, 'CRM-DEMO 0001', 'Clínica Geral', 'helena.demo@vitasus.demo');
  const marcos = await mk('Dr. Marcos Lima (demo)', 100000002, 'CRM-DEMO 0002', 'Cardiologia', 'marcos.demo@vitasus.demo');
  const beatriz = await mk('Dra. Beatriz Rocha (demo)', 100000003, 'CRM-DEMO 0003', 'Pediatria', 'beatriz.demo@vitasus.demo');

  // Horários futuros (próximos dias úteis) para o agendamento demonstrativo.
  const horarios = [['08:00', 2], ['09:00', 1], ['10:00', 2], ['14:00', 1]];
  for (const [prof, unidade] of [[helena, centro], [marcos, poli], [beatriz, centro]]) {
    let criados = 0;
    for (let i = 1; criados < 8; i++) {
      const d = somarDias(i);
      if ([0, 6].includes(d.getUTCDay())) continue;
      criados++;
      for (const [h, vagas] of horarios) {
        await prisma.agenda.create({ data: { data: d, horario: h, vagasDisponiveis: vagas, profissionalId: prof.idProfissionalSus, unidadeId: unidade.idUnidadeAtendimento } });
      }
    }
  }

  const pac = (nome, n, email, nasc) => prisma.paciente.create({
    data: {
      nome, cpf: cpfDemo(n), email, dataNascimento: new Date(`${nasc}T00:00:00.000Z`), telefone: '(00) 90000-0000',
      endereco: 'Endereço fictício, 1 (demo)', nSus: String(700000000000000 + n % 100000), senhaAcesso: hash,
      prontuarios: { create: { dataCriacao: hoje, observacoesGerais: 'Prontuário fictício para demonstração.' } },
    },
    include: { prontuarios: true },
  });
  const juan = await pac('Juan Emanuel (demo)', 200000001, 'juan.demo@vitasus.demo', '1999-09-09');
  const ana = await pac('Ana Clara Prado (demo)', 200000002, 'ana.demo@vitasus.demo', '1988-03-14');
  const carlos = await pac('Carlos Eduardo Vaz (demo)', 200000003, 'carlos.demo@vitasus.demo', '1975-11-02');

  // Agendas "de hoje" e "do passado" (para agenda do profissional e histórico).
  const slot = (d, h, prof, unidade) => prisma.agenda.create({ data: { data: d, horario: h, vagasDisponiveis: 0, profissionalId: prof.idProfissionalSus, unidadeId: unidade.idUnidadeAtendimento } });
  const ag = async (d, h, prof, unidade, paciente, tipo, status) => {
    const s = await slot(d, h, prof, unidade);
    return prisma.agendamento.create({ data: { dataSolicitacao: hoje, dataHora: quando(d, h), tipo, status, agendaId: s.idAgenda, pacienteId: paciente.idPaciente } });
  };

  const passado = await ag(somarDias(-30), '09:00', helena, centro, juan, 'Consulta', 'Concluído');
  await prisma.atendimento.create({ data: { dataHora: passado.dataHora, diagnostico: 'Check-up de rotina (fictício)', prescricao: 'Manter hábitos saudáveis (demo)', observacoes: 'Registro fictício para demonstração.', prontuarioId: juan.prontuarios[0].idProntuario, agendamentoId: passado.idAgendamento, profissionalId: helena.idProfissionalSus } });
  await ag(hoje, '08:30', helena, centro, ana, 'Consulta', 'Confirmado');
  await ag(hoje, '10:00', helena, centro, carlos, 'Consulta', 'Solicitado');
  await ag(hoje, '15:30', helena, centro, juan, 'Retorno', 'Confirmado');
  await ag(somarDias(3), '16:00', marcos, poli, juan, 'Consulta', 'Solicitado');

  await prisma.exame.createMany({ data: [
    { nome: 'Hemograma completo', dataSolicitacao: somarDias(-30), status: 'Resultado disponível', resultado: 'Valores dentro do esperado (dado fictício).', pacienteId: juan.idPaciente },
    { nome: 'Glicemia em jejum', dataSolicitacao: somarDias(-2), status: 'Em análise', resultado: null, pacienteId: juan.idPaciente },
    { nome: 'Radiografia de tórax', dataSolicitacao: hoje, status: 'Solicitado', resultado: null, pacienteId: juan.idPaciente },
    { nome: 'Colesterol total', dataSolicitacao: somarDias(-10), status: 'Resultado disponível', resultado: 'Resultado fictício para demonstração.', pacienteId: ana.idPaciente },
  ] });

  await prisma.notificacao.createMany({ data: [
    { mensagem: 'Bem-vindo ao VitaSUS (ambiente demonstrativo).', dataEnvio: hoje, statusLeitura: 'Não lida', pacienteId: juan.idPaciente },
    { mensagem: 'Resultado de exame disponível: Hemograma completo.', dataEnvio: hoje, statusLeitura: 'Não lida', pacienteId: juan.idPaciente },
    { mensagem: 'Há solicitações de atendimento aguardando confirmação.', dataEnvio: hoje, statusLeitura: 'Não lida', profissionalId: helena.idProfissionalSus },
  ] });

  console.log('Dados de demonstração criados.');
  console.log(`Paciente:     CPF ${juan.cpf}  ou  juan.demo@vitasus.demo   senha: ${SENHA_DEMO}`);
  console.log(`Profissional: CPF ${helena.cpf}  ou  helena.demo@vitasus.demo   senha: ${SENHA_DEMO}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
