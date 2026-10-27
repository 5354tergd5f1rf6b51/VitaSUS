import { Link } from 'react-router-dom'
import { Marca } from './Logo.jsx'
import Icone from './Icone.jsx'

// Telas de entrada: faixa azul-marinho com a marca + cartão centralizado.
// `voltar` é o destino do botão de retorno (seta no canto superior).
export default function AuthLayout({ children, largo = false, voltar = '/' }) {
  return (
    <main className="auth">
      <aside className="auth__marca">
        <div className="auth__marca-conteudo">
          <Marca tamanho={56} />
          <span className="auth__nome">VitaSUS</span>
        </div>
      </aside>
      <section className="auth__conteudo">
        <Link to={voltar} className="auth__voltar" aria-label="Voltar">
          <Icone nome="voltar" tamanho={26} />
        </Link>
        <div className={`auth__cartao${largo ? ' auth__cartao--largo' : ''}`}>{children}</div>
        <p className="auth__aviso">Projeto acadêmico • ambiente demonstrativo • sem vínculo com o SUS oficial</p>
      </section>
    </main>
  )
}
