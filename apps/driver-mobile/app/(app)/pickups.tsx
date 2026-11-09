import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { GradientHeader } from '@/components/ui/GradientHeader'
import { Screen } from '@/components/ui/Screen'
import { Skeleton } from '@/components/ui/Skeleton'
import { PressableScale } from '@/components/ui/PressableScale'
import { getMyRoute } from '@/services/myRoute'
import { pickupReasons, readPickupLog, savePickup, type PickupReason, type PickupRecord } from '@/services/pickupLog'
import { colors } from '@/theme/colors'

export default function PickupsScreen() {
  const { t } = useTranslation()
  const [records, setRecords] = useState<PickupRecord[]>(() => readPickupLog())
  const [askingId, setAskingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const reasonLabels: Record<PickupReason, string> = {
    BIN_NOT_FOUND: t('pickupReasonBin'),
    BIN_DAMAGED: t('pickupReasonDamaged'),
    ACCESS_BLOCKED: t('pickupReasonBlocked'),
    ALREADY_EMPTY: t('pickupReasonEmpty'),
    OTHER: t('pickupReasonOther'),
  }
  const routeQuery = useQuery({ queryKey: ['routes', 'me'], queryFn: getMyRoute })
  const ready = routeQuery.isSuccess
  const pickups = routeQuery.data?.stops ?? []
  const byId = new Map(records.map((record) => [record.stopId, record]))
  const collected = pickups.filter((stop) => byId.get(stop.id)?.status === 'collected').length
  const missed = pickups.filter((stop) => byId.get(stop.id)?.status === 'missed').length

  function markCollected(stopId: string) {
    setRecords(savePickup({ stopId, status: 'collected', reason: null, note: null }))
    setAskingId((current) => (current === stopId ? null : current))
  }

  function askReason(stopId: string) {
    setAskingId(stopId)
  }

  function chooseReason(stopId: string, reason: PickupReason) {
    const existing = byId.get(stopId)
    const note = reason === 'OTHER' ? notes[stopId] ?? existing?.note ?? null : null
    setRecords(savePickup({ stopId, status: 'missed', reason, note }))
    setAskingId(stopId)
  }

  function saveOtherNote(stopId: string, note: string) {
    setNotes((current) => ({ ...current, [stopId]: note }))
    setRecords(savePickup({ stopId, status: 'missed', reason: 'OTHER', note: note.trim() || null }))
  }

  return (
    <Screen>
      <GradientHeader title={t('pickupsTitle')} back />
      <Card>
        {routeQuery.isPending ? <Skeleton label={t('routeLoading')} lines={3} /> : null}
        {routeQuery.isError ? <ErrorState error={routeQuery.error} onRetry={() => void routeQuery.refetch()} /> : null}
        {ready && pickups.length === 0 ? <EmptyState title={t('pickupEmpty')} /> : null}
        {pickups.length > 0 ? (
          <Text className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
            {t('pickupSummary', { collected, missed })}
          </Text>
        ) : null}
        {pickups.map((stop) => {
          const record = byId.get(stop.id)
          const choosing = askingId === stop.id
          const collectedSelected = record?.status === 'collected' && !choosing
          const missedSelected = !collectedSelected && (record?.status === 'missed' || choosing)
          return (
            <View
              key={stop.id}
              className="mt-4 border-t pt-3"
              style={{ borderTopColor: colors.border }}
            >
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                {stop.name}
              </Text>
              <View className="mt-3 flex-row gap-2">
                <Choice
                  label={t('pickupCollected')}
                  selected={collectedSelected}
                  tone="primary"
                  onPress={() => markCollected(stop.id)}
                />
                <Choice
                  label={t('pickupMissed')}
                  selected={missedSelected}
                  tone="warning"
                  onPress={() => askReason(stop.id)}
                />
              </View>
              {missedSelected ? (
                <View className="mt-3">
                  <Text
                    className="text-xs uppercase tracking-wider"
                    style={{ color: colors.textMuted }}
                  >
                    {t('pickupAddReason')}
                  </Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {pickupReasons.map((reason) => (
                      <Choice
                        key={reason}
                        label={reasonLabels[reason]}
                        selected={record?.status === 'missed' && record.reason === reason}
                        tone="warning"
                        compact
                        onPress={() => chooseReason(stop.id, reason)}
                      />
                    ))}
                  </View>
                  {record?.reason === 'OTHER' ? (
                    <TextInput
                      value={notes[stop.id] ?? record.note ?? ''}
                      onChangeText={(value) => saveOtherNote(stop.id, value)}
                      placeholder={t('pickupReasonOtherHint')}
                      placeholderTextColor={colors.textMuted}
                      className="mt-2 min-h-[48px] rounded-xl border px-4 text-[15px]"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      }}
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          )
        })}
      </Card>
    </Screen>
  )
}

function Choice({
  label,
  selected,
  tone,
  compact = false,
  onPress,
}: {
  label: string
  selected: boolean
  tone: 'primary' | 'warning'
  compact?: boolean
  onPress: () => void
}) {
  const fill = tone === 'warning' ? colors.warning : colors.primary

  // PressableScale keeps a plain `style` prop (its className support is unknown),
  // so the layout values stay as raw numbers here and only the colors change.
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flexGrow: compact ? 0 : 1,
        flexBasis: compact ? '48%' : 0,
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? fill : colors.border,
        backgroundColor: selected ? fill : colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
      }}
    >
      <Text
        className="text-center text-sm font-semibold"
        style={{ color: selected ? '#FFFFFF' : colors.textPrimary }}
      >
        {label}
      </Text>
    </PressableScale>
  )
}