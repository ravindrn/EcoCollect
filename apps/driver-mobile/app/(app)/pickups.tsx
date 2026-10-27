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
import { useAppTheme } from '@/hooks/useAppTheme'
import { useDriverMap } from '@/hooks/useDriverMap'
import { pickupReasons, readPickupLog, savePickup, type PickupReason, type PickupRecord } from '@/services/pickupLog'
import { getMyProfile } from '@/services/profile'
import { getMyVehicle } from '@/services/vehicle'

export default function PickupsScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
  const profileQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: getMyProfile,
  })
  const vehicleQuery = useQuery({
    queryKey: ['vehicles', 'me'],
    queryFn: getMyVehicle,
  })
  const tripMap = useDriverMap(profileQuery.data?.email, vehicleQuery.data?.lastLocation ?? null)
  const ready = profileQuery.isSuccess && !tripMap?.routePending
  const pickups = ready ? tripMap?.pickups ?? [] : []
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
        {profileQuery.isPending || tripMap?.routePending ? <Skeleton label={t('routeLoading')} lines={3} /> : null}
        {profileQuery.isError ? <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} /> : null}
        {ready && pickups.length === 0 ? <EmptyState title={t('pickupEmpty')} /> : null}
        {pickups.length > 0 ? (
          <Text style={{ color: theme.colors.textPrimary, ...theme.typography.bodyStrong }}>
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
              style={{
                marginTop: theme.spacing.lg,
                paddingTop: theme.spacing.md,
                borderTopWidth: theme.strokes.hairline,
                borderTopColor: theme.colors.border,
              }}
            >
              <Text style={{ color: theme.colors.textPrimary, ...theme.typography.heading }}>
                {t('pickupLocation', { n: stop.index })}
              </Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
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
                <View style={{ marginTop: theme.spacing.md }}>
                  <Text style={{ color: theme.colors.textPrimary, ...theme.typography.caption }}>
                    {t('pickupAddReason')}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
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
  const theme = useAppTheme()
  const fill = tone === 'warning' ? theme.colors.warning : theme.colors.primary
  const ink = tone === 'warning' ? theme.colors.onWarning : theme.colors.onPrimary

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flexGrow: compact ? 0 : 1,
        flexBasis: compact ? '48%' : 0,
        minHeight: theme.touchTarget.minHeight,
        borderRadius: theme.radii.md,
        borderWidth: theme.strokes.strong,
        borderColor: selected ? fill : theme.colors.border,
        backgroundColor: selected ? fill : theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Text style={{ color: selected ? ink : theme.colors.textPrimary, ...theme.typography.button, textAlign: 'center' }}>
        {label}
      </Text>
    </PressableScale>
  )
}
