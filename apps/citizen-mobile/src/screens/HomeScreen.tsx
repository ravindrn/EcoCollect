import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <Text style={styles.greeting}>
          Hello{user?.fullName ? `, ${user.fullName}` : ''}
        </Text>
        <Text style={styles.subtitle}>Welcome to EcoCollect</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed in as</Text>
          <Text style={styles.cardValue}>{user?.email}</Text>
          <Text style={styles.cardLabel}>Role</Text>
          <Text style={styles.cardValue}>{user?.role}</Text>
        </View>

        <View style={styles.spacer} />

        <PrimaryButton title="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  spacer: { flex: 1 },
});