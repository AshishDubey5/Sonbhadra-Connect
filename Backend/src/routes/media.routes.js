import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPost,
    getPostsByCreator,
    getPostsByDestination,
    getFeaturedPosts,
    getPostById,
    updatePost,
    deletePost,
    togglePublish,
    incrementViews,
    toggleFeature,
    getMyPosts,
} from "../controller/media.controller.js";

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.route("/featured").get(getFeaturedPosts);
router.route("/creator/:creatorId").get(getPostsByCreator);
router.route("/destination/:slug").get(getPostsByDestination);
router.route("/:id").get(getPostById);
router.route("/:id/view").patch(incrementViews);

// ── Secured (creator must be logged in) ──────────────────────────────────────
router.route("/").post(verifyJWT, upload.single("thumbnail"), createPost);
router.route("/my").get(verifyJWT, getMyPosts);
router.route("/:id").patch(verifyJWT, updatePost);
router.route("/:id").delete(verifyJWT, deletePost);
router.route("/:id/publish").patch(verifyJWT, togglePublish);
router.route("/:id/feature").patch(verifyJWT, toggleFeature);

export default router;
