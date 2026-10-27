import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Icone from './Icone.jsx'
import { Marca } from './Logo.jsx'
import { sair } from '../services/api.js'

// Estrutura comum às duas áreas: menu lateral azul-marinho (gaveta no celular)
// e área de conteúdo. Cada área informa seus próprios itens de menu.
export default function AppLayout({ itens, area, rotaLogin }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [aberto, setAberto] = useState(false)

  // Fecha a gaveta ao navegar.
  useEffect(() => setAberto(false), [pathname])

  // Esc fecha a gaveta.
  useEffect(() => {
    if (!aberto) return undefined
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  // O servidor recusou o token (expirou ou foi adulterado): volta ao login.
  useEffect(() => {
    const aoExpirar = () =>
      navigate(rotaLogin, { replace: true, state: { mensagem: 'Sua sessão expirou. Entre novamente.', tipo: 'erro' } })
    window.addEventListener('vitasus:sessao-expirada', aoExpirar)
    return () => window.removeEventListener('vitasus:sessao-expirada', aoExpirar)
  }, [navigate, rotaLogin])

  function sairDaConta() {
    sair()
    navigate(rotaLogin, { replace: true, state: { mensagem: 'Você saiu da sua conta.' } })
  }

  return (
    <div className="app">
      <header className="app__barra">
        <button
          type="button"
          className="icone-botao icone-botao--claro"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          aria-controls="menu-lateral"
        >
          <Icone nome="menu" />
        </button>
        <span className="app__barra-marca"><Marca tamanho={30} /> VitaSUS</span>
      </header>

      {aberto && <div className="app__fundo" onClick={() => setAberto(false)} aria-hidden="true" />}

      <aside id="menu-lateral" className={`menu${aberto ? ' menu--aberto' : ''}`} aria-label={`Menu da área ${area}`}>
        <div className="menu__marca">
          <Marca tamanho={60} />
          <span className="menu__nome">VitaSUS</span>
          <span className="menu__area">{area}</span>
        </div>
        <nav>
          <ul className="menu__lista">
            {itens.map((item) => (
              <li key={item.para}>
                <NavLink to={item.para} end={item.exato} className={({ isActive }) => `menu__item${isActive ? ' menu__item--ativo' : ''}`}>
                  <Icone nome={item.icone} tamanho={20} />
                  <span>{item.rotulo}</span>
                </NavLink>
              </li>
            ))}
            <li>
              <button type="button" className="menu__item" onClick={sairDaConta}>
                <Icone nome="sair" tamanho={20} />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>
        <p className="menu__rodape">Ambiente acadêmico demonstrativo. Dados fictícios; sem vínculo com o SUS oficial.</p>
      </aside>

      <main className="app__conteudo" id="conteudo">
        <Outlet />
      </main>
    </div>
  )
}

export const ITENS_PACIENTE = [
  { para: '/paciente', rotulo: 'Painel', icone: 'painel', exato: true },
  { para: '/paciente/agendar', rotulo: 'Agendar consulta', icone: 'agendar' },
  { para: '/paciente/consultas', rotulo: 'Minhas consultas', icone: 'consultas' },
  { para: '/paciente/historico', rotulo: 'Histórico médico', icone: 'historico' },
  { para: '/paciente/exames', rotulo: 'Exames e resultados', icone: 'exames' },
  { para: '/paciente/notificacoes', rotulo: 'Notificações', icone: 'sino' },
  { para: '/paciente/perfil', rotulo: 'Meu perfil', icone: 'usuario' },
]

export const ITENS_PROFISSIONAL = [
  { para: '/profissional', rotulo: 'Painel', icone: 'painel', exato: true },
  { para: '/profissional/agenda', rotulo: 'Minha agenda', icone: 'agendar' },
  { para: '/profissional/atendimentos', rotulo: 'Atendimentos', icone: 'prancheta' },
  { para: '/profissional/pacientes', rotulo: 'Pacientes autorizados', icone: 'usuarios' },
  { para: '/profissional/registros', rotulo: 'Registros de atendimento', icone: 'arquivo' },
  { para: '/profissional/notificacoes', rotulo: 'Notificações', icone: 'sino' },
  { para: '/profissional/perfil', rotulo: 'Meu perfil', icone: 'usuario' },
]
