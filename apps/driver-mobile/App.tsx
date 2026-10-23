import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { z } from 'zod'
import { login } from './src/services/auth'
import { useTranslation  } from 'react-i18next'
import { saveLanguage, type AppLanguage } from './src/i18n/language' 
import { 
  getPublishedAnnouncements,
  type Announcement,
 } from './src/services/announcements'
import { getMyProfile, type DriverProfile } from './src/services/profile'
import { clearToken } from './src/services/session'
import { todayRouteForEmail } from './src/services/todayRoute'
import { gpsSampleIntervalMs } from './src/config/gps'
import {
  GpsDeniedError,
  enqueueFix,
  flushQueue,
  queuedPointCount,
  readCurrentFix,
} from './src/services/gpsQueue'

type FormValues = { email: string; password: string }

function LanguageChoices({ onChoose }: { onChoose: (language: AppLanguage) => void }) {
  return (
    <View style={styles.languages}>
      <Pressable onPress={() => onChoose('en')} style={styles.languageButton}>
        <Text>English</Text>
      </Pressable>
      <Pressable onPress={() => onChoose('si')} style={styles.languageButton}>
        <Text>සිංහල</Text>
      </Pressable>
      <Pressable onPress={() => onChoose('ta')} style={styles.languageButton}>
        <Text>தமிழ்</Text>
      </Pressable>
    </View>
  )
}

