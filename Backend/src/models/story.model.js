import mongoose, { Schema } from "mongoose";

/**
 * Story Model
 * Editorial "Stories of this Location" content blocks.
 * Each story belongs to one destination but can be queried independently.
 *
 * Changelog:
 *  v2 — Added heroImage, excerpt, slug, category, verificationStatus,
 *         status, lastVerifiedAt, seo. All fields are additive/optional
 *         so existing documents and controllers remain unaffected.
 */

/* ------------------------------------------------------------------
   Sub-Schemas
   ------------------------------------------------------------------ */

const heroImageSchema = new Schema(
    {
        url:     { type: String },
        alt:     { type: String },
        caption: { type: String },
        credit:  { type: String },  // Photographer / creator attribution
    },
    { _id: false }
);

const seoSchema = new Schema(
    {
        metaTitle:       { type: String, trim: true },
        metaDescription: { type: String, trim: true },
        ogImage:         { type: String },   // Override URL for og:image
    },
    { _id: false }
);

/* ------------------------------------------------------------------
   Main Story Schema
   ------------------------------------------------------------------ */

const storySchema = new Schema(
    {
        // ── Destination relationship ──────────────────────────────────────
        // Which destination this story primarily belongs to
        destination: {
            type: Schema.Types.ObjectId,
            ref: "Destination",
            required: true,
            index: true,
        },

        // Denormalized slug for fast lookup without populate
        destinationSlug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        // ── Identifiers ───────────────────────────────────────────────────

        // Legacy human-readable identifier (e.g. "engineering-feat")
        storyId: {
            type: String,
            required: true,
            trim: true,
        },

        // Canonical URL-safe slug used in public routes (e.g. "rihand-dam-history")
        // Indexed separately; not required to preserve backward compat.
        slug: {
            type: String,
            trim: true,
            lowercase: true,
            index: true,
            sparse: true,   // allow null/missing without breaking unique index
        },

        // ── Core editorial content ────────────────────────────────────────
        title:    { type: String, required: true, trim: true },
        subtitle: { type: String, trim: true },

        // Short preview text shown in listing cards (1–2 sentences)
        excerpt: { type: String, trim: true },

        // ── Classification ────────────────────────────────────────────────

        // Free-form editorial badge e.g. "Engineering Heritage", "Wildlife & Nature"
        tag: { type: String, trim: true },

        // Structured category for filtering (lowercase kebab-case)
        category: {
            type: String,
            enum: [
                "history",
                "nature",
                "culture",
                "travel",
                "people",
                "wildlife",
                "geography",
                "heritage",
                "photography",
                "experiences",
                "local-stories",
            ],
            default: "local-stories",
        },

        // ── Media ─────────────────────────────────────────────────────────
        heroImage: heroImageSchema,

        // ── Body ──────────────────────────────────────────────────────────

        // Estimated reading time e.g. "4 min read"
        readTime: { type: String },

        // Pull-quote shown prominently in the editorial layout
        quote: { type: String },

        // Array of paragraphs. HTML allowed for inline [VERIFY] badges.
        content: [{ type: String, required: true }],

        // ── Verification & editorial status ───────────────────────────────

        // Legacy boolean (kept for backward compat; mirrors verificationStatus)
        isVerified: { type: Boolean, default: false },

        // Granular fact-checking level
        verificationStatus: {
            type: String,
            enum: [
                "verified",          // Confirmed by primary/government source
                "source-based",      // Supported by reputable publication
                "oral-account",      // Local or community oral history
                "tradition-legend",  // Cultural tradition or folklore
                "editorial",         // Editor's interpretation/commentary
                "unverified",        // Not yet checked
            ],
            default: "unverified",
        },

        // Editorial workflow status
        status: {
            type: String,
            enum: ["draft", "review", "published", "archived"],
            default: "draft",
        },

        // Legacy boolean publish flag (kept for backward compat)
        isPublished: { type: Boolean, default: true },

        // When editorial facts were last confirmed by a team member
        lastVerifiedAt: { type: Date },

        // ── Display & SEO ─────────────────────────────────────────────────

        // Display order within the destination's story list
        order: { type: Number, default: 0 },

        // Per-story SEO overrides (populated by editors; fallback to title/excerpt)
        seo: seoSchema,
    },
    { timestamps: true }
);

/* ------------------------------------------------------------------
   Indexes
   ------------------------------------------------------------------ */

// Compound unique: one storyId per destination
storySchema.index({ destination: 1, storyId: 1 }, { unique: true });

// Landing page queries: published stories sorted by order
storySchema.index({ isPublished: 1, order: 1 });

// Category + published for filtered listing
storySchema.index({ category: 1, isPublished: 1 });

export const Story = mongoose.model("Story", storySchema);

