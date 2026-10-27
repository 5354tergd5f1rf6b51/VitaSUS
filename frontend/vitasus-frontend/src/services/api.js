const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CHAVE = 'vitasus:sessao'
const CHAVE_ANTIGA = 'vitasus:paciente' // formato anterior (sem token): descartado

try {
  localStorage.removeItem(CHAVE_ANTIGA)
} catch {
  /* armazenamento indisponível */
}

/* ---------- Sessão ----------
 * A sessão guarda o token emitido pelo servidor, o papel e o usuário.
 * O papel exibido aqui serve só para organizar a interface: quem decide
 * o que cada usuário pode acessar é o backend, a cada requisição. */
export function sessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE))
  } catch {
    return null
  }
}

function salvarSessao(dados) {
  localStorage.setItem(CHAVE, JSON.stringify(dados))
}

export const papelLogado = () => sessao()?.papel ?? null
export const usuarioLogado = () => sessao()?.usuario ?? null
export const pacienteLogado = () => (papelLogado() === 'paciente' ? usuarioLogado() : null)
export const profissionalLogado = () => (papelLogado() === 'profissional' ? usuarioLogado() : null)

export function sair() {
  localStorage.removeItem(CHAVE)
}

/* ---------- Requisições ---------- */
async function requisitar(caminho, { metodo = 'GET', corpo, publico = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = sessao()?.token
  if (token && !publico) headers.Authorization = `Bearer ${token}`

  let resposta
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
    )
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    if (resposta.status === 401 && token && !publico) {
      sair()
      window.dispatchEvent(new Event('vitasus:sessao-expirada'))
    }
    throw new Error(dados.error ?? 'Algo deu errado. Tente novamente.')
  }
  return dados
}

/* ---------- Autenticação ---------- */
async function entrar(caminho, identificador, senha) {
  const dados = await requisitar(caminho, {
    metodo: 'POST',
    corpo: { identificador, senha },
    publico: true,
  })
  salvarSessao({ token: dados.token, papel: dados.papel, usuario: dados.usuario })
  return dados.usuario
}

// identificador = CPF ou e-mail
export const login = (identificador, senha) => entrar('/pacientes/login', identificador, senha)
export const loginProfissional = (identificador, senha) =>
  entrar('/profissionais/login', identificador, senha)

export function cadastrar(dados) {
  return requisitar('/pacientes', { metodo: 'POST', corpo: dados, publico: true })
}

/* ---------- Área do paciente ---------- */
export const paciente = {
  perfil: () => requisitar('/pacientes/me'),
  opcoesAgendamento: () => requisitar('/pacientes/me/opcoes-agendamento'),
  agendamentos: () => requisitar('/pacientes/me/agendamentos'),
  solicitar: (agendaId, tipo) =>
    requisitar('/pacientes/me/agendamentos', { metodo: 'POST', corpo: { agendaId, tipo } }),
  cancelar: (id) => requisitar(`/pacientes/me/agendamentos/${id}/cancelar`, { metodo: 'PATCH' }),
  historico: () => requisitar('/pacientes/me/historico'),
  exames: () => requisitar('/pacientes/me/exames'),
  notificacoes: () => requisitar('/pacientes/me/notificacoes'),
  marcarLida: (id) => requisitar(`/pacientes/me/notificacoes/${id}/lida`, { metodo: 'PATCH' }),
}

/* ---------- Área do profissional ---------- */
export const profissional = {
  perfil: () => requisitar('/profissionais/me'),
  agendamentos: () => requisitar('/profissionais/me/agendamentos'),
  agendamento: (id) => requisitar(`/profissionais/me/agendamentos/${id}`),
  atualizarStatus: (id, status) =>
    requisitar(`/profissionais/me/agendamentos/${id}/status`, { metodo: 'PATCH', corpo: { status } }),
  salvarRegistro: (id, dados) =>
    requisitar(`/profissionais/me/agendamentos/${id}/registro`, { metodo: 'PUT', corpo: dados }),
  registros: () => requisitar('/profissionais/me/registros'),
  pacientes: () => requisitar('/profissionais/me/pacientes'),
  paciente: (id) => requisitar(`/profissionais/me/pacientes/${id}`),
  notificacoes: () => requisitar('/profissionais/me/notificacoes'),
  marcarLida: (id) => requisitar(`/profissionais/me/notificacoes/${id}/lida`, { metodo: 'PATCH' }),
}
