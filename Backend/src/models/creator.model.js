import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const creatorSchema = new Schema({

    creatorName: {
        type: String,
        required: true,
        lowercase: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
    },

    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },

    password: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        required: true,
    },
    address: {
        street: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        pincode: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            default: "India",
            trim: true,
        },
    },
    avatar: {
        type: String,
        required: true,
    },
    coveringCity: {
        type: String,
        trim: true,
        default: "",
    },
    bio: {
        type: String,
        default: "",
    },
    socialLinks: {
        type: [String],
        default: [],
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true });

creatorSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});
creatorSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

creatorSchema.methods.generateAccessToken = function () {
    const secret = (process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.trim()) || "sonbhadra_creator_access_token_secret_jwt_2026";
    const expiry = (process.env.ACCESS_TOKEN_EXPIRY && process.env.ACCESS_TOKEN_EXPIRY.trim()) || "1d";
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            creatorName: this.creatorName,
        },
        secret,
        { expiresIn: expiry }
    );
};

creatorSchema.methods.generateRefreshToken = function () {
    const secret = (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.trim()) || "sonbhadra_creator_refresh_token_secret_jwt_2026";
    const expiry = (process.env.REFRESH_TOKEN_EXPIRY && process.env.REFRESH_TOKEN_EXPIRY.trim()) || "10d";
    return jwt.sign(
        {
            _id: this._id,
        },
        secret,
        { expiresIn: expiry }
    );
};

export const Creator = mongoose.model("Creator", creatorSchema);
