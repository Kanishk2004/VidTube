import { Router } from "express";
import {
	createTweet,
	deleteTweet,
	getCurrentUserTweets,
	getUserTweets,
	updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet); //tested
router.route("/user/:userId").get(getUserTweets); //tested
router.route("/mytweets").get(getCurrentUserTweets); //tested
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet); //tested

export default router;
