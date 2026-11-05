
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenContainer } from "../../components/ScreenContainer";
import { AppHeader } from "../../components/AppHeader";
import type { ProfileStackParamList } from "../../navigation/ProfileStack";

type NavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "PrivacySecurity"
>;

type InfoSectionProps = {
  icon: string;
  title: string;
  description: string;
  content: string[];
};

function InfoSection({
  icon,
  title,
  description,
  content,
}: InfoSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center gap-3 p-4"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
          <Text className="text-xl">{icon}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-bold text-slate-900">
            {title}
          </Text>

          <Text className="mt-1 text-xs text-slate-500">
            {description}
          </Text>
        </View>

        <Text className="text-xl font-semibold text-slate-400">
          {expanded ? "−" : "+"}
        </Text>
      </Pressable>

      {expanded && (
        <View className="border-t border-gray-100 px-4 py-3">
          {content.map((item, index) => (
            <View key={index} className="mb-3 flex-row gap-2">
              <Text className="text-emerald-600">•</Text>
              <Text className="flex-1 text-sm leading-6 text-slate-600">
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function PrivacySecurityScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AppHeader onNotificationPress={() => {}} />

        <View className="mb-5 mt-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="mb-5 self-start rounded-full bg-white px-4 py-2"
          >
            <Text className="font-semibold text-slate-700">
              ← Back
            </Text>
          </Pressable>

          <Text className="text-2xl font-extrabold text-slate-900">
            Privacy & Security
          </Text>

          <Text className="mt-2 text-sm leading-6 text-slate-500">
            Manage your account security and learn about privacy and data
            protection in EcoCollect.
          </Text>
        </View>

        {/* Security information */}
        <View className="mb-5 rounded-2xl bg-emerald-600 p-5">
          <View className="mb-3 h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Text className="text-2xl">🛡️</Text>
          </View>

          <Text className="text-lg font-extrabold text-white">
            Your Account Security
          </Text>

          <Text className="mt-2 text-sm leading-6 text-emerald-50">
            Keep your account secure by using a strong password and
            protecting your login credentials.
          </Text>

          <Pressable
            onPress={() => navigation.navigate("ChangePassword")}
            className="mt-4 self-start rounded-xl bg-white px-4 py-3"
          >
            <Text className="font-bold text-emerald-700">
              Change Password →
            </Text>
          </Pressable>
        </View>

        {/* Privacy sections */}
        <Text className="mb-3 text-[17px] font-extrabold text-slate-900">
          Privacy Information
        </Text>

        <InfoSection
          icon="🔒"
          title="Privacy Policy"
          description="How your information is handled"
          content={[
            "EcoCollect uses account information to provide its waste management services.",
            "Information such as your name, email address and contact details may be used to manage your account.",
            "Location information may be used for location-based services when you provide or enable it.",
          ]}
        />

        <InfoSection
          icon="📜"
          title="Terms & Conditions"
          description="Rules for using EcoCollect"
          content={[
            "Use your account responsibly and provide accurate information.",
            "Do not use the application to submit false or misleading complaints.",
            "Keep your login credentials confidential.",
          ]}
        />

        <InfoSection
          icon="🔐"
          title="Account Security"
          description="Tips to protect your account"
          content={[
            "Use a strong password that is difficult to guess.",
            "Do not share your password with other people.",
            "Log out when using a shared device.",
            "Change your password if you suspect someone else has accessed your account.",
          ]}
        />

        <InfoSection
          icon="📂"
          title="Data Privacy"
          description="Information associated with your account"
          content={[
            "Your profile information is associated with your EcoCollect account.",
            "Complaint details and submitted photos may be used to support waste management services.",
            "Contact the EcoCollect administration for questions about your personal information or data-related requests.",
          ]}
        />

        <View className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <Text className="font-bold text-emerald-800">
            Need help with your privacy?
          </Text>

          <Text className="mt-2 text-sm leading-6 text-emerald-700">
            Contact the EcoCollect administration if you have questions
            about your account or personal information.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
