import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// v-1
const videoSchema=new Schema({
    videoFile:{
        type:String, // TODO cloudanry
        required:true
    },
    thumbnail:{
        type:String, // TODO cloudanry
        required:true
    },
    duration:{
        type:Number, // TODO cloudanry
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String, 
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },



},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate);
export const Video=mongoose.model("Video",videoSchema);



