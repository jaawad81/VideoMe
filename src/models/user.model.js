import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String, 
      required: [true, "Password is required"],
    },
    avatar: {
      type: String, //cloudanry url
      required: true,
    },
    coverImage: {
      type: String, //cloudanry url
    },
    watchHistory: [
    //  {v1},{v2},{v3}
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: {
      //REFRESH TOKEN
      type: String,
    },
  },
  { timestamps: true }
);

// Pre Hooks
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// SCHEMA PLUGINS 
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


userSchema.methods.addToWatchHistory = async function (videoId) {
  if (!this.watchHistory.includes(videoId)) {
    this.watchHistory.push(videoId);
    await this.save(); // Save the updated document
    return true;
  }else{
    console.log("Already in watch history");
    return false;
  }
};


export const User = mongoose.model("User", userSchema);
