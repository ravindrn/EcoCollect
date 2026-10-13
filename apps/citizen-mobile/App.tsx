import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { api, ApiError } from './src/services/http';
import { env } from './src/config/env';

type Health = { status: 'ok'; service: string; time: string };

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: Health }
  | { kind: 'error'; message: string };

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const check = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const data = await api.get<Health>('/health');
      setState({ kind: 'ok', data });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unknown error';
      setState({ kind: 'error', message });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>EcoCollect — Citizen</Text>
        <Text style={styles.subtitle}>Backend connectivity check</Text>

        <View style={styles.card}>
          <Text style={styles.label}>API base URL</Text>
          <Text style={styles.mono}>{env.apiBaseUrl}</Text>

          <View style={styles.spacer} />

          {state.kind === 'loading' && (
            <>
              <ActivityIndicator />
              <Text style={styles.status}>Checking backend…</Text>
            </>
          )}

          {state.kind === 'ok' && (
            <>
              <Text style={[styles.status, styles.ok]}>
                ✔ Backend reachable
              </Text>
              <Text style={styles.mono}>service: {state.data.service}</Text>
              <Text style={styles.mono}>time: {state.data.time}</Text>
            </>
          )}

          {state.kind === 'error' && (
            <>
              <Text style={[styles.status, styles.err]}>✖ {state.message}</Text>
              <Text style={styles.hint}>
                Check that the backend is running and that apiBaseUrl matches
                your device.
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={check}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  mono: { fontFamily: 'monospace', color: '#0F172A', marginTop: 2 },
  spacer: { height: 12 },
  status: { marginTop: 12, fontSize: 15 },
  ok: { color: '#15803D', fontWeight: '600' },
  err: { color: '#B91C1C', fontWeight: '600' },
  hint: { marginTop: 8, color: '#475569', fontSize: 12 },
  button: {
    marginTop: 20,
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 15 },
});