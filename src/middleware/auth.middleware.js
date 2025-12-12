import { User } from "../model/user.model.js";
import apiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer", "");

    if (!token) {
      throw new apiError(401, "Unauthorized access");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken) {
      throw new apiError(402, "token not verifyed.");
    }

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    req.user = user;
    next();
  } catch (error) {
    throw error;
  }
});

export default verifyJWT;
