import { useEffect, useMemo, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { LanguageChoices } from '@/components/LanguageChoices'
import { Banner } from '@/components/ui/Banner'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { login } from '@/services/auth'
import { useSession } from '@/stores/session'
import { colors } from '@/theme/colors'

type FormValues = { email: string; password: string }

export default function LoginScreen() {
  const { t, i18n } = useTranslation()
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
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.textPrimary,
  }

  return (
    <Screen>
      {/* Header: replaces GradientHeader with the citizen-style light header */}
      <View className="mb-6 mt-4 items-center">
        <View
          className="mb-3 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-[34px] font-bold text-white">
            {t('shellTitle').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-xl font-bold" style={{ color: colors.textPrimary }}>
          {t('shellTitle')}
        </Text>
        <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
          {t('title')}
        </Text>
      </View>

      {/* Card: replaces <Card> with the citizen card style */}
      <View
        className="rounded-2xl border p-[18px]"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <LanguageChoices />

        <Text
          className="mb-1 mt-4 text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          {t('email')}
        </Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={(value) => setValue('email', value, { shouldValidate: formState.isSubmitted })}
          placeholder={t('email')}
          placeholderTextColor={colors.textMuted}
          className="min-h-[48px] rounded-xl border px-4 text-[15px]"
          style={inputStyle}
        />
        {formState.errors.email?.message ? <Banner tone="danger" message={formState.errors.email.message} /> : null}

        <Text
          className="mb-1 mt-4 text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          {t('password')}
        </Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={(value) => setValue('password', value, { shouldValidate: formState.isSubmitted })}
          placeholder={t('password')}
          placeholderTextColor={colors.textMuted}
          className="min-h-[48px] rounded-xl border px-4 text-[15px]"
          style={inputStyle}
        />
        {formState.errors.password?.message ? <Banner tone="danger" message={formState.errors.password.message} /> : null}
        {formError ? <Banner tone="danger" message={formError} /> : null}

        <PrimaryButton
          label={submitting ? t('signingIn') : t('signIn')}
          disabled={submitting}
          onPress={() => void onSubmit()}
          style={{ marginTop: 24 }}
        />
      </View>
    </Screen>
  )
}