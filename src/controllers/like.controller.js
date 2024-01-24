import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video Id");
  const videoF = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!videoF) throw new ApiError(404, "Video Not found");
  const userId = req?.user._id;
  const existedLike = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId),
    likedBy: userId,
  });
  console.log("Like:", existedLike);
  let msg;
  let data;
  if (existedLike) {
    await Like.findByIdAndDelete(existedLike._id);
    msg = "Like Removed Successfully";
  } else {
    data = await Like.create({
      video: new mongoose.Types.ObjectId(videoId),
      likedBy: userId,
    });
    msg = "Like Video Successfully";
  }
  return res.status(200).json(new ApiResponse(200, data ? data : {}, msg));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid Comment Id");
  const userId = req?.user._id;
  const commentF = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  );
  if (!commentF) throw new ApiError(404, "Comment Not found");

  const existedComment = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    likedBy: userId,
  });
  console.log("Comment:", existedComment);
  let msg;
  let data;
  if (existedComment) {
    await Like.findByIdAndDelete(existedComment._id);
    msg = "Comment Removed Successfully";
  } else {
    data = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      likedBy: userId,
    });
    msg = "Comment Video Successfully";
  }
  return res.status(200).json(new ApiResponse(200, data ? data : {}, msg));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet Id");
  const tweetF = await Tweet.findById(new mongoose.Types.ObjectId(tweetId));
  if (!tweetF) throw new ApiError(404, "Tweet Not found");
  const userId = req?.user._id;
  const existedTweet = await Like.findOne({
    tweet: new mongoose.Types.ObjectId(tweetId),
    likedBy: userId,
  });
  console.log("Like:", existedTweet);
  let msg;
  let data;
  if (existedTweet) {
    await Like.findByIdAndDelete(existedTweet._id);
    msg = "Like Removed Successfully";
  } else {
    data = await Like.create({
      tweet: new mongoose.Types.ObjectId(videoId),
      likedBy: userId,
    });
    msg = "Like Tweet Successfully";
  }
  return res.status(200).json(new ApiResponse(200, data ? data : {}, msg));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  //get user id
  // match all  the documents where likeby is user
  //return json
  const userId = req?.user._id;
  
const likedVideos=await Like.aggregate(
    [
        {
          $match: {
            likedBy:userId,
            video:{
              $exists:true,
            }
          }
        },
        {
            $group:{
                "_id":"$likedBy",
                likedBy:{$first:"$likedBy"},
                video:{$push:"$video"}
            }
        },
        {
            $lookup:{
               from:"users",
               localField:"likedBy",
               foreignField:"_id",
               as:"LikeBy",
               pipeline:[
                {
                    $project:{
                       _id:0,
                       fullName:1,
                       avatar:1 
                    }
                }
               ]
            }
        },
        {
            $unwind:"$LikeBy"
        },
        {
            $addFields:{
                fullName:"$LikeBy.fullName",
                avatar:"$LikeBy.avatar",
            }
        },
        {
            $project:{
                _id:0,
                fullName:1,
                avatar:1,
                video:1
            }
        }
       
      ]
);

  console.log("Liked Videos:", likedVideos);
  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
