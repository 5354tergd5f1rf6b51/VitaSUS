import { useMemo, useState } from 'react'
import AtendimentoModal from '../../components/AtendimentoModal.jsx'
import Icone from '../../components/Icone.jsx'
import { Carregando, ErroBloco, Pagina, Status, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional } from '../../services/api.js'
import { diaISO, formatarHora, hojeISO, rotuloDia, somarDias } from '../../utils/formatar.js'
import { lerVisualizacaoAgenda, salvarVisualizacaoAgenda } from '../../utils/preferencias.js'

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const NOMES_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function diasDoMes(mes) {
  const [ano, m] = mes.split('-').map(Number)
  const primeiro = new Date(Date.UTC(ano, m - 1, 1))
  const total = new Date(Date.UTC(ano, m, 0)).getUTCDate()
  const celulas = Array(primeiro.getUTCDay()).fill(null)
  for (let d = 1; d <= total; d++) celulas.push(`${mes}-${String(d).padStart(2, '0')}`)
  return celulas
}

const trocarMes = (mes, n) => {
  const [ano, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(ano, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

export default function Agenda() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => profissional.agendamentos(), [])
  const [visao, setVisao] = useState(lerVisualizacaoAgenda)
  const [dia, setDia] = useState(hojeISO())
  const [mes, setMes] = useState(hojeISO().slice(0, 7))
  const [aberto, setAberto] = useState(null)

  const porDia = useMemo(() => {
    const mapa = new Map()
    ;(dados ?? []).forEach((a) => {
      const k = diaISO(a.dataHora)
      mapa.set(k, [...(mapa.get(k) ?? []), a])
    })
    return mapa
  }, [dados])

  const doDia = (porDia.get(dia) ?? []).sort((a, b) => a.dataHora.localeCompare(b.dataHora))

  function trocarVisao(v) {
    setVisao(v)
    salvarVisualizacaoAgenda(v)
  }
  function irPara(d) {
    setDia(d)
    setMes(d.slice(0, 7))
  }

  return (
    <Pagina titulo="Minha agenda" subtitulo="Atendimentos dos seus horários. Pacientes e dados fictícios.">
      <div className="barra-ferramentas">
        <div className="abas" role="group" aria-label="Modo de visualização">
          <button type="button" className={`aba${visao === 'lista' ? ' aba--ativa' : ''}`} aria-pressed={visao === 'lista'} onClick={() => trocarVisao('lista')}>Lista</button>
          <button type="button" className={`aba${visao === 'calendario' ? ' aba--ativa' : ''}`} aria-pressed={visao === 'calendario'} onClick={() => trocarVisao('calendario')}>Calendário</button>
        </div>
        {visao === 'lista' && (
          <div className="navegador-dia">
            <button type="button" className="icone-botao" aria-label="Dia anterior" onClick={() => irPara(somarDias(dia, -1))}><Icone nome="voltar" /></button>
            <input type="date" aria-label="Escolher data" value={dia} onChange={(e) => e.target.value && irPara(e.target.value)} />
            <button type="button" className="icone-botao" aria-label="Próximo dia" onClick={() => irPara(somarDias(dia, 1))}><Icone nome="seta" /></button>
            <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => irPara(hojeISO())}>Hoje</button>
          </div>
        )}
      </div>

      {carregando && !dados && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}

      {dados && visao === 'calendario' && (
        <section className="calendario" aria-label="Calendário de atendimentos">
          <header className="calendario__topo">
            <button type="button" className="icone-botao" aria-label="Mês anterior" onClick={() => setMes(trocarMes(mes, -1))}><Icone nome="voltar" /></button>
            <h2>{new Date(`${mes}-01T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</h2>
            <button type="button" className="icone-botao" aria-label="Próximo mês" onClick={() => setMes(trocarMes(mes, 1))}><Icone nome="seta" /></button>
          </header>
          <div className="calendario__grade" role="grid">
            {SEMANA.map((s, i) => <span key={i} className="calendario__sem" aria-hidden="true">{s}</span>)}
            {diasDoMes(mes).map((d, i) => {
              if (!d) return <span key={`v${i}`} />
              const qtd = (porDia.get(d) ?? []).filter((a) => a.status !== 'Cancelado').length
              const numero = Number(d.slice(8))
              const semana = NOMES_SEMANA[new Date(`${d}T00:00:00.000Z`).getUTCDay()]
              return (
                <button key={d} type="button"
                  className={`dia${d === dia ? ' dia--sel' : ''}${d === hojeISO() ? ' dia--hoje' : ''}${qtd ? ' dia--com' : ''}`}
                  aria-pressed={d === dia}
                  aria-label={`${semana}, ${numero}: ${qtd} atendimento(s)`}
                  onClick={() => setDia(d)}>
                  <span>{numero}</span>
                  {qtd > 0 && <small>{qtd}</small>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {dados && (
        <section aria-live="polite">
          <h2 className="subtitulo">{rotuloDia(dia)}</h2>
          {doDia.length === 0 && <Vazio icone="agendar" titulo="Sem atendimentos neste dia" />}
          <ul className="lista-cartoes">
            {doDia.map((a) => (
              <li key={a.id} className="consulta">
                <div className="consulta__data"><strong>{formatarHora(a.dataHora)}</strong><span>{a.codigo}</span></div>
                <div className="consulta__info">
                  <strong>{a.paciente.nome}</strong>
                  <small>{[a.especialidade, a.tipo].filter(Boolean).join(' • ')}</small>
                  <Status valor={a.status} />
                </div>
                <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => setAberto(a.id)}>Detalhes</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AtendimentoModal id={aberto} aoFechar={() => setAberto(null)} aoAlterar={recarregar} />
    </Pagina>
  )
}
