import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: toggle like on video
});

const toggleCommentLike = AsyncHandler(async (req, res) => {
	const { commentId } = req.params;
	//TODO: toggle like on comment
});

const toggleTweetLike = AsyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	//TODO: toggle like on tweet
});

const getLikedVideos = AsyncHandler(async (req, res) => {
	//TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
