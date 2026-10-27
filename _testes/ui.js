// Teste de interface em Chromium real. API SIMULADA (interceptação de rede) seguindo o contrato do backend.
const { chromium } = require('playwright')
const http = require('http'), fs = require('fs'), path = require('path')

const SITE = '/tmp/site', SHOTS = '/home/claude/work/teste/shots'
fs.mkdirSync(SHOTS, { recursive: true })
const servidor = http.createServer((req, res) => {
  let f = req.url.split('?')[0]
  const arq = path.join(SITE, f === '/' || !path.extname(f) ? 'index.html' : f)
  const pub = path.join('/home/claude/work/VitaSUS/VitaSUS/frontend/vitasus-frontend/public', f)
  const real = fs.existsSync(arq) ? arq : fs.existsSync(pub) ? pub : path.join(SITE, 'index.html')
  const tipo = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.html': 'text/html' }[path.extname(real)] || 'text/plain'
  res.writeHead(200, { 'Content-Type': tipo }); res.end(fs.readFileSync(real))
})

// ---------- API simulada ----------
const hoje = new Date(), p2 = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
const em = (n) => { const d = new Date(hoje); d.setDate(d.getDate() + n); return iso(d) }
const dh = (dia, h) => `${dia}T${h}:00.000Z`
const unidade = { id: 1, nome: 'UBS Demonstração Centro', endereco: 'Rua Fictícia, 100 (demo)' }
const usuarioP = { id: 1, nome: 'Juan Emanuel (demo)', cpf: '529.982.247-25', email: 'juan.demo@vitasus.demo', telefone: '(00) 90000-0000', dataNascimento: '1999-09-09T00:00:00.000Z', endereco: 'Endereço fictício, 1', nSus: '700000000000001' }
const usuarioF = { id: 7, nome: 'Dra. Helena Souza (demo)', email: 'helena.demo@vitasus.demo', cargo: 'Profissional de saúde (demo)', especialidade: 'Clínica Geral', registroProfissional: 'CRM-DEMO 0001', unidade }
const estado = {
  consultasP: [
    { id: 10, dataHora: dh(em(2), '09:00'), tipo: 'Consulta', status: 'Confirmado', dataSolicitacao: em(-1), especialidade: 'Clínica Geral', profissional: 'Dra. Helena Souza (demo)', unidade, podeCancelar: true },
    { id: 11, dataHora: dh(em(-30), '09:00'), tipo: 'Consulta', status: 'Concluído', dataSolicitacao: em(-35), especialidade: 'Clínica Geral', profissional: 'Dra. Helena Souza (demo)', unidade, podeCancelar: false },
  ],
  opcoes: [
    { idAgenda: 1, data: em(3) + 'T00:00:00.000Z', horario: '08:00', vagas: 2, especialidade: 'Clínica Geral', profissional: 'Dra. Helena Souza (demo)', unidade },
    { idAgenda: 2, data: em(3) + 'T00:00:00.000Z', horario: '10:00', vagas: 1, especialidade: 'Clínica Geral', profissional: 'Dra. Helena Souza (demo)', unidade },
    { idAgenda: 3, data: em(4) + 'T00:00:00.000Z', horario: '14:00', vagas: 1, especialidade: 'Cardiologia', profissional: 'Dr. Marcos Lima (demo)', unidade: { id: 2, nome: 'Policlínica Demonstração', endereco: 'Av. Exemplo, 200 (demo)' } },
  ],
  avisosP: [{ id: 1, mensagem: 'Bem-vindo ao VitaSUS (ambiente demonstrativo).', dataEnvio: em(0), lida: false }, { id: 2, mensagem: 'Resultado de exame disponível: Hemograma completo.', dataEnvio: em(-1), lida: true }],
  avisosF: [{ id: 5, mensagem: 'Há solicitações de atendimento aguardando confirmação.', dataEnvio: em(0), lida: false }],
  agsF: [
    { id: 1, codigo: 'AT-0001', dataHora: dh(em(0), '08:30'), tipo: 'Consulta', status: 'Confirmado', especialidade: 'Clínica Geral', unidade, paciente: { id: 2, nome: 'Ana Clara Prado (demo)' }, temRegistro: false },
    { id: 2, codigo: 'AT-0002', dataHora: dh(em(0), '23:00'), tipo: 'Consulta', status: 'Solicitado', especialidade: 'Clínica Geral', unidade, paciente: { id: 3, nome: 'Carlos Eduardo Vaz (demo)' }, temRegistro: false },
    { id: 3, codigo: 'AT-0003', dataHora: dh(em(-30), '09:00'), tipo: 'Consulta', status: 'Concluído', especialidade: 'Clínica Geral', unidade, paciente: { id: 1, nome: 'Juan Emanuel (demo)' }, temRegistro: true },
  ],
  registros: { 3: { id: 1, dataHora: dh(em(-30), '09:00'), diagnostico: 'Check-up de rotina (fictício)', prescricao: 'Manter hábitos saudáveis (demo)', observacoes: 'Registro fictício.' } },
}
const pacDetalhe = { 1: { id: 1, nome: 'Juan Emanuel (demo)', dataNascimento: '1999-09-09T00:00:00.000Z', nSus: '700000000000001' }, 2: { id: 2, nome: 'Ana Clara Prado (demo)', dataNascimento: '1988-03-14T00:00:00.000Z', nSus: '700000000000002' }, 3: { id: 3, nome: 'Carlos Eduardo Vaz (demo)', dataNascimento: '1975-11-02T00:00:00.000Z', nSus: '700000000000003' } }

