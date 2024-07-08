import { Router } from "express";
import {
	addVideoToPlaylist,
	createPlaylist,
	deletePlaylist,
	getPlaylistById,
	getUserPlaylists,
	removeVideoFromPlaylist,
	updatePlaylist,
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist); //tested

router.route("/:playlistId").get(getPlaylistById).patch(updatePlaylist).delete(deletePlaylist); //tested

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist); //tested
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist); //tested

router.route("/user/:userId").get(getUserPlaylists); //tested

export default router;
