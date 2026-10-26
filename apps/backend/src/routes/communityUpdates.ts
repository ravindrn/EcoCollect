import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

export const communityUpdatesRouter = Router();

// Get the logged-in citizen's area.
async function getCitizenArea(userId: string) {
  const profile = await prisma.citizenProfile.findUnique({
    where: { userId },
    select: { areaId: true },
  });

  if (!profile) {
    throw new HttpError(
      403,
      "A citizen profile is required",
      "CITIZEN_PROFILE_REQUIRED",
    );
  }

  if (!profile.areaId) {
    throw new HttpError(
      400,
      "Please select your area before using Community Updates",
      "AREA_REQUIRED",
    );
  }

  return profile.areaId;
}

// Check that an update belongs to the citizen's area.
async function getAreaUpdate(id: string, areaId: string) {
  const update = await prisma.communityUpdate.findFirst({
    where: { id, areaId },
    select: { id: true },
  });

  if (!update) {
    throw new HttpError(404, "Community update not found", "NOT_FOUND");
  }

  return update;
}

// Get updates from the logged-in citizen's area.
communityUpdatesRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const areaId = await getCitizenArea(req.user!.id);

    const updates = await prisma.communityUpdate.findMany({
      where: { areaId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            citizenProfile: {
              select: { fullName: true },
            },
          },
        },
        reactions: {
          where: { userId: req.user!.id },
          select: { id: true },
        },
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });

    res.json({
      success: true,
      data: updates.map((update) => ({
        id: update.id,
        userId: update.userId,
        content: update.content,
        authorName: update.user.citizenProfile?.fullName ?? "Community Member",
        createdAt: update.createdAt,
        helpfulCount: update._count.reactions,
        commentCount: update._count.comments,
        isHelpful: update.reactions.length > 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// Post a community update.
communityUpdatesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const areaId = await getCitizenArea(userId);
    const { content } = req.body;

    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.trim().length > 1000
    ) {
      throw new HttpError(
        400,
        "Update content is required and must be at most 1000 characters",
        "VALIDATION_ERROR",
      );
    }

    const update = await prisma.communityUpdate.create({
      data: {
        content: content.trim(),
        userId,
        areaId,
      },
      include: {
        user: {
          select: {
            citizenProfile: {
              select: { fullName: true },
            },
          },
        },
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: update.id,
        userId: update.userId,
        content: update.content,
        authorName: update.user.citizenProfile?.fullName ?? "Community Member",
        createdAt: update.createdAt,
        helpfulCount: update._count.reactions,
        commentCount: update._count.comments,
        isHelpful: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Edit a community update.
 * Only the owner can edit their own update.
 */
communityUpdatesRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const areaId = await getCitizenArea(userId);
    const id = req.params.id;
    const { content } = req.body;

    if (typeof id !== "string") {
      throw new HttpError(400, "Invalid update ID", "VALIDATION_ERROR");
    }

    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.trim().length > 1000
    ) {
      throw new HttpError(
        400,
        "Update content is required and must be at most 1000 characters",
        "VALIDATION_ERROR",
      );
    }

    // Confirm that the update belongs to this citizen's area.
    await getAreaUpdate(id, areaId);

    // Confirm that the logged-in citizen owns the update.
    const existingUpdate = await prisma.communityUpdate.findFirst({
      where: {
        id,
        areaId,
        userId,
      },
      select: { id: true },
    });

    if (!existingUpdate) {
      throw new HttpError(
        403,
        "You can only edit your own community updates",
        "FORBIDDEN",
      );
    }

    const updated = await prisma.communityUpdate.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            citizenProfile: {
              select: { fullName: true },
            },
          },
        },
        reactions: {
          where: { userId },
          select: { id: true },
        },
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        content: updated.content,
        authorName: updated.user.citizenProfile?.fullName ?? "Community Member",
        createdAt: updated.createdAt,
        helpfulCount: updated._count.reactions,
        commentCount: updated._count.comments,
        isHelpful: updated.reactions.length > 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete a community update.
 * Only the owner can delete their own update.
 */
communityUpdatesRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const areaId = await getCitizenArea(userId);
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new HttpError(400, "Invalid update ID", "VALIDATION_ERROR");
    }

    // Confirm that the update belongs to this citizen's area.
    await getAreaUpdate(id, areaId);

    // Confirm that the logged-in citizen owns the update.
    const existingUpdate = await prisma.communityUpdate.findFirst({
      where: {
        id,
        areaId,
        userId,
      },
      select: { id: true },
    });

    if (!existingUpdate) {
      throw new HttpError(
        403,
        "You can only delete your own community updates",
        "FORBIDDEN",
      );
    }

    await prisma.communityUpdate.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Community update deleted successfully",
    });
  } catch (err) {
    next(err);
  }
});

// Toggle Helpful on/off.
communityUpdatesRouter.post(
  "/:id/helpful",
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const areaId = await getCitizenArea(userId);
      const id = req.params.id;

      if (typeof id !== "string") {
        throw new HttpError(400, "Invalid update ID", "VALIDATION_ERROR");
      }

      await getAreaUpdate(id, areaId);

      const existing = await prisma.communityReaction.findUnique({
        where: {
          updateId_userId: { updateId: id, userId },
        },
      });

      if (existing) {
        await prisma.communityReaction.delete({
          where: { id: existing.id },
        });
      } else {
        await prisma.communityReaction.create({
          data: { updateId: id, userId },
        });
      }

      const helpfulCount = await prisma.communityReaction.count({
        where: { updateId: id },
      });

      res.json({
        success: true,
        data: {
          isHelpful: !existing,
          helpfulCount,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// Get comments for an update.
communityUpdatesRouter.get(
  "/:id/comments",
  requireAuth,
  async (req, res, next) => {
    try {
      const areaId = await getCitizenArea(req.user!.id);
      const id = req.params.id;

      if (typeof id !== "string") {
        throw new HttpError(400, "Invalid update ID", "VALIDATION_ERROR");
      }

      await getAreaUpdate(id, areaId);

      const comments = await prisma.communityComment.findMany({
        where: { updateId: id },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
          user: {
            select: {
              citizenProfile: {
                select: { fullName: true },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          authorName:
            comment.user.citizenProfile?.fullName ?? "Community Member",
          createdAt: comment.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

// Add a comment to an update.
communityUpdatesRouter.post(
  "/:id/comments",
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const areaId = await getCitizenArea(userId);
      const id = req.params.id;
      const { content } = req.body;

      if (typeof id !== "string") {
        throw new HttpError(400, "Invalid update ID", "VALIDATION_ERROR");
      }

      if (
        typeof content !== "string" ||
        !content.trim() ||
        content.trim().length > 500
      ) {
        throw new HttpError(
          400,
          "Comment is required and must be at most 500 characters",
          "VALIDATION_ERROR",
        );
      }

      await getAreaUpdate(id, areaId);

      const comment = await prisma.communityComment.create({
        data: {
          content: content.trim(),
          updateId: id,
          userId,
        },
        include: {
          user: {
            select: {
              citizenProfile: {
                select: { fullName: true },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: comment.id,
          content: comment.content,
          authorName:
            comment.user.citizenProfile?.fullName ?? "Community Member",
          createdAt: comment.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
