import { useId } from 'react'

// Marca própria do VitaSUS (projeto acadêmico): um "V" que lembra
// um pulso/visto, com um ponto de vida. Não usa símbolos oficiais.
export function Marca({ tamanho = 64 }) {
  const id = useId()
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0B3D5C" />
          <stop offset="1" stopColor="#087E8B" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#fff" />
      <path d="M13 22 28 46" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" />
      <path d="M28 46 51 17" stroke="#087E8B" strokeWidth="9" strokeLinecap="round" />
      <circle cx="23" cy="13" r="4.5" fill="#087E8B" />
    </svg>
  )
}

export default function Logo({ tamanho = 64, nome = true, vertical = false, subtitulo }) {
  return (
    <div className={`logo${vertical ? ' logo--vertical' : ''}`}>
      <Marca tamanho={tamanho} />
      {nome && (
        <div className="logo__texto">
          <span className="logo__nome" style={{ fontSize: `${Math.max(tamanho * 0.42, 20)}px` }}>VitaSUS</span>
          {subtitulo && <span className="logo__sub">{subtitulo}</span>}
        </div>
      )}
    </div>
  )
}
