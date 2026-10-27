import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AtendimentoModal from '../../components/AtendimentoModal.jsx'
import { Carregando, ErroBloco, Pagina, Status } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional } from '../../services/api.js'
import { calcularIdade, formatarData, formatarHora } from '../../utils/formatar.js'

export default function DetalhePaciente() {
  const { id } = useParams()
  const { dados, erro, carregando, recarregar } = useCarregar(() => profissional.paciente(id), [id])
  const [aberto, setAberto] = useState(null)

  return (
    <Pagina titulo={dados?.paciente.nome ?? 'Paciente'} acao={<Link to="/profissional/pacientes" className="botao botao--contorno botao--link">Voltar à lista</Link>}>
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && (
        <>
          <dl className="dados">
            <div className="dados__linha"><dt>Nascimento</dt><dd>{formatarData(dados.paciente.dataNascimento)} ({calcularIdade(dados.paciente.dataNascimento)} anos)</dd></div>
            <div className="dados__linha"><dt>Cartão SUS</dt><dd>{dados.paciente.nSus}</dd></div>
          </dl>
          <h2 className="subtitulo">Atendimentos com você</h2>
          <ul className="lista-cartoes">
            {dados.atendimentos.map((a) => (
              <li key={a.id} className="consulta">
                <div className="consulta__data"><strong>{formatarData(a.dataHora)}</strong><span>{formatarHora(a.dataHora)}</span></div>
                <div className="consulta__info">
                  <strong>{a.tipo}</strong>
                  <small>{a.registro ? `Registro: ${a.registro.diagnostico}` : 'Sem registro'}</small>
                  <Status valor={a.status} />
                </div>
                <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => setAberto(a.id)}>Detalhes</button>
              </li>
            ))}
          </ul>
        </>
      )}
      <AtendimentoModal id={aberto} aoFechar={() => setAberto(null)} aoAlterar={recarregar} />
    </Pagina>
  )
}
