import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Tourist } from "../models/tourist.model.js";
import { Destination } from "../models/destination.model.js";
import { Booking } from "../models/booking.model.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
};

/* --------------------------------------------------------------------------
   Helper — Generate access & refresh tokens
   -------------------------------------------------------------------------- */
const generateAccessAndRefreshToken = async (touristId) => {
    try {
        const tourist = await Tourist.findById(touristId);
        if (!tourist) throw new APIError(404, "Tourist not found");

        const accessSecret =
            (process.env.ACCESS_TOKEN_SECRET &&
                process.env.ACCESS_TOKEN_SECRET.trim()) ||
            "sonbhadra_tourist_access_token_secret_jwt_2026";
        const refreshSecret =
            (process.env.REFRESH_TOKEN_SECRET &&
                process.env.REFRESH_TOKEN_SECRET.trim()) ||
            "sonbhadra_tourist_refresh_token_secret_jwt_2026";
        const accessExpiry = process.env.ACCESS_TOKEN_EXPIRY || "1d";
        const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY || "10d";

        const accessToken = jwt.sign({ _id: tourist._id, email: tourist.email }, accessSecret, {
            expiresIn: accessExpiry,
        });
        const refreshToken = jwt.sign({ _id: tourist._id }, refreshSecret, {
            expiresIn: refreshExpiry,
        });

        tourist.refreshToken = refreshToken;
        await tourist.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new APIError(500, error.message || "Something went wrong while generating tokens");
    }
};

/* --------------------------------------------------------------------------
   REGISTER
   -------------------------------------------------------------------------- */
const registerTourist = asyncHandler(async (req, res) => {
    const { fullName, email, password, phone, hometown } = req.body;

    if (!fullName || !email || !password) {
        throw new APIError(400, "fullName, email, and password are required");
    }

    const existingTourist = await Tourist.findOne({ email: email.toLowerCase().trim() });
    if (existingTourist) {
        throw new APIError(409, "A tourist account with this email already exists");
    }

    let avatarUrl = "";
    const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;
    if (avatarLocalPath) {
        const uploaded = await uploadOnCloudinary(avatarLocalPath);
        if (uploaded) avatarUrl = uploaded.secure_url || uploaded.url;
    }

    const tourist = await Tourist.create({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone ? phone.trim() : "",
        hometown: hometown ? hometown.trim() : "",
        avatar: avatarUrl,
    });

    const createdTourist = await Tourist.findById(tourist._id).select("-password -refreshToken");
    if (!createdTourist) {
        throw new APIError(500, "Something went wrong while registering tourist");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdTourist, "Tourist registered successfully"));
});

/* --------------------------------------------------------------------------
   LOGIN
   -------------------------------------------------------------------------- */
const loginTourist = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new APIError(400, "Email and password are required");
    }

    const tourist = await Tourist.findOne({ email: email.toLowerCase().trim() });
    if (!tourist) {
        throw new APIError(404, "No tourist account found with this email");
    }

    if (!tourist.isActive) {
        throw new APIError(403, "This account has been deactivated");
    }

    const isPasswordValid = await tourist.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new APIError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(tourist._id);
    const loggedInTourist = await Tourist.findById(tourist._id).select("-password -refreshToken");

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { tourist: loggedInTourist, accessToken, refreshToken },
                "Tourist logged in successfully"
            )
        );
});

/* --------------------------------------------------------------------------
   LOGOUT
   -------------------------------------------------------------------------- */
const logoutTourist = asyncHandler(async (req, res) => {
    const touristId = req.tourist?._id;
    if (touristId) {
        await Tourist.findByIdAndUpdate(touristId, { $unset: { refreshToken: 1 } }, { returnDocument: "after" });
    }

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Tourist logged out successfully"));
});

/* --------------------------------------------------------------------------
   REFRESH ACCESS TOKEN
   -------------------------------------------------------------------------- */
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new APIError(401, "Unauthorized — no refresh token provided");
    }

    const secret =
        (process.env.REFRESH_TOKEN_SECRET &&
            process.env.REFRESH_TOKEN_SECRET.trim()) ||
        "sonbhadra_tourist_refresh_token_secret_jwt_2026";

    let decodedToken;
    try {
        decodedToken = jwt.verify(incomingRefreshToken, secret);
    } catch {
        throw new APIError(401, "Invalid or expired refresh token");
    }

    const tourist = await Tourist.findById(decodedToken?._id);
    if (!tourist || tourist.refreshToken !== incomingRefreshToken) {
        throw new APIError(401, "Refresh token is expired or has already been used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(tourist._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access token refreshed successfully"
            )
        );
});

/* --------------------------------------------------------------------------
   GET CURRENT TOURIST
   -------------------------------------------------------------------------- */