export default function App() {
  const { t, i18n } = useTranslation()
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('emailInvalid')),
        password: z.string().min(1, t('passwordRequired')),
      }),
    [t],
  )
  const [signedIn, setSignedIn] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { handleSubmit, setValue, watch, formState, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const email = watch('email')
  const password = watch('password')
  const [notices, setNotices] = useState<Announcement[]>([])
  const [noticeError, setNoticeError] = useState<string | null>(null)
  const [profile, setProfile] = useState<DriverProfile | null>(null)
  const route = profile ? todayRouteForEmail(profile.email) : null
  const [profileError, setProfileError] = useState<string | null>(null)
  const [weightText, setWeightText] = useState('')
  const [savedWeight, setSavedWeight] = useState<number | null>(null)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [tripActive, setTripActive] = useState(false)
  const [queueCount, setQueueCount] = useState(0)
  const [gpsDenied, setGpsDenied] = useState(false)

  function chooseLanguage(language: AppLanguage) {
    saveLanguage(language)
    void i18n.changeLanguage(language)
  }

  useEffect(() => {
    if (formState.isSubmitted) void trigger()
  }, [i18n.language, formState.isSubmitted, trigger])
  
  useEffect(() => {
    if(!signedIn) return
    getPublishedAnnouncements()
    .then(setNotices)
    .catch(() => setNoticeError(t('inboxError')))

    getMyProfile()
    .then(setProfile)
    .catch((error: unknown) =>
       setProfileError(error instanceof Error ? error.message : t('inboxError')),
    )
  }, [signedIn, t])

  useEffect(() => {
    if (!signedIn) return
    setQueueCount(queuedPointCount())
  }, [signedIn])

  useEffect(() => {
    if (!tripActive) return

    let lastFix: { latitude: number; longitude: number; speedKmh: number | null } | null = null

    const sample = async () => {
      const online = typeof navigator !== 'undefined' && navigator.onLine
      try {
        const fix = await readCurrentFix()
        lastFix = fix
        const count = enqueueFix(fix)
        setQueueCount(online ? flushQueue(true) : count)
        setGpsDenied(false)
      } catch (error) {
        if (error instanceof GpsDeniedError) {
          setGpsDenied(true)
          setTripActive(false)
          return
        }
        if (lastFix) {
          const count = enqueueFix(lastFix)
          setQueueCount(online ? flushQueue(true) : count)
        }
      }
    }

    void sample()
    const timer = setInterval(() => void sample(), gpsSampleIntervalMs)
    const onOnline = () => setQueueCount(flushQueue(true))
    if (typeof window !== 'undefined') window.addEventListener('online', onOnline)
    return () => {
      clearInterval(timer)
      if (typeof window !== 'undefined') window.removeEventListener('online', onOnline)
    }
  }, [tripActive])

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      setSignedIn(true)
    } catch (error) {
      if (error instanceof Error && error.message === 'ROLE_REJECTED') {
        setFormError(t('roleRejected'))
        return
      }
      setFormError(error instanceof Error ? error.message : t('signInFailed'))
    }
  })

  function saveWeight() {
    const weight = Number(weightText)
    if (!Number.isFinite(weight) || weight <= 0) {
      setWeightError(t('weightInvalid'))
      return
    }
    setWeightError(null)
    setSavedWeight(weight)
  }

  if (signedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('shellTitle')}</Text>
        <LanguageChoices onChoose={chooseLanguage} />
        <Text>{t('signedIn')}</Text>
        <Text style={styles.title}>{t('inboxTitle')}</Text>
        {noticeError ? <Text>{noticeError}</Text> : null}
        {notices.length === 0 ? <Text>{t('inboxEmpty')}</Text> : null}
        {notices.map((notice) => (
          <View key={notice.id}>
          <Text>{notice.title}</Text>
          <Text>{notice.description}</Text>

        </View>
      ))}

      <Text style={styles.title}>{t('routeTitle')}</Text>
        {!profile && !profileError ? <Text>{t('routeLoading')}</Text> : null}
        {profile && route ? (
          <View>
            <Text>{route.routeName}</Text>
            <Text>{t('routeTractor')}: {route.tractorName}</Text>
            <Text>{route.plannedStart}–{route.plannedEnd}</Text>
            <Text>{t('routeStops')}: {route.stopCount}</Text>
          </View>
        ) : null}
        {profile && !route ? <Text>{t('routeEmpty')}</Text> : null}

      <Text style={styles.title}>{t('tripTitle')}</Text>
      {gpsDenied ? <Text>{t('gpsDenied')}</Text> : null}
      <Text>{t('gpsQueued')}: {queueCount}</Text>
      <Pressable onPress={() => setTripActive(true)} style={styles.button}>
        <Text style={styles.buttonText}>{t('tripStart')}</Text>
      </Pressable>
      <Pressable onPress={() => setTripActive(false)} style={styles.button}>
        <Text style={styles.buttonText}>{t('tripStop')}</Text>
      </Pressable>

      <Text style={styles.title}>{t('weightTitle')}</Text>
      <Text>{t('weightLimit')}: 30 kg</Text>
      <TextInput
        keyboardType="decimal-pad"
        value={weightText}
        onChangeText={(value) => setWeightText(value)}
        placeholder={t('weightLabel')}
        style={styles.input}
      />
      {weightError ? <Text>{weightError}</Text> : null}
      <Pressable onPress={saveWeight} style={styles.button}>
        <Text style={styles.buttonText}>{t('weightSave')}</Text>
      </Pressable>
      {savedWeight !== null ? (
        <Text>{t('weightSaved')}: {savedWeight} kg</Text>
      ) : null}

      <Text style={styles.title}>{t('profileTitle')}</Text>
      {profileError ? <Text>{profileError}</Text> : null}
      {profile ? <Text>{profile.email}</Text> : null}
      {profile ? <Text>{profile.role}</Text> : null}
      {profile && !profile.profile ? <Text>{t('profileMissing')}</Text> : null}
      <Pressable
        onPress={() => {
        void clearToken()
        setSignedIn(false)
        setTripActive(false)
        setNotices([])
        setProfile(null)
      }}
      style={styles.button}
>
  <Text style={styles.buttonText}>{t('signOut')}</Text>
</Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('title')}</Text>
      <LanguageChoices onChoose={chooseLanguage} />
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(value) => setValue('email', value)}
        placeholder={t('email')}
        style={styles.input}
      />
      <Text>{formState.errors.email?.message}</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={(value) => setValue('password', value)}
        placeholder={t('password')}
        style={styles.input}
      />
      <Text>{formState.errors.password?.message}</Text>
      {formError ? <Text>{formError}</Text> : null}
      <Pressable onPress={onSubmit} style={styles.button}>
      <Text style={styles.buttonText}>{t('signIn')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F5F7FA' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, marginTop: 8 },
  languages: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  languageButton: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
  button: { marginTop: 16, backgroundColor: '#0F766E', borderRadius: 8, padding: 14, minHeight: 48, justifyContent: 'center' },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '700' },
})
