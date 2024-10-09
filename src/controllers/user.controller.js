import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudnary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
const generateTokens = async () => {
  try {
    const user = await User.findOne(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return accessToken, refreshToken;
  } catch (error) {
    throw new ApiError(500, "Something went wrong in token generation.");
  }
};
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw new ApiError(400, "all fields required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(
      409,
      "User with same username or email address already exists!"
    );
  }
  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage
    ? req.files?.coverImage[0]?.path
    : null;
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar is necessary.");
  }
  const avatar = await uploadOnCloudnary(avatarLocalFilePath);
  const coverImage = coverImageLocalFilePath
    ? await uploadOnCloudnary(coverImageLocalFilePath)
    : null;
  if (!avatar) {
    throw new ApiError(400, "avatar is necessary");
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });
  const registeredUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!registeredUser) {
    throw new ApiError(500, "Something went wrong. User not registered!");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, "User created successfully!"));
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, passowrd } = req.body;
  if (!username || !email) {
    throw new ApiError(400, "Enter username or email address.");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  const isPasswordValid = user.isPasswordCorrect(passowrd);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials.");
  }
  const { accessToken, refreshToken } = await generateTokens(user._id);
  const loggedInUser = User.findOne(user._id).select("-password -refreshToken");
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, {
        user: loggedInUser,
        accessToken,
        refreshToken,
      }),
      "User logged in successfully."
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
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
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});
export { registerUser, loginUser, logoutUser };
