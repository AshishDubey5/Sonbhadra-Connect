import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyTouristJWT } from "../middlewares/tourist.auth.middleware.js";
import {
    registerTourist,
    loginTourist,
    logoutTourist,
    refreshAccessToken,
    getCurrentTourist,
    updateProfile,
    updateAvatar,
    changePassword,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    getMyBookings,
    getEcoPoints,
    deactivateAccount,
} from "../controller/tourist.controller.js";

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.route("/register").post(upload.single("avatar"), registerTourist);
router.route("/login").post(loginTourist);
router.route("/refresh-token").post(refreshAccessToken);

// ── Secured ──────────────────────────────────────────────────────────────────
router.route("/logout").post(verifyTouristJWT, logoutTourist);
router.route("/me").get(verifyTouristJWT, getCurrentTourist);
router.route("/update-profile").patch(verifyTouristJWT, updateProfile);
router.route("/update-avatar").patch(verifyTouristJWT, upload.single("avatar"), updateAvatar);
router.route("/change-password").post(verifyTouristJWT, changePassword);
router.route("/deactivate").post(verifyTouristJWT, deactivateAccount);

// Wishlist
router.route("/wishlist").get(verifyTouristJWT, getWishlist);
router.route("/wishlist/:destinationId").post(verifyTouristJWT, addToWishlist);
router.route("/wishlist/:destinationId").delete(verifyTouristJWT, removeFromWishlist);

// Bookings & Points
router.route("/bookings").get(verifyTouristJWT, getMyBookings);
router.route("/eco-points").get(verifyTouristJWT, getEcoPoints);

export default router;
