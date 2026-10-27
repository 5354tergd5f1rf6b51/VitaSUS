export default function AuthLayout({ children, largo = false }) {
  return (
    <main className="auth">
      <section className="auth__marca">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <rect x="17" y="6" width="14" height="36" rx="3" fill="#fff" />
          <rect x="6" y="17" width="36" height="14" rx="3" fill="#fff" />
        </svg>
        <h1 className="auth__nome">VitaSUS</h1>
        <p className="auth__sub">Área do paciente</p>
      </section>
      <section className="auth__conteudo">
        <div className={`auth__form${largo ? ' auth__form--largo' : ''}`}>
          {children}
        </div>
      </section>
    </main>
  )
}