const getCurrentTourist = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.tourist, "Current tourist fetched successfully"));
});

/* --------------------------------------------------------------------------
   UPDATE PROFILE (fullName, phone, hometown)
   -------------------------------------------------------------------------- */
const updateProfile = asyncHandler(async (req, res) => {
    const { fullName, phone, hometown } = req.body;

    if (!fullName && !phone && !hometown) {
        throw new APIError(400, "At least one field (fullName, phone, hometown) is required");
    }

    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (phone) updates.phone = phone.trim();
    if (hometown) updates.hometown = hometown.trim();

    const updated = await Tourist.findByIdAndUpdate(
        req.tourist._id,
        { $set: updates },
        { returnDocument: "after" }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Profile updated successfully"));
});

/* --------------------------------------------------------------------------
   UPDATE AVATAR
   -------------------------------------------------------------------------- */
const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new APIError(400, "Avatar file is required");
    }

    const uploaded = await uploadOnCloudinary(avatarLocalPath);
    if (!uploaded || !uploaded.url) {
        throw new APIError(500, "Failed to upload avatar to Cloudinary");
    }

    const updated = await Tourist.findByIdAndUpdate(
        req.tourist._id,
        { $set: { avatar: uploaded.secure_url || uploaded.url } },
        { returnDocument: "after" }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Avatar updated successfully"));
});

/* --------------------------------------------------------------------------
   CHANGE PASSWORD
   -------------------------------------------------------------------------- */
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new APIError(400, "oldPassword and newPassword are required");
    }

    if (newPassword.length < 8) {
        throw new APIError(400, "New password must be at least 8 characters");
    }

    const tourist = await Tourist.findById(req.tourist._id);
    const isPasswordValid = await tourist.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
        throw new APIError(401, "Old password is incorrect");
    }

    tourist.password = newPassword;
    await tourist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

/* --------------------------------------------------------------------------
   WISHLIST — ADD
   -------------------------------------------------------------------------- */
const addToWishlist = asyncHandler(async (req, res) => {
    const { destinationId } = req.params;

    const destination = await Destination.findById(destinationId);
    if (!destination) {
        throw new APIError(404, "Destination not found");
    }

    const tourist = await Tourist.findById(req.tourist._id);
    if (tourist.wishlist.includes(destinationId)) {
        throw new APIError(409, "Destination already in wishlist");
    }

    tourist.wishlist.push(destinationId);
    await tourist.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, { wishlist: tourist.wishlist }, "Destination added to wishlist"));
});

/* --------------------------------------------------------------------------
   WISHLIST — REMOVE
   -------------------------------------------------------------------------- */
const removeFromWishlist = asyncHandler(async (req, res) => {
    const { destinationId } = req.params;

    await Tourist.findByIdAndUpdate(
        req.tourist._id,
        { $pull: { wishlist: destinationId } },
        { returnDocument: "after" }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Destination removed from wishlist"));
});

/* --------------------------------------------------------------------------
   WISHLIST — GET
   -------------------------------------------------------------------------- */
const getWishlist = asyncHandler(async (req, res) => {
    const tourist = await Tourist.findById(req.tourist._id)
        .populate("wishlist", "name slug coverImage tagline category location")
        .select("wishlist");

    return res
        .status(200)
        .json(new ApiResponse(200, tourist.wishlist, "Wishlist fetched successfully"));
});

/* --------------------------------------------------------------------------
   MY BOOKINGS
   -------------------------------------------------------------------------- */
const getMyBookings = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { tourist: req.tourist._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate("destination", "name slug coverImage location")
            .populate("creator", "creatorName fullName avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Booking.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            "Bookings fetched successfully"
        )
    );
});

/* --------------------------------------------------------------------------
   ECO POINTS
   -------------------------------------------------------------------------- */
const getEcoPoints = asyncHandler(async (req, res) => {
    const tourist = await Tourist.findById(req.tourist._id).select("ecoPoints");
    return res
        .status(200)
        .json(new ApiResponse(200, { ecoPoints: tourist.ecoPoints }, "Eco points fetched successfully"));
});

/* --------------------------------------------------------------------------
   DEACTIVATE ACCOUNT
   -------------------------------------------------------------------------- */
const deactivateAccount = asyncHandler(async (req, res) => {
    await Tourist.findByIdAndUpdate(req.tourist._id, { $set: { isActive: false } });
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Account deactivated. We are sorry to see you go!"));
});

export {
    registerTourist,
    loginTourist,
    logoutTourist,
    refreshAccessToken,
    getCurrentTourist,
    updateProfile,
    updateAvatar,
    changePassword,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    getMyBookings,
    getEcoPoints,
    deactivateAccount,
};
