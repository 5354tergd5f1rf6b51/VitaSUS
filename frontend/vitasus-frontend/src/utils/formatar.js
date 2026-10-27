// Datas de agenda vêm do servidor como "horário de parede" em UTC; por isso
// são sempre formatadas com timeZone 'UTC' (sem converter para o fuso do navegador).
const UTC = { timeZone: 'UTC' }

export function formatarData(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', UTC)
}

export function formatarHora(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('pt-BR', { ...UTC, hour: '2-digit', minute: '2-digit' })
}

export function formatarDataLonga(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', {
    ...UTC, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

// 'AAAA-MM-DD' de um valor vindo do servidor
export const diaISO = (iso) => (iso ? String(iso).slice(0, 10) : '')

// 'AAAA-MM-DD' de hoje no relógio local do navegador
export function hojeISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

// 'AAAA-MM-DDTHH:MM' do relógio local, comparável com dataHora do servidor (também "de parede").
export function agoraISO() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${hojeISO()}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function somarDias(iso, n) {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const rotuloDia = (iso) =>
  new Date(`${iso}T00:00:00.000Z`).toLocaleDateString('pt-BR', {
    ...UTC, weekday: 'long', day: '2-digit', month: 'long',
  })

export function calcularIdade(iso) {
  if (!iso) return null
  const n = new Date(iso)
  const h = new Date()
  let idade = h.getFullYear() - n.getUTCFullYear()
  const jaFez =
    h.getMonth() > n.getUTCMonth() ||
    (h.getMonth() === n.getUTCMonth() && h.getDate() >= n.getUTCDate())
  if (!jaFez) idade -= 1
  return idade
}

export function mascaraCpf(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// No login aceita CPF ou e-mail: só aplica máscara se o texto parece CPF.
export function mascaraIdentificador(valor) {
  return /[a-zA-Z@]/.test(valor) ? valor : mascaraCpf(valor)
}

export function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function cpfValido(valor) {
  const c = String(valor).replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const digito = (n) => {
    let soma = 0
    for (let i = 0; i < n; i++) soma += Number(c[i]) * (n + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return digito(9) === Number(c[9]) && digito(10) === Number(c[10])
}

export const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// "Dra. Helena Souza" -> "Dra. Helena"; "Juan Emanuel" -> "Juan"
export function primeiroNome(nome = '') {
  const partes = nome.trim().split(/\s+/)
  return /^dra?\.$/i.test(partes[0]) ? partes.slice(0, 2).join(' ') : (partes[0] ?? '')
}
