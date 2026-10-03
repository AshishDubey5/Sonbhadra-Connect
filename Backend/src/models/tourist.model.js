import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

/**
 * Tourist Model
 * Registered visitors who browse destinations and make bookings.
 */

const touristSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        password: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            trim: true,
        },

        // Profile picture URL (Cloudinary / S3)
        avatar: {
            type: String,
            default: "",
        },

        // Home city/state of the tourist
        hometown: {
            type: String,
            trim: true,
        },

        // Bookings placed by this tourist (for reverse lookup)
        bookings: [
            {
                type: Schema.Types.ObjectId,
                ref: "Booking",
            },
        ],

        // Destinations the tourist has saved/wishlisted
        wishlist: [
            {
                type: Schema.Types.ObjectId,
                ref: "Destination",
            },
        ],

        // Eco-points earned through responsible travel actions
        ecoPoints: {
            type: Number,
            default: 0,
        },

        // Token for "remember me" / persistent login
        refreshToken: {
            type: String,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

/* ------------------------------------------------------------------
   Password hashing & comparison
   ------------------------------------------------------------------ */

touristSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

touristSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const Tourist = mongoose.model("Tourist", touristSchema);
