import { StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../components/ScreenContainer";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { api } from "../services/http";

const COLLECTION_DAYS: Record<string, number> = {
  "Area A": 1, // Monday
  "Area B": 2, // Tuesday
  "Area C": 3, // Wednesday
  "Area D": 4, // Thursday
  "Area E": 5, // Friday
};

type Announcement = {
  id: string;
  title: string;
  description: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  publishedAt: string | null;
};

function formatAnnouncementDate(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getNextCollectionDate(
  areaName: string | null | undefined,
  fromDate: Date = new Date(),
): Date | null {
  if (!areaName) return null;

  const targetDay = COLLECTION_DAYS[areaName.trim()];

  // Unknown area: don't show an incorrect date.
  if (targetDay === undefined) return null;

  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  const currentDay = today.getDay();
  const daysUntilCollection = (targetDay - currentDay + 7) % 7;

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilCollection);

  return nextDate;
}

function formatCollectionDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function HomeScreen() {
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAnnouncements() {
      try {
        setLoadingAnnouncements(true);
        setAnnouncementError(false);

        const data = await api.get<Announcement[]>("/announcements");

        if (active) {
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load announcements:", error);

        if (active) {
          setAnnouncementError(true);
        }
      } finally {
        if (active) {
          setLoadingAnnouncements(false);
        }
      }
    }

    loadAnnouncements();

    return () => {
      active = false;
    };
  }, []);

  const visibleAnnouncements = showAllAnnouncements
    ? announcements
    : announcements.slice(0, 3);

  const nextCollectionDate = getNextCollectionDate(user?.areaName);

  const nextCollectionDateText = nextCollectionDate
    ? formatCollectionDate(nextCollectionDate)
    : "Schedule unavailable";

  const fullName = user?.fullName?.trim() || "Citizen";
  const firstName = fullName.split(/\s+/)[0];
  const initial = firstName.charAt(0).toUpperCase();

  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        <AppHeader onNotificationPress={() => {}} />

        <View style={styles.greetingSection}>
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>{initial}</Text>
          </View>

          <View style={styles.greetingText}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{firstName}! 👋</Text>

            <View style={styles.areaRow}>
              <Text style={styles.areaIcon}>📍</Text>
              <Text style={styles.areaText}>
                {user?.areaName || "Area not selected"}
              </Text>
            </View>

            <Text style={styles.message}>Let's keep our community clean.</Text>
          </View>
        </View>

        <View style={styles.collectionCard}>
          <View style={styles.collectionTitleRow}>
            <Text style={styles.collectionIcon}>🗓️</Text>

            <Text style={styles.collectionTitle}>Next Collection</Text>
          </View>

          <Text style={styles.collectionSubtitle}>
            Your area's next garbage collection
          </Text>

          <Text style={styles.collectionDate}>{nextCollectionDateText}</Text>

          <Text style={styles.collectionArea}>
            Scheduled Collection area: {user?.areaName || "Area not selected"}
          </Text>
        </View>

        <View style={styles.updatesSection}>
          <View style={styles.updatesHeader}>
            <Text style={styles.updatesTitle}>Latest Council Updates</Text>

            {announcements.length > 3 && (
              <Pressable
                onPress={() => setShowAllAnnouncements((previous) => !previous)}
              >
                <Text style={styles.viewAll}>
                  {showAllAnnouncements ? "Show Less" : "View All"}
                </Text>
              </Pressable>
            )}
          </View>

          {loadingAnnouncements ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : announcementError ? (
            <View style={styles.emptyUpdates}>
              <Text style={styles.emptyUpdatesText}>
                Unable to load council updates. Please try again later.
              </Text>
            </View>
          ) : visibleAnnouncements.length === 0 ? (
            <View style={styles.emptyUpdates}>
              <Text style={styles.emptyUpdatesText}>
                No council updates available right now.
              </Text>
            </View>
          ) : (
            visibleAnnouncements.map((announcement) => (
              <View key={announcement.id} style={styles.announcementCard}>
                <View style={styles.announcementTopRow}>
                  <Text
                    style={[
                      styles.priorityBadge,
                      announcement.priority === "URGENT" && styles.urgentBadge,
                      announcement.priority === "IMPORTANT" &&
                        styles.importantBadge,
                    ]}
                  >
                    {announcement.priority}
                  </Text>

                  <Text style={styles.announcementDate}>
                    {formatAnnouncementDate(announcement.publishedAt)}
                  </Text>
                </View>

                <Text style={styles.announcementTitle}>
                  {announcement.title}
                </Text>

                <Text style={styles.announcementDescription}>
                  {announcement.description}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  greetingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24,
    gap: 16,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 3,
  },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  areaIcon: {
    fontSize: 14,
  },
  areaText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  message: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 7,
    lineHeight: 19,
  },
  profilePicture: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#D1FAE5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: "700",
    color: "#047857",
  },

  collectionCard: {
    marginTop: 24,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  collectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  collectionIcon: {
    fontSize: 22,
  },

  collectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },

  collectionSubtitle: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },

  collectionDate: {
    marginTop: 12,
    fontSize: 21,
    fontWeight: "700",
    color: "#15803D",
  },

  collectionArea: {
    marginTop: 12,
    fontSize: 13,
    color: "#475569",
  },

  
updatesSection: {
  marginTop: 28,
  marginBottom: 24,
},

updatesHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
},

updatesTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0F172A",
  flex: 1,
},

viewAll: {
  fontSize: 14,
  fontWeight: "600",
  color: colors.primary,
  marginLeft: 10,
},

announcementCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  padding: 16,
  marginBottom: 12,
},

announcementTopRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

priorityBadge: {
  overflow: "hidden",
  borderRadius: 6,
  paddingHorizontal: 9,
  paddingVertical: 5,
  backgroundColor: "#F1F5F9",
  color: "#475569",
  fontSize: 10,
  fontWeight: "700",
},

importantBadge: {
  backgroundColor: "#FEF3C7",
  color: "#92400E",
},

urgentBadge: {
  backgroundColor: "#FEE2E2",
  color: "#B91C1C",
},

announcementDate: {
  fontSize: 12,
  color: "#64748B",
},

announcementTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#0F172A",
  marginBottom: 6,
},

announcementDescription: {
  fontSize: 14,
  lineHeight: 21,
  color: "#64748B",
},

emptyUpdates: {
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  padding: 18,
},

emptyUpdatesText: {
  fontSize: 14,
  lineHeight: 21,
  color: "#64748B",
},

});
