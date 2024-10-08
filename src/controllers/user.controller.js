import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudnary from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
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
const loginUser = asyncHandler(async (req, res) => {});
export { registerUser, loginUser };
