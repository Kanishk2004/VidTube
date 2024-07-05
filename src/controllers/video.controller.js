import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = AsyncHandler(async (req, res) => {
	const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
	//TODO: get all videos based on query, sort, pagination
});

const publishAVideo = AsyncHandler(async (req, res) => {
	const { title, description } = req.body;
	// TODO: get video, upload to cloudinary, create video
});

const getVideoById = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: get video by id
});

const updateVideo = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: update video details like title, description, thumbnail
});

const deleteVideo = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: delete video
});

const togglePublishStatus = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
