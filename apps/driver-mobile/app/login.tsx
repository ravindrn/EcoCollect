import { useEffect, useMemo, useState } from 'react'
import { Text, TextInput } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { LanguageChoices } from '@/components/LanguageChoices'
import { Banner } from '@/components/ui/Banner'
import { Card } from '@/components/ui/Card'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { useAppTheme } from '@/hooks/useAppTheme'
import { login } from '@/services/auth'
import { useSession } from '@/stores/session'

type FormValues = { email: string; password: string }

export default function LoginScreen() {
  const { t, i18n } = useTranslation()
  const theme = useAppTheme()
  const router = useRouter()
  const token = useSession((state) => state.token)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('emailInvalid')),
        password: z.string().min(1, t('passwordRequired')),
      }),
    [t],
  )
  const { handleSubmit, setValue, watch, formState, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })
  const email = watch('email')
  const password = watch('password')

  useEffect(() => {
    if (formState.isSubmitted) void trigger()
  }, [i18n.language, formState.isSubmitted, trigger])

  if (token) return <Redirect href="/(app)" />

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setSubmitting(true)
    try {
      const nextToken = await login(values.email, values.password)
      useSession.getState().setToken(nextToken)
      router.replace('/(app)')
    } catch (error) {
      if (error instanceof Error && error.message === 'ROLE_REJECTED') {
        setFormError(t('roleRejected'))
        return
      }
      if (error instanceof TypeError) {
        setFormError(t('signInFailed'))
        return
      }
      setFormError(error instanceof Error ? error.message : t('signInFailed'))
    } finally {
      setSubmitting(false)
    }
  })

  const inputStyle = {
    minHeight: theme.touchTarget.minHeight,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: theme.strokes.strong,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
  }

  return (
    <Screen>
      <GradientHeader title={t('shellTitle')} subtitle={t('title')} />
      <Card>
          <LanguageChoices />
          <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label }}>{t('email')}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={(value) => setValue('email', value, { shouldValidate: formState.isSubmitted })}
            placeholder={t('email')}
            placeholderTextColor={theme.colors.textSecondary}
            style={inputStyle}
          />
          {formState.errors.email?.message ? <Banner tone="danger" message={formState.errors.email.message} /> : null}
          <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label, marginTop: theme.spacing.lg }}>
            {t('password')}
          </Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={(value) => setValue('password', value, { shouldValidate: formState.isSubmitted })}
            placeholder={t('password')}
            placeholderTextColor={theme.colors.textSecondary}
            style={inputStyle}
          />
          {formState.errors.password?.message ? <Banner tone="danger" message={formState.errors.password.message} /> : null}
          {formError ? <Banner tone="danger" message={formError} /> : null}
          <PrimaryButton
            label={submitting ? t('signingIn') : t('signIn')}
            disabled={submitting}
            onPress={() => void onSubmit()}
            style={{ marginTop: theme.spacing.xl }}
          />
      </Card>
    </Screen>
  )
}
