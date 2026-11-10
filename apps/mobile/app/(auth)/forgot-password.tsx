import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '../../src/components/Button'
import { TextField } from '../../src/components/TextField'
import { ApiError, api } from '../../src/services/api'
import { forgotPasswordSchema, resetPasswordSchema } from '../../src/shared'
import { useTheme } from '../../src/theme/ThemeProvider'

export default function ForgotPasswordScreen() {
  const { palette, fonts } = useTheme()
  const [devCode, setDevCode] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestForm = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })
  const resetForm = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '', code: '', password: '' },
  })

  const requestCode = requestForm.handleSubmit(async (values) => {
    setError(null)
    try {
      const response = await api<{ message: string; devCode?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: values,
        auth: false,
      })
      setMessage(response.message)
      setDevCode(response.devCode ?? null)
      resetForm.setValue('email', values.email)
      if (response.devCode) resetForm.setValue('code', response.devCode)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível enviar o código.')
    }
  })

  const resetPassword = resetForm.handleSubmit(async (values) => {
    setError(null)
    try {
      const response = await api<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: values,
        auth: false,
      })
      setMessage(response.message)
      setDevCode(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível redefinir a senha.')
    }
  })

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={{ color: palette.text, fontFamily: fonts.extra, fontSize: 28 }}>Recuperar senha</Text>
          <Text style={{ color: palette.muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 }}>
            Informe o e-mail da conta. Enviaremos um código de 6 dígitos para criar uma nova senha.
          </Text>
          <TextField label="E-mail" autoCapitalize="none" keyboardType="email-address" value={requestForm.watch('email')} onChangeText={(value) => requestForm.setValue('email', value)} error={requestForm.formState.errors.email?.message} />
          <Button title="Enviar código" onPress={requestCode} loading={requestForm.formState.isSubmitting} />
          {message ? <Text style={{ color: palette.primaryDark, fontFamily: fonts.semibold }}>{message}</Text> : null}
          {devCode ? (
            <Text style={{ color: palette.muted, fontFamily: fonts.regular }}>
              Ambiente de desenvolvimento: use o código {devCode}.
            </Text>
          ) : null}
          <TextField label="Código" keyboardType="number-pad" value={resetForm.watch('code')} onChangeText={(value) => resetForm.setValue('code', value)} error={resetForm.formState.errors.code?.message} />
          <TextField label="Nova senha" secure value={resetForm.watch('password')} onChangeText={(value) => resetForm.setValue('password', value)} error={resetForm.formState.errors.password?.message} />
          {resetForm.formState.errors.email?.message ? (
            <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>Informe o e-mail antes de redefinir.</Text>
          ) : null}
          {error ? <Text style={{ color: palette.danger, fontFamily: fonts.semibold }}>{error}</Text> : null}
          <Button title="Salvar nova senha" variant="secondary" onPress={resetPassword} loading={resetForm.formState.isSubmitting} />
          <Link href="/(auth)/login" style={{ color: palette.primaryDark, fontFamily: fonts.bold, textAlign: 'center' }}>
            Voltar ao login
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
})
