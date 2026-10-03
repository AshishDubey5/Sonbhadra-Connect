import jwt from "jsonwebtoken";
import { APIError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tourist } from "../models/tourist.model.js";

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

        const tourist = await Tourist.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!tourist) {
            throw new APIError(401, "Invalid access token");
        }

        if (!tourist.isActive) {
            throw new APIError(403, "This account has been deactivated");
        }

        req.tourist = tourist;
        next();
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access token");
    }
});
