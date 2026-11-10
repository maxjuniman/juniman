import { Image } from 'expo-image'

const crest = require('../../assets/brasao.jpg')

export function Crest({ size = 96 }: { size?: number }) {
  return (
    <Image
      accessibilityLabel="Brasão da família"
      source={crest}
      style={{ width: size, height: size, borderRadius: size * 0.24 }}
      contentFit="cover"
    />
  )
}
