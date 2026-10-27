// Preferências da conta do profissional, guardadas apenas neste navegador.
const CHAVE = 'vitasus:pref-agenda'

export function lerVisualizacaoAgenda() {
  try {
    return localStorage.getItem(CHAVE) === 'calendario' ? 'calendario' : 'lista'
  } catch {
    return 'lista'
  }
}

export function salvarVisualizacaoAgenda(valor) {
  try {
    localStorage.setItem(CHAVE, valor)
  } catch {
    /* armazenamento indisponível: a preferência vale só nesta sessão */
  }
}
