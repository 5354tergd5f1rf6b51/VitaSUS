import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Aviso, Carregando, ErroBloco, Pagina, Vazio } from '../../components/ui.jsx'
import useCarregar from '../../hooks/useCarregar.js'
import { profissional } from '../../services/api.js'
import { calcularIdade, formatarData } from '../../utils/formatar.js'

export default function PacientesAutorizados() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => profissional.pacientes(), [])
  const [busca, setBusca] = useState('')
  const termo = busca.trim().toLowerCase()
  const lista = (dados ?? []).filter((p) => !termo || p.nome.toLowerCase().includes(termo))

  return (
    <Pagina titulo="Pacientes autorizados" subtitulo="Pacientes que têm atendimento na sua agenda.">
      <Aviso tipo="info">Você visualiza apenas os dados necessários ao atendimento, e somente de pacientes vinculados à sua agenda.</Aviso>
      <div className="campo campo--filtro">
        <label htmlFor="busca-paciente">Buscar por nome</label>
        <input id="busca-paciente" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      {carregando && !dados && <Carregando />}
      {erro && <ErroBloco erro={erro} aoTentar={recarregar} />}
      {dados && lista.length === 0 && <Vazio icone="usuarios" titulo="Nenhum paciente encontrado" />}
      <ul className="lista-cartoes">
        {lista.map((p) => (
          <li key={p.id} className="consulta">
            <div className="consulta__info">
              <strong>{p.nome}</strong>
              <small>{calcularIdade(p.dataNascimento)} anos • {p.totalAtendimentos} atendimento(s){p.ultimoAtendimento ? ` • último em ${formatarData(p.ultimoAtendimento)}` : ''}</small>
            </div>
            <Link to={`/profissional/pacientes/${p.id}`} className="botao botao--pequeno botao--contorno botao--link">Ver</Link>
          </li>
        ))}
      </ul>
    </Pagina>
  )
}