function api(metodo, url, auth, corpo) {
  const rota = url.replace('http://api.test', '')
  const ok = (j, s = 200) => ({ s, j })
  const papel = auth === 'Bearer tok-p' ? 'paciente' : auth === 'Bearer tok-f' ? 'profissional' : null
  if (rota === '/pacientes/login') return corpo.senha === 'Demo@1234' && corpo.identificador.startsWith('529') ? ok({ token: 'tok-p', papel: 'paciente', usuario: usuarioP }) : ok({ error: 'CPF/e-mail ou senha incorretos.' }, 401)
  if (rota === '/profissionais/login') return corpo.senha === 'Demo@1234' && corpo.identificador.includes('helena') ? ok({ token: 'tok-f', papel: 'profissional', usuario: usuarioF }) : ok({ error: 'CPF/e-mail ou senha incorretos.' }, 401)
  if (rota === '/pacientes' && metodo === 'POST') return corpo.email === 'dup@x.com' ? ok({ error: 'Já existe um paciente com esse CPF ou e-mail.' }, 409) : ok({ id: 9 }, 201)
  if (!papel) return ok({ error: 'Faça login para continuar.' }, 401)
  if (rota.startsWith('/pacientes/me') && papel !== 'paciente') return ok({ error: 'Você não tem permissão para acessar este recurso.' }, 403)
  if (rota.startsWith('/profissionais/me') && papel !== 'profissional') return ok({ error: 'Você não tem permissão para acessar este recurso.' }, 403)
  let m
  if (rota === '/pacientes/me') return ok(usuarioP)
  if (rota === '/pacientes/me/opcoes-agendamento') return ok(estado.opcoes)
  if (rota === '/pacientes/me/agendamentos' && metodo === 'GET') return ok(estado.consultasP)
  if (rota === '/pacientes/me/agendamentos' && metodo === 'POST') {
    const o = estado.opcoes.find((x) => x.idAgenda === corpo.agendaId)
    const novo = { id: 20 + estado.consultasP.length, dataHora: dh(o.data.slice(0, 10), o.horario), tipo: corpo.tipo, status: 'Solicitado', dataSolicitacao: em(0), especialidade: o.especialidade, profissional: o.profissional, unidade: o.unidade, podeCancelar: true }
    estado.consultasP.push(novo); estado.opcoes = estado.opcoes.filter((x) => x !== o); return ok(novo, 201)
  }
  if ((m = rota.match(/^\/pacientes\/me\/agendamentos\/(\d+)\/cancelar$/))) { const c = estado.consultasP.find((x) => x.id === +m[1]); c.status = 'Cancelado'; c.podeCancelar = false; return ok(c) }
  if (rota === '/pacientes/me/historico') return ok([{ id: 1, dataHora: dh(em(-30), '09:00'), diagnostico: 'Check-up de rotina (fictício)', prescricao: 'Manter hábitos saudáveis (demo)', observacoes: 'Registro fictício.', tipo: 'Consulta', profissional: 'Dra. Helena Souza (demo)', especialidade: 'Clínica Geral' }])
  if (rota === '/pacientes/me/exames') return ok([{ id: 1, nome: 'Hemograma completo', dataSolicitacao: em(-30), status: 'Resultado disponível', resultado: 'Valores dentro do esperado (dado fictício).' }, { id: 2, nome: 'Glicemia em jejum', dataSolicitacao: em(-2), status: 'Em análise', resultado: null }])
  if (rota === '/pacientes/me/notificacoes') return ok(estado.avisosP)
  if ((m = rota.match(/^\/pacientes\/me\/notificacoes\/(\d+)\/lida$/))) { estado.avisosP.find((n) => n.id === +m[1]).lida = true; return ok({ ok: true }) }
  if (rota === '/profissionais/me') return ok(usuarioF)
  if (rota === '/profissionais/me/agendamentos') return ok(estado.agsF)
  if ((m = rota.match(/^\/profissionais\/me\/agendamentos\/(\d+)$/))) { const a = estado.agsF.find((x) => x.id === +m[1]); return ok({ ...a, dataSolicitacao: em(-3), paciente: pacDetalhe[a.paciente.id], registro: estado.registros[a.id] ?? null }) }
  if ((m = rota.match(/^\/profissionais\/me\/agendamentos\/(\d+)\/status$/))) { const a = estado.agsF.find((x) => x.id === +m[1]); a.status = corpo.status; return ok(a) }
  if ((m = rota.match(/^\/profissionais\/me\/agendamentos\/(\d+)\/registro$/))) { const a = estado.agsF.find((x) => x.id === +m[1]); a.temRegistro = true; estado.registros[a.id] = { id: 50, dataHora: a.dataHora, ...corpo }; return ok(estado.registros[a.id]) }
  if (rota === '/profissionais/me/registros') return ok(Object.entries(estado.registros).map(([ag, r]) => ({ ...r, agendamentoId: +ag, tipo: 'Consulta', paciente: estado.agsF.find((x) => x.id === +ag).paciente })))
  if (rota === '/profissionais/me/pacientes') return ok(Object.values(pacDetalhe).map((p) => ({ ...p, totalAtendimentos: 1, ultimoAtendimento: dh(em(0), '08:30') })))
  if ((m = rota.match(/^\/profissionais\/me\/pacientes\/(\d+)$/))) return ok({ paciente: pacDetalhe[+m[1]], atendimentos: estado.agsF.filter((a) => a.paciente.id === +m[1]).map((a) => ({ ...a, registro: estado.registros[a.id] ?? null })) })
  if (rota === '/profissionais/me/notificacoes') return ok(estado.avisosF)
  return ok({ error: 'Rota não encontrada.' }, 404)
}

