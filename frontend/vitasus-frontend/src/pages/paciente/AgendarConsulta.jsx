import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Carregando, ErroBloco, Pagina, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { paciente } from '../../services/api.js'
import { diaISO, formatarData, formatarDataLonga, formatarHora } from '../../utils/formatar.js'

const unicos = (lista) => [...new Set(lista)]

export default function AgendarConsulta() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => paciente.opcoesAgendamento(), [])
  const [especialidade, setEspecialidade] = useState('')
  const [unidadeId, setUnidadeId] = useState('')
  const [dia, setDia] = useState('')
  const [agendaId, setAgendaId] = useState(null)
  const [tipo, setTipo] = useState('Consulta')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [confirmada, setConfirmada] = useState(null)

  const horarios = dados ?? []
  const especialidades = useMemo(() => unicos(horarios.map((h) => h.especialidade)).sort(), [horarios])
  const doEspecialidade = horarios.filter((h) => h.especialidade === especialidade)
  const unidades = useMemo(() => {
    const mapa = new Map()
    doEspecialidade.forEach((h) => h.unidade && mapa.set(h.unidade.id, h.unidade))
    return [...mapa.values()]
  }, [doEspecialidade])
  const daUnidade = doEspecialidade.filter((h) => String(h.unidade?.id) === unidadeId)
  const dias = unicos(daUnidade.map((h) => diaISO(h.data))).sort()
  const doDia = daUnidade.filter((h) => diaISO(h.data) === dia).sort((a, b) => a.horario.localeCompare(b.horario))
  const escolhido = doDia.find((h) => h.idAgenda === agendaId)

  function trocarEspecialidade(valor) {
    setEspecialidade(valor); setUnidadeId(''); setDia(''); setAgendaId(null)
    const u = unicos(horarios.filter((h) => h.especialidade === valor).map((h) => h.unidade?.id))
    if (u.length === 1) setUnidadeId(String(u[0]))
  }

  async function solicitar() {
    setErroEnvio('')
    setEnviando(true)
    try {
      setConfirmada(await paciente.solicitar(agendaId, tipo))
    } catch (e) {
      setErroEnvio(e.message)
      recarregar() // o horário pode ter sido ocupado: atualiza as opções
      setAgendaId(null)
    } finally {
      setEnviando(false)
    }
  }

  if (confirmada) {
    return (
      <Pagina titulo="Solicitação enviada">
        <Aviso tipo="ok">Sua solicitação foi registrada e aguarda a confirmação do profissional.</Aviso>
        <dl className="dados">
          <div className="dados__linha"><dt>Data</dt><dd>{formatarDataLonga(confirmada.dataHora)}</dd></div>
          <div className="dados__linha"><dt>Horário</dt><dd>{formatarHora(confirmada.dataHora)}</dd></div>
          <div className="dados__linha"><dt>Especialidade</dt><dd>{confirmada.especialidade}</dd></div>
          <div className="dados__linha"><dt>Profissional</dt><dd>{confirmada.profissional}</dd></div>
          <div className="dados__linha"><dt>Unidade</dt><dd>{confirmada.unidade?.nome}</dd></div>
          <div className="dados__linha"><dt>Situação</dt><dd>{confirmada.status}</dd></div>
        </dl>
        <div className="acoes">
          <Link to="/paciente/consultas" className="botao botao--link">Ver minhas consultas</Link>
          <button type="button" className="botao botao--contorno" onClick={() => { setConfirmada(null); setAgendaId(null); setDia(''); recarregar() }}>
            Agendar outra
          </button>
        </div>
      </Pagina>
    )
  }

  return (
    <Pagina titulo="Agendar consulta" subtitulo="Escolha a especialidade, a unidade, a data e o horário.">
      <Aviso tipo="info">
        Ambiente demonstrativo: unidades e horários são fictícios e <strong>não são vagas reais do SUS</strong>.
      </Aviso>
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {!carregando && !erro && horarios.length === 0 && (
        <Vazio icone="agendar" titulo="Nenhum horário cadastrado no momento">
          Volte mais tarde ou peça à administração do projeto para cadastrar horários de demonstração.
        </Vazio>
      )}

      {horarios.length > 0 && (
        <div className="assistente">
          <div className="campo">
            <label htmlFor="especialidade">1. Especialidade</label>
            <select id="especialidade" value={especialidade} onChange={(e) => trocarEspecialidade(e.target.value)}>
              <option value="">Selecione...</option>
              {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {especialidade && (
            <div className="campo">
              <label htmlFor="unidade">2. Unidade (fictícia)</label>
              <select id="unidade" value={unidadeId} onChange={(e) => { setUnidadeId(e.target.value); setDia(''); setAgendaId(null) }}>
                <option value="">Selecione...</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
          )}

          {unidadeId && (
            <fieldset className="campo">
              <legend>3. Data</legend>
              <div className="fichas">
                {dias.map((d) => (
                  <button key={d} type="button" className={`ficha${dia === d ? ' ficha--ativa' : ''}`} aria-pressed={dia === d} onClick={() => { setDia(d); setAgendaId(null) }}>
                    {formatarData(`${d}T00:00:00.000Z`)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {dia && (
            <fieldset className="campo">
              <legend>4. Horário</legend>
              <div className="fichas">
                {doDia.map((h) => (
                  <button key={h.idAgenda} type="button" className={`ficha${agendaId === h.idAgenda ? ' ficha--ativa' : ''}`} aria-pressed={agendaId === h.idAgenda} onClick={() => setAgendaId(h.idAgenda)}>
                    {h.horario}<small>{h.profissional}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {escolhido && (
            <div className="cartao">
              <fieldset className="campo">
                <legend>5. Tipo de atendimento</legend>
                <label className="radio"><input type="radio" name="tipo" checked={tipo === 'Consulta'} onChange={() => setTipo('Consulta')} /> Consulta</label>
                <label className="radio"><input type="radio" name="tipo" checked={tipo === 'Retorno'} onChange={() => setTipo('Retorno')} /> Retorno</label>
              </fieldset>
              <p className="texto-suave">
                {especialidade} • {formatarData(escolhido.data)} às {escolhido.horario} • {escolhido.profissional} • {escolhido.unidade?.nome}
              </p>
              {erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}
              <button type="button" className="botao" onClick={solicitar} disabled={enviando}>
                {enviando ? 'Enviando...' : 'Solicitar agendamento'}
              </button>
            </div>
          )}
          {!escolhido && erroEnvio && <Aviso tipo="erro">{erroEnvio}</Aviso>}
        </div>
      )}
    </Pagina>
  )
}
