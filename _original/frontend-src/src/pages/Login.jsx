import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Campo from '../components/Campo.jsx'
import { login } from '../services/api.js'

export default function Login() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await login(email, senha)
      navigate('/')
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout>
      <h2>Entrar</h2>
      <form className="form" onSubmit={enviar}>
        {state?.mensagem && <p className="aviso aviso--ok">{state.mensagem}</p>}
        {erro && (
          <p className="aviso aviso--erro" role="alert">
            {erro}
          </p>
        )}
        <Campo
          rotulo="E-mail"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Campo
          rotulo="Senha"
          id="senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button className="botao" type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="rodape-form">
        Ainda não tem conta? <Link to="/cadastro">Criar cadastro</Link>
      </p>
    </AuthLayout>
  )
}
