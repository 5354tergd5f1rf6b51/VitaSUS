import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import Campo from '../components/Campo.jsx'
import { Aviso } from '../components/ui.jsx'
import { cadastrar } from '../services/api.js'
import { cpfValido, emailValido, hojeISO, mascaraCpf, mascaraTelefone } from '../utils/formatar.js'

const vazio = {
  nome: '', cpf: '', dataNascimento: '', telefone: '', email: '',
  endereco: '', nSus: '', senha: '', confirmarSenha: '',
}

function validar(f) {
  const e = {}
  if (f.nome.trim().length < 3) e.nome = 'Informe seu nome completo.'
  if (!cpfValido(f.cpf)) e.cpf = 'CPF inválido. Confira os números.'
  if (!f.dataNascimento) e.dataNascimento = 'Informe a data de nascimento.'
  else if (f.dataNascimento > hojeISO()) e.dataNascimento = 'A data não pode estar no futuro.'
  if (f.telefone.replace(/\D/g, '').length < 10) e.telefone = 'Informe o telefone com DDD.'
  if (!emailValido(f.email)) e.email = 'Informe um e-mail válido, como nome@exemplo.com.'
  if (!f.nSus.trim()) e.nSus = 'Informe o número do Cartão SUS.'
  if (!f.endereco.trim()) e.endereco = 'Informe seu endereço.'
  if (f.senha.length < 6) e.senha = 'A senha deve ter pelo menos 6 caracteres.'
  if (f.confirmarSenha !== f.senha) e.confirmarSenha = 'As senhas não coincidem.'
  return e
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [form, setForm] = useState(vazio)
  const [erros, setErros] = useState({})
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function alterar(evento) {
    const { name, value } = evento.target
    const tratado = name === 'cpf' ? mascaraCpf(value) : name === 'telefone' ? mascaraTelefone(value) : value
    setForm((atual) => ({ ...atual, [name]: tratado }))
    if (erros[name]) setErros((atual) => ({ ...atual, [name]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    const encontrados = validar(form)
    setErros(encontrados)
    const primeiro = Object.keys(encontrados)[0]
    if (primeiro) {
      document.getElementById(primeiro)?.focus()
      return
    }
    setCarregando(true)
    try {
      const { confirmarSenha, ...dados } = form
      await cadastrar(dados)
      navigate('/login', { state: { mensagem: 'Cadastro criado. Entre com seu CPF ou e-mail e a senha.' } })
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <AuthLayout largo voltar="/login">
      <h1 className="auth__titulo auth__titulo--medio">Crie uma nova conta</h1>
      <p className="auth__sub">
        Já está cadastrado? Faça <Link to="/login">login aqui</Link>.
      </p>
      <form className="form" onSubmit={enviar} noValidate>
        {erro && <Aviso tipo="erro">{erro}</Aviso>}
        <div className="grade">
          <Campo classe="larga" rotulo="Nome completo" id="nome" autoComplete="name" value={form.nome} onChange={alterar} erro={erros.nome} maxLength={100} placeholder="Juan Emanuel" />
          <Campo rotulo="CPF" id="cpf" inputMode="numeric" placeholder="000.000.000-00" value={form.cpf} onChange={alterar} erro={erros.cpf} />
          <Campo rotulo="Data de nascimento" id="dataNascimento" type="date" autoComplete="bday" max={hojeISO()} value={form.dataNascimento} onChange={alterar} erro={erros.dataNascimento} />
          <Campo rotulo="Telefone" id="telefone" type="tel" autoComplete="tel" placeholder="(00) 00000-0000" value={form.telefone} onChange={alterar} erro={erros.telefone} maxLength={15} />
          <Campo rotulo="Cartão SUS" id="nSus" inputMode="numeric" value={form.nSus} onChange={alterar} erro={erros.nSus} maxLength={45} />
          <Campo classe="larga" rotulo="E-mail" id="email" type="email" autoComplete="email" placeholder="exemplo123@gmail.com" value={form.email} onChange={alterar} erro={erros.email} maxLength={100} />
          <Campo classe="larga" rotulo="Endereço" id="endereco" autoComplete="street-address" value={form.endereco} onChange={alterar} erro={erros.endereco} maxLength={100} />
          <Campo rotulo="Senha" id="senha" type="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={alterar} erro={erros.senha} />
          <Campo rotulo="Confirmar senha" id="confirmarSenha" type="password" autoComplete="new-password" value={form.confirmarSenha} onChange={alterar} erro={erros.confirmarSenha} />
        </div>
        <button className="botao botao--cheio" type="submit" disabled={carregando}>
          {carregando ? 'Registrando...' : 'Registrar-se'}
        </button>
      </form>
    </AuthLayout>
  )
}
