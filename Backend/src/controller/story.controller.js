import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Story } from "../models/story.model.js";
import { Destination } from "../models/destination.model.js";

/* --------------------------------------------------------------------------
   GET ALL STORIES (public — paginated, filterable)
   GET /api/v1/stories?status=published&category=history&featured=true&limit=12&page=1
   -------------------------------------------------------------------------- */
const getAllStories = asyncHandler(async (req, res) => {
    const {
        category,
        limit: rawLimit = "12",
        page: rawPage = "1",
    } = req.query;

    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 12, 1), 50);
    const page  = Math.max(parseInt(rawPage, 10)  || 1,  1);
    const skip  = (page - 1) * limit;

    // Always restrict to published stories on public endpoint
    const filter = { isPublished: true };
    if (category) filter.category = category;

    const [stories, total] = await Promise.all([
        Story.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Story.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            stories,
            total,
            page,
            limit,
            hasMore: skip + stories.length < total,
        }, "Stories fetched successfully")
    );
});

/* --------------------------------------------------------------------------
   GET STORY BY URL-SAFE SLUG FIELD (public)
   GET /api/v1/stories/slug/:slug
   -------------------------------------------------------------------------- */
const getStoryBySlugField = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const story = await Story.findOne({
        slug: slug.toLowerCase().trim(),
        isPublished: true,
    }).populate("destination", "name slug coverImage tagline");

    if (!story) {
        throw new APIError(404, `Story with slug "${slug}" not found`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, story, "Story fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET STORIES BY DESTINATION SLUG (public — only published)
   -------------------------------------------------------------------------- */
const getStoriesByDestination = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const stories = await Story.find({
        destinationSlug: slug.toLowerCase(),
        isPublished: true,
    }).sort({ order: 1, createdAt: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, stories, "Stories fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET STORY BY ID (public)
   -------------------------------------------------------------------------- */
const getStoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid story ID");
    }

    const story = await Story.findById(id).populate("destination", "name slug coverImage");
    if (!story) throw new APIError(404, "Story not found");
    if (!story.isPublished) throw new APIError(404, "This story is not currently available");

    return res
        .status(200)
        .json(new ApiResponse(200, story, "Story fetched successfully"));
});

/* --------------------------------------------------------------------------
   GET STORY BY STORY ID STRING + DESTINATION SLUG (public)
   Used by frontend: GET /stories/destination/:slug/id/:storyId
   -------------------------------------------------------------------------- */
const getStoryByStoryId = asyncHandler(async (req, res) => {
    const { slug, storyId } = req.params;

    const story = await Story.findOne({
        destinationSlug: slug.toLowerCase(),
        storyId: storyId.trim(),
        isPublished: true,
    }).populate("destination", "name slug coverImage");

    if (!story) {
        throw new APIError(404, `Story "${storyId}" not found for destination "${slug}"`);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, story, "Story fetched successfully"));
});

/* --------------------------------------------------------------------------
   CREATE STORY (admin)
   -------------------------------------------------------------------------- */
const createStory = asyncHandler(async (req, res) => {
    const {
        destinationSlug,
        storyId,
        title,
        subtitle,
        tag,
        readTime,
        quote,
        content,
        isVerified,
        order,
        isPublished,
    } = req.body;

    if (!destinationSlug || !storyId || !title || !content) {
        throw new APIError(400, "destinationSlug, storyId, title, and content are required");
    }

    const destination = await Destination.findOne({
        slug: destinationSlug.toLowerCase().trim(),
    });
    if (!destination) {
        throw new APIError(404, `Destination "${destinationSlug}" not found`);
    }

    // Check uniqueness: one storyId per destination
    const existingStory = await Story.findOne({
        destination: destination._id,
        storyId: storyId.trim(),
    });
    if (existingStory) {
        throw new APIError(409, `A story with id "${storyId}" already exists for this destination`);
    }

    // Content can come as array or newline-separated string
    let parsedContent = content;
    if (typeof content === "string") {
        try {
            parsedContent = JSON.parse(content);
        } catch {
            parsedContent = content.split("\n").map((p) => p.trim()).filter(Boolean);
        }
    }

    const story = await Story.create({
        destination: destination._id,
        destinationSlug: destinationSlug.toLowerCase().trim(),
        storyId: storyId.trim(),
        title: title.trim(),
        subtitle: subtitle?.trim() || "",
        tag: tag?.trim() || "",
        readTime: readTime?.trim() || "",
        quote: quote?.trim() || "",
        content: parsedContent,
        isVerified: isVerified === "true" || isVerified === true,
        order: Number(order) || 0,
        isPublished: isPublished === "false" || isPublished === false ? false : true,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, story, "Story created successfully"));
});

/* --------------------------------------------------------------------------
   UPDATE STORY (admin)
   -------------------------------------------------------------------------- */
const updateStory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid story ID");
    }

    const story = await Story.findById(id);
    if (!story) throw new APIError(404, "Story not found");

    const allowedFields = [
        "title", "subtitle", "tag", "readTime", "quote",
        "content", "isVerified", "order", "isPublished",
    ];

    const updates = {};
    allowedFields.forEach((f) => {
        if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Normalize content to array if updated
    if (updates.content && typeof updates.content === "string") {
        try {
            updates.content = JSON.parse(updates.content);
        } catch {
            updates.content = updates.content.split("\n").map((p) => p.trim()).filter(Boolean);
        }
    }

    const updated = await Story.findByIdAndUpdate(id, { $set: updates }, { returnDocument: "after" });
    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Story updated successfully"));
});

/* --------------------------------------------------------------------------
   DELETE STORY (admin)
   -------------------------------------------------------------------------- */
const deleteStory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid story ID");
    }

    const story = await Story.findById(id);
    if (!story) throw new APIError(404, "Story not found");

    await Story.findByIdAndDelete(id);
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Story deleted successfully"));
});

/* --------------------------------------------------------------------------
   TOGGLE PUBLISH (admin — toggle isPublished without full update)
   -------------------------------------------------------------------------- */
const togglePublishStory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new APIError(400, "Invalid story ID");
    }

    const story = await Story.findById(id);
    if (!story) throw new APIError(404, "Story not found");

    const updated = await Story.findByIdAndUpdate(
        id,
        { $set: { isPublished: !story.isPublished } },
        { returnDocument: "after" }
    );

    const action = updated.isPublished ? "published" : "unpublished";
    return res
        .status(200)
        .json(new ApiResponse(200, updated, `Story ${action} successfully`));
});

/* --------------------------------------------------------------------------
   REORDER STORIES (admin — bulk update display order)
   Body: { orders: [{ id, order }] }
   -------------------------------------------------------------------------- */
const reorderStories = asyncHandler(async (req, res) => {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
        throw new APIError(400, "orders must be a non-empty array of { id, order } objects");
    }

    const bulkOps = orders.map(({ id, order }) => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: { order: Number(order) } },
        },
    }));

    await Story.bulkWrite(bulkOps);
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Stories reordered successfully"));
});

export {
    getAllStories,
    getStoryBySlugField,
    getStoriesByDestination,
    getStoryById,
    getStoryByStoryId,
    createStory,
    updateStory,
    deleteStory,
    togglePublishStory,
    reorderStories,
};
