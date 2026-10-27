import { useState } from 'react'
import { Carregando, ErroBloco, Pagina, Vazio } from '../components/ui.jsx'
import Icone from '../components/Icone.jsx'
import useCarregar from '../hooks/useCarregar.js'
import { paciente, profissional } from '../services/api.js'
import { formatarData } from '../utils/formatar.js'

// Mesma tela para as duas áreas; cada uma consulta apenas as próprias notificações.
export default function Notificacoes({ papel }) {
  const api = papel === 'profissional' ? profissional : paciente
  const { dados, erro, carregando, recarregar } = useCarregar(() => api.notificacoes(), [papel])
  const [erroAcao, setErroAcao] = useState('')

  async function marcar(id) {
    setErroAcao('')
    try {
      await api.marcarLida(id)
      recarregar()
    } catch (e) {
      setErroAcao(e.message)
    }
  }

  const naoLidas = dados?.filter((n) => !n.lida).length ?? 0

  return (
    <Pagina titulo="Notificações" subtitulo={dados ? (naoLidas ? `${naoLidas} não lida(s)` : 'Tudo em dia') : undefined}>
      {carregando && !dados && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {erroAcao && <ErroBloco erro={erroAcao} />}
      {dados?.length === 0 && <Vazio icone="sino" titulo="Nenhuma notificação por enquanto" />}
      <ul className="lista-cartoes">
        {dados?.map((n) => (
          <li key={n.id} className={`notificacao${n.lida ? '' : ' notificacao--nova'}`}>
            <Icone nome="sino" />
            <div>
              <p>{n.mensagem}</p>
              <small>{formatarData(n.dataEnvio)}{n.lida ? '' : ' • não lida'}</small>
            </div>
            {!n.lida && (
              <button type="button" className="botao botao--pequeno botao--contorno" onClick={() => marcar(n.id)}>
                Marcar como lida
              </button>
            )}
          </li>
        ))}
      </ul>
    </Pagina>
  )
}
