import mongoose, { Schema } from "mongoose";

/**
 * Review Model
 * Community reviews and verified tips submitted by Tourists
 * for a Destination. Admins must approve before public display.
 */

const reviewSchema = new Schema(
    {
        // Who wrote the review
        tourist: {
            type: Schema.Types.ObjectId,
            ref: "Tourist",
            required: true,
            index: true,
        },

        // Which destination is being reviewed
        destination: {
            type: Schema.Types.ObjectId,
            ref: "Destination",
            required: true,
            index: true,
        },

        destinationSlug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        // Star rating 1 – 5
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        // Main review text
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        // Type of tip (maps to communityGuidelines sections in frontend)
        tipType: {
            type: String,
            enum: ["etiquette", "eco", "safety", "general", "logistics"],
            default: "general",
        },

        // Optional images attached to the review
        images: [{ type: String }],

        // Visit date the tourist is reviewing
        visitDate: { type: Date },

        // Whether the tourist actually booked via the platform
        isVerifiedBooking: { type: Boolean, default: false },

        // Admin approval before showing publicly
        isApproved: { type: Boolean, default: false, index: true },

        // Helpful vote count from other tourists
        helpfulVotes: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// One review per tourist per destination
reviewSchema.index({ tourist: 1, destination: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
