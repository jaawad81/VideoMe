import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    //  Get token from cookie or header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    // TODO :: COOKIES ARE NOT WORKING PERFECTLY

    // check token availability
    // console.log("token", token);
    //
    if (!token) {
      throw new ApiError(401, "Unauthorized Request");
    }
    // decode token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // finding user
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      // TODO :: DISCUSS ABOUT FRONTEND
      throw new ApiError(401, "Invalid Access Token");
    }
    //    add user to the req
    req.user = user;
    console.log("Logged In User:", user.fullName || "Not Found USer");
    next();
  } catch (error) {
    throw new ApiError(401, error?.message, "Invalid  Access token:: logout");
  }
});

export { verifyJWT };
