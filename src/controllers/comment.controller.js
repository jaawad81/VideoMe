import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video

  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Please provide valid videoId");
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video) throw new ApiError(404, "Video not Found");
  var commentAggrgate = await Comment.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, commentAggrgate, "Comments Fetched Successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // get videoID
  // get userId for comment owner
  // find video
  // get comment content
  // content validation
  // add comment
  // return
  const { content } = req.body;
  if (content === "")
    throw new ApiError(400, "Please type something in comment");
  const { videoId } = req.params;
  if (!isValidObjectId(videoId))
    throw new ApiError(400, "Please provide valid videoId");
  const video = await Video.findById(new mongoose.Types.ObjectId(videoId));
  if (!video) throw new ApiError(404, "Video not Found");
  const owner = req.user._id;
  const comment = await Comment.create({
    content,
    owner,
    video: new mongoose.Types.ObjectId(videoId),
  });
  if (!comment) throw new ApiError(500, "Something went wrong");
  console.log("Comment:", comment);
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  // get comment id
  // validate
  // owner authorization
  // content validation
  // update
  // return

  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Please provide valid comment ID");
  const { content } = req.body;
  if (!content) throw new ApiError(400, "Please provide content to update");
  const comment = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  ).select("owner");
  if (!comment) throw new ApiError(404, "Comment not found");
  const user = req.user._id;
  if (comment.owner.toString() !== user.toString())
    throw new ApiError(401, "You are not authorized to update this comment");
  const updateCpmment = await Comment.findByIdAndUpdate(
    new mongoose.Types.ObjectId(commentId),
    {
      $set: {
        content,
      },
    },
    { new: true }
  );
  if (!updateCpmment) throw new ApiError(500, "Something went wrong");
  return res
    .status(200)
    .json(new ApiResponse(200, updateCpmment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  // get comment id
  // validate
  // owner authorization
  // delete
  // return
  const { commentId } = req.params;
  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Please provide valid comment ID");
  const comment = await Comment.findById(
    new mongoose.Types.ObjectId(commentId)
  ).select("owner");
  if (!comment) throw new ApiError(404, "Comment not found");
  const user = req.user._id;
  if (comment.owner.toString() !== user.toString())
    throw new ApiError(401, "You are not authorized to delete this comment");
  await Comment.findByIdAndDelete(new mongoose.Types.ObjectId(commentId));
  return res
    .status(200)
    .json(new ApiResponse(200, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
