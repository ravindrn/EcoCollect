
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export function LiveMapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Map</Text>
      <Text style={styles.subtitle}>
        Track waste collection vehicles in real time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
