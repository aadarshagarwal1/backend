import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID is required.");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found.");
  }
  const videoStats = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
    {
      $facet: {
        totalVideoViews: [
          {
            $group: {
              _id: null,
              totalViews: { $sum: "$views" },
            },
          },
        ],
        totalVideos: [{ $count: "totalVideos" }],
      },
    },
    {
      $project: {
        totalVideos: {
          $ifNull: [{ $arrayElemAt: ["$totalVideos.totalVideos", 0] }, 0], // Default to 0 if no matching videos
        },
        totalViews: {
          $ifNull: [{ $arrayElemAt: ["$totalVideoViews.totalViews", 0] }, 0], // Default to 0 if no views are found
        },
      },
    },
  ]);
  const subscribersCount = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });
  const likeStats = await Like.aggregate([
    {
      $facet: {
        videoCount: [
          {
            $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "video",
              pipeline: [
                { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
              ],
            },
          },
          { $unwind: "$video" },
          { $count: "count" },
        ],
        commentCount: [
          {
            $lookup: {
              from: "comments",
              localField: "comment",
              foreignField: "_id",
              as: "comment",
              pipeline: [
                { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
              ],
            },
          },
          { $unwind: "$comment" },
          { $count: "count" },
        ],
        tweetCount: [
          {
            $lookup: {
              from: "tweets",
              localField: "tweet",
              foreignField: "_id",
              as: "tweet",
              pipeline: [
                { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
              ],
            },
          },
          { $unwind: "$tweet" },
          { $count: "count" },
        ],
      },
    },
    {
      $project: {
        likedVideosCount: {
          $ifNull: [{ $arrayElemAt: ["$videoCount.count", 0] }, 0],
        },
        likedCommentsCount: {
          $ifNull: [{ $arrayElemAt: ["$commentCount.count", 0] }, 0],
        },
        likedTweetsCount: {
          $ifNull: [{ $arrayElemAt: ["$tweetCount.count", 0] }, 0],
        },
      },
    },
  ]);
  return res.status(200).json(
    new ApiResponse(200, {
      videoStats: videoStats[0],
      subscribersCount: { subscribersCount },
      likeStats: likeStats[0],
    })
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID is required.");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found.");
  }
  const videos = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(channelId) },
    },
  ]);
  if (!videos) {
    throw new ApiError(500, "Something went wrong with video aggregation.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully."));
});

export { getChannelStats, getChannelVideos };
