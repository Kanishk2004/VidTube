import { AsyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { deleteAssetOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });
		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(500, "Something went wrong while generating access and refresh token");
	}
};

const registerUser = AsyncHandler(async (req, res) => {
	// get user details from frontend
	// validation - not empty
	// check if user already exists: username, email
	// check for images, check for avatar
	// upload them to cloudinary, avatar
	// create user object - create entry in db
	// remove password and refresh token field from response
	// check for user creating
	// return res

	const { fullName, email, username, password } = req.body;

	if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
		//to check if all fields are given or not
		throw new ApiError(400, "All fields are required");
	}

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(409, "User with email or username already exists");
	}

	const avatarLocalPath = req.files?.avatar[0]?.path;
	// const coverImageLocalPath = req.files?.coverImage[0]?.path;

	let coverImageLocalPath;

	if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
		coverImageLocalPath = req.files.coverImage[0].path;
	}

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is required");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!avatar) {
		throw new ApiError(400, "Avatar file is required - cloudinary upload failed!");
	}

	const user = await User.create({
		fullName,
		avatar: avatar.url,
		avatar_public_id: avatar.public_id,
		coverImage: coverImage?.url || "",
		coverImage_public_id: coverImage?.public_id || "",
		email,
		password,
		username: username.toLowerCase(),
	});

	const createdUser = await User.findById(user._id).select("-password -refreshToken");

	if (!createdUser) {
		throw new ApiError(500, "Failed to register the user");
	}

	return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = AsyncHandler(async (req, res) => {
	// req.body -> data
	// username or email
	// find the user
	// password check
	// access and refresh token
	// send cookie

	const { email, username, password } = req.body;

	if (!(username || email)) {
		// same as - if(!username && !email)
		throw new ApiError(400, "username or email is required");
	}

	const user = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (!user) {
		throw new ApiError(404, "user doesn't exists!");
	}

	// using "user" instead of "User" because User methods like (User.findOne) is available through mongoose but the methods we created in user model file is accessed by using "user"
	const isPasswordValid = await user.isPasswordCorrect(password);
	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid user credentials");
	}
	const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

	const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

	const options = {
		httpOnly: true, //by default anybody can modify your cookie from frontend by giving these options cookies can only be modified on the server
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				"User logged in successfully"
			)
		);
});

const logoutUser = AsyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1, // this removes the field from document
			},
		},
		{
			new: true,
		}
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new ApiResponse(200, "User logged Out"));
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
	const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

	if (!incomingRefreshToken) {
		throw new ApiError(401, "Unauthorized request");
	}

	try {
		const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

		const user = await User.findById(decodedToken?._id);

		if (!user) {
			throw new ApiError(401, "Invalid refresh token");
		}

		if (incomingRefreshToken !== user?.refreshToken) {
			throw new ApiError(401, "Refresh token is expired or used");
		}

		const options = {
			httpOnly: true,
			secure: true,
		};

		const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
		return res
			.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("refreshToken", newRefreshToken, options)
			.json(
				new ApiResponse(
					200,
					{
						accessToken,
						refreshToken: newRefreshToken,
					},
					"Access token refreshed"
				)
			);
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid refresh token");
	}
});

const changeCurrentPassword = AsyncHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;
	const user = await User.findById(req.user?._id);

	const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

	if (!isPasswordCorrect) {
		throw new ApiError(400, "Inavalid old password");
	}

	user.password = newPassword;
	await user.save({ validateBeforeSave: false });

	return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = AsyncHandler(async (req, res) => {
	return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = AsyncHandler(async (req, res) => {
	const { username, fullName, email } = req.body;

	if (!(username || fullName || email)) {
		throw new ApiError(400, "All fields are required");
	}

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(409, "Email and username must be unique");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: { username, fullName, email },
		},
		{ new: true }
	).select("-password");

	return res.status(200).json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = AsyncHandler(async (req, res) => {
	const avatarLocalPath = req.file?.path;

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is missing");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);

	if (!avatar.url) {
		throw new ApiError(501, "Error while uploading on cloudinary");
	}

	//Delete old image from cloudinary
	const oldUser = await User.findById(req.user?._id);
	await deleteAssetOnCloudinary(oldUser.avatar_public_id);

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				avatar: avatar.url,
				avatar_public_id: avatar.public_id,
			},
		},
		{ new: true }
	).select("-password");

	return res.status(200).json(new ApiResponse(200, user, "Avatar Image updated successfully"));
});

const updateUserCoverImage = AsyncHandler(async (req, res) => {
	const coverImageLocalPath = req.file?.path;

	if (!coverImageLocalPath) {
		throw new ApiError(400, "Avatar file is missing");
	}

	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!coverImage.url) {
		throw new ApiError(501, "Error while uploading on cloudinary");
	}

	//Delete old image from cloudinary
	const oldUser = await User.findById(req.user?._id);
	if (!(oldUser?.coverImage_public_id === "")) {
		await deleteAssetOnCloudinary(oldUser.coverImage_public_id);
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				coverImage: coverImage.url,
				coverImage_public_id: coverImage.public_id,
			},
		},
		{ new: true }
	).select("-password");

	return res.status(200).json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

const getUserChannelProfile = AsyncHandler(async (req, res) => {
	const { username } = req.params;

	if (!username?.trim()) {
		throw new ApiError(400, "Username is missing");
	}

	const channel = await User.aggregate([
		{
			$match: {
				username: username?.toLowerCase(),
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "channel",
				as: "subscribers",
			},
		},
		{
			$lookup: {
				from: "subscriptions",
				localField: "_id",
				foreignField: "subscriber",
				as: "subscribedTo",
			},
		},
		{
			$addFields: {
				subscribersCount: {
					$size: "$subscribers",
				},
				channelsSubscribedToCount: {
					$size: "$subscribedTo",
				},
				isSubscribed: {
					$cond: {
						if: { $in: [req.user?._id, "$subscribers.subscriber"] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$project: {
				fullName: 1,
				username: 1,
				subscribersCount: 1,
				channelsSubscribedToCount: 1,
				avatar: 1,
				coverImage: 1,
				email: 1,
				isSubscribed: 1,
			},
		},
	]);

	if (!channel?.length) {
		throw new ApiError(404, "Channel does not exist");
	}

	return res.status(200).json(new ApiResponse(200, channel[0], "User channel fetched successfully"));
});

const getWatchHistory = AsyncHandler(async (req, res) => {
	// const objectId = new mongoose.Types.ObjectId(req.user._id)

	const user = await User.aggregate([
		{
			$match: {
				_id: new mongoose.Types.ObjectId(req.user._id),
			},
		},
		{
			$lookup: {
				from: "videos",
				localField: "watchHistory",
				foreignField: "_id",
				as: "watchHistory",
				pipeline: [
					{
						$lookup: {
							from: "users",
							localField: "owner",
							foreignField: "_id",
							as: "owner",
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
					{
						$addFields: {
							owner: {
								$first: "$owner",
							},
						},
					},
				],
			},
		},
	]);

	return res.status(200).json(new ApiError(200, user[0].watchHistory, "Watch history fetched successfully"));
});

export {
	registerUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	changeCurrentPassword,
	getCurrentUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage,
	getUserChannelProfile,
	getWatchHistory,
};
