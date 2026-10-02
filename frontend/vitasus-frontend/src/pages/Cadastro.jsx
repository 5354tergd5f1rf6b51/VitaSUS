import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Campo from '../components/Campo.jsx'
import { cadastrar } from '../services/api.js'

const vazio = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  telefone: '',
  email: '',
  endereco: '',
  nSus: '',
  senha: '',
}

function mascaraCpf(valor) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [form, setForm] = useState(vazio)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function alterar(evento) {
    const { name, value } = evento.target
    setForm((atual) => ({
      ...atual,
      [name]: name === 'cpf' ? mascaraCpf(value) : value,
    }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await cadastrar(form)
      navigate('/login', {
        state: { mensagem: 'Cadastro criado. Entre com seu e-mail e senha.' },
      })
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout largo>
      <h2>Criar cadastro</h2>
      <form className="form" onSubmit={enviar}>
        {erro && (
          <p className="aviso aviso--erro" role="alert">
            {erro}
          </p>
        )}
        <div className="grade">
          <Campo classe="larga" rotulo="Nome completo" id="nome" autoComplete="name" value={form.nome} onChange={alterar} required maxLength={100} />
          <Campo rotulo="CPF" id="cpf" inputMode="numeric" placeholder="000.000.000-00" value={form.cpf} onChange={alterar} required minLength={14} />
          <Campo rotulo="Data de nascimento" id="dataNascimento" type="date" autoComplete="bday" value={form.dataNascimento} onChange={alterar} required />
          <Campo rotulo="Telefone" id="telefone" type="tel" autoComplete="tel" value={form.telefone} onChange={alterar} required maxLength={15} />
          <Campo rotulo="Cartão SUS" id="nSus" inputMode="numeric" value={form.nSus} onChange={alterar} required maxLength={45} />
          <Campo classe="larga" rotulo="Endereço" id="endereco" autoComplete="street-address" value={form.endereco} onChange={alterar} required maxLength={100} />
          <Campo classe="larga" rotulo="E-mail" id="email" type="email" autoComplete="email" value={form.email} onChange={alterar} required maxLength={100} />
          <Campo classe="larga" rotulo="Senha (mínimo 6 caracteres)" id="senha" type="password" autoComplete="new-password" value={form.senha} onChange={alterar} required minLength={6} />
        </div>
        <button className="botao" type="submit" disabled={carregando}>
          {carregando ? 'Criando...' : 'Criar cadastro'}
        </button>
      </form>
      <p className="rodape-form">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  )
}
