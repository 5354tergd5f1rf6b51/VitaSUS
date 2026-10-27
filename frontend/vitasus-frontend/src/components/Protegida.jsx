import { Navigate, useLocation } from 'react-router-dom'
import { papelLogado, sessao } from '../services/api.js'

const PAINEL = { paciente: '/paciente', profissional: '/profissional' }
const LOGIN = { paciente: '/login', profissional: '/profissional/login' }

// Guarda de navegação da interface. Ela só evita telas erradas:
// a proteção real dos dados está no backend (token + papel em cada rota).
export default function Protegida({ papel, children }) {
  const local = useLocation()
  const atual = sessao()?.token ? papelLogado() : null

  if (!atual) return <Navigate to={LOGIN[papel]} replace state={{ de: local.pathname }} />
  if (atual !== papel) return <Navigate to={PAINEL[atual] ?? '/'} replace />
  return children
}

export { PAINEL, LOGIN }
