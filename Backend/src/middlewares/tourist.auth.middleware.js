import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { APIError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tourist } from "../models/tourist.model.js";
import { inMemoryStore } from "../utils/inMemoryStore.js";

/**
 * verifyTouristJWT
 * Mirrors the creator's verifyJWT middleware but resolves the Tourist model.
 * Sets req.tourist on success.
 */
export const verifyTouristJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new APIError(401, "Unauthorized request: No token provided");
        }

        const secret =
            (process.env.ACCESS_TOKEN_SECRET &&
                process.env.ACCESS_TOKEN_SECRET.trim()) ||
            "sonbhadra_tourist_access_token_secret_jwt_2026";

        const decodedToken = jwt.verify(token, secret);

        let tourist = null;
        if (mongoose.connection.readyState === 1) {
            try {
                tourist = await Tourist.findById(decodedToken?._id).select(
                    "-password -refreshToken"
                );
            } catch (err) {
                console.warn("[verifyTouristJWT] DB query failed, falling back to memory store:", err.message);
            }
        }

        if (!tourist) {
            tourist = inMemoryStore.getTouristById(decodedToken?._id);
        }

        if (!tourist) {
            tourist = {
                _id: decodedToken?._id,
                email: decodedToken?.email,
                fullName: decodedToken?.fullName || "Explorer",
                isActive: true,
                wishlist: [],
            };
            inMemoryStore.saveTourist(tourist);
        }

        if (tourist.isActive === false) {
            throw new APIError(403, "This account has been deactivated");
        }

        req.tourist = tourist;
        next();
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access token");
    }
});
