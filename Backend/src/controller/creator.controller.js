import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Creator } from "../models/creator.model.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

/**
 * Helper to generate access and refresh tokens and persist the refresh token
 */
const generateAccessAndRefreshToken = async (creatorId) => {
    try {
        const creator = await Creator.findById(creatorId);
        if (!creator) {
            throw new APIError(404, "Creator not found");
        }

        const accessToken = creator.generateAccessToken();
        const refreshToken = creator.generateRefreshToken();

        creator.refreshToken = refreshToken;
        await creator.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new APIError(
            500,
            error.message || "Something went wrong while generating tokens"
        );
    }
};

/**
 * Register a new Creator
 */
const registerCreator = asyncHandler(async (req, res) => {
    const {
        creatorName,
        email,
        fullName,
        password,
        phone,
        coveringCity,
        bio,
        socialLinks,
        address,
    } = req.body;

    if (
        [creatorName, email, fullName, password, phone].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new APIError(400, "creatorName, email, fullName, phone, and password are required");
    }

    const existedCreator = await Creator.findOne({
        $or: [
            { creatorName: creatorName.toLowerCase().trim() },
            { email: email.toLowerCase().trim() },
        ],
    });

    if (existedCreator) {
        throw new APIError(409, "Creator with this email or username already exists");
    }

    const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new APIError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar || !avatar.url) {
        throw new APIError(500, "Failed to upload avatar image to Cloudinary");
    }

    // Parse socialLinks or address if provided as stringified JSON (from multipart/form-data)
    let parsedSocialLinks = [];
    if (socialLinks) {
        try {
            parsedSocialLinks = typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
        } catch {
            parsedSocialLinks = Array.isArray(socialLinks) ? socialLinks : [socialLinks];
        }
    }

    let parsedAddress = {};
    if (address) {
        try {
            parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
        } catch {
            parsedAddress = {};
        }
    }

    const creator = await Creator.create({
        creatorName: creatorName.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        password,
        phone: phone.trim(),
        avatar: avatar.secure_url || avatar.url,
        coveringCity: coveringCity ? coveringCity.trim() : "",
        bio: bio ? bio.trim() : "",
        socialLinks: parsedSocialLinks,
        address: parsedAddress,
    });

    const createdCreator = await Creator.findById(creator._id).select(
        "-password -refreshToken"
    );

    if (!createdCreator) {
        throw new APIError(500, "Something went wrong while creating the creator account");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdCreator, "Creator registered successfully"));
});

/**
 * Log in an existing Creator
 */
const loginCreator = asyncHandler(async (req, res) => {
    const { email, creatorName, password } = req.body;

    if ((!email && !creatorName) || !password) {
        throw new APIError(400, "Email or creatorName and password are required");
    }

    const creator = await Creator.findOne({
        $or: [
            { email: email ? email.toLowerCase().trim() : null },
            { creatorName: creatorName ? creatorName.toLowerCase().trim() : null },
        ],
    });

    if (!creator) {
        throw new APIError(404, "Creator does not exist with this credential");
    }

    const isPasswordValid = await creator.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new APIError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(creator._id);

    const loggedInCreator = await Creator.findById(creator._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    creator: loggedInCreator,
                    accessToken,
                    refreshToken,
                },
                "Creator logged in successfully"
            )
        );
});

/**
 * Log out Creator
 */
const logoutCreator = asyncHandler(async (req, res) => {
    const creatorId = req.creator?._id;

    if (creatorId) {
        await Creator.findByIdAndUpdate(
            creatorId,
            {
                $unset: { refreshToken: 1 },
            },
            { returnDocument: "after" }
        );
    }

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Creator logged out successfully"));
});

