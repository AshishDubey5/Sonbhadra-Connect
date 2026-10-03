import mongoose, { Schema } from "mongoose";

/* ------------------------------------------------------------------
   Sub-Schemas
   ------------------------------------------------------------------ */

const galleryItemSchema = new Schema(
    {
        url:     { type: String, required: true },
        alt:     { type: String, required: true },
        caption: { type: String },
        type: {
            type: String,
            enum: ["featured", "landscape", "nature", "action", "geology", "aerial", "heritage", "general"],
            default: "general",
        },
    },
    { _id: false }
);

const coordinatesSchema = new Schema(
    {
        lat:   { type: Number, required: true },
        lng:   { type: Number, required: true },
        label: { type: String },
    },
    { _id: false }
);

const quickFactsSchema = new Schema(
    {
        bestSeason:      { type: String },
        timings:         { type: String },
        entryFee:        { type: String },
        difficulty:      { type: String },
        nearestRailway:  { type: String },
        nearestAirport:  { type: String },
        howToReach:      { type: String },
    },
    { _id: false }
);

const mapDetailsSchema = new Schema(
    {
        lat:        { type: Number },
        lng:        { type: Number },
        mapQuery:   { type: String },
        terrain:    { type: String },
        landmarks:  [{ type: String }],
        safetyNotes:{ type: String },
    },
    { _id: false }
);

const communityGuidelinesSchema = new Schema(
    {
        etiquette:      [{ type: String }],
        ecoRules:       [{ type: String }],
        safetyWarnings: [{ type: String }],
    },
    { _id: false }
);

/* ------------------------------------------------------------------
   Main Destination Schema
   ------------------------------------------------------------------ */

const destinationSchema = new Schema(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        shortName: { type: String, trim: true },
        tagline:   { type: String, trim: true },
        category:  { type: String, required: true },
        categoryBadge: { type: String },
        categorySlug:  { type: String, lowercase: true, trim: true },
        location:  { type: String, required: true },
        coordinates: coordinatesSchema,
        summary:   { type: String, required: true },
        description: { type: String },

        // Hero gallery (5-6 images shown in horizontal scroll)
        gallery: [galleryItemSchema],

        // Convenience cover image URL
        coverImage: { type: String },

        // Visit logistics
        duration:   { type: String },
        bestSeason: { type: String },
        difficulty: { type: String },

        quickFacts:          quickFactsSchema,
        mapDetails:          mapDetailsSchema,
        communityGuidelines: communityGuidelinesSchema,

        // Related destination slugs shown at bottom of page
        relatedSlugs: [{ type: String }],

        isPublished: { type: Boolean, default: false },
        isFeatured:  { type: Boolean, default: false },
        isHero:      { type: Boolean, default: false },
        isVerified:  { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Destination = mongoose.model("Destination", destinationSchema);
