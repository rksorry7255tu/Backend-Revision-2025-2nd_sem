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

//not working
// const generateAccessAndRefreshTokens = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new apiError("404", "user not found");
//     }
//     const accessToken = user.generateAccessToken();
//     const refreshToken = user.generateRefreshToken();

//     user.refreshToken = refreshToken;
//     await user.save({ validateBeforeSave: false });

//     return { accessToken, refreshToken };
//   } catch (error) {
//     throw new apiError(
//       500,
//       "Something went wrong while generating access token"
//     );
//     console.log(error);
//   }
// };

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  // console.log(email);
  // console.log(password);

  if (!email || !password || !username) {
    throw new apiError(409, "email or password not correct");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });

  if (!user) {
    return new apiError(401, "user not existed");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "User Invalid");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  // console.log(accessToken);
  // console.log(refreshToken);

  // const { accessToken, refreshToken } = generateAccessAndRefreshTokens(
  //   user._id
  // );

  if (!accessToken || !refreshToken) {
    throw new apiError(404, "Tokens not generated");
  }

  const loggedInUser = await User.findById(user?._id).select(
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
      new apiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User loggedIn successfully"
      )
    );
});

const logOut = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(req.user?._id, {
    $set: {
      refreshToken: undefined,
    },
  });

  return res
    .status(200)
    .cookie("accessToken", "")
    .json(new apiResponse(200, {}, "User logOut successfully"));
});
export { registerUser, loginUser, logOut };