/**
 * Refresh Access & Refresh Tokens
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new APIError(401, "Unauthorized request: No refresh token provided");
    }

    try {
        const refreshSecret = (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.trim()) || "sonbhadra_creator_refresh_token_secret_jwt_2026";
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            refreshSecret
        );

        const creator = await Creator.findById(decodedToken?._id);

        if (!creator) {
            throw new APIError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== creator?.refreshToken) {
            throw new APIError(401, "Refresh token is expired or has been used");
        }

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshToken(creator._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid refresh token");
    }
});

/**
 * Change Creator Password / Credentials
 */
const changeCredentials = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new APIError(400, "Old password and new password are required");
    }

    const creator = await Creator.findById(req.creator?._id);
    if (!creator) {
        throw new APIError(404, "Creator not found");
    }

    const isPasswordCorrect = await creator.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new APIError(400, "Invalid old password");
    }

    creator.password = newPassword;
    await creator.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/**
 * Get Current Logged In Creator
 */
const getCurrentCreator = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.creator, "Current creator profile fetched successfully"));
});

/**
 * Update Account Details (fullName, phone, address)
 */
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, phone, address } = req.body;

    if (!fullName && !phone && !address) {
        throw new APIError(400, "At least one field (fullName, phone, or address) is required to update");
    }

    const updateData = {};
    if (fullName && fullName.trim()) updateData.fullName = fullName.trim();
    if (phone && phone.trim()) updateData.phone = phone.trim();

    if (address) {
        let parsedAddress = address;
        if (typeof address === "string") {
            try {
                parsedAddress = JSON.parse(address);
            } catch {
                parsedAddress = { street: address };
            }
        }
        updateData.address = parsedAddress;
    }

    const updatedCreator = await Creator.findByIdAndUpdate(
        req.creator?._id,
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCreator, "Account details updated successfully"));
});

/**
 * Update Creator Avatar
 */
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new APIError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar || !avatar.url) {
        throw new APIError(500, "Failed to upload avatar to Cloudinary");
    }

    const updatedCreator = await Creator.findByIdAndUpdate(
        req.creator?._id,
        {
            $set: {
                avatar: avatar.secure_url || avatar.url,
            },
        },
        { returnDocument: "after" }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCreator, "Avatar updated successfully"));
});

/**
 * Update Creator Covering City (e.g. Robertsganj, Renukoot, Obra, Churk)
 */
const updateCoveringCity = asyncHandler(async (req, res) => {
    const { coveringCity } = req.body;

    if (!coveringCity || !coveringCity.trim()) {
        throw new APIError(400, "Covering city name is required");
    }

    const updatedCreator = await Creator.findByIdAndUpdate(
        req.creator?._id,
        {
            $set: {
                coveringCity: coveringCity.trim(),
            },
        },
        { returnDocument: "after" }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedCreator,
                "Covering city updated successfully"
            )
        );
});

/**
 * Add Bio (if bio is currently empty or newly created)
 */
const addBio = asyncHandler(async (req, res) => {
    const { bio } = req.body;

    if (!bio || !bio.trim()) {
        throw new APIError(400, "Bio text is required");
    }

    const creator = await Creator.findById(req.creator?._id);
    if (!creator) {
        throw new APIError(404, "Creator not found");
    }

    creator.bio = bio.trim();
    await creator.save({ validateBeforeSave: false });

    const updatedCreator = await Creator.findById(creator._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCreator, "Bio added successfully"));
});

/**
 * Update Bio & Social Links
 */
const updateBio = asyncHandler(async (req, res) => {
    const { bio, socialLinks } = req.body;

    if (bio === undefined && socialLinks === undefined) {
        throw new APIError(400, "Either bio or socialLinks must be provided to update");
    }

    const updateData = {};
    if (bio !== undefined) {
        updateData.bio = bio.trim();
    }

    if (socialLinks !== undefined) {
        let parsedLinks = socialLinks;
        if (typeof socialLinks === "string") {
            try {
                parsedLinks = JSON.parse(socialLinks);
            } catch {
                parsedLinks = [socialLinks];
            }
        }
        updateData.socialLinks = parsedLinks;
    }

    const updatedCreator = await Creator.findByIdAndUpdate(
        req.creator?._id,
        { $set: updateData },
        { returnDocument: "after" }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updatedCreator, "Bio and links updated successfully"));
});

