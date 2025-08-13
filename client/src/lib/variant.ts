export type Variant = 'desktop' | 'mobile-lite'
export type VariantSetting = 'auto' | Variant

const KEY = 'patwua-variant'

export function getVariantSetting(): VariantSetting {
  const v = localStorage.getItem(KEY) as VariantSetting | null
  return v === 'desktop' || v === 'mobile-lite' ? v : 'auto'
}

export function isMobileHeuristic(): boolean {
  try {
    return (
      window.matchMedia('(max-width:768px)').matches ||
      window.matchMedia('(pointer:coarse)').matches ||
      (navigator as any).maxTouchPoints > 0
    )
  } catch {
    return false
  }
}

export function computeActualVariant(setting: VariantSetting): Variant {
  if (setting === 'desktop') return 'desktop'
  if (setting === 'mobile-lite') return 'mobile-lite'
  return isMobileHeuristic() ? 'mobile-lite' : 'desktop'
}

export function setVariantSetting(next: VariantSetting) {
  localStorage.setItem(KEY, next)
  window.dispatchEvent(new CustomEvent('patwua-variant-change', { detail: { setting: next } }))
}

export function getClientVariant(): Variant {
  return computeActualVariant(getVariantSetting())
}
