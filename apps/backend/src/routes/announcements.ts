import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

export const announcementsRouter = Router();

const priorities = ["NORMAL", "IMPORTANT", "URGENT"] as const;
const statuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

// Citizen: Get published announcements
announcementsRouter.get("/", async (_req, res, next) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: announcements,
    });
  } catch (err) {
    next(err);
  }
});

// Admin: Create announcement
announcementsRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const { title, description, priority } = req.body;

      if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof description !== "string" ||
        !description.trim()
      ) {
        throw new HttpError(
          400,
          "Title and description are required",
          "VALIDATION_ERROR",
        );
      }

      if (
        priority !== undefined &&
        !(priorities as readonly unknown[]).includes(priority)
      ) {
        throw new HttpError(
          400,
          "Invalid announcement priority",
          "VALIDATION_ERROR",
        );
      }

      const announcement = await prisma.announcement.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          priority: priority ?? "NORMAL",
          status: "DRAFT",
        },
      });

      res.status(201).json({
        success: true,
        data: announcement,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Admin: Edit, publish, or archive announcement
announcementsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const id = req.params.id;

      if (typeof id !== "string" || !id.trim()) {
        throw new HttpError(400, "Invalid announcement ID", "VALIDATION_ERROR");
      }

      const { title, description, priority, status } = req.body;

      if (title !== undefined && (typeof title !== "string" || !title.trim())) {
        throw new HttpError(400, "Invalid title", "VALIDATION_ERROR");
      }

      if (
        description !== undefined &&
        (typeof description !== "string" || !description.trim())
      ) {
        throw new HttpError(400, "Invalid description", "VALIDATION_ERROR");
      }

      if (
        priority !== undefined &&
        !(priorities as readonly unknown[]).includes(priority)
      ) {
        throw new HttpError(
          400,
          "Invalid announcement priority",
          "VALIDATION_ERROR",
        );
      }

      if (
        status !== undefined &&
        !(statuses as readonly unknown[]).includes(status)
      ) {
        throw new HttpError(
          400,
          "Invalid announcement status",
          "VALIDATION_ERROR",
        );
      }

      const existing = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new HttpError(404, "Announcement not found", "NOT_FOUND");
      }

      const nextStatus = status ?? existing.status;

      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title: title.trim() } : {}),
          ...(description !== undefined
            ? { description: description.trim() }
            : {}),
          ...(priority !== undefined ? { priority } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(status === "PUBLISHED" && existing.status !== "PUBLISHED"
            ? { publishedAt: new Date() }
            : {}),
          ...(nextStatus === "PUBLISHED" && !existing.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
      });

      res.json({
        success: true,
        data: announcement,
      });
    } catch (err) {
      next(err);
    }
  },
);
