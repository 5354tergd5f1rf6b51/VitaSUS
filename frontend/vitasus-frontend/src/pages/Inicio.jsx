import { Link, Navigate } from 'react-router-dom'
import { Marca } from '../components/Logo.jsx'
import Icone from '../components/Icone.jsx'
import { papelLogado, sessao } from '../services/api.js'
import { PAINEL } from '../components/Protegida.jsx'

// Escolher o perfil só leva ao login correspondente. Nenhum privilégio é
// concedido aqui: o papel real vem do servidor depois da autenticação.
export default function Inicio() {
  const papel = sessao()?.token ? papelLogado() : null
  if (papel) return <Navigate to={PAINEL[papel]} replace />

  return (
    <main className="inicio">
      <section className="inicio__marca">
        <Marca tamanho={112} />
        <h1 className="inicio__nome">VitaSUS</h1>
        <p className="inicio__slogan">Saúde pública, conectada à vida</p>
      </section>

      <section className="inicio__escolha">
        <div className="inicio__miolo">
          <h2 className="inicio__titulo">VitaSUS</h2>
          <p className="inicio__slogan inicio__slogan--escuro">Saúde pública, conectada à vida</p>
          <p className="inicio__texto">
            Plataforma que aproxima o cidadão dos serviços de saúde: agende consultas,
            acompanhe seu histórico e seus exames, ou acesse a agenda de atendimentos.
          </p>

          <p className="inicio__pergunta" id="rotulo-perfil">Como você quer entrar?</p>
          <div className="inicio__botoes" role="group" aria-labelledby="rotulo-perfil">
            <Link to="/profissional/login" className="opcao">
              <Icone nome="estetoscopio" tamanho={26} />
              <span><strong>Profissional SUS</strong><small>Agenda e atendimentos</small></span>
              <Icone nome="seta" tamanho={18} />
            </Link>
            <Link to="/login" className="opcao">
              <Icone nome="usuario" tamanho={26} />
              <span><strong>Paciente</strong><small>Consultas, histórico e exames</small></span>
              <Icone nome="seta" tamanho={18} />
            </Link>
          </div>

          <p className="inicio__links">
            Primeira vez por aqui? <Link to="/cadastro">Criar conta de paciente</Link>
          </p>
          <p className="inicio__aviso">
            Projeto acadêmico em ambiente demonstrativo. Os dados são fictícios e o VitaSUS
            não tem vínculo com o sistema oficial do SUS.
          </p>
        </div>
      </section>
    </main>
  )
}
