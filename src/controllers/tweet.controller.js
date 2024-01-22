import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // Get userId
  // Get tweet content
  // Create tweet
  // Add tweet to user tweets
  // Return tweet
  const { content } = req.body;
  const owner = req?.user._id;
  if (content.lenght < 10)
    throw new ApiError(400, "Tweet Must have some content");
  const tweet = await Tweet.create({
    content,
    owner,
  });
  return res.status(200).json(new ApiResponse(200, "Tweet Created Successsfully", tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // get userId from params
  // check user found
  // get tweets of user
  // return tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId)) throw new ApiError(400, "User Id is Required");
  const user = await User.findById(new mongoose.Types.ObjectId(userId)).select(
    "fullName"
  );
  if (!user) throw new ApiError(404, "User Not Found");
  const userTweets = await Tweet.find({ owner: userId }).populate(
    "owner",
    "-_id fullName"
  );
  console.log("tweets", userTweets);
  return res
    .status(200)
    .json(
      new ApiResponse(200, userTweets, "Tweets of User Found Successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  // get tweet id from  params and validate
  // get tweet content from body
  // get tweet  owner from db
  // check if owner is authenticated
  // update tweet
  // return tweet

  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId))
    throw new ApiError(400, "Tweet Id is Required");
  const { content } = req.body;
  if (content && content.lenght < 10)
    throw new ApiError(400, "Tweet Must have some content");
  const tweetOwner = await Tweet.findById(
    new mongoose.Types.ObjectId(tweetId)
  ).select("owner");
  if (!tweetOwner) throw new ApiError(404, "Tweet Not Found");
  if (!tweetOwner.owner.equals(req?.user._id))
    throw new ApiError(403, "You are not authorized to update this tweet");
  const tweet = await Tweet.findByIdAndUpdate(
    new mongoose.Types.ObjectId(tweetId),
    { content },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet Updated Successfully", tweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  // get tweet id
  // get owenr
  // owner is authentivcated
  //delete tweet
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId))
    throw new ApiError(400, "Tweet Id is Required");

  const tweetOwner = await Tweet.findById(
    new mongoose.Types.ObjectId(tweetId)
  ).select("owner");
  if (!tweetOwner) throw new ApiError(404, "Tweet Not Found");

  if (!tweetOwner.owner.equals(req?.user._id))
    throw new ApiError(403, "You are not authorized to delete this tweet");
  await Tweet.findByIdAndDelete(new mongoose.Types.ObjectId(tweetId));
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet Deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
