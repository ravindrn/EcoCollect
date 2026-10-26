import { Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/useAppTheme'
import { usePreferences } from '@/stores/preferences'
import type { AppLanguage } from '@/i18n/language'
import { PressableScale } from './ui/PressableScale'

const choices: { id: AppLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'si', label: 'සිංහල' },
  { id: 'ta', label: 'தமிழ்' },
]

export function LanguageChoices() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const language = usePreferences((state) => state.language)
  const setLanguage = usePreferences((state) => state.setLanguage)

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption, marginBottom: theme.spacing.sm }}>
        {t('languageLabel')}
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {choices.map((choice) => {
          const selected = language === choice.id
          return (
            <PressableScale
              key={choice.id}
              accessibilityLabel={choice.label}
              accessibilityState={{ selected }}
              onPress={() => setLanguage(choice.id)}
              style={{
                minHeight: theme.touchTarget.minHeight,
                minWidth: theme.touchTarget.minWidth,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radii.md,
                borderWidth: theme.strokes.strong,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                backgroundColor: selected ? theme.colors.primarySoft : theme.colors.card,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: theme.colors.textPrimary, ...theme.typography.label }}>{choice.label}</Text>
            </PressableScale>
          )
        })}
      </View>
    </View>
  )
}
