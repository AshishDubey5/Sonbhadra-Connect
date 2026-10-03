import mongoose, { Schema } from "mongoose";

/**
 * Media / Post Model
 * Content posts published by Creators — reels, photos, and blog entries
 * linked to a specific Destination. Shown in "Local Creators" section.
 */

const mediaSchema = new Schema(
    {
        // The creator who published this post
        creator: {
            type: Schema.Types.ObjectId,
            ref: "Creator",
            required: true,
            index: true,
        },

        // Primary destination this post is about
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

        // Post metadata
        title: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: ["reel", "photo", "blog", "drone", "vlog"],
            required: true,
        },

        // Cloudinary / S3 URLs
        thumbnailUrl: { type: String, required: true },
        mediaUrl:     { type: String },        // full-res video or image

        // Short description shown on the creator card
        description: { type: String, trim: true },

        // Platform where original content lives
        externalUrl: { type: String },         // YouTube / Instagram link

        // Engagement stats (synced periodically from social APIs)
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },

        // Display string e.g. "24.8K views" (for fast rendering without formatting)
        viewsLabel: { type: String },

        isPublished: { type: Boolean, default: false, index: true },
        isFeatured:  { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Media = mongoose.model("Media", mediaSchema);
