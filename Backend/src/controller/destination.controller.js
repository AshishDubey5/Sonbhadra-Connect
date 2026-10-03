import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Destination } from "../models/destination.model.js";

/* --------------------------------------------------------------------------
   GET ALL DESTINATIONS (public, paginated + filtered)
   Query params: page, limit, category, featured, published
   -------------------------------------------------------------------------- */
const getAllDestinations = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 12,
        category,
        categorySlug,
        featured,
        hero,
        search,
        sortBy = "createdAt",
        order = "desc",
    } = req.query;

    const query = { isPublished: true };
    if (category) query.category = new RegExp(category, "i");
    if (categorySlug) query.categorySlug = categorySlug.toLowerCase();
    if (featured === "true") query.isFeatured = true;
    if (hero === "true") query.isHero = true;
    if (search) {
        query.$or = [
            { name: new RegExp(search, "i") },
            { location: new RegExp(search, "i") },
            { tagline: new RegExp(search, "i") },
            { summary: new RegExp(search, "i") },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [destinations, total] = await Promise.all([
        Destination.find(query)
            .select("name slug shortName tagline category categorySlug location coverImage duration bestSeason difficulty isFeatured isHero coordinates")
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(Number(limit)),
        Destination.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                destinations,
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
            },
            "Destinations fetched successfully"
        )
    );
});

/* --------------------------------------------------------------------------
   GET DESTINATION BY SLUG (full detail — public)
   -------------------------------------------------------------------------- */
const getDestinationBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const destination = await Destination.findOne({ slug: slug.toLowerCase(), isPublished: true });
    if (!destination) {
        throw new APIError(404, `Destination "${slug}" not found`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, destination, "Destination fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET FEATURED DESTINATIONS (public)
   -------------------------------------------------------------------------- */
const getFeaturedDestinations = asyncHandler(async (req, res) => {
    const destinations = await Destination.find({ isPublished: true, isFeatured: true })
        .select("name slug tagline category location coverImage duration bestSeason difficulty coordinates")
        .sort({ name: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, destinations, "Featured destinations fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET HERO DESTINATIONS (for homepage hero banner — public)
   -------------------------------------------------------------------------- */
const getHeroDestinations = asyncHandler(async (req, res) => {
    const destinations = await Destination.find({ isPublished: true, isHero: true })
        .select("name slug tagline category location coverImage gallery coordinates")
        .sort({ name: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, destinations, "Hero destinations fetched successfully"));
});

/* --------------------------------------------------------------------------
   SEARCH DESTINATIONS (public)
   -------------------------------------------------------------------------- */
const searchDestinations = asyncHandler(async (req, res) => {
    const { q, limit = 8 } = req.query;

    if (!q || q.trim().length < 2) {
        throw new APIError(400, "Search query must be at least 2 characters");
    }

    const destinations = await Destination.find({
        isPublished: true,
        $or: [
            { name: new RegExp(q, "i") },
            { location: new RegExp(q, "i") },
            { tagline: new RegExp(q, "i") },
            { category: new RegExp(q, "i") },
        ],
    })
        .select("name slug tagline category location coverImage")
        .limit(Number(limit));

    return res
        .status(200)
        .json(new ApiResponse(200, destinations, "Search results fetched successfully"));
});

/* --------------------------------------------------------------------------
   CREATE DESTINATION (admin)
   -------------------------------------------------------------------------- */
const createDestination = asyncHandler(async (req, res) => {
    const {
        slug, name, shortName, tagline, category, categoryBadge, categorySlug,
        location, coordinates, summary, description, duration, bestSeason,
        difficulty, quickFacts, mapDetails, communityGuidelines, relatedSlugs,
        isPublished, isFeatured, isHero, isVerified,
    } = req.body;

    if (!slug || !name || !category || !location || !summary) {
        throw new APIError(400, "slug, name, category, location, and summary are required");
    }

    const existingSlug = await Destination.findOne({ slug: slug.toLowerCase().trim() });
    if (existingSlug) {
        throw new APIError(409, `A destination with slug "${slug}" already exists`);
    }

    // Handle optional cover image upload
    let coverImageUrl = "";
    const coverLocalPath = req.file?.path || req.files?.coverImage?.[0]?.path;
    if (coverLocalPath) {
        const uploaded = await uploadOnCloudinary(coverLocalPath);
        if (uploaded) coverImageUrl = uploaded.secure_url || uploaded.url;
    }

    // Parse nested JSON fields sent as strings (multipart/form-data support)
    const parse = (val) => {
        if (!val) return undefined;
        try { return typeof val === "string" ? JSON.parse(val) : val; } catch { return val; }
    };

    const destination = await Destination.create({
        slug: slug.toLowerCase().trim(),
        name: name.trim(),
        shortName: shortName?.trim(),
        tagline: tagline?.trim(),
        category: category.trim(),
        categoryBadge: categoryBadge?.trim(),
        categorySlug: categorySlug?.toLowerCase().trim(),
        location: location.trim(),
        coordinates: parse(coordinates),
        summary: summary.trim(),
        description: description?.trim(),
        coverImage: coverImageUrl,
        duration,
        bestSeason,
        difficulty,
        quickFacts: parse(quickFacts),
        mapDetails: parse(mapDetails),
        communityGuidelines: parse(communityGuidelines),
        relatedSlugs: parse(relatedSlugs) || [],
        isPublished: isPublished === "true" || isPublished === true,
        isFeatured: isFeatured === "true" || isFeatured === true,
        isHero: isHero === "true" || isHero === true,
        isVerified: isVerified === "true" || isVerified === true,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, destination, "Destination created successfully"));
});

/* --------------------------------------------------------------------------
   UPDATE DESTINATION (admin)
   -------------------------------------------------------------------------- */
const updateDestination = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const destination = await Destination.findOne({ slug: slug.toLowerCase() });
    if (!destination) {
        throw new APIError(404, `Destination "${slug}" not found`);
    }

    const allowedFields = [
        "name", "shortName", "tagline", "category", "categoryBadge", "categorySlug",
        "location", "coordinates", "summary", "description", "duration", "bestSeason",
        "difficulty", "quickFacts", "mapDetails", "communityGuidelines", "relatedSlugs",
        "isPublished", "isFeatured", "isHero", "isVerified",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    const updated = await Destination.findByIdAndUpdate(
        destination._id,
        { $set: updates },
        { returnDocument: "after", runValidators: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Destination updated successfully"));
});

/* --------------------------------------------------------------------------
   ADD GALLERY IMAGE (admin) — uploads to Cloudinary and pushes to array
   -------------------------------------------------------------------------- */
const addGalleryImage = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { alt, caption, type } = req.body;

    const destination = await Destination.findOne({ slug: slug.toLowerCase() });
    if (!destination) {
        throw new APIError(404, `Destination "${slug}" not found`);
    }

    const imageLocalPath = req.file?.path;
    if (!imageLocalPath) {
        throw new APIError(400, "Image file is required");
    }

    const uploaded = await uploadOnCloudinary(imageLocalPath);
    if (!uploaded || !uploaded.url) {
        throw new APIError(500, "Failed to upload image to Cloudinary");
    }

    const galleryItem = {
        url: uploaded.secure_url || uploaded.url,
        alt: alt || destination.name,
        caption: caption || "",
        type: type || "general",
    };

    const updated = await Destination.findByIdAndUpdate(
        destination._id,
        { $push: { gallery: galleryItem } },
        { returnDocument: "after" }
    ).select("name slug gallery");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Gallery image added successfully"));
});

/* --------------------------------------------------------------------------
   DELETE / UNPUBLISH DESTINATION (admin — soft delete)
   -------------------------------------------------------------------------- */
const deleteDestination = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { hardDelete } = req.query;

    const destination = await Destination.findOne({ slug: slug.toLowerCase() });
    if (!destination) {
        throw new APIError(404, `Destination "${slug}" not found`);
    }

    if (hardDelete === "true") {
        await Destination.findByIdAndDelete(destination._id);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Destination permanently deleted"));
    }

    // Soft delete — just unpublish
    await Destination.findByIdAndUpdate(destination._id, { $set: { isPublished: false } });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Destination unpublished successfully"));
});

/* --------------------------------------------------------------------------
   GET DESTINATIONS BY CATEGORY (public)
   -------------------------------------------------------------------------- */
const getDestinationsByCategory = asyncHandler(async (req, res) => {
    const { categorySlug } = req.params;

    const destinations = await Destination.find({
        isPublished: true,
        categorySlug: categorySlug.toLowerCase(),
    })
        .select("name slug tagline category location coverImage duration bestSeason difficulty coordinates")
        .sort({ name: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, destinations, `Destinations in category "${categorySlug}" fetched`));
});

export {
    getAllDestinations,
    getDestinationBySlug,
    getFeaturedDestinations,
    getHeroDestinations,
    searchDestinations,
    createDestination,
    updateDestination,
    addGalleryImage,
    deleteDestination,
    getDestinationsByCategory,
};
