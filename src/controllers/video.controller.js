import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  let { sortBy = "views", sortType = "asc", query = null } = req.query;
  sortBy = sortBy.toString().trim().toLowerCase();
  sortType = sortType?.toString().trim().toLowerCase();
  query = query?.toString().trim().toLowerCase();
  const userId = req.user?._id;
  if (sortBy !== "duration" && sortBy !== "views") {
    throw new ApiError(400, "Invalid sorting key.");
  }
  if (sortType !== "asc" && sortType !== "desc") {
    throw new ApiError(400, "Invalid sorting type.");
  }
  if (
    query !== "published=true" &&
    query !== "published=false" &&
    query !== "getAllVideos"
  ) {
    throw new ApiError(400, "Invalid aggregation query.");
  }
  query =
    query === "published=true"
      ? true
      : query === "published=false"
        ? false
        : null;
  const aggregationPipeline = [
    { $match: { owner: new mongoose.Types.ObjectId(userId) } },
    { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
  ];
  if (query !== null) {
    aggregationPipeline.push({ $match: { isPublished: query } });
  }
  const paginationOptions = { page, limit };
  const videos =
    await Video.aggregate(aggregationPipeline).aggregatePaginate(
      paginationOptions
    );
  if (!videos) {
    throw new ApiError(500, "Something went wrong with video aggregation.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully."));
});

const publishVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  const { title, description } = req.body;
  if (!title.trim() || !description.trim()) {
    throw new ApiError(400, "Title and/or description required.");
  }
  const videoFileLocalFilePath = req.files?.videoFile[0]?.path;
  const thumbnailLocalFilePath = req.files?.thumbnail[0]?.path;
  if (!videoFileLocalFilePath || !thumbnailLocalFilePath) {
    throw new ApiError(400, "Video file and/or thumbnail required.");
  }
  const videoFile = await uploadOnCloudinary(videoFileLocalFilePath);
  if (!videoFile) {
    throw new ApiError(500, "Video file upload on cloudinary failed.");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath);
  if (!thumbnail) {
    throw new ApiError(500, "Thumbnail upload on cloudinary failed.");
  }
  const publishedVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user?._id,
    title,
    description,
    duration: videoFile.video.duration,
  });
  if (!publishedVideo) {
    throw new ApiError(500, "Something went wrong. Video not published.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, publishedVideo, "Video published successfully.")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully."));
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  const { title, description } = req.body;
  const thumbnailLocalFilePath = req.files?.thumbnail[0]?.path;
  if (!title?.trim() && description.trim() && !thumbnailLocalFilePath) {
    throw new ApiError(
      400,
      "Enter atleast one field: title, description or thumbnail."
    );
  }
  video.title = title ? title : video.title;
  video.description = description ? description : video.description;
  if (thumbnailLocalFilePath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalFilePath);
    if (!thumbnail) {
      throw new ApiError(
        500,
        "Something went wrong. Updated thumbnail not uplaoded on cloudinary."
      );
    }
    video.thumbnail = thumbnail ? thumbnail.url : video.thumbnail;
  }
  const updatedVideo = await video.save();
  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong. Video details not updated.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully.")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  const result = await Video.findByIdAndDelete(videoId);
  if (!result) {
    throw new ApiError(500, "Something went wrong. Video not deleted.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId?.trim()) {
    throw new ApiError(400, "Video ID required.");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  video.isPublished = !video.isPublished;
  const updatedVideo = await Video.save();
  if (!updatedVideo) {
    throw new ApiError(
      500,
      "Something went wrong. Video publishment status not toggled."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video publishment status toggled successfully."
      )
    );
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideoDetails,
  deleteVideo,
  togglePublishStatus,
};
