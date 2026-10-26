import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { Screen } from '@/components/ui/Screen'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAppTheme } from '@/hooks/useAppTheme'
import { getPublishedAnnouncements, type Announcement } from '@/services/announcements'

export default function InboxScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const notices = useQuery({
    queryKey: ['announcements'],
    queryFn: getPublishedAnnouncements,
  })

  return (
    <Screen>
      <GradientHeader title={t('inboxTitle')} back />
      {notices.isPending ? (
        <Card>
          <Skeleton label={t('loading')} />
        </Card>
      ) : null}
      {notices.isError ? (
        <Card>
          <ErrorState error={notices.error} onRetry={() => void notices.refetch()} />
        </Card>
      ) : null}
      {notices.isSuccess && notices.data.length === 0 ? (
        <Card>
          <EmptyState title={t('inboxEmpty')} />
        </Card>
      ) : null}
      {notices.data?.map((notice, index) => (
        <Card key={notice.id} delay={index * 60}>
          <Notice notice={notice} />
        </Card>
      ))}
    </Screen>
  )
}

function Notice({ notice }: { notice: Announcement }) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const tone =
    notice.priority === 'URGENT'
      ? { fill: theme.colors.danger, ink: theme.colors.onDanger, label: t('priorityUrgent') }
      : notice.priority === 'IMPORTANT'
        ? { fill: theme.colors.warning, ink: theme.colors.onWarning, label: t('priorityImportant') }
        : { fill: theme.colors.secondary, ink: theme.colors.onSecondary, label: t('priorityNormal') }

  return (
    <View>
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: tone.fill,
          borderRadius: theme.radii.pill,
          paddingHorizontal: theme.spacing.md,
          minHeight: 32,
          justifyContent: 'center',
          marginBottom: theme.spacing.sm,
        }}
      >
        <Text style={{ color: tone.ink, ...theme.typography.caption }}>{tone.label}</Text>
      </View>
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>{notice.title}</Text>
      <Text style={{ color: theme.colors.textPrimary, ...theme.typography.body, marginTop: theme.spacing.sm }}>
        {notice.description}
      </Text>
      {notice.publishedAt ? (
        <Text style={{ color: theme.colors.textSecondary, ...theme.typography.caption, marginTop: theme.spacing.md }}>
          {notice.publishedAt.slice(0, 16).replace('T', ' ')}
        </Text>
      ) : null}
    </View>
  )
}
