import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Variant, VariantSetting, computeActualVariant, getVariantSetting, setVariantSetting } from '../lib/variant'

type Ctx = {
  setting: VariantSetting               // 'auto' | 'desktop' | 'mobile-lite'
  actual: Variant                       // resolved at runtime
  setSetting: (s: VariantSetting) => void
  toggleLite: () => void                // quick toggle for “Lite Mode”
}

const VariantCtx = createContext<Ctx | undefined>(undefined)

export function VariantProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSettingState] = useState<VariantSetting>(() => getVariantSetting())
  const [actual, setActual] = useState<Variant>(() => computeActualVariant(setting))

  useEffect(() => {
    const update = () => setActual(computeActualVariant(setting))
    update()
    const onChange = () => update()
    window.addEventListener('resize', onChange)
    window.addEventListener('patwua-variant-change' as any, onChange as any)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('patwua-variant-change' as any, onChange as any)
    }
  }, [setting])

  const setSetting = (s: VariantSetting) => {
    setSettingState(s)
    setVariantSetting(s)
    setActual(computeActualVariant(s))
  }

  const toggleLite = () => {
    // If currently lite, go back to auto; otherwise force lite
    setSetting(setting === 'mobile-lite' ? 'auto' : 'mobile-lite')
  }

  const value = useMemo(() => ({ setting, actual, setSetting, toggleLite }), [setting, actual])
  return <VariantCtx.Provider value={value}>{children}</VariantCtx.Provider>
}

export function useVariant() {
  const v = useContext(VariantCtx)
  if (!v) throw new Error('useVariant must be used within VariantProvider')
  return v
}
