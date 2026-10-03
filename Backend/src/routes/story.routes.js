import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllStories,
    getStoryBySlugField,
    getStoriesByDestination,
    getStoryById,
    getStoryByStoryId,
    createStory,
    updateStory,
    deleteStory,
    togglePublishStory,
    reorderStories,
} from "../controller/story.controller.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// List all published stories (paginated, filterable)
router.route("/").get(getAllStories);

// Lookup by URL-safe canonical slug field
router.route("/slug/:slug").get(getStoryBySlugField);

// Lookup all stories for a destination
router.route("/destination/:slug").get(getStoriesByDestination);

// Lookup single story by destination slug + storyId string
router.route("/destination/:slug/id/:storyId").get(getStoryByStoryId);

// Lookup single story by MongoDB ObjectId (must come last among GETs)
router.route("/:id").get(getStoryById);

// ── Admin routes (creator JWT — replace with admin middleware later) ───────────
router.route("/").post(verifyJWT, createStory);
router.route("/reorder").patch(verifyJWT, reorderStories);
router.route("/:id").patch(verifyJWT, updateStory);
router.route("/:id").delete(verifyJWT, deleteStory);
router.route("/:id/publish").patch(verifyJWT, togglePublishStory);

export default router;
