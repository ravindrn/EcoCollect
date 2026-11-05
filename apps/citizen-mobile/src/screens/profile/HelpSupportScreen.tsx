
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
  "HelpSupport"
>;

type FAQItemProps = {
  question: string;
  answer: string;
};

function FAQItem({ question, answer }: FAQItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center gap-3 p-4"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text className="flex-1 text-[14px] font-bold leading-6 text-slate-800">
          {question}
        </Text>

        <Text className="text-xl font-semibold text-emerald-700">
          {expanded ? "−" : "+"}
        </Text>
      </Pressable>

      {expanded && (
        <View className="border-t border-gray-100 px-4 py-3">
          <Text className="text-sm leading-6 text-slate-600">
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export function HelpSupportScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AppHeader onNotificationPress={() => {}} />

        {/* Page Header */}
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
            Help & Support
          </Text>

          <Text className="mt-2 text-sm leading-6 text-slate-500">
            Find answers to common questions and learn how to use
            EcoCollect services.
          </Text>
        </View>

        {/* Hero Card */}
        <View className="mb-6 overflow-hidden rounded-3xl bg-emerald-600 p-5">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Text className="text-3xl">🎧</Text>
          </View>

          <Text className="text-xl font-extrabold text-white">
            How can we help you?
          </Text>

          <Text className="mt-2 text-sm leading-6 text-emerald-50">
            Get help with waste collection schedules, complaints,
            notifications and your EcoCollect account.
          </Text>
        </View>

        {/* Quick Help */}
        <Text className="mb-3 text-[17px] font-extrabold text-slate-900">
          Quick Help
        </Text>

        <View className="mb-6 rounded-2xl border border-gray-100 bg-white p-4">
          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Text className="text-xl">🗓️</Text>
            </View>

            <View className="flex-1">
              <Text className="font-bold text-slate-800">
                Collection Schedule
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Check your area's collection day.
              </Text>
            </View>
          </View>

          <View className="mb-4 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Text className="text-xl">📢</Text>
            </View>

            <View className="flex-1">
              <Text className="font-bold text-slate-800">
                Complaints
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Report missed collections and waste-related issues.
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <Text className="text-xl">🔔</Text>
            </View>

            <View className="flex-1">
              <Text className="font-bold text-slate-800">
                Notifications
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                Stay updated about collection announcements.
              </Text>
            </View>
          </View>
        </View>

        {/* FAQs */}
        <Text className="mb-1 text-[17px] font-extrabold text-slate-900">
          Frequently Asked Questions
        </Text>

        <Text className="mb-4 text-xs text-slate-500">
          Tap a question to view its answer.
        </Text>

        <FAQItem
          question="1. How can I check my waste collection day?"
          answer="Open your Profile or Home screen to view the collection information assigned to your area. If your collection day is not displayed, contact the local council."
        />

        <FAQItem
          question="2. What should I do if the garbage truck does not arrive?"
          answer="Open the Complaints section and submit a complaint about the missed waste collection. Include a description and location so the relevant officers can identify the issue."
        />

        <FAQItem
          question="3. How can I submit a complaint?"
          answer="Open the Complaints section, select the relevant complaint category, enter a title and description, and provide the location if required. You can also attach a photo when the feature is available."
        />

        <FAQItem
          question="4. Can I check my complaint status?"
          answer="Use the Complaints section to view the complaints associated with your account and check their latest status, if status tracking is enabled."
        />

        <FAQItem
          question="5. How can I update my profile information?"
          answer="Go to Profile, select Edit Profile, update the available information and save your changes."
        />

        <FAQItem
          question="6. How can I change my password?"
          answer="Go to Profile, select Change Password, enter your current password and your new password, then confirm the new password."
        />

        <FAQItem
          question="7. Why am I not receiving notifications?"
          answer="Check your Notification Settings and your device notification permissions. Also make sure your internet connection is available."
        />

        <FAQItem
          question="8. How can I contact the local council?"
          answer="Use the official contact details published by your local council. Contact numbers and email details should be confirmed with the council administration."
        />

        {/* Contact Support */}
        <View className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <View className="mb-3 flex-row items-center gap-2">
            <Text className="text-2xl">📞</Text>
            <Text className="text-lg font-extrabold text-emerald-900">
              Contact Support
            </Text>
          </View>

          <Text className="text-sm leading-6 text-emerald-800">
            Need further assistance? Contact the relevant local council
            office for help with waste collection services and complaints.
          </Text>

          <View className="mt-4 rounded-xl bg-white p-3">
            <Text className="text-xs font-semibold text-slate-500">
              OFFICIAL CONTACT DETAILS
            </Text>
            <Text className="mt-1 text-sm font-semibold text-slate-700">
              To be provided by the council administration.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text className="mt-6 text-center text-xs text-slate-400">
          EcoCollect • Help & Support
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
