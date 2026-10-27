import { useState } from 'react'
import { Aviso, Carregando, ErroBloco, Modal, Status } from './ui.jsx'
import useCarregar from '../hooks/useCarregar.js'
import { profissional } from '../services/api.js'
import { calcularIdade, formatarData, formatarDataLonga, formatarHora } from '../utils/formatar.js'

const ACOES = {
  Solicitado: [['Confirmado', 'Confirmar atendimento', 'botao'], ['Cancelado', 'Recusar / cancelar', 'botao botao--perigo-contorno']],
  Confirmado: [['Concluído', 'Marcar como concluído', 'botao'], ['Cancelado', 'Cancelar atendimento', 'botao botao--perigo-contorno']],
}

function FormRegistro({ atendimento, aoSalvar }) {
  const inicial = atendimento.registro
  const [form, setForm] = useState({
    diagnostico: inicial?.diagnostico ?? '',
    prescricao: inicial?.prescricao ?? '',
    observacoes: inicial?.observacoes ?? '',
  })
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [salvando, setSalvando] = useState(false)

  const alterar = (e) => { setOk(''); setForm((f) => ({ ...f, [e.target.name]: e.target.value })) }

  async function salvar(evento) {
    evento.preventDefault()
    setErro(''); setOk('')
    if (!form.diagnostico.trim()) {
      setErro('Preencha o resumo do atendimento.')
      return
    }
    setSalvando(true)
    try {
      await profissional.salvarRegistro(atendimento.id, form)
      setOk('Registro salvo com sucesso.')
      aoSalvar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const contador = (campo, max) => `${form[campo].length}/${max}`

  return (
    <form className="form form--registro" onSubmit={salvar} noValidate>
      <h3>Registro do atendimento</h3>
      <Aviso tipo="info">Registro demonstrativo. Não informe dados clínicos reais.</Aviso>
      <div className="campo">
        <label htmlFor="diagnostico">Resumo do atendimento <small>{contador('diagnostico', 45)}</small></label>
        <input id="diagnostico" name="diagnostico" value={form.diagnostico} onChange={alterar} maxLength={45} />
      </div>
      <div className="campo">
        <label htmlFor="prescricao">Orientações <small>{contador('prescricao', 100)}</small></label>
        <textarea id="prescricao" name="prescricao" rows={2} value={form.prescricao} onChange={alterar} maxLength={100} />
      </div>
      <div className="campo">
        <label htmlFor="observacoes">Observações administrativas <small>{contador('observacoes', 100)}</small></label>
        <textarea id="observacoes" name="observacoes" rows={2} value={form.observacoes} onChange={alterar} maxLength={100} />
      </div>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}
      <button type="submit" className="botao" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar registro'}</button>
    </form>
  )
}

// Detalhes de um atendimento do profissional logado: dados, mudança de situação
// e registro. O servidor só entrega atendimentos que pertencem à agenda dele.
export default function AtendimentoModal({ id, aoFechar, aoAlterar }) {
  const { dados, erro, carregando, recarregar } = useCarregar(
    () => (id ? profissional.agendamento(id) : Promise.resolve(null)),
    [id],
  )
  const [erroAcao, setErroAcao] = useState('')
  const [trabalhando, setTrabalhando] = useState(false)
  const [confirmar, setConfirmar] = useState(null)

  function fechar() {
    setErroAcao(''); setConfirmar(null)
    aoFechar()
  }

  async function mudarStatus(novo) {
    setErroAcao('')
    setTrabalhando(true)
    try {
      await profissional.atualizarStatus(id, novo)
      setConfirmar(null)
      recarregar()
      aoAlterar?.()
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setTrabalhando(false)
    }
  }

  const acoes = dados ? ACOES[dados.status] ?? [] : []
  const podeRegistrar = dados && ['Confirmado', 'Concluído'].includes(dados.status)

  return (
    <Modal aberto={Boolean(id)} aoFechar={fechar} titulo={dados ? `Atendimento ${dados.codigo}` : 'Atendimento'} largo>
      {carregando && !dados && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && (
        <>
          <dl className="dados dados--simples">
            <div className="dados__linha"><dt>Paciente</dt><dd>{dados.paciente.nome}</dd></div>
            <div className="dados__linha"><dt>Nascimento</dt><dd>{formatarData(dados.paciente.dataNascimento)} ({calcularIdade(dados.paciente.dataNascimento)} anos)</dd></div>
            <div className="dados__linha"><dt>Cartão SUS</dt><dd>{dados.paciente.nSus}</dd></div>
            <div className="dados__linha"><dt>Data</dt><dd>{formatarDataLonga(dados.dataHora)}, {formatarHora(dados.dataHora)}</dd></div>
            <div className="dados__linha"><dt>Tipo</dt><dd>{dados.tipo}{dados.especialidade ? ` • ${dados.especialidade}` : ''}</dd></div>
            <div className="dados__linha"><dt>Unidade</dt><dd>{dados.unidade?.nome ?? '-'}</dd></div>
            <div className="dados__linha"><dt>Situação</dt><dd><Status valor={dados.status} /></dd></div>
          </dl>

          {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}

          {acoes.length > 0 && !confirmar && (
            <div className="acoes">
              {acoes.map(([novo, rotulo, classe]) => (
                <button key={novo} type="button" className={classe} disabled={trabalhando}
                  onClick={() => (novo === 'Cancelado' ? setConfirmar(novo) : mudarStatus(novo))}>
                  {rotulo}
                </button>
              ))}
            </div>
          )}
          {confirmar && (
            <div className="confirmacao" role="alertdialog" aria-label="Confirmar cancelamento">
              <p>Cancelar este atendimento? A vaga será liberada e o paciente será avisado.</p>
              <div className="acoes">
                <button type="button" className="botao botao--perigo" disabled={trabalhando} onClick={() => mudarStatus('Cancelado')}>
                  {trabalhando ? 'Cancelando...' : 'Sim, cancelar'}
                </button>
                <button type="button" className="botao botao--contorno" onClick={() => setConfirmar(null)}>Voltar</button>
              </div>
            </div>
          )}

          {podeRegistrar && (
            <FormRegistro key={`${dados.id}-${dados.registro?.id ?? 'novo'}`} atendimento={dados}
              aoSalvar={() => { recarregar(); aoAlterar?.() }} />
          )}
          {!podeRegistrar && dados.status === 'Solicitado' && (
            <p className="texto-suave">Confirme o atendimento para poder registrá-lo.</p>
          )}
        </>
      )}
    </Modal>
  )
}
