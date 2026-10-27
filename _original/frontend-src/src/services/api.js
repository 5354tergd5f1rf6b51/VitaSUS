const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const CHAVE = 'vitasus:paciente'

async function requisitar(caminho, opcoes = {}) {
  let resposta
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opcoes,
    })
  } catch {
    throw new Error(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
    )
  }

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(dados.error ?? 'Algo deu errado. Tente novamente.')
  }
  return dados
}

export async function login(email, senha) {
  const paciente = await requisitar('/pacientes/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
  localStorage.setItem(CHAVE, JSON.stringify(paciente))
  return paciente
}

export function cadastrar(dados) {
  return requisitar('/pacientes', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export function pacienteLogado() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE))
  } catch {
    return null
  }
}

export function sair() {
  localStorage.removeItem(CHAVE)
}
