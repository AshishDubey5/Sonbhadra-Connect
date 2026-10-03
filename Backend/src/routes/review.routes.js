import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyTouristJWT } from "../middlewares/tourist.auth.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createReview,
    getReviewsByDestination,
    getMyReviews,
    updateReview,
    deleteReview,
    approveReview,
    voteHelpful,
    getPendingReviews,
} from "../controller/review.controller.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.route("/destination/:slug").get(getReviewsByDestination);
router.route("/:id/helpful").patch(voteHelpful);

// ── Tourist routes ────────────────────────────────────────────────────────────
router.route("/").post(
    verifyTouristJWT,
    upload.array("images", 3),
    createReview
);
router.route("/my").get(verifyTouristJWT, getMyReviews);
router.route("/:id").patch(verifyTouristJWT, updateReview);
router.route("/:id").delete(verifyTouristJWT, deleteReview);

// ── Admin routes (creator JWT — replace with admin middleware later) ───────────
router.route("/pending").get(verifyJWT, getPendingReviews);
router.route("/:id/approve").patch(verifyJWT, approveReview);

export default router;
