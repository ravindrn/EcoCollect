import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { NotificationSettingsScreen } from "../screens/profile/NotificationSettingsScreen";
import { ChangePasswordScreen } from "../screens/profile/ChangePasswordScreen";
import { PrivacySecurityScreen } from "../screens/profile/PrivacySecurityScreen";
import { HelpSupportScreen } from "../screens/profile/HelpSupportScreen";
import { AboutEcoCollectScreen } from "../screens/profile/AboutEcoCollectScreen";

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  NotificationSettings: undefined;
  ChangePassword: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  AboutEcoCollect: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />

      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
      />

      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />

      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />

      <Stack.Screen name="AboutEcoCollect" component={AboutEcoCollectScreen} />
    </Stack.Navigator>
  );
}
