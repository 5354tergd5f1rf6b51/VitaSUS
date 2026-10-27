import { useState } from 'react'
import AtendimentoModal from '../../components/AtendimentoModal.jsx'
import { Aviso, Carregando, ErroBloco, Pagina, Status, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional } from '../../services/api.js'
import { formatarData, formatarHora } from '../../utils/formatar.js'

const STATUS = ['Solicitado', 'Confirmado', 'Concluído', 'Cancelado']

export default function Atendimentos() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => profissional.agendamentos(), [])
  const [status, setStatus] = useState('')
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(null)
  const [trabalhando, setTrabalhando] = useState(null)
  const [erroAcao, setErroAcao] = useState('')

  const termo = busca.trim().toLowerCase()
  const lista = (dados ?? [])
    .filter((a) => !status || a.status === status)
    .filter((a) => !termo || a.paciente.nome.toLowerCase().includes(termo) || a.codigo.toLowerCase().includes(termo))
    .sort((a, b) => b.dataHora.localeCompare(a.dataHora))

  async function confirmar(a) {
    setErroAcao('')
    setTrabalhando(a.id)
    try {
      await profissional.atualizarStatus(a.id, 'Confirmado')
      recarregar()
    } catch (e) {
      setErroAcao(e.message)
    } finally {
      setTrabalhando(null)
    }
  }

  return (
    <Pagina titulo="Atendimentos" subtitulo="Atendimentos dos seus horários. Você só vê o que pertence à sua agenda.">
      <div className="barra-ferramentas">
        <div className="campo campo--filtro">
          <label htmlFor="busca">Buscar</label>
          <input id="busca" type="search" placeholder="Nome do paciente ou AT-0001" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="campo campo--filtro">
          <label htmlFor="filtro-status">Situação</label>
          <select id="filtro-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {erroAcao && <Aviso tipo="erro">{erroAcao}</Aviso>}
      {carregando && !dados && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && lista.length === 0 && <Vazio icone="prancheta" titulo="Nenhum atendimento encontrado">Ajuste a busca ou o filtro de situação.</Vazio>}

      {lista.length > 0 && (
        <table className="tabela">
          <thead>
            <tr><th scope="col">ID</th><th scope="col">Paciente</th><th scope="col">Data e horário</th><th scope="col">Especialidade</th><th scope="col">Situação</th><th scope="col"><span className="so-leitor">Ações</span></th></tr>
          </thead>
          <tbody>
            {lista.map((a) => (
              <tr key={a.id}>
                <td data-rotulo="ID">{a.codigo}</td>
                <td data-rotulo="Paciente">{a.paciente.nome}</td>
                <td data-rotulo="Data e horário">{formatarData(a.dataHora)} às {formatarHora(a.dataHora)}</td>
                <td data-rotulo="Especialidade">{a.especialidade ?? '-'}</td>
                <td data-rotulo="Situação"><Status valor={a.status} /></td>
                <td className="tabela__acoes">
                  {a.status === 'Solicitado' && (
                    <button type="button" className="botao botao--pequeno" onClick={() => confirmar(a)} disabled={trabalhando === a.id}>
                      {trabalhando === a.id ? '...' : 'Confirmar'}
                    </button>
                  )}
                  <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => setAberto(a.id)}>Detalhes</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <AtendimentoModal id={aberto} aoFechar={() => setAberto(null)} aoAlterar={recarregar} />
    </Pagina>
  )
}
