import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Campo from '../components/Campo.jsx'
import { Aviso } from '../components/ui.jsx'
import { login, loginProfissional, papelLogado, sessao } from '../services/api.js'
import { mascaraIdentificador } from '../utils/formatar.js'
import { PAINEL } from '../components/Protegida.jsx'

// Uma única tela para as duas áreas. O que libera o painel é a resposta do
// servidor (papel do usuário), e não o botão escolhido na página inicial.
export default function Login({ papel = 'paciente' }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const ehProfissional = papel === 'profissional'
  const [identificador, setIdentificador] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const atual = sessao()?.token ? papelLogado() : null
  if (atual) return <Navigate to={PAINEL[atual]} replace />

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    if (!identificador.trim() || !senha) {
      setErro('Informe seu CPF (ou e-mail) e a senha.')
      return
    }
    setCarregando(true)
    try {
      await (ehProfissional ? loginProfissional : login)(identificador.trim(), senha)
      navigate(PAINEL[papel], { replace: true })
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout voltar="/">
      <h1 className="auth__titulo">VitaSUS</h1>
      <p className="auth__sub">Entre para continuar</p>
      {ehProfissional && <p className="auth__selo">Acesso do Profissional SUS</p>}

      <form className="form" onSubmit={enviar} noValidate>
        {state?.mensagem && <Aviso tipo={state.tipo === 'erro' ? 'erro' : 'ok'}>{state.mensagem}</Aviso>}
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <Campo
          rotulo="CPF ou e-mail"
          id="identificador"
          placeholder="123.456.789-10"
          autoComplete="username"
          value={identificador}
          onChange={(e) => setIdentificador(mascaraIdentificador(e.target.value))}
          required
        />
        <Campo
          rotulo="Senha"
          id="senha"
          type="password"
          placeholder="••••••"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button className="botao botao--cheio" type="submit" disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="auth__links">
        <Link to="/recuperar-senha">Esqueci minha senha</Link>
        {ehProfissional ? (
          <span>Contas de profissionais são criadas pela administração. <Link to="/login">Sou paciente</Link></span>
        ) : (
          <Link to="/cadastro">Criar uma conta</Link>
        )}
      </p>
    </AuthLayout>
  )
}
