import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

// TODO: toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
  // Channel Name :: Subscriber
  const { channelId } = req?.params; //channel
  const channel = channelId;

  const channelExist = await User.findOne({
    _id: new mongoose.Types.ObjectId(channel),
  });
  if (!channelExist) {
    throw new ApiError(404, "Channel Not found");
  }

  if (req.user._id.equals(channel)) {
    throw new ApiError(409, "Invalid Subscription");
  }

  const subscriptionExist = await Subscription.findOne({
    subscriber: new mongoose.Types.ObjectId(req.user?._id),
    channel: new mongoose.Types.ObjectId(channel),
  });
  // console.log("Subscription Exist::",subscriptionExist);

  let subscription;
  let msg;
  if (subscriptionExist) {
    //unsubscirbe
    subscription = await Subscription.findOneAndDelete({
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      channel: new mongoose.Types.ObjectId(channel),
    });
    msg = "Channel Unsubscribed Successfully";
  } else {
    subscription = await Subscription.create({
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      channel: new mongoose.Types.ObjectId(channel),
    });
    msg = "Channel Subscribed Successfully";
  }

  return res.status(200).json(new ApiResponse(200, subscription, msg));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // get channel  id from the user
  // match all the documents in db where channel is user
  // lookup subscription with user to find the detail of subscribers
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(404, "Channel Not Found");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId), //subscriberId
      }, //gmd
    },
    {
      $group: {
        _id: "$channel", //gmd    //subscriberId
        channel: { $first: "$channel" }, //gmd   //subscriberId
        subscribers: { $push: "$subscriber" }, //[{id-1:jawad},{id-2:usama}]  //channels
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribers",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        subscribers: 0,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers Found Successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new ApiError(404, "subscriber Not Found");
  }
  
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber:new mongoose.Types.ObjectId(subscriberId), 
      },
    },
    {
      $group: {
        _id: "$subscriber",
        subscriber: { $first: "$subscriber" },
        channels: { $push: "$channel" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channels",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              _id: 0,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        channels: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribedChannels, "Subscribed Channels Found Successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
