import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { APP_NAME, neutralPalette } from '../theme/colors'
import { Crest } from './Crest'

export function BootScreen() {
  return (
    <View style={styles.screen}>
      <Crest size={180} />
      <Text style={styles.name}>{APP_NAME}</Text>
      <ActivityIndicator color={neutralPalette.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: neutralPalette.background,
  },
  name: { color: neutralPalette.text, fontSize: 32, fontWeight: '800' },
})