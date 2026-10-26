import { Component, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import i18n from '@/i18n'
import { colors, spacing, touchTarget, typography } from '@/theme'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: spacing.screen, backgroundColor: colors.light.background }}>
          <Text style={{ color: colors.light.textPrimary, ...typography.heading }}>{i18n.t('errorTitle')}</Text>
          <Text style={{ color: colors.light.textSecondary, ...typography.body, marginTop: spacing.sm }}>
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={this.reset}
            style={{
              marginTop: spacing.lg,
              minHeight: touchTarget.minHeight,
              minWidth: touchTarget.minWidth,
              justifyContent: 'center',
              backgroundColor: colors.light.primary,
              borderRadius: 12,
              paddingHorizontal: spacing.lg,
            }}
          >
            <Text style={{ color: colors.light.onPrimary, ...typography.button, textAlign: 'center' }}>{i18n.t('errorRetry')}</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}