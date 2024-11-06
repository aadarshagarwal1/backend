import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";
const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { content } = req.body;
  if (!content?.trim()) {
    throw new ApiError(401, "Content required.");
  }
  const createdTweet = await Tweet.create({
    content,
    owner: userId,
  });
  if (!createdTweet) {
    throw new ApiError(500, "Something went wrong. Tweet not created.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, createdTweet, "Tweet created successfully."));
});
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { newContent } = req.body;
  if (!tweetId?.trim()) {
    throw new ApiError(400, "Tweet ID required.");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }
  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content: newContent },
    },
    { new: true }
  );
  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong. Tweet not updated.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."));
});
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId?.trim()) {
    throw new ApiError(400, "Tweet ID required.");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }
  const result = await Tweet.deleteOne({ _id: tweetId });
  if (!result) {
    throw new ApiError(500, "Something went wrong. Tweet not deleted.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});
const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tweets = await Tweet.aggregate([
    {
      $match: { owner: userId },
    },
  ]);
  if (!tweets) {
    throw new ApiError(500, "Something went wrong in tweet aggregation.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully."));
});
export { createTweet, getUserTweets, updateTweet, deleteTweet };
