import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Media } from "../models/media.model.js";
import { Creator } from "../models/creator.model.js";
import { Destination } from "../models/destination.model.js";

/* --------------------------------------------------------------------------
   CREATE POST (creator — multipart/form-data with thumbnail upload)
   -------------------------------------------------------------------------- */
const createPost = asyncHandler(async (req, res) => {
    const {
        destinationSlug,
        title,
        type,
        description,
        externalUrl,
        mediaUrl,
    } = req.body;

    if (!destinationSlug || !title || !type) {
        throw new APIError(400, "destinationSlug, title, and type are required");
    }

    const validTypes = ["reel", "photo", "blog", "drone", "vlog"];
    if (!validTypes.includes(type)) {
        throw new APIError(400, `type must be one of: ${validTypes.join(", ")}`);
    }

    // Resolve destination → ObjectId
    const destination = await Destination.findOne({
        slug: destinationSlug.toLowerCase().trim(),
    });
    if (!destination) {
        throw new APIError(404, `Destination "${destinationSlug}" not found`);
    }

    // Thumbnail upload (required)
    const thumbnailLocalPath = req.file?.path || req.files?.thumbnail?.[0]?.path;
    if (!thumbnailLocalPath) {
        throw new APIError(400, "A thumbnail image is required");
    }

    const uploaded = await uploadOnCloudinary(thumbnailLocalPath);
    if (!uploaded || !uploaded.url) {
        throw new APIError(500, "Failed to upload thumbnail to Cloudinary");
    }

    const post = await Media.create({
        creator: req.creator._id,
        destination: destination._id,
        destinationSlug: destinationSlug.toLowerCase().trim(),
        title: title.trim(),
        type,
        thumbnailUrl: uploaded.secure_url || uploaded.url,
        description: description?.trim() || "",
        externalUrl: externalUrl?.trim() || "",
        mediaUrl: mediaUrl?.trim() || "",
        isPublished: false, // creator must explicitly publish
    });

    return res
        .status(201)
        .json(new ApiResponse(201, post, "Post created successfully. Publish when ready."));
});

/* --------------------------------------------------------------------------
   GET POSTS BY CREATOR (public)
   -------------------------------------------------------------------------- */
const getPostsByCreator = asyncHandler(async (req, res) => {
    const { creatorId } = req.params;
    const { type, published = "true", page = 1, limit = 12 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
        throw new APIError(400, "Invalid creator ID");
    }

    const query = { creator: creatorId };
    if (published === "true") query.isPublished = true;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
        Media.find(query)
            .populate("destination", "name slug coverImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Media.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            "Creator posts fetched successfully"
        )
    );
});

/* --------------------------------------------------------------------------
   GET POSTS BY DESTINATION SLUG (public)
   -------------------------------------------------------------------------- */
const getPostsByDestination = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { type, page = 1, limit = 12 } = req.query;

    const query = { destinationSlug: slug.toLowerCase(), isPublished: true };
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
        Media.find(query)
            .populate("creator", "creatorName fullName avatar coveringCity")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Media.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            "Destination posts fetched successfully"
        )
    );
});

/* --------------------------------------------------------------------------
   GET FEATURED POSTS (public)
   -------------------------------------------------------------------------- */
const getFeaturedPosts = asyncHandler(async (req, res) => {
    const { limit = 8, type } = req.query;
    const query = { isPublished: true, isFeatured: true };
    if (type) query.type = type;

    const posts = await Media.find(query)
        .populate("creator", "creatorName fullName avatar")
        .populate("destination", "name slug coverImage location")
        .sort({ views: -1 })
        .limit(Number(limit));

    return res
        .status(200)
        .json(new ApiResponse(200, posts, "Featured posts fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET POST BY ID (public)
   -------------------------------------------------------------------------- */
const getPostById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid post ID");
    }

    const post = await Media.findById(id)
        .populate("creator", "creatorName fullName avatar bio coveringCity socialLinks")
        .populate("destination", "name slug coverImage tagline location");

    if (!post) {
        throw new APIError(404, "Post not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, post, "Post fetched successfully"));
});

/* --------------------------------------------------------------------------
   UPDATE POST (owner creator only)
   -------------------------------------------------------------------------- */
const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid post ID");
    }

    const post = await Media.findById(id);
    if (!post) throw new APIError(404, "Post not found");

    // Only the creator who owns this post can edit it
    if (post.creator.toString() !== req.creator._id.toString()) {
        throw new APIError(403, "You are not authorized to edit this post");
    }

    const allowedFields = ["title", "description", "externalUrl", "mediaUrl", "type"];
    const updates = {};
    allowedFields.forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const updated = await Media.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after" });
    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Post updated successfully"));
});

/* --------------------------------------------------------------------------
   DELETE POST (owner creator only)
   -------------------------------------------------------------------------- */
const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid post ID");
    }

    const post = await Media.findById(id);
    if (!post) throw new APIError(404, "Post not found");

    if (post.creator.toString() !== req.creator._id.toString()) {
        throw new APIError(403, "You are not authorized to delete this post");
    }

    await Media.findByIdAndDelete(id);
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

/* --------------------------------------------------------------------------
   TOGGLE PUBLISH (owner creator only)
   -------------------------------------------------------------------------- */
const togglePublish = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid post ID");
    }

    const post = await Media.findById(id);
    if (!post) throw new APIError(404, "Post not found");

    if (post.creator.toString() !== req.creator._id.toString()) {
        throw new APIError(403, "You are not authorized to publish/unpublish this post");
    }

    const updated = await Media.findByIdAndUpdate(
        id,
        { $set: { isPublished: !post.isPublished } },
        { returnDocument: "after" }
    );

    const action = updated.isPublished ? "published" : "unpublished";
    return res
        .status(200)
        .json(new ApiResponse(200, updated, `Post ${action} successfully`));
});

/* --------------------------------------------------------------------------
   INCREMENT VIEWS (called silently from frontend when post is opened)
   -------------------------------------------------------------------------- */
const incrementViews = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid post ID");
    }

    await Media.findByIdAndUpdate(id, { $inc: { views: 1 } });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "View recorded"));
});

/* --------------------------------------------------------------------------
   TOGGLE FEATURE (admin — mark post as featured on homepage)
   -------------------------------------------------------------------------- */
const toggleFeature = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid post ID");
    }

    const post = await Media.findById(id);
    if (!post) throw new APIError(404, "Post not found");

    const updated = await Media.findByIdAndUpdate(
        id,
        { $set: { isFeatured: !post.isFeatured } },
        { returnDocument: "after" }
    );

    const action = updated.isFeatured ? "featured" : "unfeatured";
    return res
        .status(200)
        .json(new ApiResponse(200, updated, `Post ${action} successfully`));
});

/* --------------------------------------------------------------------------
   GET MY POSTS (logged-in creator's own content)
   -------------------------------------------------------------------------- */
const getMyPosts = asyncHandler(async (req, res) => {
    const { type, published, page = 1, limit = 12 } = req.query;

    const query = { creator: req.creator._id };
    if (type) query.type = type;
    if (published !== undefined) query.isPublished = published === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [posts, total] = await Promise.all([
        Media.find(query)
            .populate("destination", "name slug coverImage")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Media.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            { posts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
            "Your posts fetched successfully"
        )
    );
});

export {
    createPost,
    getPostsByCreator,
    getPostsByDestination,
    getFeaturedPosts,
    getPostById,
    updatePost,
    deletePost,
    togglePublish,
    incrementViews,
    toggleFeature,
    getMyPosts,
};
