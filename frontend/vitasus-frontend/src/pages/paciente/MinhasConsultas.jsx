import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Carregando, ErroBloco, Modal, Pagina, Status, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { paciente } from '../../services/api.js'
import { diaISO, formatarData, formatarDataLonga, formatarHora, hojeISO } from '../../utils/formatar.js'

const FILTROS = [['proximas', 'Próximas'], ['anteriores', 'Anteriores'], ['todas', 'Todas']]

export default function MinhasConsultas() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => paciente.agendamentos(), [])
  const [filtro, setFiltro] = useState('proximas')
  const [detalhe, setDetalhe] = useState(null)
  const [cancelando, setCancelando] = useState(false)
  const [erroAcao, setErroAcao] = useState('')
  const [sucesso, setSucesso] = useState('')

  const hoje = hojeISO()
  const ativa = (c) => c.status !== 'Cancelado' && c.status !== 'Concluído'
  const lista = (dados ?? []).filter((c) => {
    if (filtro === 'todas') return true
    const futura = diaISO(c.dataHora) >= hoje && ativa(c)
    return filtro === 'proximas' ? futura : !futura
  })
  const ordenada = [...lista].sort((a, b) => (filtro === 'proximas' ? a.dataHora.localeCompare(b.dataHora) : b.dataHora.localeCompare(a.dataHora)))

  async function cancelar() {
    setErroAcao('')
    setCancelando(true)
    try {
      await paciente.cancelar(detalhe.id)
      setDetalhe(null)
      setSucesso('Consulta cancelada. A vaga foi liberada.')
      recarregar()
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setCancelando(false)
    }
  }

  return (
    <Pagina titulo="Minhas consultas" acao={<Link to="/paciente/agendar" className="botao botao--link">Agendar consulta</Link>}>
      {sucesso && <Aviso tipo="ok">{sucesso}</Aviso>}
      <div className="abas" role="group" aria-label="Filtrar consultas">
        {FILTROS.map(([valor, rotulo]) => (
          <button key={valor} type="button" className={`aba${filtro === valor ? ' aba--ativa' : ''}`} aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>{rotulo}</button>
        ))}
      </div>

      {carregando && !dados && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && ordenada.length === 0 && <Vazio icone="consultas" titulo="Nenhuma consulta nesta lista" />}

      <ul className="lista-cartoes">
        {ordenada.map((c) => (
          <li key={c.id} className="consulta">
            <div className="consulta__data">
              <strong>{formatarData(c.dataHora)}</strong>
              <span>{formatarHora(c.dataHora)}</span>
            </div>
            <div className="consulta__info">
              <strong>{c.especialidade ?? c.tipo}</strong>
              <small>{c.unidade?.nome ?? 'Unidade não informada'}</small>
              <Status valor={c.status} />
            </div>
            <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => { setErroAcao(''); setSucesso(''); setDetalhe(c) }}>
              Detalhes
            </button>
          </li>
        ))}
      </ul>

      <Modal aberto={Boolean(detalhe)} aoFechar={() => setDetalhe(null)} titulo="Detalhes da consulta">
        {detalhe && (
          <>
            <dl className="dados dados--simples">
              <div className="dados__linha"><dt>Data</dt><dd>{formatarDataLonga(detalhe.dataHora)}</dd></div>
              <div className="dados__linha"><dt>Horário</dt><dd>{formatarHora(detalhe.dataHora)}</dd></div>
              <div className="dados__linha"><dt>Tipo</dt><dd>{detalhe.tipo}</dd></div>
              <div className="dados__linha"><dt>Especialidade</dt><dd>{detalhe.especialidade ?? '-'}</dd></div>
              <div className="dados__linha"><dt>Profissional</dt><dd>{detalhe.profissional ?? '-'}</dd></div>
              <div className="dados__linha"><dt>Unidade</dt><dd>{detalhe.unidade ? `${detalhe.unidade.nome} — ${detalhe.unidade.endereco}` : '-'}</dd></div>
              <div className="dados__linha"><dt>Solicitada em</dt><dd>{formatarData(detalhe.dataSolicitacao)}</dd></div>
              <div className="dados__linha"><dt>Situação</dt><dd><Status valor={detalhe.status} /></dd></div>
            </dl>
            {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}
            <div className="acoes">
              {detalhe.podeCancelar && (
                <button type="button" className="botao botao--perigo" onClick={cancelar} disabled={cancelando}>
                  {cancelando ? 'Cancelando...' : 'Cancelar consulta'}
                </button>
              )}
              <button type="button" className="botao botao--contorno" onClick={() => setDetalhe(null)}>Fechar</button>
            </div>
          </>
        )}
      </Modal>
    </Pagina>
  )
}
