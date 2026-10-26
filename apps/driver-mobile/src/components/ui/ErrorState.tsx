import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Banner } from './Banner'
import { PrimaryButton } from './PrimaryButton'
import { useAppTheme } from '@/hooks/useAppTheme'

type Props = {
  error: unknown
  onRetry: () => void
}

export function readableError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  if (error.message === 'LOAD_FAILED' || error.message === 'Failed to fetch') return fallback
  return error.message
}

export function ErrorState({ error, onRetry }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  return (
    <View style={{ marginTop: theme.spacing.md }}>
      <Banner tone="danger" message={readableError(error, t('loadFailed'))} />
      <PrimaryButton label={t('queueRetry')} onPress={onRetry} style={{ marginTop: theme.spacing.md }} />
    </View>
  )
}
