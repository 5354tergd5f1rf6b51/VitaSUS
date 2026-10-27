import { Carregando, ErroBloco, Pagina } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { paciente } from '../../services/api.js'
import { formatarData } from '../../utils/formatar.js'

// Dados que a antiga página inicial já exibia (nome, CPF, nascimento, telefone,
// e-mail, endereço e Cartão SUS), agora lidos do servidor.
export default function PerfilPaciente() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => paciente.perfil(), [])
  const linhas = dados && [
    ['Nome', dados.nome],
    ['CPF', dados.cpf],
    ['Data de nascimento', formatarData(dados.dataNascimento)],
    ['Telefone', dados.telefone],
    ['E-mail', dados.email],
    ['Endereço', dados.endereco],
    ['Cartão SUS', dados.nSus],
  ]
  return (
    <Pagina titulo="Meu perfil">
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {linhas && (
        <dl className="dados">
          {linhas.map(([rotulo, valor]) => (
            <div className="dados__linha" key={rotulo}><dt>{rotulo}</dt><dd>{valor}</dd></div>
          ))}
        </dl>
      )}
    </Pagina>
  )
}
