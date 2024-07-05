import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const createTweet = AsyncHandler(async (req, res) => {
	//TODO: create tweet

	//Get tweet content from req.body
	//check if the content isn't empty
	//get owner from req.user coming from verifyJWT middleware
	//save in db

	const { content } = req.body;

	if (content?.trim() === "") {
		throw new ApiError(400, "Content is required");
	}

	const user = await User.aggregate([
		{
			$match: { _id: new mongoose.Types.ObjectId(req.user._id) },
		},
	]);

	console.log(user);

	const tweet = await Tweet.create({
		content,
		owner: user[0]?._id,
	});

	if (!tweet) {
		throw new ApiError(500, "Failed to post a tweet");
	}

	return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = AsyncHandler(async (req, res) => {
	// TODO: get user tweets
});

const updateTweet = AsyncHandler(async (req, res) => {
	//TODO: update tweet
});

const deleteTweet = AsyncHandler(async (req, res) => {
	//TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