;(async () => {
  await new Promise((r) => servidor.listen(8765, r))
  const browser = await chromium.launch()
  let falhas = 0
  const t = (nome, ok, extra = '') => { if (!ok) falhas++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${nome}${extra ? '  -> ' + extra : ''}`) }

  async function novaPagina(largura, altura) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: altura } })
    const page = await ctx.newPage()
    page.erros = []
    page.on('console', (m) => { if (m.type() === 'error') page.erros.push(m.text()) })
    page.on('pageerror', (e) => page.erros.push('pageerror: ' + e.message))
    await page.route('http://api.test/**', async (route) => {
      const req = route.request()
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
      const r = api(req.method(), req.url(), req.headers()['authorization'], req.postData() ? JSON.parse(req.postData()) : undefined)
      await route.fulfill({ status: r.s, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify(r.j) })
    })
    return page
  }
  const ir = (p, rota) => p.goto('http://localhost:8765' + rota)
  const foto = (p, nome) => p.screenshot({ path: `${SHOTS}/${nome}.png`, fullPage: true })
  const semRolagemLateral = async (p, nome) => t(`sem rolagem horizontal: ${nome}`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${await p.evaluate(() => document.documentElement.scrollWidth)} vs ${await p.evaluate(() => window.innerWidth)}`)

  // ================= DESKTOP =================
  let p = await novaPagina(1280, 800)
  await ir(p, '/'); await p.waitForSelector('text=Como você quer entrar?')
  t('inicio: cards Paciente e Profissional SUS', (await p.locator('a.opcao').count()) === 2)
  await foto(p, '01-inicio-desktop'); await semRolagemLateral(p, 'inicio desktop')

  // rotas protegidas sem login
  await ir(p, '/paciente/consultas'); await p.waitForURL('**/login')
  t('sem login: /paciente/* redireciona para /login', p.url().endsWith('/login'))
  await ir(p, '/profissional/agenda'); await p.waitForURL('**/profissional/login')
  t('sem login: /profissional/* redireciona para /profissional/login', p.url().endsWith('/profissional/login'))

  // escolher Paciente -> login
  await ir(p, '/'); await p.click('a.opcao:has-text("Paciente")'); await p.waitForURL('**/login')
  await foto(p, '02-login-desktop')
  await p.fill('#identificador', '52998224725')
  t('login: máscara de CPF aplicada', (await p.inputValue('#identificador')) === '529.982.247-25')
  await p.fill('#senha', 'errada'); await p.click('button:has-text("Entrar")')
  await p.waitForSelector('.aviso--erro')
  t('login: senha errada mostra erro', (await p.textContent('.aviso--erro')).includes('incorretos'))
  await p.click('button[aria-label="Mostrar senha"]')
  t('login: mostrar senha alterna o tipo do campo', (await p.getAttribute('#senha', 'type')) === 'text')
  await p.fill('#senha', 'Demo@1234'); await p.click('button:has-text("Entrar")'); await p.waitForURL('**/paciente')
  await p.waitForSelector('text=Próximas consultas'); await p.waitForTimeout(300)
  t('login ok -> painel do paciente', p.url().endsWith('/paciente'))
  t('painel: saudação com o primeiro nome', (await p.textContent('.painel__ola')).includes('Juan'))
  t('painel: 4 atalhos', (await p.locator('a.atalho').count()) === 4)
  t('menu do paciente: 7 links + Sair', (await p.locator('.menu a.menu__item').count()) === 7 && (await p.locator('.menu button.menu__item').count()) === 1)
  await foto(p, '03-painel-paciente-desktop'); await semRolagemLateral(p, 'painel paciente desktop')

  // paciente tentando área do profissional
  await ir(p, '/profissional'); await p.waitForURL('**/paciente')
  t('paciente em /profissional é devolvido ao /paciente', p.url().endsWith('/paciente'))

  // agendar
  await p.click('.menu >> text=Agendar consulta'); await p.waitForSelector('#especialidade')
  await p.selectOption('#especialidade', 'Clínica Geral')
  t('agendar: unidade única já vem selecionada', (await p.inputValue('#unidade')) !== '')
  await p.click('.ficha >> nth=0'); await p.click('.ficha >> nth=1')
  await foto(p, '04-agendar-desktop')
  await p.click('button:has-text("Solicitar agendamento")'); await p.waitForSelector('text=Solicitação enviada')
  t('agendar: confirmação exibida', true)
  await foto(p, '05-agendar-confirmado')
  await p.click('a:has-text("Ver minhas consultas")'); await p.waitForSelector('.consulta')
  await p.click('button:has-text("Todas")')
  t('consultas: nova solicitação aparece na lista', (await p.locator('.consulta').count()) === 3)
  await foto(p, '06-consultas-desktop')
  await p.locator('.consulta >> button:has-text("Detalhes")').first().click(); await p.waitForSelector('dialog[open]')
  await foto(p, '07-consulta-detalhe')
  await p.click('button:has-text("Cancelar consulta")'); await p.waitForSelector('text=Consulta cancelada')
  t('consultas: cancelamento mostra confirmação', true)
  await p.click('.menu >> text=Histórico médico'); await p.waitForSelector('.linha-tempo li'); await foto(p, '08-historico')
  await p.click('.menu >> text=Exames e resultados'); await p.waitForSelector('text=Hemograma completo'); await foto(p, '09-exames')
  await p.click('.menu >> text=Notificações'); await p.waitForSelector('.notificacao--nova')
  await p.click('button:has-text("Marcar como lida")'); await p.waitForFunction(() => !document.querySelector('.notificacao--nova'))
  t('notificações: marcar como lida', true)
  await p.click('.menu >> text=Meu perfil'); await p.waitForSelector('text=Cartão SUS'); await foto(p, '10-perfil-paciente')
  await p.click('.menu button:has-text("Sair")'); await p.waitForURL('**/login')
  t('logout volta ao login', true)
  await ir(p, '/paciente'); await p.waitForURL('**/login')
  t('após logout, /paciente exige login de novo', p.url().endsWith('/login'))
  t('desktop paciente: sem erros no console', p.erros.length === 0, p.erros.join(' | '))

  // cadastro
  await ir(p, '/cadastro'); await p.waitForSelector('text=Crie uma nova conta')
  await p.click('button:has-text("Registrar-se")')
  t('cadastro: campos vazios mostram erros', (await p.locator('.campo__msg--erro').count()) >= 5)
  await p.fill('#nome', 'Maria Teste'); await p.fill('#cpf', '11111111111'); await p.fill('#dataNascimento', '2000-01-01')
  await p.fill('#telefone', '84999990000'); await p.fill('#nSus', '123'); await p.fill('#email', 'maria@x.com'); await p.fill('#endereco', 'Rua A')
  await p.fill('#senha', '123456'); await p.fill('#confirmarSenha', '654321'); await p.click('button:has-text("Registrar-se")')
  t('cadastro: CPF inválido barrado', (await p.textContent('#cpf-erro')).includes('inválido'))
  t('cadastro: senhas diferentes barradas', (await p.textContent('#confirmarSenha-erro')).includes('não coincidem'))
  await foto(p, '11-cadastro-erros')
  await p.fill('#cpf', '52998224725'); await p.fill('#confirmarSenha', '123456'); await p.click('button:has-text("Registrar-se")')
  await p.waitForURL('**/login'); await p.waitForSelector('.aviso--ok')
  t('cadastro ok -> login com mensagem de sucesso', true)
  await ir(p, '/recuperar-senha'); await p.waitForSelector('text=Recuperação de acesso'); await foto(p, '12-recuperar')
  await p.close()

  // ================= PROFISSIONAL =================
  p = await novaPagina(1280, 800)
  await ir(p, '/'); await p.click('a.opcao:has-text("Profissional SUS")'); await p.waitForURL('**/profissional/login')
  t('login profissional: sem link de criar conta', (await p.locator('text=Criar uma conta').count()) === 0)
  await foto(p, '13-login-profissional')
  await p.fill('#identificador', 'helena.demo@vitasus.demo'); await p.fill('#senha', 'Demo@1234'); await p.click('button:has-text("Entrar")')
  await p.waitForURL('**/profissional'); await p.waitForSelector('.indicador'); await p.waitForTimeout(300)
  t('painel profissional: saudação e unidade', (await p.textContent('.painel__ola')).includes('Dra. Helena') && (await p.textContent('.painel__topo')).includes('UBS Demonstração Centro'))
  const ind = await p.locator('.indicador strong').allTextContents()
  t('painel profissional: indicadores (hoje=2, pendentes=1)', ind[0] === '2' && ind[1] === '1', ind.join(','))
  t('menu do profissional: 7 links + Sair', (await p.locator('.menu a.menu__item').count()) === 7)
  await foto(p, '14-painel-profissional'); await semRolagemLateral(p, 'painel profissional')
  await ir(p, '/paciente'); await p.waitForURL('**/profissional')
  t('profissional em /paciente é devolvido ao /profissional', p.url().endsWith('/profissional'))

  await p.click('.menu >> text=Minha agenda'); await p.waitForSelector('text=Sem atendimentos neste dia, .consulta').catch(() => {})
  await p.waitForSelector('.consulta')
  t('agenda (lista): atendimentos de hoje', (await p.locator('.consulta').count()) === 2)
  await foto(p, '15-agenda-lista')
  await p.click('button:has-text("Calendário")'); await p.waitForSelector('.calendario__grade')
  t('agenda (calendário): grade e dia com contagem', (await p.locator('.dia--com').count()) >= 1)
  await foto(p, '16-agenda-calendario')
  await p.reload(); await p.waitForSelector('.calendario__grade')
  t('agenda: preferência de visualização lembrada', true)
  await p.locator('.consulta >> button:has-text("Detalhes")').first().click(); await p.waitForSelector('dialog[open] #diagnostico')
  await foto(p, '17-atendimento-modal')
  await p.fill('#diagnostico', 'Consulta de rotina (demo)'); await p.fill('#prescricao', 'Hidratação (demo)')
  await p.click('button:has-text("Salvar registro")'); await p.waitForSelector('text=Registro salvo com sucesso')
  t('registro: salvo com confirmação', true)
  await p.keyboard.press('Escape')

  await p.click('.menu >> text=Atendimentos'); await p.waitForSelector('table.tabela')
  t('atendimentos: tabela com 3 linhas', (await p.locator('.tabela tbody tr').count()) === 3)
  await foto(p, '18-atendimentos-desktop')
  await p.selectOption('#filtro-status', 'Solicitado')
  t('atendimentos: filtro por situação', (await p.locator('.tabela tbody tr').count()) === 1)
  await p.click('button:has-text("Confirmar")'); await p.waitForFunction(() => !document.querySelector('.tabela tbody tr'))
  t('atendimentos: confirmar muda a situação', true)
  await p.selectOption('#filtro-status', ''); await p.fill('#busca', 'carlos')
  t('atendimentos: busca por nome', (await p.locator('.tabela tbody tr').count()) === 1)
  await p.locator('tr >> button:has-text("Detalhes")').click(); await p.waitForSelector('dialog[open]')
  await p.click('button:has-text("Cancelar atendimento")')
  t('atendimentos: cancelar pede confirmação', (await p.locator('.confirmacao').count()) === 1)
  await p.click('button:has-text("Sim, cancelar")'); await p.waitForSelector('.selo--cancelado')
  t('atendimentos: cancelamento aplicado', true)
  await p.keyboard.press('Escape')

  await p.click('.menu >> text=Pacientes autorizados'); await p.waitForSelector('.consulta'); await foto(p, '19-pacientes')
  await p.locator('a:has-text("Ver")').first().click(); await p.waitForSelector('text=Atendimentos com você'); await foto(p, '20-detalhe-paciente')
  await p.click('.menu >> text=Registros de atendimento'); await p.waitForSelector('.registro__titulo'); await foto(p, '21-registros')
  await p.click('.menu >> text=Meu perfil'); await p.waitForSelector('text=Preferências da conta'); await foto(p, '22-perfil-profissional')
  await p.click('.menu button:has-text("Sair")'); await p.waitForURL('**/profissional/login')
  t('desktop profissional: sem erros no console', p.erros.length === 0, p.erros.join(' | '))
  await p.close()

  // ================= MOBILE (390x844) =================
  p = await novaPagina(390, 844)
  await ir(p, '/'); await p.waitForSelector('a.opcao'); await foto(p, '30-inicio-mobile'); await semRolagemLateral(p, 'inicio mobile')
  await ir(p, '/login'); await foto(p, '31-login-mobile'); await semRolagemLateral(p, 'login mobile')
  await ir(p, '/cadastro'); await p.waitForSelector('#nome'); await foto(p, '32-cadastro-mobile'); await semRolagemLateral(p, 'cadastro mobile')
  await ir(p, '/login'); await p.fill('#identificador', '52998224725'); await p.fill('#senha', 'Demo@1234'); await p.click('button:has-text("Entrar")')
  await p.waitForURL('**/paciente'); await p.waitForSelector('.atalho')
  t('mobile: menu lateral escondido por padrão', !(await p.locator('#menu-lateral').isVisible()))
  await p.click('button[aria-label="Abrir menu"]'); await p.waitForTimeout(350)
  t('mobile: gaveta abre ao tocar no menu', await p.locator('#menu-lateral').isVisible())
  await foto(p, '33-painel-mobile-gaveta')
  await p.keyboard.press('Escape'); await p.waitForTimeout(350)
  t('mobile: Esc fecha a gaveta', !(await p.locator('#menu-lateral').isVisible()))
  await foto(p, '34-painel-mobile'); await semRolagemLateral(p, 'painel paciente mobile')
  await p.click('button[aria-label="Abrir menu"]'); await p.click('.menu >> text=Minhas consultas'); await p.waitForSelector('.consulta'); await p.waitForTimeout(350)
  t('mobile: navegar fecha a gaveta', !(await p.locator('#menu-lateral').isVisible()))
  await semRolagemLateral(p, 'consultas mobile'); await foto(p, '35-consultas-mobile')
  await p.click('button[aria-label="Abrir menu"]'); await p.click('.menu button:has-text("Sair")'); await p.waitForURL('**/login')
  await ir(p, '/profissional/login'); await p.fill('#identificador', 'helena.demo@vitasus.demo'); await p.fill('#senha', 'Demo@1234'); await p.click('button:has-text("Entrar")')
  await p.waitForURL('**/profissional'); await p.waitForSelector('.indicador'); await semRolagemLateral(p, 'painel profissional mobile'); await foto(p, '36-painel-prof-mobile')
  await p.click('button[aria-label="Abrir menu"]'); await p.click('.menu >> text=Atendimentos'); await p.waitForSelector('.tabela tbody tr'); await p.waitForTimeout(350)
  await semRolagemLateral(p, 'atendimentos mobile (tabela em cartões)'); await foto(p, '37-atendimentos-mobile')
  await p.click('button[aria-label="Abrir menu"]'); await p.click('.menu >> text=Minha agenda'); await p.waitForSelector('.consulta'); await p.waitForTimeout(350)
  await p.click('button:has-text("Calendário")'); await p.waitForSelector('.calendario__grade'); await semRolagemLateral(p, 'agenda calendário mobile'); await foto(p, '38-agenda-mobile')
  t('mobile: sem erros no console', p.erros.length === 0, p.erros.join(' | '))
  await p.close()

  await browser.close(); servidor.close()
  console.log(falhas === 0 ? '\nTODOS OS TESTES DE INTERFACE PASSARAM' : `\n${falhas} FALHA(S)`)
  process.exit(falhas ? 1 : 0)
})().catch((e) => { console.error('ERRO NO TESTE:', e.message.split('\n').slice(0, 6).join('\n')); process.exit(2) })
