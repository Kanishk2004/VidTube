import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";
import { deleteAssetOnCloudinary, deleteVideoOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = AsyncHandler(async (req, res) => {
	const { page = 1, limit = 5, query, sortBy, sortType, userId } = req.query;
	//TODO: get all videos based on query, sort, pagination

	// const options = {
	// 	page: parseInt(page, 10),
	// 	limit: parseInt(limit, 10),
	// };

	const pipeline = [];
	
	if (query) {
		pipeline.push({
			$match: { $text: { $search: query, $caseSensitive: false } },
		});
	}
	if (userId) {
		pipeline.push({
			$match: { owner: new mongoose.Types.ObjectId(userId) },
		});
	}
	if (sortBy) {
		const sortOrder = sortType === "desc" ? -1 : 1;
		pipeline.push({
			$sort: { [sortBy]: sortOrder },
		});
	}

	let myAggregate;
	if (JSON.stringify(req.query) === "{}") {
		myAggregate = await Video.find();
	}

	if (!(JSON.stringify(req.query) === "{}")) {
		myAggregate = await Video.aggregate(pipeline);
	}
	// const result = await Video.aggregatePaginate(myAggregate, { page, limit });

	return res.status(200).json(new ApiResponse(200, myAggregate, "Successfully fetched required data"));
});

const publishAVideo = AsyncHandler(async (req, res) => {
	// TODO: get video, upload to cloudinary, create video

	//get video title, description from req.body
	//validate the fields aren't empty
	//check for video and thumbnail files - both are required
	//upload to cloudinary
	//get the owner ObjectId
	//create video object - create entry in db
	//check if video created in db
	//return the video document and res

	const { title, description } = req.body;
	// console.log(title, description)

	if (title?.trim() === "" || description?.trim() === "") {
		throw new ApiError(400, "Title or description should not be empty");
	}

	const videoLocalPath = req.files?.videoFile[0]?.path;
	const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

	if (!(videoLocalPath || thumbnailLocalPath)) {
		throw new ApiError(400, "Video and thumbnail are required");
	}

	const videoUpload = await uploadOnCloudinary(videoLocalPath);
	const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

	if (!(videoUpload || thumbnailUpload)) {
		throw new ApiError(400, "Video and thumbail failed to upload on Cloudinary");
	}

	const video = await Video.create({
		videoFile: videoUpload.url,
		videoFilePublicId: videoUpload.public_id,
		thumbnail: thumbnailUpload.url,
		thumbnailPublicId: thumbnailUpload.public_id,
		title,
		description,
		duration: videoUpload.duration, // in seconds and miliseconds
		owner: new mongoose.Types.ObjectId(req.user._id),
	});

	return res.status(200).json(new ApiResponse(200, video, "Video published successfully"));
});

const getVideoById = AsyncHandler(async (req, res) => {
	//TODO: get video by id
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "Invalid video id");
	}

	const video = await Video.findById(videoId);

	return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully!"));
});

const updateVideo = AsyncHandler(async (req, res) => {
	//update video details like title, description, thumbnail
	const { videoId } = req.params;

	if (!videoId.trim() === "") {
		throw new ApiError(400, "Invalid video id");
	}

	const { title, description } = req.body;

	if (title?.trim() === "" || description?.trim === "") {
		throw new ApiError(400, "Title and description are required");
	}

	const video = await Video.findById(videoId);
	// console.log(video.owner.toString() === req.user._id.toString()) - true

	if (!(video.owner.toString() === req.user._id.toString())) {
		throw new ApiError(400, "Only owner can update the video");
	}

	let thumbnailLocalPath;
	let newThumbnail;
	if (req.file) {
		thumbnailLocalPath = req.file?.path;
		newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
		await deleteAssetOnCloudinary(video.thumbnailPublicId);
	}

	const oldThumbnail = video?.thumbnail;
	const oldThumbnailPublicId = video?.thumbnailPublicId;

	const updatedVideo = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				title,
				description,
				thumbnail: newThumbnail?.url || oldThumbnail,
				thumbnailPublicId: newThumbnail?.public_id || oldThumbnailPublicId,
			},
		},
		{ new: true }
	);

	return res.status(200).json(new ApiResponse(200, updatedVideo, "Video details updated successfully"));
});

const deleteVideo = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;
	//TODO: delete video
	if (!videoId) {
		throw new ApiError(400, "Invalid video id");
	}

	const video = await Video.findById(videoId);

	if (!(video.owner.toString() === req.user._id.toString())) {
		throw new ApiError(400, "Only owner can delete the video");
	}

	await deleteAssetOnCloudinary(video.thumbnailPublicId);
	await deleteVideoOnCloudinary(video.videoFilePublicId);

	await Video.findByIdAndDelete(videoId);

	return res.status(200).json(new ApiResponse(200, "Video deleted successfully", "Success"));
});

const togglePublishStatus = AsyncHandler(async (req, res) => {
	const { videoId } = req.params;

	if (!videoId) {
		throw new ApiError(400, "Invalid video id");
	}

	const video = await Video.findById(videoId);

	if (!(video.owner.toString() === req.user._id.toString())) {
		throw new ApiError(400, "Only owner can update the video");
	}

	const isPublished = video.isPublished;

	const result = await Video.findByIdAndUpdate(
		videoId,
		{
			$set: {
				isPublished: !isPublished,
			},
		},
		{ new: true }
	);

	res.status(200).json(new ApiResponse(200, result, "Successfully updated the published field"));
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus };
