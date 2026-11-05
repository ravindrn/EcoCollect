import { prisma } from "../lib/prisma.js";

type PushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  priority: "high";
  channelId: "announcements";
  data: {
    type: "ANNOUNCEMENT";
    announcementId: string;
    priority: "IMPORTANT" | "URGENT";
  };
};

export async function sendAnnouncementPush(announcement: {
  id: string;
  title: string;
  description: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
}): Promise<void> {
  // NORMAL announcements never send push notifications.
  if (
    announcement.priority !== "IMPORTANT" &&
    announcement.priority !== "URGENT"
  ) {
    return;
  }

  const preferenceField =
    announcement.priority === "URGENT"
      ? "urgentAnnouncements"
      : "importantAnnouncements";

  const citizens = await prisma.user.findMany({
    where: {
      role: "CITIZEN",
      isActive: true,
      expoPushToken: { not: null },
    },
    select: {
      expoPushToken: true,
      notificationPreference: {
        select: {
          pushEnabled: true,
          importantAnnouncements: true,
          urgentAnnouncements: true,
        },
      },
    },
  });

  const tokens = [
    ...new Set(
      citizens
        .filter((citizen) => {
          const preferences = citizen.notificationPreference;

          // Users without a preference record retain the default ON behavior.
          if (!preferences) return true;

          if (!preferences.pushEnabled) return false;

          return preferences[preferenceField];
        })
        .map((citizen) => citizen.expoPushToken)
        .filter((token): token is string => Boolean(token)),
    ),
  ];

  if (tokens.length === 0) {
    console.log("[Push] No registered citizen devices.");
    return;
  }

  const pushTitle =
    announcement.priority === "URGENT"
      ? `🚨 Urgent: ${announcement.title}`
      : `Important: ${announcement.title}`;

  // Expo recommends sending notifications in batches of at most 100.
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);

    const messages: PushMessage[] = batch.map((token) => ({
      to: token,
      title: pushTitle,
      body: announcement.description.slice(0, 200),
      sound: "default",
      priority: "high",
      channelId: "announcements",
      data: {
        type: "ANNOUNCEMENT",
        announcementId: announcement.id,
        priority: announcement.priority as "IMPORTANT" | "URGENT",
      },
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        console.error(
          `[Push] Expo request failed with HTTP ${response.status}`,
          await response.text(),
        );
        continue;
      }

      const result = (await response.json()) as {
        data?: Array<{
          status?: string;
          message?: string;
          details?: { error?: string };
        }>;
      };

      const errors = (result.data ?? []).filter(
        (ticket) => ticket.status === "error",
      );

      if (errors.length > 0) {
        console.error(
          `[Push] ${errors.length} notification(s) failed.`,
          errors.map((error) => ({
            message: error.message,
            error: error.details?.error,
          })),
        );
      } else {
        console.log(
          `[Push] Expo accepted a batch of ${batch.length} notification(s).`,
        );
      }
    } catch (error) {
      // A push failure must not undo a successfully published announcement.
      console.error("[Push] Failed to contact Expo:", error);
    }
  }
}
