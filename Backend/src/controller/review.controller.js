import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Review } from "../models/review.model.js";
import { Destination } from "../models/destination.model.js";
import { Booking } from "../models/booking.model.js";

/* --------------------------------------------------------------------------
   CREATE REVIEW (tourist — one per destination)
   -------------------------------------------------------------------------- */
const createReview = asyncHandler(async (req, res) => {
    const {
        destinationSlug,
        rating,
        comment,
        tipType,
        visitDate,
    } = req.body;

    if (!destinationSlug || !rating || !comment) {
        throw new APIError(400, "destinationSlug, rating, and comment are required");
    }

    const parsedRating = Number(rating);
    if (parsedRating < 1 || parsedRating > 5) {
        throw new APIError(400, "Rating must be between 1 and 5");
    }

    const destination = await Destination.findOne({
        slug: destinationSlug.toLowerCase().trim(),
    });
    if (!destination) {
        throw new APIError(404, `Destination "${destinationSlug}" not found`);
    }

    // Check if tourist already reviewed this destination
    const existingReview = await Review.findOne({
        tourist: req.tourist._id,
        destination: destination._id,
    });
    if (existingReview) {
        throw new APIError(409, "You have already reviewed this destination. You can edit your existing review.");
    }

    // Check if tourist has a completed booking for this destination (verified badge)
    const isVerifiedBooking = await Booking.exists({
        tourist: req.tourist._id,
        destinationSlug: destinationSlug.toLowerCase().trim(),
        status: "completed",
    });

    // Handle optional image uploads (up to 3)
    const imageUrls = [];
    const files = req.files?.images || [];
    for (const file of files.slice(0, 3)) {
        const uploaded = await uploadOnCloudinary(file.path);
        if (uploaded) imageUrls.push(uploaded.secure_url || uploaded.url);
    }

    const review = await Review.create({
        tourist: req.tourist._id,
        destination: destination._id,
        destinationSlug: destinationSlug.toLowerCase().trim(),
        rating: parsedRating,
        comment: comment.trim(),
        tipType: tipType || "general",
        visitDate: visitDate ? new Date(visitDate) : undefined,
        images: imageUrls,
        isVerifiedBooking: Boolean(isVerifiedBooking),
        isApproved: false, // admin must approve
    });

    const populated = await Review.findById(review._id).populate(
        "tourist",
        "fullName avatar hometown"
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                populated,
                "Review submitted! It will appear publicly after admin approval."
            )
        );
});

/* --------------------------------------------------------------------------
   GET REVIEWS BY DESTINATION (public — only approved)
   -------------------------------------------------------------------------- */
const getReviewsByDestination = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    const query = { destinationSlug: slug.toLowerCase(), isApproved: true };
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = sortBy === "helpful"
        ? { helpfulVotes: -1, createdAt: -1 }
        : sortBy === "rating"
            ? { rating: -1, createdAt: -1 }
            : { createdAt: -1 };

    const [reviews, total, avgRating] = await Promise.all([
        Review.find(query)
            .populate("tourist", "fullName avatar hometown")
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit)),
        Review.countDocuments(query),
        Review.aggregate([
            { $match: query },
            { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
        ]),
    ]);

    const ratingStats = avgRating[0] || { avg: 0, count: 0 };

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                reviews,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                averageRating: Math.round(ratingStats.avg * 10) / 10,
                ratingCount: ratingStats.count,
            },
            "Reviews fetched successfully"
        )
    );
});

/* --------------------------------------------------------------------------
   GET MY REVIEWS (logged-in tourist)
   -------------------------------------------------------------------------- */
const getMyReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ tourist: req.tourist._id })
        .populate("destination", "name slug coverImage location")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "Your reviews fetched successfully"));
});

/* --------------------------------------------------------------------------
   UPDATE REVIEW (owner tourist only)
   -------------------------------------------------------------------------- */
const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid review ID");
    }

    const review = await Review.findById(id);
    if (!review) throw new APIError(404, "Review not found");

    if (review.tourist.toString() !== req.tourist._id.toString()) {
        throw new APIError(403, "You are not authorized to edit this review");
    }

    const { rating, comment, tipType, visitDate } = req.body;

    const updates = {};
    if (rating) {
        const parsedRating = Number(rating);
        if (parsedRating < 1 || parsedRating > 5) throw new APIError(400, "Rating must be 1–5");
        updates.rating = parsedRating;
    }
    if (comment) updates.comment = comment.trim();
    if (tipType) updates.tipType = tipType;
    if (visitDate) updates.visitDate = new Date(visitDate);

    // Reset approval on edit — admin must re-approve
    updates.isApproved = false;

    const updated = await Review.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after" }).populate(
        "tourist",
        "fullName avatar"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Review updated. It will be re-reviewed by admin."));
});

/* --------------------------------------------------------------------------
   DELETE REVIEW (owner tourist only)
   -------------------------------------------------------------------------- */
const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid review ID");
    }

    const review = await Review.findById(id);
    if (!review) throw new APIError(404, "Review not found");

    if (review.tourist.toString() !== req.tourist._id.toString()) {
        throw new APIError(403, "You are not authorized to delete this review");
    }

    await Review.findByIdAndDelete(id);
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Review deleted successfully"));
});

/* --------------------------------------------------------------------------
   APPROVE REVIEW (admin)
   -------------------------------------------------------------------------- */
const approveReview = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid review ID");
    }

    const review = await Review.findById(id);
    if (!review) throw new APIError(404, "Review not found");

    const updated = await Review.findByIdAndUpdate(
        id,
        { $set: { isApproved: !review.isApproved } },
        { returnDocument: "after" }
    );

    const action = updated.isApproved ? "approved" : "un-approved";
    return res
        .status(200)
        .json(new ApiResponse(200, updated, `Review ${action} successfully`));
});

/* --------------------------------------------------------------------------
   VOTE HELPFUL (any authenticated user — no double-vote protection)
   -------------------------------------------------------------------------- */
const voteHelpful = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid review ID");
    }

    const review = await Review.findById(id);
    if (!review) throw new APIError(404, "Review not found");

    await Review.findByIdAndUpdate(id, { $inc: { helpfulVotes: 1 } });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Marked as helpful!"));
});

/* --------------------------------------------------------------------------
   GET ALL PENDING REVIEWS (admin — awaiting approval)
   -------------------------------------------------------------------------- */
const getPendingReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
        Review.find({ isApproved: false })
            .populate("tourist", "fullName email avatar")
            .populate("destination", "name slug")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Review.countDocuments({ isApproved: false }),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { reviews, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            "Pending reviews fetched successfully"
        )
    );
});

export {
    createReview,
    getReviewsByDestination,
    getMyReviews,
    updateReview,
    deleteReview,
    approveReview,
    voteHelpful,
    getPendingReviews,
};
