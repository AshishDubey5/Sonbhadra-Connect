import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllDestinations,
    getDestinationBySlug,
    getFeaturedDestinations,
    getHeroDestinations,
    searchDestinations,
    createDestination,
    updateDestination,
    addGalleryImage,
    deleteDestination,
    getDestinationsByCategory,
} from "../controller/destination.controller.js";

const router = Router();

// ── Public ───────────────────────────────────────────────────────────────────
router.route("/").get(getAllDestinations);
router.route("/featured").get(getFeaturedDestinations);
router.route("/hero").get(getHeroDestinations);
router.route("/search").get(searchDestinations);
router.route("/category/:categorySlug").get(getDestinationsByCategory);
router.route("/:slug").get(getDestinationBySlug);

// ── Admin (creator JWT — swap for admin middleware when admin model is added) ─
router.route("/").post(verifyJWT, upload.single("coverImage"), createDestination);
router.route("/:slug").patch(verifyJWT, updateDestination);
router.route("/:slug/gallery").patch(verifyJWT, upload.single("image"), addGalleryImage);
router.route("/:slug").delete(verifyJWT, deleteDestination);

export default router;
