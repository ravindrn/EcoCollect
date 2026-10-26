import { useEffect, useMemo, useState } from 'react'
import { Text, TextInput } from 'react-native'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Banner } from '@/components/ui/Banner'
import { Card } from '@/components/ui/Card'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { Screen } from '@/components/ui/Screen'
import { SuccessCheck } from '@/components/ui/SuccessCheck'
import { useAppTheme } from '@/hooks/useAppTheme'
import { householdLimitKg, readWeightDraft, saveWeightDraft } from '@/services/weightDraft'

type FormValues = { weight: string }

export default function WeightScreen() {
  const { t, i18n } = useTranslation()
  const theme = useAppTheme()
  const limit = householdLimitKg()
  const [saved, setSaved] = useState<number | null>(null)
  const [savedTick, setSavedTick] = useState(0)
  const [restored, setRestored] = useState(false)
  const schema = useMemo(
    () =>
      z.object({
        weight: z
          .string()
          .trim()
          .min(1, t('weightInvalid'))
          .refine((value) => {
            const weight = Number(value)
            return Number.isFinite(weight) && weight > 0
          }, t('weightInvalid')),
      }),
    [t],
  )
  const { handleSubmit, setValue, watch, formState, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { weight: '' },
  })
  const weight = watch('weight')

  useEffect(() => {
    const draft = readWeightDraft()
    if (draft === null) return
    setValue('weight', String(draft))
    setRestored(true)
  }, [setValue])

  useEffect(() => {
    if (formState.isSubmitted) void trigger()
  }, [i18n.language, formState.isSubmitted, trigger])

  const onSubmit = handleSubmit((values) => {
    const kilograms = Number(values.weight)
    saveWeightDraft(kilograms)
    setSaved(kilograms)
    setSavedTick((tick) => tick + 1)
    setRestored(false)
  })

  return (
    <Screen>
      <GradientHeader title={t('weightTitle')} back />
      <Card>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption }}>
          {t('weightLimit')}: {limit} {t('unitKg')}
        </Text>
        <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label, marginTop: theme.spacing.lg }}>
          {t('weightLabel')}
        </Text>
        <TextInput
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={(value) => setValue('weight', value, { shouldValidate: formState.isSubmitted })}
          placeholder={t('weightLabel')}
          placeholderTextColor={theme.colors.textSecondary}
          style={{
            minHeight: theme.touchTarget.minHeight,
            marginTop: theme.spacing.sm,
            backgroundColor: theme.colors.background,
            borderWidth: theme.strokes.strong,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.lg,
            color: theme.colors.textPrimary,
            ...theme.typography.body,
          }}
        />
        {formState.errors.weight?.message ? <Banner tone="danger" message={formState.errors.weight.message} /> : null}
        {restored ? <Banner tone="secondary" message={t('weightDraftRestored')} /> : null}
        {saved !== null ? <SuccessCheck key={savedTick} message={`${t('weightSaved')}: ${saved} ${t('unitKg')}`} /> : null}
        <PrimaryButton label={t('weightSave')} onPress={() => void onSubmit()} style={{ marginTop: theme.spacing.xl }} />
      </Card>
    </Screen>
  )
}
