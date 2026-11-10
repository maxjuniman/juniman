import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { initials } from '../lib/text'
import { mediaUrl } from '../services/config'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  name: string
  photo?: string | null
  size?: number
}

export function Avatar({ name, photo, size = 48 }: Props) {
  const { palette, fonts } = useTheme()
  const uri = mediaUrl(photo)

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.primarySoft }]}>
      <Text style={{ color: palette.primaryDark, fontFamily: fonts.extra, fontSize: size * 0.34 }}>{initials(name)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
})
