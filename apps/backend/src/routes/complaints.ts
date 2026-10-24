import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { uploadsDir } from "../lib/uploads.js";

export const complaintsRouter = Router();

const CATEGORIES = [
  "Garbage not collected",
  "Missed collection schedule",
  "Illegal dumping",
  "Overflowing public bin",
  "Waste collection vehicle issue",
  "Other",
] as const;

mkdirSync(uploadsDir, { recursive: true });

const allowedImageTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, uploadsDir);
    },
    filename: (_req, file, callback) => {
      const extension = allowedImageTypes[file.mimetype];

      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes[file.mimetype]) {
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

type ComplaintLocation = {
  latitude: number;
  longitude: number;
};

function parseLocation(value: unknown): ComplaintLocation | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(
      400,
      "Location must contain latitude and longitude",
      "INVALID_LOCATION",
    );
  }

  const location = value as Record<string, unknown>;
  const { latitude, longitude } = location;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new HttpError(
      400,
      "Invalid latitude or longitude",
      "INVALID_LOCATION",
    );
  }

  return { latitude, longitude };
}

// POST /api/v1/complaints
// Submit a complaint.
complaintsRouter.post(
  "/",
  requireAuth,
  requireRole("CITIZEN"),
  photoUpload.single("photo"),
  async (req, res, next) => {
    try {
      const body = req.body ?? {};

      const category = body.category;
      const title = body.title;
      const description = body.description;

      const isAnonymous =
        body.isAnonymous === true || body.isAnonymous === "true";

      let rawLocation: unknown = body.location;

      if (typeof rawLocation === "string") {
        if (!rawLocation.trim()) {
          rawLocation = null;
        } else {
          try {
            rawLocation = JSON.parse(rawLocation);
          } catch {
            throw new HttpError(
              400,
              "Invalid location data",
              "INVALID_LOCATION",
            );
          }
        }
      }

      const location = parseLocation(rawLocation);

      if (
        typeof category !== "string" ||
        !CATEGORIES.includes(category as (typeof CATEGORIES)[number])
      ) {
        throw new HttpError(
          400,
          "Please select a valid complaint category",
          "INVALID_CATEGORY",
        );
      }

      if (
        typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 100
      ) {
        throw new HttpError(
          400,
          "Title is required and must be at most 100 characters",
          "INVALID_TITLE",
        );
      }

      if (
        typeof description !== "string" ||
        !description.trim() ||
        description.trim().length > 1000
      ) {
        throw new HttpError(
          400,
          "Description is required and must be at most 1000 characters",
          "INVALID_DESCRIPTION",
        );
      }

      if (typeof isAnonymous !== "boolean") {
        throw new HttpError(
          400,
          "isAnonymous must be a boolean",
          "INVALID_COMPLAINT_TYPE",
        );
      }

      if (!isAnonymous && !location) {
        throw new HttpError(
          400,
          "Location is required for a registered complaint",
          "LOCATION_REQUIRED",
        );
      }

      const complaint = await prisma.complaint.create({
        data: {
          category,
          title: title.trim(),
          description: description.trim(),
          isAnonymous,
          userId: isAnonymous ? null : req.user!.id,
          latitude: location?.latitude ?? null,
          longitude: location?.longitude ?? null,
          photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
        },
      });

      res.status(201).json({
        success: true,
        message: "Complaint submitted successfully",
        data: {
          id: complaint.id,
          category: complaint.category,
          title: complaint.title,
          description: complaint.description,
          isAnonymous: complaint.isAnonymous,
          status: complaint.status,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          createdAt: complaint.createdAt,
          photoUrl: complaint.photoUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/complaints
// Get the authenticated citizen's registered complaints.
complaintsRouter.get(
  "/",
  requireAuth,
  requireRole("CITIZEN"),
  async (req, res, next) => {
    try {
      const complaints = await prisma.complaint.findMany({
        where: {
          userId: req.user!.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        success: true,
        data: complaints,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/complaints/:id
// Get a registered complaint owned by the authenticated citizen.

complaintsRouter.get(
  "/:id",
  requireAuth,
  requireRole("CITIZEN"),
  async (req, res, next) => {
    try {
      const complaintId = req.params.id;

      if (typeof complaintId !== "string" || complaintId.trim() === "") {
        throw new HttpError(
          400,
          "Invalid complaint ID",
          "INVALID_COMPLAINT_ID",
        );
      }

      const complaint = await prisma.complaint.findFirst({
        where: {
          id: complaintId,
          userId: req.user!.id,
        },
      });

      if (!complaint) {
        throw new HttpError(404, "Complaint not found", "COMPLAINT_NOT_FOUND");
      }

      res.json({
        success: true,
        data: complaint,
      });
    } catch (error) {
      next(error);
    }
  },
);
