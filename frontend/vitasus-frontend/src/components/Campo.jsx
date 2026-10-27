import { useState } from 'react'
import Icone from './Icone.jsx'

// rotulo/id/classe como antes. Novos: erro (mensagem do campo) e ajuda (texto de apoio).
// Para tipo senha use type="password": o botão mostrar/ocultar é incluído.
export default function Campo({ rotulo, id, classe = '', erro = '', ajuda = '', type = 'text', ...props }) {
  const [visivel, setVisivel] = useState(false)
  const ehSenha = type === 'password'
  const descricao = erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined

  return (
    <div className={`campo ${classe}${erro ? ' campo--erro' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <div className="campo__controle">
        <input
          id={id}
          name={id}
          type={ehSenha && visivel ? 'text' : type}
          aria-invalid={erro ? 'true' : undefined}
          aria-describedby={descricao}
          {...props}
        />
        {ehSenha && (
          <button
            type="button"
            className="campo__olho"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visivel}
          >
            <Icone nome={visivel ? 'olhoFechado' : 'olho'} tamanho={20} />
          </button>
        )}
      </div>
      {erro ? (
        <p className="campo__msg campo__msg--erro" id={`${id}-erro`} role="alert">{erro}</p>
      ) : (
        ajuda && <p className="campo__msg" id={`${id}-ajuda`}>{ajuda}</p>
      )}
    </div>
  )
}
