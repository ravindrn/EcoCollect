import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export function HomeScreen() {
  const { user, signOut } = useAuth();

  const initial = (user?.fullName || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.greeting} numberOfLines={1}>
              Hello{user?.fullName ? `, ${user.fullName}` : ''}
            </Text>
            <Text style={styles.subtitle}>Welcome to EcoCollect</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your account</Text>

          <View style={styles.row}>
            <Text style={styles.cardLabel}>Signed in as</Text>
            <Text style={styles.cardValue}>{user?.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.cardLabel}>Role</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{user?.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />

        <PrimaryButton title="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  heroText: { flex: 1 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  card: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  row: { paddingVertical: 4 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  spacer: { flex: 1 },
});
