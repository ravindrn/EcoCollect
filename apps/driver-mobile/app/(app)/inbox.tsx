import { Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { Screen } from '@/components/ui/Screen'
import { Skeleton } from '@/components/ui/Skeleton'
import { getPublishedAnnouncements, type Announcement } from '@/services/announcements'
import { colors } from '@/theme/colors'

export default function InboxScreen() {
  const { t } = useTranslation()
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
  const tone =
    notice.priority === 'URGENT'
      ? { fill: colors.error, ink: '#FFFFFF', label: t('priorityUrgent') }
      : notice.priority === 'IMPORTANT'
        ? { fill: colors.warning, ink: '#FFFFFF', label: t('priorityImportant') }
        : { fill: colors.primaryLight, ink: colors.primary, label: t('priorityNormal') }

  return (
    <View>
      <View
        className="mb-2 min-h-[32px] items-center justify-center self-start rounded-full px-3"
        style={{ backgroundColor: tone.fill }}
      >
        <Text className="text-xs font-semibold" style={{ color: tone.ink }}>
          {tone.label}
        </Text>
      </View>

      <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
        {notice.title}
      </Text>

      <Text className="mt-2 text-[15px]" style={{ color: colors.textSecondary }}>
        {notice.description}
      </Text>

      {notice.publishedAt ? (
        <Text
          className="mt-3 text-xs uppercase tracking-wider"
          style={{ color: colors.textMuted }}
        >
          {notice.publishedAt.slice(0, 16).replace('T', ' ')}
        </Text>
      ) : null}
    </View>
  )
}