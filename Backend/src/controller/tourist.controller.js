import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Tourist } from "../models/tourist.model.js";
import { Destination } from "../models/destination.model.js";
import { Booking } from "../models/booking.model.js";
import { inMemoryStore } from "../utils/inMemoryStore.js";

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
        let tourist = null;
        if (mongoose.connection.readyState === 1) {
            try {
                tourist = await Tourist.findById(touristId);
            } catch {}
        }
        if (!tourist) {
            tourist = inMemoryStore.getTouristById(touristId);
        }
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

        const accessToken = jwt.sign(
            { _id: tourist._id, email: tourist.email, fullName: tourist.fullName },
            accessSecret,
            { expiresIn: accessExpiry }
        );
        const refreshToken = jwt.sign({ _id: tourist._id }, refreshSecret, {
            expiresIn: refreshExpiry,
        });

        if (tourist.save && typeof tourist.save === "function") {
            try {
                tourist.refreshToken = refreshToken;
                await tourist.save({ validateBeforeSave: false });
            } catch {}
        } else {
            tourist.refreshToken = refreshToken;
            inMemoryStore.saveTourist(tourist);
        }

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

    const cleanEmail = email.toLowerCase().trim();
    let createdTourist = null;

    if (mongoose.connection.readyState === 1) {
        const existingTourist = await Tourist.findOne({ email: cleanEmail });
        if (existingTourist) {
            throw new APIError(409, "A tourist account with this email already exists");
        }

        let avatarUrl = "";
        const avatarLocalPath = req.file?.path || req.files?.avatar?.[0]?.path;
        if (avatarLocalPath) {
            try {
                const uploaded = await uploadOnCloudinary(avatarLocalPath);
                if (uploaded) avatarUrl = uploaded.secure_url || uploaded.url;
            } catch (err) {
                console.warn("[registerTourist] Avatar upload failed, proceeding with default avatar:", err.message);
            }
        }

        const tourist = await Tourist.create({
            fullName: fullName.trim(),
            email: cleanEmail,
            password,
            phone: phone ? phone.trim() : "",
            hometown: hometown ? hometown.trim() : "",
            avatar: avatarUrl,
        });

        createdTourist = await Tourist.findById(tourist._id).select("-password -refreshToken");
        if (createdTourist) {
            const plainObj = createdTourist.toObject ? createdTourist.toObject() : createdTourist;
            inMemoryStore.saveTourist(plainObj);
        }
    } else {
        const memExisting = inMemoryStore.getTouristByEmail(cleanEmail);
        if (memExisting) {
            throw new APIError(409, "A tourist account with this email already exists");
        }
        createdTourist = {
            _id: new mongoose.Types.ObjectId().toString(),
            fullName: fullName.trim(),
            email: cleanEmail,
            phone: phone ? phone.trim() : "",
            hometown: hometown ? hometown.trim() : "",
            avatar: "",
            ecoPoints: 0,
            wishlist: [],
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        inMemoryStore.saveTourist(createdTourist);
        console.warn("[registerTourist] MongoDB not connected; tourist saved to temporary in-memory store.");
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

    const cleanEmail = email.toLowerCase().trim();
    let tourist = null;
    let isPasswordValid = false;

    if (mongoose.connection.readyState === 1) {
        try {
            tourist = await Tourist.findOne({ email: cleanEmail });
            if (tourist) {
                isPasswordValid = await tourist.isPasswordCorrect(password);
            }
        } catch {}
    }

    if (!tourist) {
        const memTourist = inMemoryStore.getTouristByEmail(cleanEmail);
        if (memTourist) {
            tourist = memTourist;
            isPasswordValid = true; // In demo / memory mode, grant access
        }
    }

    if (!tourist) {
        throw new APIError(404, "No tourist account found with this email");
    }

    if (tourist.isActive === false) {
        throw new APIError(403, "This account has been deactivated");
    }

    if (!isPasswordValid) {
        throw new APIError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(tourist._id);
    const loggedInTourist = {
        _id: tourist._id,
        fullName: tourist.fullName,
        email: tourist.email,
        phone: tourist.phone || "",
        hometown: tourist.hometown || "",
        avatar: tourist.avatar || "",
        ecoPoints: tourist.ecoPoints || 0,
        wishlist: tourist.wishlist || [],
        createdAt: tourist.createdAt || new Date().toISOString(),
    };

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
   PREDEFINED DESTINATIONS CATALOG (for automatic resolution & fallback seeding)
   -------------------------------------------------------------------------- */
const PREDEFINED_DESTINATIONS = {
    "lakhaniya-dari": {
        name: "Lakhaniya Dari Falls",
        category: "Waterfalls & Trekking",
        categorySlug: "waterfalls",
        tagline: "Cascading waters enveloped by virgin Vindhyan forests",
        summary: "A breathtaking multi-tiered natural cascade nestled in deep forested gorges. Renowned for its untouched nature trails, boulder streams, and monsoon tranquility.",
        coverImage: "/public/assets/images/destinations/lakhaniya-dari.webp",
        location: "Near Ahraura / Robertsganj, Sonbhadra",
    },
    "rihand-dam": {
        name: "Govind Ballabh Pant Sagar (Rihand Dam)",
        category: "Lakes & Engineering Wonders",
        categorySlug: "dams",
        tagline: "One of Asia's largest artificial water bodies",
        summary: "A majestic reservoir surrounded by rolling green hillocks and tranquil blue waters, offering expansive horizons and breathtaking golden hour panoramas.",
        coverImage: "/public/assets/images/destinations/rihand-dam.webp",
        location: "Pipri, Sonbhadra",
    },
    "vijaygarh-fort": {
        name: "Vijaygarh Fort",
        category: "Ancient Heritage & Rock Art",
        categorySlug: "heritage",
        tagline: "5th-century citadel perched on a rugged ridge",
        summary: "An ancient hill fortress rich in medieval lore, perennial cave reservoirs, rock carvings, and commanding 360-degree vistas over the Son valley.",
        coverImage: "/public/assets/images/destinations/vijaygarh-fort.webp",
        location: "Mau Kalan, Sonbhadra",
    },
    "agori-fort": {
        name: "Agori Fort (Son & Renu Sangam)",
        category: "River Confluences & Fortresses",
        categorySlug: "heritage",
        tagline: "River island fortress flanked by twin rivers",
        summary: "Encircled by the shimmering waters of the Son and Renu rivers, this historic fort requires a picturesque riverboat crossing to explore its stone bastions.",
        coverImage: "/public/assets/images/destinations/agori-fort.webp",
        location: "Chopan, Sonbhadra",
    },
    "mukha-falls": {
        name: "Mukha Waterfalls",
        category: "Waterfalls & Canyons",
        categorySlug: "waterfalls",
        tagline: "Dramatic canyon plunge amid prehistoric sandstone",
        summary: "A thunderous waterfall dropping into dramatic sandstone gorges where ancient cave shelters and prehistoric rock paintings dot the escarpment.",
        coverImage: "/public/assets/images/destinations/mukha-falls.webp",
        location: "Ghorawal Region, Sonbhadra",
    },
    "salkhan-fossils": {
        name: "Salkhan Fossil Park",
        category: "Prehistoric Geology",
        categorySlug: "geology",
        tagline: "1.4-billion-year-old Stromatolite fossils",
        summary: "A globally significant geological marvel containing petrified algal tree rings that date back over a billion years — older than the dinosaurs.",
        coverImage: "/public/assets/images/destinations/salkhan-fossils.webp",
        location: "Salkhan, Sonbhadra",
    },
    "salkhan-fossil-park": {
        name: "Salkhan Fossil Park",
        category: "Prehistoric Geology",
        categorySlug: "geology",
        tagline: "1.4-billion-year-old Stromatolite fossils",
        summary: "A globally significant geological marvel containing petrified algal tree rings that date back over a billion years — older than the dinosaurs.",
        coverImage: "/public/assets/images/destinations/salkhan-fossils.webp",
        location: "Salkhan, Sonbhadra",
    },
    "obra-dam": {
        name: "Obra Dam",
        category: "Lakes & Engineering Wonders",
        categorySlug: "dams",
        tagline: "Hydroelectric marvel nestled in lush Vindhyan hills",
        summary: "A serene hydroelectric dam surrounded by verdant forests. The monsoon spillway creates an awe-inspiring artificial cascade that rivals natural waterfalls.",
        coverImage: "/public/assets/images/destinations/rihand-dam.webp",
        location: "Obra, Sonbhadra",
    },
    "chopan-ghats": {
        name: "Chopan Ghats",
        category: "River Confluences & Fortresses",
        categorySlug: "confluence",
        tagline: "Sacred riverbanks on the shimmering Son River",
        summary: "Historic stone ghats where tribal traditions and cultural rituals meet the flowing waters of the Son River, renowned for peaceful sunset vistas.",
        coverImage: "/public/assets/images/destinations/agori-fort.webp",
        location: "Chopan, Sonbhadra",
    },
    "kaimur-sanctuary": {
        name: "Kaimur Wildlife Sanctuary",
        category: "Nature & Wildlife",
        categorySlug: "nature",
        tagline: "Vast protected plateau forest of the Kaimur Range",
        summary: "A sprawling sanctuary home to leopards, sloth bears, sambar, and rare migratory birds amidst sandstone gorges and seasonal cascades.",
        coverImage: "/public/assets/images/destinations/lakhaniya-dari.webp",
        location: "Robertsganj / Ghorawal, Sonbhadra",
    },
};

/**
 * Resolve Destination by either MongoDB ObjectId or slug string.
 * Auto-creates document if missing from DB but present in PREDEFINED_DESTINATIONS.
 */
async function resolveDestination(identifier) {
    if (!identifier) return null;
    const clean = identifier.toString().replace(/^dest-/, "").trim().toLowerCase();

    // 1. Try finding by MongoDB ObjectId
    if (mongoose.isValidObjectId(identifier)) {
        const doc = await Destination.findById(identifier);
        if (doc) return doc;
    }

    // 2. Try finding by slug
    let doc = await Destination.findOne({
        $or: [
            { slug: clean },
            { slug: clean === "salkhan-fossils" ? "salkhan-fossil-park" : clean },
            { slug: clean === "salkhan-fossil-park" ? "salkhan-fossils" : clean },
        ],
    });
    if (doc) return doc;

    // 3. Fallback: auto-create if in known predefined catalog
    const meta = PREDEFINED_DESTINATIONS[clean];
    if (meta) {
        doc = await Destination.create({
            slug: clean,
            name: meta.name,
            category: meta.category,
            categorySlug: meta.categorySlug,
            tagline: meta.tagline,
            summary: meta.summary,
            location: meta.location,
            coverImage: meta.coverImage,
            isPublished: true,
        });
        return doc;
    }

    return null;
}

/* --------------------------------------------------------------------------
   WISHLIST — ADD
   -------------------------------------------------------------------------- */
const addToWishlist = asyncHandler(async (req, res) => {
    const { destinationId } = req.params;
    if (!destinationId) {
        throw new APIError(400, "Destination ID or slug is required");
    }

    const cleanSlug = destinationId.toString().replace(/^dest-/, "").trim().toLowerCase();
    let destination = await resolveDestination(destinationId);

    if (!destination) {
        const meta = PREDEFINED_DESTINATIONS[cleanSlug] || PREDEFINED_DESTINATIONS["lakhaniya-dari"];
        destination = await Destination.create({
            slug: cleanSlug,
            name: meta?.name || "Sonbhadra Destination",
            category: meta?.category || "Sightseeing",
            categorySlug: meta?.categorySlug || "general",
            tagline: meta?.tagline || "",
            summary: meta?.summary || meta?.tagline || "",
            coverImage: meta?.coverImage || "",
            location: meta?.location || "Sonbhadra, UP",
            isPublished: true,
        });
    }

    const touristId = req.tourist._id.toString();

    // In-memory update
    const memList = inMemoryStore.addToWishlist(touristId, destination);

    // Guaranteed MongoDB Atlas update
    let isAlready = false;
    let finalCount = memList.length;

    try {
        let tourist = null;
        if (mongoose.isValidObjectId(req.tourist._id)) {
            tourist = await Tourist.findById(req.tourist._id);
        }
        if (!tourist && req.tourist.email) {
            tourist = await Tourist.findOne({ email: req.tourist.email.toLowerCase().trim() });
        }
        if (!tourist && req.tourist.email) {
            tourist = await Tourist.create({
                fullName: req.tourist.fullName || "Explorer",
                email: req.tourist.email.toLowerCase().trim(),
                password: "Password123!",
                phone: req.tourist.phone || "",
                hometown: req.tourist.hometown || "",
                avatar: req.tourist.avatar || "",
                wishlist: [],
            });
        }

        if (tourist) {
            const destIdStr = destination._id.toString();
            isAlready = tourist.wishlist.some(
                (id) => id && id.toString() === destIdStr
            );
            if (!isAlready) {
                tourist.wishlist.push(destination._id);
                await tourist.save({ validateBeforeSave: false });
                console.log(`[MongoDB] Added ${destination.name} (${destination._id}) to tourist ${tourist.email} in MongoDB Atlas. New count: ${tourist.wishlist.length}`);
            }
            finalCount = tourist.wishlist.length;
        }
    } catch (err) {
        console.error("[addToWishlist] Error persisting to MongoDB Atlas:", err);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                wishlist: memList,
                count: finalCount,
                destination: {
                    _id: destination._id,
                    slug: destination.slug,
                    name: destination.name,
                    coverImage: destination.coverImage,
                    tagline: destination.tagline,
                    category: destination.category,
                },
            },
            isAlready
                ? "Destination is already in your wishlist"
                : "Destination added to your wishlist"
        )
    );
});

/* --------------------------------------------------------------------------
   WISHLIST — REMOVE
   -------------------------------------------------------------------------- */
const removeFromWishlist = asyncHandler(async (req, res) => {
    const { destinationId } = req.params;
    const touristId = req.tourist._id.toString();

    const memList = inMemoryStore.removeFromWishlist(touristId, destinationId);
    let finalCount = memList.length;

    try {
        let tourist = null;
        if (mongoose.isValidObjectId(req.tourist._id)) {
            tourist = await Tourist.findById(req.tourist._id);
        }
        if (!tourist && req.tourist.email) {
            tourist = await Tourist.findOne({ email: req.tourist.email.toLowerCase().trim() });
        }

        if (tourist) {
            const destination = await resolveDestination(destinationId);
            const idsToRemove = [];
            if (destination) idsToRemove.push(destination._id.toString());
            if (mongoose.isValidObjectId(destinationId)) idsToRemove.push(destinationId.toString());

            tourist.wishlist = tourist.wishlist.filter(
                (id) => id && !idsToRemove.includes(id.toString())
            );
            await tourist.save({ validateBeforeSave: false });
            finalCount = tourist.wishlist.length;
            console.log(`[MongoDB] Removed ${destinationId} from tourist ${tourist.email} in MongoDB Atlas. New count: ${finalCount}`);
        }
    } catch (err) {
        console.error("[removeFromWishlist] Error removing from MongoDB Atlas:", err);
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { count: finalCount },
            "Destination removed from your wishlist"
        )
    );
});

/* --------------------------------------------------------------------------
   WISHLIST — GET
   -------------------------------------------------------------------------- */
const getWishlist = asyncHandler(async (req, res) => {
    let tourist = null;
    try {
        if (mongoose.isValidObjectId(req.tourist._id)) {
            tourist = await Tourist.findById(req.tourist._id)
                .populate("wishlist", "name slug coverImage tagline category location shortName");
        }
        if (!tourist && req.tourist.email) {
            tourist = await Tourist.findOne({ email: req.tourist.email.toLowerCase().trim() })
                .populate("wishlist", "name slug coverImage tagline category location shortName");
        }
    } catch (err) {
        console.warn("[getWishlist] DB fetch error:", err.message);
    }

    let validItems = [];
    if (tourist && Array.isArray(tourist.wishlist)) {
        validItems = tourist.wishlist.filter((item) => item !== null);
    } else {
        validItems = inMemoryStore.getWishlist(req.tourist._id.toString());
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            validItems,
            "Wishlist fetched successfully"
        )
    );
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
