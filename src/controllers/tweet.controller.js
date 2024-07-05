import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const createTweet = AsyncHandler(async (req, res) => {
	//Get tweet content from req.body
	//validation content shouldn't be empty
	//get owner objectId from req.user coming from verifyJWT middleware
	//create tweet in db
	//return tweet as response

	const { content } = req.body;

	if (!content || content?.trim() === "") {
		throw new ApiError(400, "Content is required");
	}

	const user = await User.aggregate([
		{
			$match: { _id: new mongoose.Types.ObjectId(req.user._id) },
		},
	]);

	const tweet = await Tweet.create({
		content,
		owner: user[0]?._id,
	});

	if (!tweet) {
		throw new ApiError(500, "Failed to post a tweet");
	}

	return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getCurrentUserTweets = AsyncHandler(async (req, res) => {
	const tweets = await Tweet.aggregate([
		{
			$match: {
				owner: new mongoose.Types.ObjectId(req.user._id),
			},
		},
	]);

	return res.status(200).json(new ApiResponse(200, tweets, "Current user tweets fetched successfully"));
});

const getUserTweets = AsyncHandler(async (req, res) => {
	const { userId } = req.params;

	const tweets = await Tweet.aggregate([
		{
			$match: {
				owner: new mongoose.Types.ObjectId(userId),
			},
		},
	]);

	return res.status(200).json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = AsyncHandler(async (req, res) => {
	//TODO: update tweet

	//get the tweetId from req.params
	//get the new content from req.body
	//validate the content isn't empty
	//validate that the user is updating its own tweet or other's
	//update the tweet in db
	//return the new tweet as response

	const { tweetId } = req.params;
	const { content } = req.body;

	if (!content || content?.trim() === "") {
		throw new ApiError(400, "Content must not be empty");
	}

	//finding if the given tweet id belongs to the logged in person
	const tweets = await Tweet.aggregate([
		{
			$match: {
				owner: new mongoose.Types.ObjectId(req.user._id),
			},
		},
		{
			$match: {
				_id: new mongoose.Types.ObjectId(tweetId),
			},
		},
	]);

	if (Array.isArray(tweets) && tweets.length === 0) {
		throw new ApiError(400, "Only the tweet owner is allowed to edit the tweet");
	}

	const updatedTweet = await Tweet.findByIdAndUpdate(
		tweetId,
		{
			$set: { content },
		},
		{
			new: true,
		}
	);

	return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = AsyncHandler(async (req, res) => {
	const { tweetId } = req.params;

	//finding if the given tweet id belongs to the logged in user or not
	const tweets = await Tweet.aggregate([
		{
			$match: {
				owner: new mongoose.Types.ObjectId(req.user._id),
			},
		},
		{
			$match: {
				_id: new mongoose.Types.ObjectId(tweetId),
			},
		},
	]);

	if (Array.isArray(tweets) && tweets.length === 0) {
		throw new ApiError(400, "Only the tweet owner is allowed to delete the tweet");
	}

	await Tweet.findByIdAndDelete(tweetId);

	return res.status(200).json(new ApiResponse(200, "Tweet deleted successfully", "Success"));
});

export { createTweet, getCurrentUserTweets, getUserTweets, updateTweet, deleteTweet };
