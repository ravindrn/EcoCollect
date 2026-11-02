import { Platform } from "react-native";
import { api } from "./http";
import { env } from "../config/env";
import { File as ExpoFile } from "expo-file-system";

export type CitizenProfile = {
  fullName: string | null;
  phone: string | null;
  address: string | null;
  wardDivision: string | null;
  profileImageUrl: string | null;
  area: { id: string; name: string } | null;
};

export type MeResponse = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  profile: CitizenProfile | null;
};

export type UpdateProfileInput = {
  fullName: string;
  phone: string | null;
  address: string | null;
  wardDivision: string | null;
};

export async function getMyProfile(): Promise<MeResponse> {
  return api.get<MeResponse>("/users/me", { auth: true });
}

export async function updateMyProfile(
  input: UpdateProfileInput,
): Promise<CitizenProfile> {
  return api.patch<CitizenProfile>("/users/me", input, { auth: true });
}

type ProfileImageAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export async function uploadProfilePicture(
  asset: ProfileImageAsset,
): Promise<{ profileImageUrl: string }> {
  const formData = new FormData();

  const fileName = asset.fileName ?? `profile-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? "image/jpeg";

  if (Platform.OS === "web") {
    const response = await fetch(asset.uri);

    if (!response.ok) {
      throw new Error("Unable to read the selected image.");
    }

    const blob = await response.blob();

    formData.append("photo", blob, fileName);
  } else {
    // Create an actual Expo File object
    const file = new ExpoFile(asset.uri);

    // Expo File implements the Blob interface at runtime.
    // Cast is needed because of the TypeScript type mismatch.
    formData.append("photo", file as unknown as Blob);
  }

  return api.postFormData<{ profileImageUrl: string }>(
    "/users/me/profile-picture",
    formData,
    { auth: true },
  );
}
/**
 * Converts backend path /uploads/example.png
 * into a complete URL using the API server's origin.
 */
export function getProfileImageUri(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const apiOrigin = env.apiBaseUrl.replace(/\/api\/v1\/?$/, "");

  return `${apiOrigin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}
