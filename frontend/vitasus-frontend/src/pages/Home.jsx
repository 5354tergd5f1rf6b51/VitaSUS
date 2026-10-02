import { useNavigate } from 'react-router-dom'
import { pacienteLogado, sair } from '../services/api.js'

function formatarData(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export default function Home() {
  const navigate = useNavigate()
  const paciente = pacienteLogado()

  function sairDaConta() {
    sair()
    navigate('/login')
  }

  const dados = [
    ['Nome', paciente.nome],
    ['CPF', paciente.cpf],
    ['Data de nascimento', formatarData(paciente.dataNascimento)],
    ['Telefone', paciente.telefone],
    ['E-mail', paciente.email],
    ['Endereço', paciente.endereco],
    ['Cartão SUS', paciente.nSus],
  ]

  return (
    <>
      <header className="topo">
        <span className="topo__marca">VitaSUS</span>
        <button className="botao botao--simples" onClick={sairDaConta}>
          Sair
        </button>
      </header>
      <main className="pagina">
        <h2>Olá, {paciente.nome.split(' ')[0]}</h2>
        <dl className="dados">
          {dados.map(([rotulo, valor]) => (
            <div className="dados__linha" key={rotulo}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  )
}
