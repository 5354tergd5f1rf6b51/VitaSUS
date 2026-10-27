import { Link } from 'react-router-dom'
import Icone from '../../components/Icone.jsx'
import { Carregando, Status } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { paciente, usuarioLogado } from '../../services/api.js'
import { diaISO, formatarData, formatarHora, hojeISO, primeiroNome } from '../../utils/formatar.js'

const ATALHOS = [
  { para: '/paciente/agendar', icone: 'agendar', titulo: 'Agendar Consulta', texto: 'Marque uma nova consulta' },
  { para: '/paciente/consultas', icone: 'consultas', titulo: 'Ver Minhas Consultas', texto: 'Veja suas consultas agendadas' },
  { para: '/paciente/historico', icone: 'historico', titulo: 'Histórico Médico', texto: 'Acesse seu histórico de saúde' },
  { para: '/paciente/exames', icone: 'exames', titulo: 'Resultados de Exames', texto: 'Veja seus exames e resultados' },
]

export default function PainelPaciente() {
  const usuario = usuarioLogado()
  const consultas = useCarregar(() => paciente.agendamentos(), [])
  const avisos = useCarregar(() => paciente.notificacoes(), [])

  const hoje = hojeISO()
  const proximas = (consultas.dados ?? [])
    .filter((c) => c.status !== 'Cancelado' && c.status !== 'Concluído' && diaISO(c.dataHora) >= hoje)
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora))
    .slice(0, 3)
  const novas = (avisos.dados ?? []).filter((n) => !n.lida).slice(0, 3)

  return (
    <div className="pagina pagina--centro">
      <header className="painel__topo">
        <h1>Painel do Paciente</h1>
        <p className="painel__ola">Olá, {primeiroNome(usuario?.nome)}!</p>
      </header>

      <ul className="atalhos">
        {ATALHOS.map((a) => (
          <li key={a.para}>
            <Link to={a.para} className="atalho">
              <span className="atalho__icone"><Icone nome={a.icone} tamanho={28} /></span>
              <span className="atalho__texto"><strong>{a.titulo}</strong><small>{a.texto}</small></span>
              <Icone nome="seta" tamanho={18} />
            </Link>
          </li>
        ))}
      </ul>

      <div className="resumo">
        <section className="cartao" aria-labelledby="titulo-proximas">
          <h2 id="titulo-proximas">Próximas consultas</h2>
          {consultas.carregando && <Carregando />}
          {consultas.erro && <p className="texto-erro">{consultas.erro}</p>}
          {!consultas.carregando && !consultas.erro && proximas.length === 0 && (
            <p className="texto-suave">Você não tem consultas futuras. <Link to="/paciente/agendar">Agendar agora</Link></p>
          )}
          <ul className="linhas">
            {proximas.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{formatarData(c.dataHora)} às {formatarHora(c.dataHora)}</strong>
                  <small>{c.especialidade ?? c.tipo}{c.unidade ? ` • ${c.unidade.nome}` : ''}</small>
                </div>
                <Status valor={c.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="cartao" aria-labelledby="titulo-avisos">
          <h2 id="titulo-avisos">Notificações</h2>
          {avisos.carregando && <Carregando />}
          {avisos.erro && <p className="texto-erro">{avisos.erro}</p>}
          {!avisos.carregando && !avisos.erro && novas.length === 0 && <p className="texto-suave">Nenhuma notificação nova.</p>}
          <ul className="linhas">
            {novas.map((n) => (
              <li key={n.id}><div><strong>{n.mensagem}</strong><small>{formatarData(n.dataEnvio)}</small></div></li>
            ))}
          </ul>
          {!avisos.carregando && <Link to="/paciente/notificacoes" className="cartao__link">Ver todas</Link>}
        </section>
      </div>
    </div>
  )
}
