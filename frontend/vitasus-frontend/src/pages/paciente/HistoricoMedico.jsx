import { useState } from 'react'
import { Carregando, ErroBloco, Pagina, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { paciente } from '../../services/api.js'
import { formatarData } from '../../utils/formatar.js'

export default function HistoricoMedico() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => paciente.historico(), [])
  const [tipo, setTipo] = useState('')

  const tipos = [...new Set((dados ?? []).map((r) => r.tipo))]
  const lista = (dados ?? []).filter((r) => !tipo || r.tipo === tipo)

  return (
    <Pagina titulo="Histórico médico" subtitulo="Registros dos seus atendimentos, do mais recente ao mais antigo. Dados fictícios de demonstração.">
      {tipos.length > 1 && (
        <div className="campo campo--filtro">
          <label htmlFor="tipo">Tipo de atendimento</label>
          <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && lista.length === 0 && <Vazio icone="historico" titulo="Nenhum registro no histórico">Os registros aparecem aqui depois dos atendimentos.</Vazio>}

      <ol className="linha-tempo">
        {lista.map((r) => (
          <li key={r.id} className="cartao">
            <header>
              <strong>{formatarData(r.dataHora)}</strong>
              <span className="selo selo--neutro">{r.tipo}</span>
            </header>
            <p className="registro__titulo">{r.diagnostico}</p>
            <p className="texto-suave">{[r.especialidade, r.profissional].filter(Boolean).join(' • ')}</p>
            {r.prescricao && <p><strong>Orientações:</strong> {r.prescricao}</p>}
            {r.observacoes && <p><strong>Observações:</strong> {r.observacoes}</p>}
          </li>
        ))}
      </ol>
    </Pagina>
  )
}
