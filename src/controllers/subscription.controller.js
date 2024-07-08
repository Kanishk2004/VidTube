import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = AsyncHandler(async (req, res) => {
	const { channelId } = req.params;
	// TODO: toggle subscription

	const isAlreadySubscribed = await Subscription.aggregate([
		{
			$match: {
				subscriber: new mongoose.Types.ObjectId(req.user._id),
				channel: new mongoose.Types.ObjectId(channelId),
			},
		},
	]);

	if (Array.isArray(isAlreadySubscribed) && isAlreadySubscribed.length === 0) {
		const subscribed = await Subscription.create({
			subscriber: new mongoose.Types.ObjectId(req.user._id),
			channel: new mongoose.Types.ObjectId(channelId),
		});
		return res.status(200).json(new ApiResponse(200, subscribed[0], "Successfully subscribed the channel"));
	} else {
		await Subscription.findByIdAndDelete(isAlreadySubscribed[0]._id);
		return res.status(200).json(new ApiResponse(200, "Channel unsubscribed", "Success"));
	}
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = AsyncHandler(async (req, res) => {
	const { channelId } = req.params;

	const subscriberList = await Subscription.aggregate([
		{
			$match: { channel: new mongoose.Types.ObjectId(channelId) },
		},
		{
			$lookup: {
				from: "users",
				localField: "subscriber",
				foreignField: "_id",
				as: "subscriber",
				pipeline: [
					{
						$project: {
							fullName: 1,
							username: 1,
							avatar: 1,
						},
					},
				],
			},
		},
	]);

	const subscribers = subscriberList.map((subscription) => subscription.subscriber[0]);
	const subscriberCount = subscribers.length;

	return res
		.status(200)
		.json(new ApiResponse(200, { subscriberCount, subscribers }, "Successfully fetched subscriber list"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = AsyncHandler(async (req, res) => {
	const { subscriberId } = req.params;

	const channelList = await Subscription.aggregate([
		{ $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) } },
		{
			$lookup: {
				from: "users",
				localField: "channel",
				foreignField: "_id",
				as: "channel",
				pipeline: [
					{
						$project: {
							fullName: 1,
							username: 1,
							avatar: 1,
						},
					},
				],
			},
		},
	]);

	const channels = channelList.map((subscription) => subscription.channel[0]);
	const channelCount = channelList.length;

	return res
		.status(200)
		.json(new ApiResponse(200, { channelCount, channels }, "Successfully fetched channels subscribed"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
