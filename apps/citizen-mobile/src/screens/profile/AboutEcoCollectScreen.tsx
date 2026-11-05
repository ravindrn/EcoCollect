import { ScrollView, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { ScreenContainer } from "../../components/ScreenContainer";
import { AppHeader } from "../../components/AppHeader";

const FEATURES = [
  {
    icon: "📅",
    title: "Collection Schedules",
    description:
      "View your area's waste collection days and stay informed about upcoming collections.",
  },
  {
    icon: "📍",
    title: "Vehicle Tracking",
    description:
      "Follow available waste collection vehicle location updates and get a better idea of collection progress.",
  },
  {
    icon: "📝",
    title: "Complaint Reporting",
    description:
      "Report missed collections, illegal dumping and other waste-related issues with photos and location details.",
  },
  {
    icon: "🔔",
    title: "Notifications",
    description:
      "Receive important announcements, collection reminders and complaint status updates.",
  },
  {
    icon: "♻️",
    title: "Waste Segregation",
    description:
      "Learn how to separate waste correctly and support responsible waste disposal.",
  },
  {
    icon: "🤖",
    title: "Smart Waste Management",
    description:
      "Support smarter waste management through AI-based planning and IoT-enabled smart waste stations.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Stay Informed",
    description:
      "Check your waste collection schedule and read important announcements.",
  },
  {
    number: "02",
    title: "Take Action",
    description:
      "Report waste-related problems and follow the progress of your complaints.",
  },
  {
    number: "03",
    title: "Get Updates",
    description: "Receive notifications and relevant collection information.",
  },
  {
    number: "04",
    title: "Build a Cleaner Community",
    description:
      "Follow proper waste segregation practices and contribute to a cleaner environment.",
  },
];

export function AboutEcoCollectScreen() {
  const navigation = useNavigation();

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        <AppHeader onNotificationPress={() => {}} />

        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          className="mb-6 self-start rounded-full bg-white px-4 py-2"
        >
          <Text className="text-base font-semibold text-gray-700">← Back</Text>
        </Pressable>

        {/* Hero section */}
        <View className="mb-5 overflow-hidden rounded-3xl bg-emerald-600 p-5 shadow-md">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />

          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <Text className="text-3xl">♻️</Text>
          </View>

          <Text className="mt-5 text-[28px] font-extrabold tracking-tight text-white">
            About EcoCollect
          </Text>

          <Text className="mt-2 text-sm font-medium leading-6 text-emerald-50">
            A smarter way to manage waste and build cleaner communities.
          </Text>

          <View className="mt-5 self-start rounded-full border border-white/30 bg-white/15 px-4 py-2">
            <Text className="text-xs font-bold text-white">
              SMART WASTE MANAGEMENT
            </Text>
          </View>
        </View>

        {/* Introduction */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center gap-2.5">
            <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
            <Text className="text-[17px] font-extrabold text-slate-900">
              Who We Are
            </Text>
          </View>

          <Text className="text-sm leading-6 text-slate-600">
            EcoCollect is an AI-powered smart waste management system designed
            to support more efficient waste collection and communication between
            citizens and local authorities.
          </Text>

          <Text className="mt-3 text-sm leading-6 text-slate-600">
            The project focuses on the Bope-Poddala Divisional Secretariat area,
            bringing together mobile applications, intelligent technologies and
            IoT integration to support a cleaner and more organized community.
          </Text>
        </View>

        {/* Mission */}
        <View className="mb-5 overflow-hidden rounded-3xl bg-emerald-50 p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
              <Text className="text-xl">🎯</Text>
            </View>
            <Text className="text-[17px] font-extrabold text-slate-900">
              Our Mission
            </Text>
          </View>

          <Text className="mt-3 text-sm leading-6 text-slate-700">
            To make waste collection smarter, improve communication, encourage
            responsible waste disposal and contribute to a cleaner and healthier
            environment.
          </Text>
        </View>

        {/* Features */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <View className="mb-4 flex-row items-center gap-2.5">
            <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
            <Text className="text-[17px] font-extrabold text-slate-900">
              What EcoCollect Offers
            </Text>
          </View>

          <View className="gap-3">
            {FEATURES.map((feature, index) => (
              <View
                key={feature.title}
                className="flex-row items-start rounded-2xl border border-gray-100 bg-slate-50 p-3.5"
              >
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                  <Text className="text-xl">{feature.icon}</Text>
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">
                    {feature.title}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-500">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <View className="mb-4 flex-row items-center gap-2.5">
            <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
            <Text className="text-[17px] font-extrabold text-slate-900">
              How It Works
            </Text>
          </View>

          <View className="gap-4">
            {STEPS.map((step, index) => (
              <View key={step.number} className="flex-row items-start">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Text className="text-xs font-extrabold text-emerald-700">
                    {step.number}
                  </Text>
                </View>

                <View className="flex-1 pt-0.5">
                  <Text className="text-sm font-bold text-slate-900">
                    {step.title}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-slate-500">
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Project information */}
        <View className="mb-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="mb-4 flex-row items-center gap-2.5">
            <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
            <Text className="text-[17px] font-extrabold text-slate-900">
              Project Information
            </Text>
          </View>

          <View className="gap-3">
            <View>
              <Text className="text-xs font-medium text-slate-400">
                Project Name
              </Text>
              <Text className="mt-1 text-sm font-bold text-slate-800">
                EcoCollect
              </Text>
            </View>

            <View className="h-px bg-gray-100" />

            <View>
              <Text className="text-xs font-medium text-slate-400">
                Project Type
              </Text>
              <Text className="mt-1 text-sm font-bold text-slate-800">
                Final Year Group Project
              </Text>
            </View>

            <View className="h-px bg-gray-100" />

            <View>
              <Text className="text-xs font-medium text-slate-400">
                Institution
              </Text>
              <Text className="mt-1 text-sm font-bold text-slate-800">
                University of Ruhuna
              </Text>
            </View>

            <View className="h-px bg-gray-100" />

            <View>
              <Text className="text-xs font-medium text-slate-400">
                Focus Area
              </Text>
              <Text className="mt-1 text-sm font-bold text-slate-800">
                Bope-Poddala Divisional Secretariat Area
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center rounded-3xl bg-slate-50 px-5 py-6">
          <Text className="text-3xl">🌱</Text>

          <Text className="mt-2 text-base font-extrabold text-emerald-700">
            Together for a Cleaner Tomorrow
          </Text>

          <Text className="mt-2 text-center text-xs leading-5 text-slate-500">
            Every small action makes a difference. Let's build a cleaner,
            greener and smarter community together.
          </Text>

          <Text className="mt-4 text-[11px] font-medium text-slate-400">
            EcoCollect • Smart Waste Management
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
