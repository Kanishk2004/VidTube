import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = AsyncHandler(async (req, res) => {
	// TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

	const subscribers = await Subscription.aggregate([
		{
			$match: { channel: new mongoose.Types.ObjectId(req.user._id) },
		},
		{
			$count: "subscribers",
		},
	]);

	const videoLikes = await Like.aggregate([
		{
			$lookup: {
				from: "videos",
				localField: "video",
				foreignField: "_id",
				as: "videoDetails",
			},
		},
		{
			$project: {
				videoDetails: { $arrayElemAt: ["$videoDetails", 0] },
			},
		},
		{
			$match: {
				"videoDetails.owner": new mongoose.Types.ObjectId(req.user._id),
			},
		},
		{
			$count: "likes",
		},
	]);

	const video = await Video.aggregate([
		{
			$match: { owner: new mongoose.Types.ObjectId(req.user._id) },
		},
		{
			$group: {
				_id: null,
				totalViews: { $sum: "$views" },
				totalVideos: { $sum: 1 },
			},
		},
	]);

	const videoLikesCount = videoLikes[0]?.likes;
	const subscriberCount = subscribers[0]?.subscribers;
	const totalChannelViews = video[0]?.totalViews;
	const totalChannelVideos = video[0]?.totalVideos;

	const stats = {
		videoLikesCount,
		subscriberCount,
		totalChannelVideos,
		totalChannelViews,
	};

	return res.status(200).json(new ApiResponse(200, stats, "Successfully fetched channel stats"));
});

const getChannelVideos = AsyncHandler(async (req, res) => {
	// TODO: Get all the videos uploaded by the channel

	const channelVideos = await Video.aggregate([
		{
			$match: { owner: new mongoose.Types.ObjectId(req.user._id) },
		},
	]);

	return res.status(200).json(new ApiResponse(200, channelVideos, "Successfully fetched all the channel videos"));
});

export { getChannelStats, getChannelVideos };
