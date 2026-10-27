import { useCallback, useEffect, useRef, useState } from 'react'

// Executa uma função assíncrona e acompanha carregamento, erro e dados.
export default function useCarregar(funcao, deps = []) {
  const [estado, setEstado] = useState({ dados: null, erro: '', carregando: true })
  const [versao, setVersao] = useState(0)
  const funcaoRef = useRef(funcao)
  funcaoRef.current = funcao

  useEffect(() => {
    let ativo = true
    setEstado((e) => ({ ...e, carregando: true, erro: '' }))
    funcaoRef
      .current()
      .then((dados) => ativo && setEstado({ dados, erro: '', carregando: false }))
      .catch((e) => ativo && setEstado({ dados: null, erro: e.message, carregando: false }))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  return { ...estado, recarregar }
}
