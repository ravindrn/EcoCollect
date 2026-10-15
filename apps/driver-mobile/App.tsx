import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { env } from './src/config/env'

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>EcoCollect Driver</Text>
      <Text style={styles.body}>Driver shell is running.</Text>
      <Text style={styles.body}>API base: {env.apiBaseUrl}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  body: { marginTop: 8, fontSize: 16, color: '#334155', textAlign: 'center' },
})
