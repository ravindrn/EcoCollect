import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { z } from "zod";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { uploadsDir } from "../lib/uploads.js";

export const usersRouter = Router();

mkdirSync(uploadsDir, { recursive: true });

const allowedProfileImageTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const profilePhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadsDir);
    },
    filename: (_req, file, callback) => {
      const extension = allowedProfileImageTypes[file.mimetype];
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedProfileImageTypes[file.mimetype]) {
      callback(
        new HttpError(
          400,
          "Only JPG, PNG and WEBP images are allowed",
          "INVALID_IMAGE_TYPE",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

usersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");

    const user = await prisma.user.findUnique({
      where: { id: userId },

      include: {
        citizenProfile: {
          include: {
            area: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,

        profile: user.citizenProfile
          ? {
              fullName: user.citizenProfile.fullName,
              phone: user.citizenProfile.phone,
              address: user.citizenProfile.address,
              wardDivision: user.citizenProfile.wardDivision,
              profileImageUrl: user.citizenProfile.profileImageUrl,
              area: user.citizenProfile.area
                ? {
                    id: user.citizenProfile.area.id,
                    name: user.citizenProfile.area.name,
                  }
                : null,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch(
  "/me",
  requireAuth,
  requireRole("CITIZEN"),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
      }

      const profileSchema = z
        .object({
          fullName: z.string().trim().min(2).max(100).optional(),
          phone: z
            .string()
            .trim()
            .max(20)
            .refine(
              (value) =>
                value === "" ||
                /^(?:07\d{8}|\+947\d{8}|947\d{8})$/.test(
                  value.replace(/[\s()-]/g, ""),
                ),
              {
                message: "Enter a valid Sri Lankan mobile number",
              },
            )
            .nullable()
            .optional(),
          address: z.string().trim().max(250).nullable().optional(),
          wardDivision: z.string().trim().max(100).nullable().optional(),
        })
        .refine(
          (data) => Object.values(data).some((value) => value !== undefined),
          { message: "At least one field is required" },
        );

      const parsed = profileSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new HttpError(
          400,
          "Invalid profile information",
          "VALIDATION_ERROR",
        );
      }

      const existingProfile = await prisma.citizenProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new HttpError(404, "Citizen profile not found", "NOT_FOUND");
      }

      const updatedProfile = await prisma.citizenProfile.update({
        where: { userId },
        data: parsed.data,
        include: {
          area: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          fullName: updatedProfile.fullName,
          phone: updatedProfile.phone,
          address: updatedProfile.address,
          wardDivision: updatedProfile.wardDivision,
          area: updatedProfile.area
            ? {
                id: updatedProfile.area.id,
                name: updatedProfile.area.name,
              }
            : null,
          profileImageUrl: updatedProfile.profileImageUrl,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/users/me/profile-picture
// Upload or replace the authenticated citizen's profile picture.
usersRouter.post(
  "/me/profile-picture",
  requireAuth,
  requireRole("CITIZEN"),
  profilePhotoUpload.single("photo"),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
      }

      if (!req.file) {
        throw new HttpError(
          400,
          "Please select a profile picture",
          "IMAGE_REQUIRED",
        );
      }

      const profileImageUrl = `/uploads/${req.file.filename}`;

      const updatedProfile = await prisma.citizenProfile.update({
        where: { userId },
        data: { profileImageUrl },
        select: {
          profileImageUrl: true,
        },
      });

      res.json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post(
  "/push-token",
  requireAuth,
  requireRole("CITIZEN"),
  async (req, res, next) => {
    try {
      const parsed = z
        .object({
          expoPushToken: z
            .string()
            .regex(
              /^(Expo|Exponent)PushToken\[[^\]]+\]$/,
              "Invalid Expo push token",
            ),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        throw new HttpError(400, "Invalid Expo push token", "VALIDATION_ERROR");
      }

      const userId = req.user?.id;

      if (!userId) {
        throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          expoPushToken: parsed.data.expoPushToken,
        },
      });

      res.json({
        success: true,
        data: { registered: true },
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/users/me/notification-settings
// Get the authenticated citizen's notification preferences.
usersRouter.get(
  "/me/notification-settings",
  requireAuth,
  requireRole("CITIZEN"),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
      }

      const settings = await prisma.notificationPreference.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: {
          pushEnabled: true,
          importantAnnouncements: true,
          urgentAnnouncements: true,
          collectionReminders: true,
          complaintUpdates: true,
        },
      });

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/v1/users/me/notification-settings
// Update one or more notification preferences.
usersRouter.patch(
  "/me/notification-settings",
  requireAuth,
  requireRole("CITIZEN"),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
      }

      const settingsSchema = z
        .object({
          pushEnabled: z.boolean().optional(),
          importantAnnouncements: z.boolean().optional(),
          urgentAnnouncements: z.boolean().optional(),
          collectionReminders: z.boolean().optional(),
          complaintUpdates: z.boolean().optional(),
        })
        .refine(
          (data) => Object.values(data).some((value) => value !== undefined),
          {
            message: "At least one notification setting is required",
          },
        );

      const parsed = settingsSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new HttpError(
          400,
          "Invalid notification settings",
          "VALIDATION_ERROR",
        );
      }

      const settings = await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...parsed.data,
        },
        update: parsed.data,
        select: {
          pushEnabled: true,
          importantAnnouncements: true,
          urgentAnnouncements: true,
          collectionReminders: true,
          complaintUpdates: true,
        },
      });

      res.json({
        success: true,
        message: "Notification settings updated successfully",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  },
);
