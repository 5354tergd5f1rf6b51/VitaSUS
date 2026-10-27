import { Link } from 'react-router-dom'
import Icone from '../../components/Icone.jsx'
import { Carregando, ErroBloco, Status } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional, usuarioLogado } from '../../services/api.js'
import { agoraISO, diaISO, formatarData, formatarHora, hojeISO, primeiroNome, rotuloDia } from '../../utils/formatar.js'

export default function PainelProfissional() {
  const logado = usuarioLogado()
  const perfil = useCarregar(() => profissional.perfil(), [])
  const ags = useCarregar(() => profissional.agendamentos(), [])
  const avisos = useCarregar(() => profissional.notificacoes(), [])

  const hoje = hojeISO()
  const lista = ags.dados ?? []
  const deHoje = lista.filter((a) => diaISO(a.dataHora) === hoje && a.status !== 'Cancelado')
  const pendentes = lista.filter((a) => a.status === 'Solicitado')
  const concluidosHoje = deHoje.filter((a) => a.status === 'Concluído').length
  const agora = agoraISO()
  const proximos = lista
    .filter((a) => ['Solicitado', 'Confirmado'].includes(a.status) && a.dataHora.slice(0, 16) >= agora)
    .slice(0, 5)
  const novas = (avisos.dados ?? []).filter((n) => !n.lida).slice(0, 3)
  const nome = perfil.dados?.nome ?? logado?.nome
  const unidade = perfil.dados?.unidade ?? logado?.unidade

  return (
    <div className="pagina pagina--centro">
      <header className="painel__topo">
        <h1>Painel do Profissional</h1>
        <p className="painel__ola">Olá, {primeiroNome(nome)}!</p>
        <p className="texto-suave">
          {unidade ? `${unidade.nome} (unidade fictícia)` : 'Unidade não informada'} • {rotuloDia(hoje)}
        </p>
      </header>

      {ags.erro && <ErroBloco erro={ags.erro} aoTentar={ags.recarregar} />}
      {ags.carregando && <Carregando />}

      {ags.dados && (
        <ul className="indicadores">
          <li className="indicador"><strong>{deHoje.length}</strong><span>atendimentos previstos hoje</span></li>
          <li className="indicador indicador--alerta"><strong>{pendentes.length}</strong><span>aguardando confirmação</span></li>
          <li className="indicador"><strong>{concluidosHoje}</strong><span>concluídos hoje</span></li>
        </ul>
      )}

      <ul className="atalhos atalhos--duplo">
        <li>
          <Link to="/profissional/agenda" className="atalho">
            <span className="atalho__icone"><Icone nome="agendar" tamanho={28} /></span>
            <span className="atalho__texto"><strong>Minha agenda</strong><small>Atendimentos por data</small></span>
            <Icone nome="seta" tamanho={18} />
          </Link>
        </li>
        <li>
          <Link to="/profissional/atendimentos" className="atalho">
            <span className="atalho__icone"><Icone nome="prancheta" tamanho={28} /></span>
            <span className="atalho__texto"><strong>Atendimentos</strong><small>Lista e situação</small></span>
            <Icone nome="seta" tamanho={18} />
          </Link>
        </li>
      </ul>

      <div className="resumo">
        <section className="cartao" aria-labelledby="titulo-prox">
          <h2 id="titulo-prox">Próximos horários</h2>
          {ags.dados && proximos.length === 0 && <p className="texto-suave">Nenhum atendimento futuro na agenda.</p>}
          <ul className="linhas">
            {proximos.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{formatarData(a.dataHora)} às {formatarHora(a.dataHora)}</strong>
                  <small>{a.paciente.nome} • {a.tipo}</small>
                </div>
                <Status valor={a.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="cartao" aria-labelledby="titulo-av">
          <h2 id="titulo-av">Notificações</h2>
          {avisos.erro && <p className="texto-erro">{avisos.erro}</p>}
          {avisos.dados && novas.length === 0 && <p className="texto-suave">Nenhuma notificação nova.</p>}
          <ul className="linhas">
            {novas.map((n) => <li key={n.id}><div><strong>{n.mensagem}</strong><small>{formatarData(n.dataEnvio)}</small></div></li>)}
          </ul>
          <Link to="/profissional/notificacoes" className="cartao__link">Ver todas</Link>
        </section>
      </div>
    </div>
  )
}
