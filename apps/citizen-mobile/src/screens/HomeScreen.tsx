import {
  Text,
  View,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "../components/ScreenContainer";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../contexts/AuthContext";
import { colors } from "../theme/colors";
import { useEffect, useState } from "react";
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

type CommunityUpdate = {
  id: string;
  userId: string;
  content: string;
  authorName: string;
  createdAt: string;
  helpfulCount: number;
  commentCount: number;
  isHelpful: boolean;
};

type CommunityComment = {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
};

function formatTimeAgo(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60000),
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

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

  const [communityUpdates, setCommunityUpdates] = useState<CommunityUpdate[]>(
    [],
  );
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [communityError, setCommunityError] = useState(false);
  const [newUpdate, setNewUpdate] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [showAllCommunity, setShowAllCommunity] = useState(false);
  const [helpfulLoadingId, setHelpfulLoadingId] = useState<string | null>(null);

  const [selectedUpdate, setSelectedUpdate] = useState<CommunityUpdate | null>(
    null,
  );

  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [editingUpdate, setEditingUpdate] = useState<CommunityUpdate | null>(
    null,
  );

  const [editedContent, setEditedContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingUpdateId, setDeletingUpdateId] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;

    async function loadCommunityUpdates() {
      try {
        setLoadingCommunity(true);
        setCommunityError(false);

        const data = await api.get<CommunityUpdate[]>("/community-updates", {
          auth: true,
        });

        if (active) {
          setCommunityUpdates(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to load community updates:", error);
        if (active) setCommunityError(true);
      } finally {
        if (active) setLoadingCommunity(false);
      }
    }

    loadCommunityUpdates();

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

  async function handlePostUpdate() {
    const content = newUpdate.trim();

    if (!content) {
      Alert.alert("Required", "Please enter your community update.");
      return;
    }

    if (content.length > 1000) {
      Alert.alert("Too long", "Your update must be 1000 characters or less.");
      return;
    }

    try {
      setPostingUpdate(true);

      const created = await api.post<CommunityUpdate>(
        "/community-updates",
        { content },
        { auth: true },
      );

      setCommunityUpdates((previous) => [created, ...previous]);
      setNewUpdate("");
      Alert.alert("Success", "Your community update has been posted.");
    } catch (error) {
      console.error("Failed to post community update:", error);
      Alert.alert(
        "Unable to post",
        "Please check your connection and make sure your area is selected.",
      );
    } finally {
      setPostingUpdate(false);
    }
  }

  async function handleHelpful(update: CommunityUpdate) {
    if (helpfulLoadingId) return;

    try {
      setHelpfulLoadingId(update.id);

      const result = await api.post<{
        isHelpful: boolean;
        helpfulCount: number;
      }>(`/community-updates/${update.id}/helpful`, {}, { auth: true });

      setCommunityUpdates((previous) =>
        previous.map((item) =>
          item.id === update.id
            ? {
                ...item,
                isHelpful: result.isHelpful,
                helpfulCount: result.helpfulCount,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update Helpful reaction:", error);
      Alert.alert("Error", "Unable to update your reaction. Please try again.");
    } finally {
      setHelpfulLoadingId(null);
    }
  }

  async function handleOpenComments(update: CommunityUpdate) {
    setSelectedUpdate(update);
    setComments([]);
    setNewComment("");
    setCommentError(false);
    setLoadingComments(true);

    try {
      const data = await api.get<CommunityComment[]>(
        `/community-updates/${update.id}/comments`,
        { auth: true },
      );

      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setCommentError(true);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handlePostComment() {
    if (!selectedUpdate || postingComment) return;

    const content = newComment.trim();

    if (!content) {
      Alert.alert("Required", "Please enter a comment.");
      return;
    }

    if (content.length > 500) {
      Alert.alert("Too long", "Comments must be 500 characters or less.");
      return;
    }

    try {
      setPostingComment(true);

      const created = await api.post<CommunityComment>(
        `/community-updates/${selectedUpdate.id}/comments`,
        { content },
        { auth: true },
      );

      setComments((previous) => [...previous, created]);
      setNewComment("");

      setCommunityUpdates((previous) =>
        previous.map((item) =>
          item.id === selectedUpdate.id
            ? { ...item, commentCount: item.commentCount + 1 }
            : item,
        ),
      );

      setSelectedUpdate((previous) =>
        previous
          ? { ...previous, commentCount: previous.commentCount + 1 }
          : previous,
      );
    } catch (error) {
      console.error("Failed to post comment:", error);
      Alert.alert(
        "Unable to post",
        "Please check your connection and try again.",
      );
    } finally {
      setPostingComment(false);
    }
  }

  const handleStartEdit = (item: CommunityUpdate) => {
    setEditingUpdate(item);
    setEditedContent(item.content);
  };

  const handleSaveEdit = async () => {
    if (!editingUpdate || !editedContent.trim()) {
      Alert.alert("Required", "Please enter your update.");
      return;
    }

    try {
      setSavingEdit(true);

      const updated = await api.patch<CommunityUpdate>(
        `/community-updates/${editingUpdate.id}`,
        { content: editedContent.trim() },
        { auth: true },
      );

      setCommunityUpdates((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );

      setEditingUpdate(null);
      setEditedContent("");
      Alert.alert("Success", "Your update has been edited.");
    } catch (error) {
      Alert.alert("Error", "Unable to edit this update. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = (message: string): Promise<boolean> => {
    if (Platform.OS === "web") {
      return Promise.resolve(window.confirm(message));
    }

    return new Promise((resolve) => {
      Alert.alert("Delete Update", message, [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => resolve(true),
        },
      ]);
    });
  };

  const handleDeleteUpdate = async (item: CommunityUpdate) => {
    const confirmed = await confirmDelete(
      "Are you sure you want to delete this update? Its comments and helpful reactions will also be deleted.",
    );

    if (!confirmed) return;

    try {
      setDeletingUpdateId(item.id);

      await api.delete(`/community-updates/${item.id}`, { auth: true });

      setCommunityUpdates((previous) =>
        previous.filter((update) => update.id !== item.id),
      );

      if (selectedUpdate?.id === item.id) {
        setSelectedUpdate(null);
        setComments([]);
      }

      if (Platform.OS === "web") {
        window.alert("Update deleted successfully.");
      } else {
        Alert.alert("Success", "Update deleted successfully.");
      }
    } catch (error) {
      console.error("Delete API error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete this update. Please try again.";

      if (Platform.OS === "web") {
        window.alert(`Delete failed: ${message}`);
      } else {
        Alert.alert("Delete Failed", message);
      }
    } finally {
      setDeletingUpdateId(null);
    }
  };

  return (
    <ScreenContainer scroll={true}>
      <View className="flex-1 px-5 pb-10">
        <AppHeader onNotificationPress={() => {}} />

        {/* ───────────── Welcome ───────────── */}
        <View className="mb-5 mt-4 flex-row items-center gap-4">
          <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-100 p-1">
            <View className="h-full w-full items-center justify-center rounded-full bg-emerald-600">
              <Text className="text-[28px] font-extrabold text-white">
                {initial}
              </Text>
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-sm font-medium text-slate-500">
              {greeting},
            </Text>

            <Text
              className="mt-0.5 text-[26px] font-extrabold tracking-tight text-slate-900"
              numberOfLines={1}
            >
              {firstName}! 👋
            </Text>

            <View className="mt-2 flex-row">
              <View className="flex-row items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
                <Text className="text-xs">📍</Text>
                <Text className="text-xs font-semibold text-emerald-700">
                  {user?.areaName || "Area not selected"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text className="mb-5 text-[13px] leading-5 text-slate-500">
          Let's keep our community clean.
        </Text>

        {/* ───────────── Next Collection (hero card) ───────────── */}
        <View className="overflow-hidden rounded-3xl bg-emerald-600 p-5 shadow-md">
          {/* Decorative shapes */}
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Text className="text-xl">🗓️</Text>
              </View>
              <Text className="text-base font-bold text-white">
                Next Collection
              </Text>
            </View>

            <View className="rounded-full bg-white/20 px-3 py-1">
              <Text className="text-[11px] font-bold uppercase tracking-wide text-white">
                {user?.areaName || "No area"}
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-[13px] font-medium text-emerald-50">
            Your area's next garbage collection
          </Text>

          <Text className="mt-1.5 text-[26px] font-extrabold leading-8 text-white">
            {nextCollectionDateText}
          </Text>

          <View className="mt-4 border-t border-white/20 pt-3">
            <Text className="text-[12px] text-emerald-50">
              Scheduled Collection area:{" "}
              <Text className="font-bold text-white">
                {user?.areaName || "Area not selected"}
              </Text>
            </Text>
          </View>
        </View>

        {/* ───────────── Council Updates ───────────── */}
        <View className="mt-8">
          {/* Section Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
              <Text className="text-xl font-extrabold text-slate-900">
                Latest Council Updates
              </Text>
            </View>

            {announcements.length > 3 && (
              <Pressable
                onPress={() => setShowAllAnnouncements((previous) => !previous)}
                className="rounded-full bg-emerald-50 px-3 py-1.5"
              >
                <Text className="text-[13px] font-bold text-emerald-700">
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
            <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">
              <Text className="text-3xl">⚠️</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
                Unable to load council updates. Please try again later.
              </Text>
            </View>
          ) : visibleAnnouncements.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">
              <Text className="text-3xl">📭</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
                No council updates available right now.
              </Text>
            </View>
          ) : (
            visibleAnnouncements.map((announcement) => (
              <View
                key={announcement.id}
                className={`mb-3 overflow-hidden rounded-2xl border bg-white shadow-sm ${
                  announcement.priority === "URGENT"
                    ? "border-red-100"
                    : announcement.priority === "IMPORTANT"
                      ? "border-amber-100"
                      : "border-gray-100"
                }`}
              >
                <View className="flex-row">
                  {/* Priority accent bar */}
                  <View
                    className={`w-1.5 ${
                      announcement.priority === "URGENT"
                        ? "bg-red-500"
                        : announcement.priority === "IMPORTANT"
                          ? "bg-amber-500"
                          : "bg-slate-300"
                    }`}
                  />

                  <View className="flex-1 p-4">
                    {/* Priority and Date */}
                    <View className="mb-3 flex-row items-center justify-between gap-2">
                      <View
                        className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${
                          announcement.priority === "URGENT"
                            ? "bg-red-100"
                            : announcement.priority === "IMPORTANT"
                              ? "bg-amber-100"
                              : "bg-gray-100"
                        }`}
                      >
                        <View
                          className={`h-1.5 w-1.5 rounded-full ${
                            announcement.priority === "URGENT"
                              ? "bg-red-600"
                              : announcement.priority === "IMPORTANT"
                                ? "bg-amber-600"
                                : "bg-slate-400"
                          }`}
                        />
                        <Text
                          className={`text-[11px] font-bold tracking-wide ${
                            announcement.priority === "URGENT"
                              ? "text-red-700"
                              : announcement.priority === "IMPORTANT"
                                ? "text-amber-700"
                                : "text-slate-600"
                          }`}
                        >
                          {announcement.priority}
                        </Text>
                      </View>

                      <Text className="text-xs font-medium text-slate-400">
                        {formatAnnouncementDate(announcement.publishedAt)}
                      </Text>
                    </View>

                    {/* Announcement Title */}
                    <Text className="mb-1.5 text-base font-bold leading-6 text-slate-900">
                      {announcement.title}
                    </Text>

                    {/* Announcement Description */}
                    <Text className="text-sm leading-6 text-slate-600">
                      {announcement.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ───────────── Community Updates ───────────── */}
        <View className="mt-8">
          {/* Section Header */}
          <View className="flex-row items-center gap-2.5">
            <View className="h-5 w-1.5 rounded-full bg-emerald-600" />
            <Text className="text-xl font-extrabold text-slate-900">
              Community Updates
            </Text>
          </View>

          <Text className="mb-4 ml-4 mt-1 text-sm text-slate-500">
            Updates from citizens in your area
          </Text>

          {/* Share Update Card */}
          <View className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Text className="text-lg">✍️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">
                  Share an Update
                </Text>
                <Text className="text-[13px] text-slate-500">
                  Inform people in your community.
                </Text>
              </View>
            </View>

            <TextInput
              className="mt-4 min-h-[120px] rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-sm leading-5 text-slate-800"
              placeholder="What's happening in your area?"
              placeholderTextColor="#94A3B8"
              value={newUpdate}
              onChangeText={setNewUpdate}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />

            <View className="mt-3 flex-row items-center justify-between">
              <Text className="text-xs text-slate-400">
                Be kind and keep it relevant
              </Text>
              <Text className="text-xs font-medium text-slate-400">
                {newUpdate.length}/1000
              </Text>
            </View>

            <Pressable
              className={`mt-3 min-h-[50px] items-center justify-center rounded-2xl px-4 py-3 ${
                postingUpdate ? "bg-emerald-400" : "bg-emerald-600"
              }`}
              onPress={handlePostUpdate}
              disabled={postingUpdate}
            >
              {postingUpdate ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[15px] font-bold text-white">
                  Post Update
                </Text>
              )}
            </Pressable>
          </View>

          {/* Recent Updates Header */}
          <View className="mb-4 mt-7 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-slate-900">
              Recent Updates
            </Text>

            {communityUpdates.length > 3 && (
              <Pressable
                onPress={() => setShowAllCommunity((previous) => !previous)}
                className="rounded-full bg-emerald-50 px-3 py-1.5"
              >
                <Text className="text-[13px] font-bold text-emerald-700">
                  {showAllCommunity ? "Show Less" : "View All"}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Loading / Error / Empty / Updates */}
          {loadingCommunity ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : communityError ? (
            <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">
              <Text className="text-3xl">⚠️</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
                Unable to load community updates.
              </Text>

              <Pressable
                className="mt-4 rounded-full bg-emerald-50 px-4 py-2"
                onPress={async () => {
                  try {
                    setCommunityError(false);
                    setLoadingCommunity(true);

                    const data = await api.get<CommunityUpdate[]>(
                      "/community-updates",
                      { auth: true },
                    );

                    setCommunityUpdates(Array.isArray(data) ? data : []);
                  } catch {
                    setCommunityError(true);
                  } finally {
                    setLoadingCommunity(false);
                  }
                }}
              >
                <Text className="text-sm font-bold text-emerald-700">
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : communityUpdates.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8">
              <Text className="text-3xl">🌱</Text>
              <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
                No community updates yet. Be the first to share an update!
              </Text>
            </View>
          ) : (
            (showAllCommunity
              ? communityUpdates
              : communityUpdates.slice(0, 3)
            ).map((item) => (
              <View
                key={item.id}
                className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                {/* Author */}
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                    <Text className="text-lg font-bold text-emerald-700">
                      {(item.authorName || "C").charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      {item.authorName}
                    </Text>

                    <Text className="mt-0.5 text-xs text-slate-500">
                      {user?.areaName || "Your area"} ·{" "}
                      {formatTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Update Content */}
                <Text className="mt-3.5 text-[14px] leading-6 text-slate-700">
                  {item.content}
                </Text>

                {/* Actions */}
                <View className="mt-4 flex-row flex-wrap items-center gap-2.5 border-t border-gray-100 pt-3.5">
                  <Pressable
                    className={`rounded-full border px-3.5 py-2 ${
                      item.isHelpful
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                    onPress={() => handleHelpful(item)}
                    disabled={helpfulLoadingId !== null}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        item.isHelpful ? "text-emerald-700" : "text-slate-600"
                      }`}
                    >
                      {item.isHelpful ? "✓ Helpful" : "♡ Helpful"} (
                      {item.helpfulCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    className="rounded-full border border-gray-200 bg-white px-3.5 py-2"
                    onPress={() => handleOpenComments(item)}
                  >
                    <Text className="text-[13px] font-semibold text-slate-600">
                      💬 Comments ({item.commentCount})
                    </Text>
                  </Pressable>

                  {item.userId === user?.id && (
                    <>
                      <Pressable
                        className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2"
                        onPress={() => handleStartEdit(item)}
                      >
                        <Text className="text-[13px] font-semibold text-blue-700">
                          ✏️ Edit
                        </Text>
                      </Pressable>

                      <Pressable
                        className="rounded-full border border-red-200 bg-red-50 px-3.5 py-2"
                        onPress={() => {
                          console.log("Delete button clicked:", item.id);
                          handleDeleteUpdate(item);
                        }}
                        disabled={deletingUpdateId === item.id}
                      >
                        {deletingUpdateId === item.id ? (
                          <ActivityIndicator color="#DC2626" size="small" />
                        ) : (
                          <Text className="text-[13px] font-semibold text-red-600">
                            🗑️ Delete
                          </Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* ───────────── Comments Modal ───────────── */}
      <Modal
        visible={selectedUpdate !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedUpdate(null)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal Backdrop */}
          <Pressable
            className="absolute inset-0 bg-slate-900/60"
            onPress={() => setSelectedUpdate(null)}
          />

          {/* Comments Sheet */}
          <View className="max-h-[85%] rounded-t-[28px] bg-white px-5 pb-3 pt-3">
            {/* Grabber */}
            <View className="mb-3 items-center">
              <View className="h-1.5 w-12 rounded-full bg-gray-200" />
            </View>

            {/* Header */}
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xl font-extrabold text-slate-900">
                  Comments
                </Text>
                <Text className="mt-0.5 text-sm text-slate-500">
                  Join the conversation
                </Text>
              </View>

              <Pressable
                onPress={() => setSelectedUpdate(null)}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Text className="text-base font-semibold text-slate-600">
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* Original Community Update */}
            {selectedUpdate && (
              <View className="mb-4 flex-row overflow-hidden rounded-2xl bg-emerald-50">
                <View className="w-1.5 bg-emerald-500" />
                <View className="flex-1 p-3.5">
                  <Text className="text-sm font-bold text-emerald-800">
                    {selectedUpdate.authorName}
                  </Text>
                  <Text className="mt-1.5 text-sm leading-5 text-slate-700">
                    {selectedUpdate.content}
                  </Text>
                </View>
              </View>
            )}

            {/* Loading / Error / Comments */}
            {loadingComments ? (
              <View className="min-h-[120px] items-center justify-center gap-3">
                <ActivityIndicator color={colors.primary} />
                <Text className="text-sm text-slate-500">
                  Loading comments...
                </Text>
              </View>
            ) : commentError ? (
              <View className="min-h-[120px] items-center justify-center gap-3">
                <Text className="text-center text-sm text-slate-500">
                  Unable to load comments.
                </Text>

                <Pressable
                  className="rounded-full bg-emerald-50 px-4 py-2"
                  onPress={() => {
                    if (selectedUpdate) {
                      void handleOpenComments(selectedUpdate);
                    }
                  }}
                >
                  <Text className="text-sm font-bold text-emerald-700">
                    Try Again
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                className="shrink"
                contentContainerClassName="pb-4"
                keyboardShouldPersistTaps="handled"
              >
                {comments.length === 0 ? (
                  <View className="min-h-[150px] items-center justify-center py-6">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                      <Text className="text-3xl">💬</Text>
                    </View>
                    <Text className="mt-3 text-base font-bold text-slate-800">
                      No comments yet
                    </Text>
                    <Text className="mt-1 text-center text-sm text-slate-500">
                      Be the first to join the conversation.
                    </Text>
                  </View>
                ) : (
                  comments.map((comment) => (
                    <View
                      key={comment.id}
                      className="mb-4 flex-row items-start gap-3"
                    >
                      {/* Comment Avatar */}
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <Text className="text-base font-bold text-emerald-700">
                          {(comment.authorName || "C").charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      {/* Comment Bubble */}
                      <View className="flex-1 rounded-2xl rounded-tl-md bg-gray-100 px-3.5 py-3">
                        <View className="mb-1.5 flex-row flex-wrap items-center justify-between gap-1">
                          <Text className="text-sm font-bold text-slate-900">
                            {comment.authorName}
                          </Text>

                          <Text className="text-xs text-slate-400">
                            {formatTimeAgo(comment.createdAt)}
                          </Text>
                        </View>

                        <Text className="text-sm leading-5 text-slate-700">
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            {/* Comment Input and Send Button */}
            <View className="flex-row items-end gap-3 border-t border-gray-100 pb-2 pt-4">
              <TextInput
                className="max-h-[100px] min-h-[46px] flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-slate-800"
                placeholder="Write a comment..."
                placeholderTextColor="#94A3B8"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                editable={!postingComment}
                textAlignVertical="center"
              />

              <Pressable
                className={`min-h-[46px] min-w-[70px] items-center justify-center rounded-2xl px-4 py-3 ${
                  postingComment ? "bg-emerald-400" : "bg-emerald-600"
                }`}
                onPress={handlePostComment}
                disabled={postingComment || loadingComments || commentError}
              >
                {postingComment ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-sm font-bold text-white">Send</Text>
                )}
              </Pressable>
            </View>

            {/* Character Count */}
            <Text className="mb-1 mt-1 text-right text-xs text-slate-400">
              {newComment.length}/500
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal
        visible={editingUpdate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingUpdate(null)}
      >
        <View className="flex-1 justify-center bg-black/50 px-5">
          <View className="rounded-3xl bg-white p-5">
            <Text className="text-xl font-extrabold text-slate-900">
              Edit Update
            </Text>

            <TextInput
              className="mt-4 min-h-[140px] rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-slate-800"
              value={editedContent}
              onChangeText={setEditedContent}
              placeholder="Edit your update..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />

            <Text className="mt-2 text-right text-xs text-slate-400">
              {editedContent.length}/1000
            </Text>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                className="flex-1 items-center rounded-2xl bg-gray-100 px-4 py-3"
                onPress={() => setEditingUpdate(null)}
                disabled={savingEdit}
              >
                <Text className="font-bold text-slate-700">Cancel</Text>
              </Pressable>

              <Pressable
                className="flex-1 items-center rounded-2xl bg-emerald-600 px-4 py-3"
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="font-bold text-white">Save Changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
