import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Booking } from "../models/booking.model.js";
import { Destination } from "../models/destination.model.js";
import { Tourist } from "../models/tourist.model.js";
import { Creator } from "../models/creator.model.js";

/* --------------------------------------------------------------------------
   CREATE BOOKING (tourist)
   -------------------------------------------------------------------------- */
const createBooking = asyncHandler(async (req, res) => {
    const {
        destinationSlug,
        creatorId,
        travelDate,
        returnDate,
        travelers,
        contactName,
        contactEmail,
        contactPhone,
        basePrice,
        creatorFee,
        permitFee,
        couponCode,
        couponDiscount,
        totalAmount,
        notes,
    } = req.body;

    if (!destinationSlug || !travelDate || !travelers || !contactName || !contactEmail || !contactPhone || !basePrice || !totalAmount) {
        throw new APIError(400, "destinationSlug, travelDate, travelers, contact details, basePrice, and totalAmount are required");
    }

    // Resolve destination
    const destination = await Destination.findOne({
        slug: destinationSlug.toLowerCase().trim(),
        isPublished: true,
    });
    if (!destination) {
        throw new APIError(404, `Destination "${destinationSlug}" not found or not available`);
    }

    // Validate optional creator
    let creatorObjectId = null;
    if (creatorId) {
        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            throw new APIError(400, "Invalid creator ID");
        }
        const creatorExists = await Creator.exists({ _id: creatorId });
        if (!creatorExists) {
            throw new APIError(404, "Selected creator/guide not found");
        }
        creatorObjectId = creatorId;
    }

    const booking = await Booking.create({
        tourist: req.tourist._id,
        destination: destination._id,
        destinationSlug: destinationSlug.toLowerCase().trim(),
        creator: creatorObjectId,
        travelDate: new Date(travelDate),
        returnDate: returnDate ? new Date(returnDate) : undefined,
        travelers: Number(travelers),
        contactName: contactName.trim(),
        contactEmail: contactEmail.toLowerCase().trim(),
        contactPhone: contactPhone.trim(),
        basePrice: Number(basePrice),
        creatorFee: Number(creatorFee) || 0,
        permitFee: Number(permitFee) || 0,
        couponCode: couponCode?.trim() || "",
        couponDiscount: Number(couponDiscount) || 0,
        totalAmount: Number(totalAmount),
        notes: notes?.trim() || "",
        status: "pending",
        paymentStatus: "unpaid",
    });

    // Add booking reference to tourist's bookings array
    await Tourist.findByIdAndUpdate(req.tourist._id, {
        $push: { bookings: booking._id },
    });

    const populated = await Booking.findById(booking._id)
        .populate("destination", "name slug coverImage location")
        .populate("creator", "creatorName fullName avatar");

    return res
        .status(201)
        .json(new ApiResponse(201, populated, `Booking confirmed! Reference: ${populated.bookingReference}`));
});

/* --------------------------------------------------------------------------
   GET BOOKING BY ID (tourist who owns it, or admin)
   -------------------------------------------------------------------------- */
const getBookingById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid booking ID");
    }

    const booking = await Booking.findById(id)
        .populate("tourist", "fullName email phone")
        .populate("destination", "name slug coverImage location quickFacts")
        .populate("creator", "creatorName fullName avatar phone");

    if (!booking) {
        throw new APIError(404, "Booking not found");
    }

    // Ensure tourist can only see their own booking
    if (
        req.tourist &&
        booking.tourist._id.toString() !== req.tourist._id.toString()
    ) {
        throw new APIError(403, "You are not authorized to view this booking");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET MY BOOKINGS (logged-in tourist)
   -------------------------------------------------------------------------- */
const getMyBookings = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { tourist: req.tourist._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate("destination", "name slug coverImage location")
            .populate("creator", "creatorName fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Booking.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            "Your bookings fetched successfully"
        )
    );
});

/* --------------------------------------------------------------------------
   CANCEL BOOKING (tourist — only pending/confirmed can be cancelled)
   -------------------------------------------------------------------------- */
