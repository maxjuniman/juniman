import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Gender } from '../shared'
import { useAuthStore } from '../stores/auth-store'
import { fonts, neutralPalette, palettes, type Palette } from './colors'

type ThemeValue = {
  palette: Palette
  fonts: typeof fonts | Record<keyof typeof fonts, undefined>
  setPreviewGender: (gender: Gender | null) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children, useNunito }: { children: ReactNode; useNunito: boolean }) {
  const userGender = useAuthStore((state) => state.user?.gender)
  const [previewGender, setPreviewGender] = useState<Gender | null>(null)
  const gender = userGender ?? previewGender
  const palette = gender ? palettes[gender] : neutralPalette
  const typography = useNunito ? fonts : { regular: undefined, semibold: undefined, bold: undefined, extra: undefined }

  const value = useMemo(
    () => ({ palette, fonts: typography, setPreviewGender }),
    [palette, typography],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme precisa estar dentro do ThemeProvider.')
  return value
}
