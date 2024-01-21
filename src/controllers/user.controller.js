import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Generate Tokens
const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    // console.log("Access Token:", accessToken);
    // console.log("Refresh Token:", refreshToken);
    // console.log("User ::Genrate Tokens:", user);
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while gernating Refresh and Access Token::",
      error
    );
  }
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  //  req body  data
  const { email, username, password } = req.body;
  // console.log("email:", email);
  // username or email
  if (!(username || email)) {
    throw new ApiError(400, "Username or Email  is required");
  }

  // find the user
  const user = await User.findOne({
    $or: [
      {
        username,
      },
      {
        email,
      },
    ],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // console.log("User:", user);
  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Password");
  }
  // access and refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);
  // send token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
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
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1,
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
  res.clearCookie("accessoken", options);
  res.clearCookie("refreshToken", options);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User Logout Successfully"));
});

// refreshToken

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // get refreshToken from frontend
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(500, "Something went wrong with Refresh Token ");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    console.log("decoded token:", decodedToken);
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Inavlid Refresh Token ");
    }
    console.log("User::", user);

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(500, "Refresh Token is expired or used ");
    }
    const { accessToken, newRefreshToken } = await generateTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };
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
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Something went wron :: while decoding refreshToken"
    );
  }
});

// change current password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Get values from frontend
  const { oldPassword, newPassword } = req.body;
  // finding user from cookies :: middleware auth
  const user = await User.findById(req.user?._id);
  // check password is correct :: pre hook
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  // saving password in database
  user.password = newPassword;
  const userSaving = await user.save({ validateBeforeSave: false });
  console.log("User Saved:", userSaving);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Successfully"));
});

// get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  console.log("Current USer::", user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Fetched successfully"));
});

// update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!(fullName || email)) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");
  console.log("Update Account Details:: User:", user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated Successfully"));
});

// update user Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File  is Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!(avatar.url || avatar)) {
    throw new ApiError(400, "Error while uploading file");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url || avatar,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Avatar updated Successfully"));
});

// update user Avatar
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image  is Missing");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!(coverImage.url || coverImage)) {
    throw new ApiError(400, "Error while uploading file");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url || coverImage,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User Cover Image updated Successfully"));
});

// Database Aggregation Pipelines
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req?.params;
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
      // users who have subscribed Jawad
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriber",
      },
    },
     // channels that Jawad has subscribed
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "channel",
      },
    },
    {
      $addFields: {
        channelSubscribers: {
          $size: "$channel", //jawad
        },
        subscribedChannels: {
          $size: "$subscriber",  //chai aur code
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$channel.subscriber"] },
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
        channelSubscribers: 1,
        subscribedChannels: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel Fetched Successfully"));
});

// get watch history

const getWatchHistory = asyncHandler(async (req, res) => {
  // user_1
  // video_1 , video_2  , video_3
  // u2

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    }, //user_id_123
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        // v-1,v2,v3
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // u2
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
              owner: { $arrayElemAt: ["$owner", 0] },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "Watch History Fetched Successfully"
      )
    );
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

/*
200: Used for Ok responses
201: Used for Created responses
204: Used for No Content responses

300: Used for Multiple Choices responses
301: Used for Moved Permanently responses
304: Used for Not Modified responses

400: Used for Bad Request responses
401: Used for Unauthorized responses
403: Used for Forbidden responses
404: Used for Not Found responses
409: Used for Conflict responses

500: Used for Internal Server Error responses

*/







