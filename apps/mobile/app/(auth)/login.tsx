import { zodResolver } from '@hookform/resolvers/zod'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../../src/components/Button'
import { Crest } from '../../src/components/Crest'
import { TextField } from '../../src/components/TextField'
import { ApiError, api } from '../../src/services/api'
import { loginSchema, type AuthSession, type LoginInput } from '../../src/shared'
import { useAuthStore } from '../../src/stores/auth-store'
import { APP_NAME } from '../../src/theme/colors'
import { useTheme } from '../../src/theme/ThemeProvider'

export default function LoginScreen() {
  const { palette, fonts } = useTheme()
  const setSession = useAuthStore((state) => state.setSession)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const submit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      const session = await api<AuthSession>('/api/auth/login', { method: 'POST', body: values, auth: false })
      await setSession(session)
      router.replace('/(app)')
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Não foi possível entrar.')
    }
  })

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: palette.surface }]}>
            <Crest size={108} />
            <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 32 }}>{APP_NAME}</Text>
            <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 16, textAlign: 'center' }}>
              O calendário da família, simples e compartilhado.
            </Text>
          </View>
          <TextField
            label="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={form.watch('email')}
            onChangeText={(value) => form.setValue('email', value, { shouldValidate: form.formState.isSubmitted })}
            error={form.formState.errors.email?.message}
          />
          <TextField
            label="Senha"
            secure
            autoCapitalize="none"
            autoComplete="password"
            value={form.watch('password')}
            onChangeText={(value) => form.setValue('password', value, { shouldValidate: form.formState.isSubmitted })}
            error={form.formState.errors.password?.message}
          />
          {formError ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{formError}</Text> : null}
          <Button title="Entrar" onPress={submit} loading={form.formState.isSubmitting} />
          <Link href="/(auth)/forgot-password" style={[styles.link, { color: palette.primaryDark, fontFamily: fonts.bold }]}>
            Esqueci minha senha
          </Link>
          <Link href="/(auth)/register" style={[styles.link, { color: palette.primaryDark, fontFamily: fonts.bold }]}>
            Criar uma conta
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  hero: { borderRadius: 28, padding: 24, alignItems: 'center', gap: 8 },
  link: { textAlign: 'center', fontSize: 15, paddingVertical: 4 },
})
