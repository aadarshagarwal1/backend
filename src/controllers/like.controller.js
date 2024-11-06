import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  const userId = req.user._id;
  const like = await Like.findOne({
    likedBy: userId,
    video: videoId,
  });
  if (like) {
    const result = await Like.findByIdAndDelete(like._id);
    if (!result) {
      throw new ApiError(500, "Something went wrong. Like not removed.");
    } else
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Like removed successfully."));
  } else {
    const result = await Like.create({
      likedBy: userId,
      video: videoId,
    });
    if (!result) {
      throw new ApiError(500, "Something went wrong. Video not liked.");
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Video liked successfully."));
    }
  }
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID is required.");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }
  const userId = req.user._id;
  const like = await Like.findOne({
    likedBy: userId,
    comment: commentId,
  });
  if (like) {
    const result = await Like.findByIdAndDelete(like._id);
    if (!result) {
      throw new ApiError(500, "Something went wrong. Like not removed.");
    } else
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Like removed successfully."));
  } else {
    const result = await Like.create({
      likedBy: userId,
      comment: commentId,
    });
    if (!result) {
      throw new ApiError(500, "Something went wrong. Comment not liked.");
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment liked successfully."));
    }
  }
});
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required.");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }
  const userId = req.user._id;
  const like = await Like.findOne({
    likedBy: userId,
    tweet: tweetId,
  });
  if (like) {
    const result = await Like.findByIdAndDelete(like._id);
    if (!result) {
      throw new ApiError(500, "Something went wrong. Like not removed.");
    } else
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Like removed successfully."));
  } else {
    const result = await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
    if (!result) {
      throw new ApiError(500, "Something went wrong. Tweet not liked.");
    } else {
      return res
        .status(200)
        .json(new ApiResponse(200, result, "Tweet liked successfully."));
    }
  }
});
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  try {
    const likedVideos = await Like.aggregate([
      {
        $match: { likedBy: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "likedVideo",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: { owner: { $first: "$owner" } },
            },
          ],
        },
      },
      {
        $unwind: "$likedVideo",
      },
    ]);
    if (!likedVideos) {
      throw new ApiError(500, "Something went wrong. Liked videos not fetched");
    } else
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully."
          )
        );
  } catch (error) {
    throw new ApiError(500, error, "Error with aggregation pipeline");
  }
});
export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