const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid booking ID");
    }

    const booking = await Booking.findById(id);
    if (!booking) throw new APIError(404, "Booking not found");

    if (booking.tourist.toString() !== req.tourist._id.toString()) {
        throw new APIError(403, "You are not authorized to cancel this booking");
    }

    if (booking.status === "cancelled") {
        throw new APIError(409, "This booking is already cancelled");
    }

    if (booking.status === "completed") {
        throw new APIError(400, "Completed bookings cannot be cancelled");
    }

    const updated = await Booking.findByIdAndUpdate(
        id,
        { $set: { status: "cancelled" } },
        { returnDocument: "after" }
    ).populate("destination", "name slug");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Booking cancelled successfully"));
});

/* --------------------------------------------------------------------------
   CONFIRM BOOKING (admin)
   -------------------------------------------------------------------------- */
const confirmBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid booking ID");
    }

    const booking = await Booking.findById(id);
    if (!booking) throw new APIError(404, "Booking not found");

    if (booking.status !== "pending") {
        throw new APIError(400, `Cannot confirm a booking with status "${booking.status}"`);
    }

    const updated = await Booking.findByIdAndUpdate(
        id,
        { $set: { status: "confirmed" } },
        { returnDocument: "after" }
    ).populate("destination", "name slug").populate("tourist", "fullName email");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Booking confirmed successfully"));
});

/* --------------------------------------------------------------------------
   MARK BOOKING AS COMPLETED (admin)
   -------------------------------------------------------------------------- */
const completeBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid booking ID");
    }

    const booking = await Booking.findById(id);
    if (!booking) throw new APIError(404, "Booking not found");

    if (booking.status !== "confirmed") {
        throw new APIError(400, `Only confirmed bookings can be marked as completed`);
    }

    // Award eco points to tourist (10 points per trip)
    await Promise.all([
        Booking.findByIdAndUpdate(id, { $set: { status: "completed" } }),
        Tourist.findByIdAndUpdate(booking.tourist, { $inc: { ecoPoints: 10 } }),
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Booking marked as completed. Eco points awarded to tourist!"));
});

/* --------------------------------------------------------------------------
   UPDATE PAYMENT STATUS (admin / payment gateway webhook)
   -------------------------------------------------------------------------- */
const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentId, paymentStatus, paymentMethod } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid booking ID");
    }

    const validStatuses = ["unpaid", "paid", "refunded"];
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
        throw new APIError(400, `paymentStatus must be one of: ${validStatuses.join(", ")}`);
    }

    const updates = {};
    if (paymentId) updates.paymentId = paymentId.trim();
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (paymentMethod) updates.paymentMethod = paymentMethod;
    // Auto-confirm booking when payment is received
    if (paymentStatus === "paid") updates.status = "confirmed";

    const updated = await Booking.findByIdAndUpdate(
        id,
        { $set: updates },
        { returnDocument: "after" }
    );
    if (!updated) throw new APIError(404, "Booking not found");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Payment status updated successfully"));
});

/* --------------------------------------------------------------------------
   GET BOOKINGS BY DESTINATION (admin)
   -------------------------------------------------------------------------- */
const getBookingsByDestination = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { destinationSlug: slug.toLowerCase() };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate("tourist", "fullName email phone")
            .populate("creator", "creatorName fullName")
            .sort({ travelDate: 1 })
            .skip(skip)
            .limit(Number(limit)),
        Booking.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            `Bookings for "${slug}" fetched successfully`
        )
    );
});

/* --------------------------------------------------------------------------
   GET BOOKING STATS SUMMARY (admin dashboard widget)
   -------------------------------------------------------------------------- */
const getBookingStats = asyncHandler(async (req, res) => {
    const stats = await Booking.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
            },
        },
    ]);

    const summary = { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, totalRevenue: 0 };
    stats.forEach(({ _id, count, totalRevenue }) => {
        summary[_id] = count;
        summary.total += count;
        if (_id === "completed") summary.totalRevenue += totalRevenue;
    });

    return res
        .status(200)
        .json(new ApiResponse(200, summary, "Booking statistics fetched successfully"));
});

export {
    createBooking,
    getBookingById,
    getMyBookings,
    cancelBooking,
    confirmBooking,
    completeBooking,
    updatePaymentStatus,
    getBookingsByDestination,
    getBookingStats,
};
