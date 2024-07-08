import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = AsyncHandler(async (req, res) => {
	const { name, description } = req.body;
	//TODO: create playlist

	if (!name) {
		throw new ApiError(400, "Please provide the name for the playlist");
	}

	const playlist = await Playlist.create({
		name,
		description: description || "",
		owner: new mongoose.Types.ObjectId(req.user._id),
	});

	return res.status(200).json(new ApiResponse(200, playlist, "New playlist created successfully"));
});

const getUserPlaylists = AsyncHandler(async (req, res) => {
	const { userId } = req.params;
	//TODO: get user playlists
	const userPlaylist = await Playlist.aggregate([{ $match: { owner: new mongoose.Types.ObjectId(userId) } }]);

	if (userPlaylist.length === 0) {
		throw new ApiError(400, "No playlist found for this user");
	}

	return res.status(200).json(new ApiResponse(200, userPlaylist, "Successfully fetched user playlist"));
});

const getPlaylistById = AsyncHandler(async (req, res) => {
	const { playlistId } = req.params;
	//TODO: get playlist by id
	const playlist = await Playlist.findById(playlistId);
	if (!playlist) {
		throw new ApiError(400, "No playlist found with provided id");
	}

	return res.status(200).json(new ApiResponse(200, playlist, "Successfully fetched the playlist"));
});

const addVideoToPlaylist = AsyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params;

	const isVideoAlreadyInPlaylist = await Playlist.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(playlistId),
				videos: { $elemMatch: { $eq: new mongoose.Types.ObjectId(videoId) } },
			},
		},
	]);

	// if (
	// 	Array.isArray(isVideoAlreadyInPlaylist) &&
	// 	!(isVideoAlreadyInPlaylist.length === 0) &&
	// 	!(isVideoAlreadyInPlaylist[0]?.owner === new mongoose.Types.ObjectId(req.user._id))
	// ) {
	// 	throw new ApiError(400, "Only owner is allowed to edit the playlist");
	// }

	if (Array.isArray(isVideoAlreadyInPlaylist) && !(isVideoAlreadyInPlaylist.length === 0)) {
		throw new ApiError(400, "This video is already present in this playlist");
	}

	const playlist = await Playlist.findByIdAndUpdate(
		playlistId,
		{ $push: { videos: [new mongoose.Types.ObjectId(videoId)] } },
		{ new: true }
	);
	return res.status(200).json(new ApiResponse(200, playlist, "Video added to the playlist successfully"));
});

const removeVideoFromPlaylist = AsyncHandler(async (req, res) => {
	const { playlistId, videoId } = req.params;
	// TODO: remove video from playlist

	const isVideoInPlaylist = await Playlist.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(playlistId),
				videos: { $elemMatch: { $eq: new mongoose.Types.ObjectId(videoId) } },
			},
		},
	]);

	if (Array.isArray(isVideoInPlaylist) && isVideoInPlaylist.length === 0) {
		throw new ApiError(400, "The video you want to remove is not in the playlist");
	}

	const playlist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			$pull: { videos: new mongoose.Types.ObjectId(videoId) },
		},
		{ new: true }
	);

	return res.status(200).json(new ApiResponse(200, playlist, "Successfully removed the video from the playlist"));
});

const deletePlaylist = AsyncHandler(async (req, res) => {
	const { playlistId } = req.params;
	// TODO: delete playlist
	await Playlist.findByIdAndDelete(playlistId);

	return res.status(200).json(new ApiResponse(200, "Successfully deleted the playlist"));
});

const updatePlaylist = AsyncHandler(async (req, res) => {
	const { playlistId } = req.params;
	const { name, description } = req.body;
	//TODO: update playlist

	const playlist = await Playlist.findByIdAndUpdate(
		playlistId,
		{
			name,
			description,
		},
		{
			new: true,
		}
	);

	return res.status(200).json(new ApiResponse(200, playlist, "Successfully updated the playlist"));
});

export {
	createPlaylist,
	getUserPlaylists,
	getPlaylistById,
	addVideoToPlaylist,
	removeVideoFromPlaylist,
	deletePlaylist,
	updatePlaylist,
};
