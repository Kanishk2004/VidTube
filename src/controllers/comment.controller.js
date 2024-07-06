import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = AsyncHandler(async (req, res) => {
	//TODO: get all comments for a video
	const { videoId } = req.params;
	// const { page = 1, limit = 10 } = req.query;

	const videoComments = await Comment.aggregate([
		{
			$match: { video: new mongoose.Types.ObjectId(videoId) },
		},
	]);

	return res.status(200).json(new ApiResponse(200, videoComments, "Successfully fetched video comments"));
});

const addComment = AsyncHandler(async (req, res) => {
	// TODO: add a comment to a video
	const { videoId } = req.params;
	const { content } = req.body;

	if (!videoId) {
		throw new ApiError(400, "Please provide valid video id");
	}

	if (!content.trim() === "") {
		throw new ApiError(400, "Please provide valid content");
	}

	const comment = await Comment.create({
		content,
		video: new mongoose.Types.ObjectId(videoId),
		owner: new mongoose.Types.ObjectId(req.user._id),
	});

	return res.status(200).json(new ApiResponse(200, comment, "Successfully posted a comment"));
});

const updateComment = AsyncHandler(async (req, res) => {
	// TODO: update a comment
	const { commentId } = req.params;
	const { content } = req.body;

	if (!commentId) {
		throw new ApiError(400, "Please provide valid comment id");
	}

	const comment = await Comment.findById(commentId);

	if (!(comment.owner.toString() === req.user._id.toString())) {
		throw new ApiError(400, "Only owner can update the comment");
	}

	if (!content.trim() === "") {
		throw new ApiError(400, "Please provide valid content");
	}

	const newComment = await Comment.findByIdAndUpdate(
		commentId,
		{
			$set: { content: content },
		},
		{ new: true }
	);

	return res.status(200).json(new ApiResponse(200, newComment, "Successfully updated the comment."));
});

const deleteComment = AsyncHandler(async (req, res) => {
	// TODO: delete a comment
	const { commentId } = req.params;

	if (!commentId) {
		throw new ApiError(400, "Please provide valid comment id");
	}

	const comment = await Comment.findById(commentId);

	if (!(comment.owner.toString() === req.user._id.toString())) {
		throw new ApiError(400, "Only owner can update the comment");
	}

	await Comment.findByIdAndDelete(commentId);

	return res.status(200).json(new ApiResponse(200, "Successfully deleted the comment", "success"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
