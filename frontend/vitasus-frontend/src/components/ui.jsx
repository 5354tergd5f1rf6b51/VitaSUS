import { useEffect, useId, useRef } from 'react'
import Icone from './Icone.jsx'

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  )
}

export function ErroBloco({ erro, aoTentar }) {
  return (
    <div className="aviso aviso--erro aviso--bloco" role="alert">
      <span>{erro}</span>
      {aoTentar && (
        <button type="button" className="botao botao--pequeno botao--contorno" onClick={aoTentar}>
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function Vazio({ icone = 'info', titulo, children }) {
  return (
    <div className="vazio">
      <Icone nome={icone} tamanho={34} />
      <strong>{titulo}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}

export function Aviso({ tipo = 'info', children }) {
  return (
    <p className={`aviso aviso--${tipo}`} role={tipo === 'erro' ? 'alert' : undefined}>
      {children}
    </p>
  )
}

const CLASSE_STATUS = {
  Solicitado: 'pendente',
  Confirmado: 'confirmado',
  'Concluído': 'concluido',
  Cancelado: 'cancelado',
  'Resultado disponível': 'concluido',
  'Em análise': 'pendente',
}

// O texto sempre acompanha a cor, para não depender só da cor.
export function Status({ valor }) {
  return <span className={`selo selo--${CLASSE_STATUS[valor] ?? 'neutro'}`}>{valor}</span>
}

// Janela modal nativa (<dialog>): foco preso, Esc fecha, leitor de tela anuncia o título.
export function Modal({ aberto, aoFechar, titulo, children, largo = false }) {
  const ref = useRef(null)
  const idTitulo = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className={`modal${largo ? ' modal--largo' : ''}`}
      aria-labelledby={idTitulo}
      onClose={aoFechar}
      onClick={(e) => e.target === ref.current && aoFechar()}
    >
      <div className="modal__corpo">
        <header className="modal__topo">
          <h2 id={idTitulo}>{titulo}</h2>
          <button type="button" className="icone-botao" onClick={aoFechar} aria-label="Fechar">
            <Icone nome="fechar" />
          </button>
        </header>
        {aberto && children}
      </div>
    </dialog>
  )
}

export function Pagina({ titulo, subtitulo, children, acao }) {
  return (
    <div className="pagina">
      <header className="pagina__topo">
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <p className="pagina__sub">{subtitulo}</p>}
        </div>
        {acao}
      </header>
      {children}
    </div>
  )
}
