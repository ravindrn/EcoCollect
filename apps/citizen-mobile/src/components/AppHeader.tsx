
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '../theme/colors';

type AppHeaderProps = {
  showNotifications?: boolean;
  onNotificationPress?: () => void;
};

export function AppHeader({
  showNotifications = true,
  onNotificationPress,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>♻️</Text>
        </View>

        <View style={styles.brandText}>
          <Text style={styles.appName}>EcoCollect</Text>
          <Text style={styles.tagline}>
            Smart Waste Management
          </Text>
        </View>
      </View>

      {showNotifications && (
        <Pressable
          style={styles.notificationButton}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Bell size={22} color={colors.textPrimary} />
          <View style={styles.notificationDot} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 27,
  },
  brandText: {
    flex: 1,
  },
  appName: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 12,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