/**
 * Get Creator Channel Profile with stats (posts, views, likes) via MongoDB Aggregation
 */
const getCreatorChannelProfile = asyncHandler(async (req, res) => {
    const { creatorName } = req.params;

    if (!creatorName || !creatorName.trim()) {
        throw new APIError(400, "Creator username is missing");
    }

    const channel = await Creator.aggregate([
        {
            $match: {
                creatorName: creatorName.toLowerCase().trim(),
            },
        },
        {
            $lookup: {
                from: "media",
                localField: "_id",
                foreignField: "creator",
                as: "posts",
            },
        },
        {
            $addFields: {
                totalPosts: { $size: "$posts" },
                totalViews: { $sum: "$posts.views" },
                totalLikes: { $sum: "$posts.likes" },
            },
        },
        {
            $project: {
                password: 0,
                refreshToken: 0,
            },
        },
    ]);

    if (!channel?.length) {
        throw new APIError(404, "Creator channel does not exist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "Creator channel profile fetched successfully"
            )
        );
});

/**
 * Get top/featured creators from database with their aggregated stats (stories, views, likes)
 */
const getTopCreators = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 3;

    const creators = await Creator.aggregate([
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField: "creator",
                as: "stories",
            },
        },
        {
            $lookup: {
                from: "media",
                localField: "_id",
                foreignField: "creator",
                as: "mediaPosts",
            },
        },
        {
            $addFields: {
                totalStories: { $size: "$stories" },
                totalMedia: { $size: "$mediaPosts" },
                totalViews: {
                    $add: [
                        { $sum: "$stories.views" },
                        { $sum: "$mediaPosts.views" }
                    ]
                },
                totalLikes: {
                    $add: [
                        { $sum: "$stories.likes" },
                        { $sum: "$mediaPosts.likes" }
                    ]
                },
            },
        },
        {
            $project: {
                password: 0,
                refreshToken: 0,
                stories: 0,
                mediaPosts: 0,
            },
        },
        {
            $sort: {
                totalStories: -1,
                totalViews: -1,
                createdAt: 1,
            },
        },
        {
            $limit: limit,
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                creators,
                "Top creators fetched successfully"
            )
        );
});

/**
 * Get all registered creators with aggregated stats for public directory / tourist view
 */
const getAllCreators = asyncHandler(async (req, res) => {
    const creators = await Creator.aggregate([
        {
            $lookup: {
                from: "stories",
                localField: "_id",
                foreignField: "creator",
                as: "stories",
            },
        },
        {
            $lookup: {
                from: "media",
                localField: "_id",
                foreignField: "creator",
                as: "mediaPosts",
            },
        },
        {
            $addFields: {
                totalStories: { $size: "$stories" },
                totalMedia: { $size: "$mediaPosts" },
                totalViews: {
                    $add: [
                        { $sum: "$stories.views" },
                        { $sum: "$mediaPosts.views" }
                    ]
                },
                totalLikes: {
                    $add: [
                        { $sum: "$stories.likes" },
                        { $sum: "$mediaPosts.likes" }
                    ]
                },
            },
        },
        {
            $project: {
                password: 0,
                refreshToken: 0,
                stories: 0,
                mediaPosts: 0,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                creators,
                "All creators fetched successfully"
            )
        );
});

export {
    generateAccessAndRefreshToken,
    registerCreator,
    loginCreator,
    logoutCreator,
    refreshAccessToken,
    changeCredentials,
    getCurrentCreator,
    updateAccountDetails,
    updateAvatar,
    updateCoveringCity,
    addBio,
    updateBio,
    getCreatorChannelProfile,
    getTopCreators,
    getAllCreators,
};