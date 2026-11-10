import type { Gender } from '../shared'

export const APP_NAME = "Juniman's"

export type Palette = {
  primary: string
  primaryDark: string
  primarySoft: string
  onPrimary: string
  background: string
  surface: string
  text: string
  muted: string
  border: string
  personal: string
  personalSoft: string
  family: string
  familySoft: string
  danger: string
  dangerSoft: string
  shadow: string
}

export const neutralPalette: Palette = {
  primary: '#6E8CA0',
  primaryDark: '#56788C',
  primarySoft: '#E7EEF3',
  onPrimary: '#FFFFFF',
  background: '#F7F4F1',
  surface: '#FFFFFF',
  text: '#243039',
  muted: '#6E7C87',
  border: '#E4DCD6',
  personal: '#6E8CA0',
  personalSoft: '#E7EEF3',
  family: '#6F9B86',
  familySoft: '#E6F2EB',
  danger: '#C45C5C',
  dangerSoft: '#F8E6E6',
  shadow: 'rgba(36, 48, 57, 0.08)',
}

export const palettes: Record<Gender, Palette> = {
  MALE: {
    primary: '#5C8FBF',
    primaryDark: '#3E719C',
    primarySoft: '#E5F1F8',
    onPrimary: '#FFFFFF',
    background: '#F3F7FB',
    surface: '#FFFFFF',
    text: '#1C2B3A',
    muted: '#6A7C8C',
    border: '#D7E4EF',
    personal: '#5C8FBF',
    personalSoft: '#E5F1F8',
    family: '#6F9B86',
    familySoft: '#E6F2EB',
    danger: '#C45C5C',
    dangerSoft: '#F8E6E6',
    shadow: 'rgba(36, 64, 92, 0.08)',
  },
  FEMALE: {
    primary: '#D989A8',
    primaryDark: '#C16E90',
    primarySoft: '#FBEAF1',
    onPrimary: '#FFFFFF',
    background: '#FDF7F9',
    surface: '#FFFFFF',
    text: '#3A2430',
    muted: '#8C6E7A',
    border: '#F0D8E3',
    personal: '#D989A8',
    personalSoft: '#FBEAF1',
    family: '#6F9B86',
    familySoft: '#E6F2EB',
    danger: '#C45C5C',
    dangerSoft: '#F8E6E6',
    shadow: 'rgba(92, 48, 68, 0.08)',
  },
}

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
} as const
