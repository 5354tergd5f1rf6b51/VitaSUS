import { useState } from 'react'
import { Carregando, ErroBloco, Pagina } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional } from '../../services/api.js'
import { lerVisualizacaoAgenda, salvarVisualizacaoAgenda } from '../../utils/preferencias.js'

export default function PerfilProfissional() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => profissional.perfil(), [])
  const [visao, setVisao] = useState(lerVisualizacaoAgenda)
  const [salvo, setSalvo] = useState(false)

  function alterar(e) {
    setVisao(e.target.value)
    salvarVisualizacaoAgenda(e.target.value)
    setSalvo(true)
  }

  const linhas = dados && [
    ['Nome', dados.nome],
    ['E-mail', dados.email],
    ['Função', dados.cargo],
    ['Especialidade', dados.especialidade],
    ['Registro profissional', dados.registroProfissional],
    ['Unidade vinculada', dados.unidade ? `${dados.unidade.nome} (fictícia)` : 'Não informada'],
  ]

  return (
    <Pagina titulo="Meu perfil">
      {carregando && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {linhas && (
        <dl className="dados">
          {linhas.map(([r, v]) => <div className="dados__linha" key={r}><dt>{r}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
      <section className="cartao">
        <h2>Preferências da conta</h2>
        <div className="campo campo--filtro">
          <label htmlFor="pref-agenda">Visualização inicial da agenda</label>
          <select id="pref-agenda" value={visao} onChange={alterar}>
            <option value="lista">Lista</option>
            <option value="calendario">Calendário</option>
          </select>
        </div>
        <p className="texto-suave" role="status">{salvo ? 'Preferência salva neste navegador.' : 'Guardada apenas neste navegador.'}</p>
      </section>
    </Pagina>
  )
}
