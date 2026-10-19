import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { z } from 'zod'
import { env } from './src/config/env'
import { login } from './src/services/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const email = watch('email')
  const password = watch('password')

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      setSignedIn(true)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sign-in failed')
    }
  })

  if (signedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EcoCollect Driver</Text>
        <Text>Signed in</Text>
        <Text>API base: {env.apiBaseUrl}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver sign in</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(value) => setValue('email', value)}
        placeholder="Email"
        style={styles.input}
      />
      <Text>{formState.errors.email?.message}</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={(value) => setValue('password', value)}
        placeholder="Password"
        style={styles.input}
      />
      <Text>{formState.errors.password?.message}</Text>
      {formError ? <Text>{formError}</Text> : null}
      <Pressable onPress={onSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Sign in</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F5F7FA' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 12, marginTop: 8 },
  button: { marginTop: 16, backgroundColor: '#0F766E', borderRadius: 8, padding: 14 },
  buttonText: { color: 'white', textAlign: 'center', fontWeight: '700' },
})