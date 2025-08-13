import { useEffect, useState } from 'react'

/** Heuristic: viewport width OR coarse pointer OR touch */
export function useIsMobile(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${maxWidth}px)`)
    const coarse = () => (window.matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0)

    const update = () => setIsMobile(mq.matches || coarse())
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [maxWidth])

  return isMobile
}
