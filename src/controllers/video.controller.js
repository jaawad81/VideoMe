import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// // TODO :: Get ALl videos
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 1, query, sortBy="title", sortType="desc", userId } = req.query;

  let sortOptions = {};

  if (sortBy) {
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sortOptions.description = 1;
  }
  console.log("sortOptions",sortOptions)

  let basequery = {};
  if (query) {
    basequery.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  const result = await Video.aggregatePaginate(
    [
      {
        $match: {
          ...basequery,
          owner:new mongoose.Types.ObjectId(userId),
          isPublished:true
        },
      },
      {
        $sort: sortOptions,
      },
    ],
    { page, limit }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "All Videos fetched Successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user._id;
  // TODO: get video, upload to cloudinary, create video
  if (title.length < 4)
    throw new ApiError(400, "Title must be at least 4 characters long");
  if (description.length < 10)
    throw new ApiError(400, "Description must be at least 10 characters long");
  let videoLocalPath;
  let imageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalPath = req.files.videoFile[0].path;
  }
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    imageLocalPath = req.files.thumbnail[0].path;
  }
  if (!videoLocalPath) throw new ApiError(400, "Video file is required");
  if (!imageLocalPath) throw new ApiError(400, "Thumbnail is required");
  const video = await uploadOnCloudinary(videoLocalPath);
  const image = await uploadOnCloudinary(imageLocalPath);
  if (!video) throw new ApiError(500, "Error while uploading video");
  if (!image) throw new ApiError(500, "Error while uploading thumbnail");

  const newVideo = await Video.create({
    videoFile: video.secure_url,
    thumbnail: image.url,
    duration: video.duration,
    title: title,
    description: description,
    owner: userId,
  });

  if (!newVideo) throw new ApiError(500, "Error while creating video");
  return res
    .status(200)
    .json(new ApiResponse(200, "Video created successfully", newVideo));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video ID is required");
  const userId = req.user._id;

  const videoDetail = await Video.findById(videoId);
  if (!videoDetail) throw new ApiError(404, "Video not found");
  const user = await User.findById(userId).select("watchHistory");
  const viewStatus = await user.addToWatchHistory(videoId);
  if (viewStatus) {
    videoDetail.addView();
  }
  return res.status(200).json(new ApiResponse(200, "Video found", videoDetail));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(400, "Video ID is required");

  const { title, description } = req.body;
  if (title.length < 4)
    throw new ApiError(400, "Title must be at least 4 characters long");
  if (description.length < 10)
    throw new ApiError(
      400,
      "Description is required and must be at least 10 characters long"
    );
  const videoOwner = await Video.findById(videoId).select("owner");
  console.log("Video Owner:", videoOwner);
  const userId = req.user._id;
  const owner = videoOwner?.owner;

  if (!userId.equals(owner))
    throw new ApiError(403, "You are not authorized to update this video");

  const thumbnailLocalPath = req?.file?.path;
  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) throw new ApiError(500, "Error while uploading thumbnail");

  const videoUpdate = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        thumbnail: thumbnail.url,
      },
    },
    { new: true }
  );

  if (!videoUpdate)
    throw new ApiError(500, "Error while updating video details");

  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", videoUpdate));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoOwner = await Video.findById(videoId).select("owner");
  const userId = req.user._id;
  const owner = videoOwner?.owner;
  if (!userId.equals(owner))
    throw new ApiError(403, "You are not authorized to delete this video");
  const video = await Video.findByIdAndDelete(videoId);
  if (!video) throw new ApiError(500, "Error while deleting video");

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoOwner = await Video.findById(videoId).select("owner");
  const userId = req.user._id;
  const owner = videoOwner?.owner;

  if (!userId.equals(owner))
    throw new ApiError(403, "You are not authorized to delete this video");
  const { isPublished } = await Video.findById(videoId).select("isPublished");
  console.log("isPublished:", isPublished);
  const togglePublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !isPublished,
      },
    },
    {
      new: true,
    }
  );
  if (!togglePublishStatus)
    throw new ApiError(500, "Error while updating video");
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video Toggle successfully", togglePublishStatus)
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
