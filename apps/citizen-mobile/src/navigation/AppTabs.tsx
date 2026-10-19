import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ComplaintsScreen } from '../screens/ComplaintsScreen';
import { NewComplaintScreen } from '../screens/NewComplaintScreen';
import { colors } from '../theme/colors';

export type AppTabsParamList = {
  Home: undefined;
  Complaints: undefined;
  New: undefined;
  Profile: undefined;
};

const Tabs = createBottomTabNavigator<AppTabsParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof AppTabsParamList, [IoniconName, IoniconName]> = {
  Home: ['home-outline', 'home'],
  Complaints: ['list-outline', 'list'],
  New: ['add-circle-outline', 'add-circle'],
  Profile: ['person-outline', 'person'],
};

export function AppTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [outline, filled] = ICONS[route.name];
          return (
            <Ionicons
              name={focused ? filled : outline}
              size={size}
              color={color}
            />
          );
        },
        tabBarLabel: ({ color }) => {
          const label =
            route.name === 'New' ? 'New' : route.name;
          return <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Complaints" component={ComplaintsScreen} />
      <Tabs.Screen name="New" component={NewComplaintScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}