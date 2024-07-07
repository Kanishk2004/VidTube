import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: toggle like on video

	//one user is not allowed to like one video twice - the same combination of ownerId and VideoId cannot repeat
	//one video can be liked my many users - same videoId but different ownerId can exist

	// this will check if the given videoId is liked by current logged in user
	const isVideoLikedByUser = await Like.aggregate([
		{
			$match: {
				video: new mongoose.Types.ObjectId(videoId),
				likedBy: new mongoose.Types.ObjectId(req.user._id),
			},
		},
	]);

	if (Array.isArray(isVideoLikedByUser) && isVideoLikedByUser.length === 0) {
		const like = await Like.create({
			video: new mongoose.Types.ObjectId(videoId),
			likedBy: new mongoose.Types.ObjectId(req.user._id),
		});
		return res.status(200).json(new ApiResponse(200, like, "Successfully liked the video"));
	} else {
		await Like.findByIdAndDelete(isVideoLikedByUser[0]?._id);
		return res.status(200).json(new ApiResponse(200, "Successfully disliked the video", "success"));
	}
});

const toggleCommentLike = AsyncHandler(async (req, res) => {
	const { commentId } = req.params;
	//TODO: toggle like on comment
	const isCommentLikedByUser = await Like.aggregate([
		{
			$match: {
				comment: new mongoose.Types.ObjectId(commentId),
				likedBy: new mongoose.Types.ObjectId(req.user._id),
			},
		},
	]);

	if (Array.isArray(isCommentLikedByUser) && isCommentLikedByUser.length === 0) {
		const like = await Like.create({
			comment: new mongoose.Types.ObjectId(commentId),
			likedBy: new mongoose.Types.ObjectId(req.user._id),
		});
		return res.status(200).json(new ApiResponse(200, like, "Successfully liked the comment"));
	} else {
		await Like.findByIdAndDelete(isCommentLikedByUser[0]?._id);
		return res.status(200).json(new ApiResponse(200, "Successfully disliked the comment", "success"));
	}
});

const toggleTweetLike = AsyncHandler(async (req, res) => {
	const { tweetId } = req.params;
	//TODO: toggle like on tweet
	const isTweetLikedByUser = await Like.aggregate([
		{
			$match: {
				tweet: new mongoose.Types.ObjectId(tweetId),
				likedBy: new mongoose.Types.ObjectId(req.user._id),
			},
		},
	]);

	if (Array.isArray(isTweetLikedByUser) && isTweetLikedByUser.length === 0) {
		const like = await Like.create({
			tweet: new mongoose.Types.ObjectId(tweetId),
			likedBy: new mongoose.Types.ObjectId(req.user._id),
		});
		return res.status(200).json(new ApiResponse(200, like, "Successfully liked the tweet"));
	} else {
		await Like.findByIdAndDelete(isTweetLikedByUser[0]?._id);
		return res.status(200).json(new ApiResponse(200, "Successfully disliked the tweet", "success"));
	}
});

const getLikedVideos = AsyncHandler(async (req, res) => {
	//TODO: get all liked videos
	const likedVideos = await Like.aggregate([
		{
			$match: {
				likedBy: new mongoose.Types.ObjectId(req.user?._id),
				video: { $exists: true },
			},
		},
	]);

	return res.status(200).json(new ApiResponse(200, likedVideos, "Successfully fetched the liked videos"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
