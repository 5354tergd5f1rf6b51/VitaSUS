import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import { Aviso } from '../components/ui.jsx'

// O backend atual não envia e-mails nem possui redefinição de senha.
// Em vez de simular um envio que não acontece, a tela explica a situação.
export default function RecuperarSenha() {
  return (
    <AuthLayout voltar="/login">
      <h1 className="auth__titulo auth__titulo--medio">Esqueci minha senha</h1>
      <p className="auth__sub">Recuperação de acesso</p>
      <div className="form">
        <Aviso tipo="info">
          A redefinição automática de senha ainda não está disponível neste ambiente
          acadêmico, pois o sistema não envia e-mails.
        </Aviso>
        <p className="texto-suave">
          Para recuperar o acesso, procure a administração do projeto, que pode redefinir
          sua senha. Se preferir, você pode criar uma nova conta de paciente com outro e-mail.
        </p>
        <Link to="/login" className="botao botao--cheio botao--link">Voltar ao login</Link>
      </div>
    </AuthLayout>
  )
}
