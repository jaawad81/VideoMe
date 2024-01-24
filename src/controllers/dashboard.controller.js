import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // get channel id from cookies
    // count total views of all the videos owned by this user
    // count total subscriber 
    // count total views on all  his videos
    //count total likes on all his videos
    const userId=req.user._id;
    const videos=await Video.find({owner:userId});
    if(!videos){
        throw new ApiError(404,"No videos found");
    }
    let totalViews=0;
    let totalLikes=0;
    videos.forEach(video=>{
        totalViews+=video.views;
        totalLikes+=video.likes;
    })
    const subscriptions=await Subscription.find({channel:userId});
    const totalSubscribers=subscriptions.length;
    const response=new ApiResponse(200,{totalViews,totalLikes,totalSubscribers},"Stats found");
    res.status(200).json(response);
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    // get channel id from cookies
    // get all videos of this channel owned by user either published or unpublished
    const userId=req.user._id;
    const videos=await Video.find({owner:userId});
    if(!videos){
        throw new ApiError(404,"No videos found");
    }
    const response=new ApiResponse(200,videos,"Videos found");
    res.status(200).json(response);

})

export {
    getChannelStats, 
    getChannelVideos
    }