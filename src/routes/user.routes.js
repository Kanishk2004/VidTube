import { Router } from "express";
import {
	changeCurrentPassword,
	getCurrentUser,
	getUserChannelProfile,
	getWatchHistory,
	loginUser,
	logoutUser,
	refreshAccessToken,
	registerUser,
	updateAccountDetails,
	updateUserAvatar,
	updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
	upload.fields([
		{
			name: "avatar",
			maxCount: 1,
		},
		{
			name: "coverImage",
			maxCount: 1,
		},
	]),
	registerUser
); //tested
router.route("/login").post(loginUser); //tested

//secure routes
router.route("/logout").post(verifyJWT, logoutUser); //tested
router.route("/refresh-token").post(refreshAccessToken); //tested
router.route("/change-password").post(verifyJWT, changeCurrentPassword); //tested
router.route("/current-user").get(verifyJWT, getCurrentUser); //tested
router.route("/update-account").patch(verifyJWT, updateAccountDetails); //tested
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar); //tested
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); //tested
router.route("/c/:username").get(verifyJWT, getUserChannelProfile); //tested
router.route("/history").get(verifyJWT, getWatchHistory); //tested

export default router;
