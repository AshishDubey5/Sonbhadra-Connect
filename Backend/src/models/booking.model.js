import mongoose, { Schema } from "mongoose";

/**
 * Booking Model
 * Records every trip booking made by a Tourist.
 * Links Tourist -> Destination -> Creator (optional).
 * Mirrors the frontend booking.js checkout flow exactly.
 */

const bookingSchema = new Schema(
    {
        // Auto-generated unique reference e.g. "SNB-2026-00142"
        bookingReference: {
            type: String,
            unique: true,
            index: true,
        },

        // Who is booking
        tourist: {
            type: Schema.Types.ObjectId,
            ref: "Tourist",
            required: true,
            index: true,
        },

        // Where they are going
        destination: {
            type: Schema.Types.ObjectId,
            ref: "Destination",
            required: true,
            index: true,
        },

        // Convenience slug stored so we can filter without populate
        destinationSlug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        // Optional: the local creator/guide they selected as an add-on
        creator: {
            type: Schema.Types.ObjectId,
            ref: "Creator",
            default: null,
        },

        // Travel dates
        travelDate: {
            type: Date,
            required: true,
        },

        returnDate: {
            type: Date,
        },

        // Number of travelers in the group
        travelers: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },

        // Contact details (may differ from Tourist profile for group bookings)
        contactName:  { type: String, required: true, trim: true },
        contactEmail: { type: String, required: true, lowercase: true, trim: true },
        contactPhone: { type: String, required: true, trim: true },

        // Pricing breakdown (all in INR ₹)
        basePrice:      { type: Number, required: true },   // per person base
        creatorFee:     { type: Number, default: 0 },       // creator add-on
        permitFee:      { type: Number, default: 0 },       // govt permit/entry
        couponCode:     { type: String, default: "" },
        couponDiscount: { type: Number, default: 0 },       // flat INR discount
        totalAmount:    { type: Number, required: true },   // final charge

        // Booking lifecycle status
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
            index: true,
        },

        // Optional notes from tourist
        notes: { type: String, trim: true },

        // Payment info (to be filled once payment gateway is integrated)
        paymentId:     { type: String },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "paid", "refunded"],
            default: "unpaid",
        },
        paymentMethod: {
            type: String,
            enum: ["upi", "card", "netbanking", "wallet", "cod", ""],
            default: "",
        },
    },
    { timestamps: true }
);

// Auto-generate booking reference before saving
bookingSchema.pre("save", async function () {
    if (!this.bookingReference) {
        const year = new Date().getFullYear();
        const count = await mongoose.model("Booking").countDocuments();
        this.bookingReference = `SNB-${year}-${String(count + 1).padStart(5, "0")}`;
    }
});

export const Booking = mongoose.model("Booking", bookingSchema);
