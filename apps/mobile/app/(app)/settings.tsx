import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Avatar } from '../../src/components/Avatar'
import { Button } from '../../src/components/Button'
import { ConfirmDialog } from '../../src/components/ConfirmDialog'
import { TextField } from '../../src/components/TextField'
import { roleLabel } from '../../src/lib/text'
import { ApiError } from '../../src/services/api'
import { addFamilyMember, getFamilies, uploadPhoto } from '../../src/services/tasks'
import { addMemberSchema, type FamiliesResponse } from '../../src/shared'
import { useAuthStore } from '../../src/stores/auth-store'
import { useTheme } from '../../src/theme/ThemeProvider'

export default function SettingsScreen() {
  const { palette, fonts } = useTheme()
  const user = useAuthStore((state) => state.user)
  const pushEnabled = useAuthStore((state) => state.pushEnabled)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)
  const [families, setFamilies] = useState<FamiliesResponse | null>(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const load = useCallback(async () => {
    try {
      setFamilies(await getFamilies())
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível carregar a família.')
    }
  }, [])

  useFocusEffect(useCallback(() => { void load() }, [load]))

  const changePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem de perfil.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 })
    if (result.canceled || !result.assets[0]) return
    const uri = result.assets[0].uri
    const formData = new FormData()
    if (Platform.OS === 'web') {
      const file = await fetch(uri).then((response) => response.blob())
      formData.append('photo', file, 'perfil.jpg')
    } else {
      formData.append('photo', { uri, name: 'perfil.jpg', type: 'image/jpeg' } as unknown as Blob)
    }
    try {
      await setUser(await uploadPhoto(formData))
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível atualizar a foto.')
    }
  }

  const addMember = async () => {
    const parsed = addMemberSchema.safeParse({ email })
    if (!parsed.success) {
      setMessage(null)
      setError(parsed.error.issues[0]?.message ?? 'E-mail inválido.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      setFamilies(await addFamilyMember(parsed.data.email))
      setEmail('')
      setMessage('Pessoa adicionada à família.')
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível adicionar.')
    } finally {
      setSaving(false)
    }
  }

  const family = families?.activeFamily
  const others = families?.families.filter((item) => item.id !== family?.id) ?? []

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={[styles.back, { backgroundColor: palette.surface }]}>
            <Ionicons name="chevron-back" size={22} color={palette.primaryDark} />
          </Pressable>
          <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 28 }}>Configurações</Text>
        </View>
        <Pressable onPress={changePhoto} style={[styles.profile, { backgroundColor: palette.surface }]}>
          <Avatar name={user?.name ?? ''} photo={user?.photo} size={72} />
          <View style={styles.profileCopy}>
            <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 20 }}>{user?.name}</Text>
            <Text style={{ color: palette.muted, fontFamily: fonts.regular }}>{user?.email}</Text>
            <Text style={{ color: palette.primaryDark, fontFamily: fonts.bold }}>Trocar foto</Text>
          </View>
        </Pressable>
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 18 }}>{family?.name ?? 'Família'}</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular }}>
            Seu papel: {family ? roleLabel(family.role) : 'carregando'}
          </Text>
          {family?.members.map((member) => (
            <View key={member.id} style={styles.member}>
              <Avatar name={member.user.name} photo={member.user.photo} size={36} />
              <View style={styles.profileCopy}>
                <Text style={{ color: palette.text, fontFamily: fonts.bold }}>{member.user.name}</Text>
                <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 12 }}>{roleLabel(member.role)}</Text>
              </View>
            </View>
          ))}
          {others.length > 0 ? (
            <Text style={{ color: palette.muted, fontFamily: fonts.regular }}>
              Também em: {others.map((item) => item.name).join(', ')}
            </Text>
          ) : null}
        </View>
        {family?.role === 'ADMIN' ? (
          <View style={[styles.card, { backgroundColor: palette.surface }]}>
            <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 18 }}>Adicionar membro</Text>
            <Text style={{ color: palette.muted, fontFamily: fonts.regular, lineHeight: 20 }}>
              A pessoa precisa já ter uma conta. Convites por e-mail para quem ainda não se cadastrou ficam para uma próxima versão.
            </Text>
            <TextField label="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <Button title="Adicionar" onPress={addMember} loading={saving} disabled={!email.trim()} />
          </View>
        ) : null}
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 18 }}>Notificações</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular, lineHeight: 20 }}>
            {pushEnabled
              ? 'Este aparelho recebe avisos da família mesmo com o aplicativo fechado.'
              : 'Os alarmes pessoais são agendados neste aparelho. Para a família receber com o app fechado, informe o EXPO_PUBLIC_PROJECT_ID de um projeto EAS.'}
          </Text>
        </View>
        {message ? <Text style={{ color: palette.primaryDark, fontFamily: fonts.semibold }}>{message}</Text> : null}
        {error ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{error}</Text> : null}
        <Button title="Sair" variant="danger" onPress={() => setConfirmLogout(true)} />
      </ScrollView>
      <ConfirmDialog
        visible={confirmLogout}
        title="Sair da conta"
        message="Você poderá entrar novamente quando quiser."
        confirmLabel="Sair"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false)
          void logout().then(() => router.replace('/(auth)/login'))
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  profile: { borderRadius: 24, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'center' },
  profileCopy: { flex: 1, gap: 2 },
  card: { borderRadius: 24, padding: 16, gap: 12 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 10 },
})
