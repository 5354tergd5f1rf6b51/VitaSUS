import { useState } from 'react'
import { Carregando, ErroBloco, Pagina, Status, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { paciente } from '../../services/api.js'
import { formatarData } from '../../utils/formatar.js'

export default function Exames() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => paciente.exames(), [])
  const [status, setStatus] = useState('')
  const estados = [...new Set((dados ?? []).map((e) => e.status))]
  const lista = (dados ?? []).filter((e) => !status || e.status === status)

  return (
    <Pagina titulo="Exames e resultados" subtitulo="Exames fictícios para demonstração. Não representam informações clínicas reais.">
      {estados.length > 1 && (
        <div className="campo campo--filtro">
          <label htmlFor="status">Situação</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todas</option>
            {estados.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && lista.length === 0 && <Vazio icone="exames" titulo="Nenhum exame encontrado" />}
      <ul className="lista-cartoes">
        {lista.map((e) => (
          <li key={e.id} className="cartao">
            <header className="cartao__cabeca">
              <strong>{e.nome}</strong>
              <Status valor={e.status} />
            </header>
            <p className="texto-suave">Solicitado em {formatarData(e.dataSolicitacao)}</p>
            {e.resultado && <p><strong>Resultado:</strong> {e.resultado}</p>}
          </li>
        ))}
      </ul>
    </Pagina>
  )
}
