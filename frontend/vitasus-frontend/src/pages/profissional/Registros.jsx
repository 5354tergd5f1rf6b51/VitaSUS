import { useState } from 'react'
import AtendimentoModal from '../../components/AtendimentoModal.jsx'
import { Carregando, ErroBloco, Pagina, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional } from '../../services/api.js'
import { formatarData } from '../../utils/formatar.js'

export default function Registros() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => profissional.registros(), [])
  const [aberto, setAberto] = useState(null)

  return (
    <Pagina titulo="Registros de atendimento" subtitulo="Resumos que você registrou. Para criar um novo, abra o atendimento confirmado.">
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && dados.length === 0 && <Vazio icone="arquivo" titulo="Nenhum registro ainda">Confirme um atendimento em “Atendimentos” e registre o resumo.</Vazio>}
      <ul className="lista-cartoes">
        {dados?.map((r) => (
          <li key={r.id} className="cartao">
            <header className="cartao__cabeca">
              <strong>{r.paciente?.nome ?? 'Paciente'}</strong>
              <span className="texto-suave">{formatarData(r.dataHora)}</span>
            </header>
            <p className="registro__titulo">{r.diagnostico}</p>
            {r.prescricao && <p><strong>Orientações:</strong> {r.prescricao}</p>}
            {r.observacoes && <p><strong>Observações:</strong> {r.observacoes}</p>}
            {r.agendamentoId && (
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => setAberto(r.agendamentoId)}>Abrir atendimento</button>
            )}
          </li>
        ))}
      </ul>
      <AtendimentoModal id={aberto} aoFechar={() => setAberto(null)} aoAlterar={recarregar} />
    </Pagina>
  )
}
