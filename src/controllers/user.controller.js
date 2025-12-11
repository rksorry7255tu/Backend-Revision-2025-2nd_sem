import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import cloudinary from "../utils/cloudinary.js";
import apiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;
  if (!username || !email || !fullName || !password) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new apiError(409, "user already exist");
  }

  let avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new apiError(402, "Avatar local path not found");
  }
  let coverImageLocalpath;

  if (
    req.files &&
    Array.isArray(req.files?.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalpath = req.files?.coverImage[0]?.path;
  }

  // console.log(coverImageLocalpath);
  // console.log(avatarLocalPath);

  const avatar = await cloudinary(avatarLocalPath);
  if (!avatar) {
    throw new apiError(402, "Avatar not found!");
  }
  const coverImage = await cloudinary(coverImageLocalpath);

  // console.log(avatar);
  // console.log(coverImage);

  const user = await User.create({
    username: username.toLowerCase(),
    email: email,
    fullName: fullName,
    password: password,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apiError(401, "user not created");
  }

  return res
    .status(201)
    .json(new apiResponse(201, createdUser, "User register successfully"));
});

export { registerUser };
