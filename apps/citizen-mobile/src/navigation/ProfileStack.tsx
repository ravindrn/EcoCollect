
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
      />

      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
      />
    </Stack.Navigator>
  );
}
