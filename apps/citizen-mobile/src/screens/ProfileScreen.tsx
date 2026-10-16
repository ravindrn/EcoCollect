import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  const initial = (user?.fullName || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? 'EcoCollect Citizen'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Role</Text>
        <Text style={styles.cardValue}>{user?.role}</Text>

        <View style={styles.divider} />

        <Text style={styles.cardLabel}>Account ID</Text>
        <Text style={styles.mono}>{user?.id}</Text>
      </View>

      <View style={styles.spacer} />

      <PrimaryButton title="Sign out" variant="ghost" onPress={signOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: 'white', fontSize: 34, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  mono: { fontFamily: 'monospace', fontSize: 12, color: colors.textSecondary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  spacer: { flex: 1 },
});