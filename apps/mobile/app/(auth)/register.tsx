import { Ionicons } from '@expo/vector-icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { Link, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../../src/components/Button'
import { Crest } from '../../src/components/Crest'
import { SelectableCard } from '../../src/components/SelectableCard'
import { TextField } from '../../src/components/TextField'
import { ApiError, api } from '../../src/services/api'
import { uploadPhoto } from '../../src/services/tasks'
import { registerSchema, type AuthSession, type RegisterInput } from '../../src/shared'
import { useAuthStore } from '../../src/stores/auth-store'
import { useTheme } from '../../src/theme/ThemeProvider'

export default function RegisterScreen() {
  const { palette, fonts, setPreviewGender } = useTheme()
  const setSession = useAuthStore((state) => state.setSession)
  const setUser = useAuthStore((state) => state.setUser)
  const [photo, setPhoto] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  })
  const gender = form.watch('gender')

  useEffect(() => {
    setPreviewGender(gender === 'MALE' || gender === 'FEMALE' ? gender : null)
    return () => setPreviewGender(null)
  }, [gender, setPreviewGender])

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem de perfil.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled) setPhoto(result.assets[0]?.uri ?? null)
  }

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const session = await api<AuthSession>('/api/auth/register', {
        method: 'POST',
        body: { ...values, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        auth: false,
      })
      await setSession(session)
      if (photo) {
        const formData = new FormData()
        if (Platform.OS === 'web') {
          const file = await fetch(photo).then((response) => response.blob())
          formData.append('photo', file, 'perfil.jpg')
        } else {
          const png = photo.toLowerCase().includes('.png')
          formData.append('photo', {
            uri: photo,
            name: png ? 'perfil.png' : 'perfil.jpg',
            type: png ? 'image/png' : 'image/jpeg',
          } as unknown as Blob)
        }
        await setUser(await uploadPhoto(formData))
      }
      router.replace('/(app)')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível criar a conta.')
    }
  })

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Crest size={64} />
            <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 28 }}>Criar conta</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.photoWrap}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
            ) : (
              <View style={[styles.photo, styles.placeholder, { backgroundColor: palette.primarySoft }]}>
                <Ionicons name="camera-outline" size={24} color={palette.primaryDark} />
              </View>
            )}
            <Text style={{ color: palette.primaryDark, fontFamily: fonts.bold }}>
              {photo ? 'Trocar foto' : 'Adicionar foto (opcional)'}
            </Text>
          </Pressable>
          <TextField label="Nome completo" value={form.watch('name')} onChangeText={(value) => form.setValue('name', value)} error={form.formState.errors.name?.message} />
          <TextField label="E-mail" autoCapitalize="none" keyboardType="email-address" value={form.watch('email')} onChangeText={(value) => form.setValue('email', value)} error={form.formState.errors.email?.message} />
          <TextField label="Senha" secure autoCapitalize="none" value={form.watch('password')} onChangeText={(value) => form.setValue('password', value)} error={form.formState.errors.password?.message} />
          <View style={styles.gender}>
            <Text style={{ color: palette.text, fontFamily: fonts.bold }}>Sexo</Text>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <View style={styles.genderRow}>
                  <SelectableCard title="Masculino" subtitle="Tons de azul" icon="male" selected={field.value === 'MALE'} onPress={() => field.onChange('MALE')} />
                  <SelectableCard title="Feminino" subtitle="Tons de rosa" icon="female" selected={field.value === 'FEMALE'} onPress={() => field.onChange('FEMALE')} />
                </View>
              )}
            />
            {form.formState.errors.gender?.message ? (
              <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{form.formState.errors.gender.message}</Text>
            ) : null}
          </View>
          {formError ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{formError}</Text> : null}
          <Button title="Criar conta" onPress={submit} loading={form.formState.isSubmitting} />
          <Link href="/(auth)/login" style={{ color: palette.primaryDark, fontFamily: fonts.bold, textAlign: 'center' }}>
            Já tenho uma conta
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoWrap: { alignItems: 'center', gap: 8 },
  photo: { width: 92, height: 92, borderRadius: 32 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  gender: { gap: 10 },
  genderRow: { flexDirection: 'row', gap: 10 },
})
