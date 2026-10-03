import { Router } from "express";
import { verifyTouristJWT } from "../middlewares/tourist.auth.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createBooking,
    getBookingById,
    getMyBookings,
    cancelBooking,
    confirmBooking,
    completeBooking,
    updatePaymentStatus,
    getBookingsByDestination,
    getBookingStats,
} from "../controller/booking.controller.js";

const router = Router();

// ── Tourist routes ────────────────────────────────────────────────────────────
router.route("/").post(verifyTouristJWT, createBooking);
router.route("/my").get(verifyTouristJWT, getMyBookings);
router.route("/:id/cancel").patch(verifyTouristJWT, cancelBooking);
router.route("/:id").get(verifyTouristJWT, getBookingById);

// ── Admin routes (creator JWT — replace with admin middleware later) ───────────
router.route("/stats").get(verifyJWT, getBookingStats);
router.route("/destination/:slug").get(verifyJWT, getBookingsByDestination);
router.route("/:id/confirm").patch(verifyJWT, confirmBooking);
router.route("/:id/complete").patch(verifyJWT, completeBooking);
router.route("/:id/payment").patch(verifyJWT, updatePaymentStatus);

export default router;
