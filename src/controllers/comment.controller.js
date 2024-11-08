import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  try {
    const comments = await Comment.aggregate([
      { $match: { video: new mongoose.Types.ObjectId(videoId) } },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                username: 1,
                fullName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      { $addFields: { owner: { $first: "$owner" } } },
      { $limit: limit },
      { $skip: (page - 1) * limit },
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully."));
  } catch (error) {
    throw new ApiError(500, error, "Something wrong in aggregation pipeline.");
  }
});
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  if (!(content.trim() && videoId)) {
    throw new ApiError(400, "Content required and/or video required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  const createdComment = await Comment.create({
    owner: req.user._id,
    video: videoId,
    content,
  });
  if (!createdComment) {
    throw new ApiError(500, "Something went wrong. Comment not created.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, createdComment, "Comment created successfully.")
    );
});
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment ID required.");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "No comment found with given ID.");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized request.");
  }
  const result = await Comment.deleteOne({ _id: commentId });
  if (!result) {
    throw new ApiError(500, "Something went wrong. Comment not deleted.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully."));
});
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newContent } = req.body;
  if (!newContent.trim()) {
    throw new ApiError(400, "Content required.");
  }
  const comment = await Comment.findById(commentId);
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized request.");
  }
  if (comment.content === newContent) {
    throw new ApiError(304, "No changes made in the comment.");
  }
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: newContent },
    },
    { new: true }
  );
  if (!updatedComment) {
    throw new ApiError(500, "Something went wrong. Comment not updated.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment updated successfully.")
    );
});
export { getVideoComments, addComment, updateComment, deleteComment };
