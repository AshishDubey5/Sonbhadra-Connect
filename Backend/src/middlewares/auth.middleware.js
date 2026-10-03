import jwt from "jsonwebtoken";
import { APIError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Creator } from "../models/creator.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new APIError(401, "Unauthorized request: No token provided");
        }

        const secret = (process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.trim()) || "sonbhadra_creator_access_token_secret_jwt_2026";
        const decodedToken = jwt.verify(token, secret);

        const creator = await Creator.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!creator) {
            throw new APIError(401, "Invalid access token");
        }

        req.creator = creator;
        next();
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access token");
    }
});
