import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and/or description required.");
  }
  const createdPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  if (!createdPlaylist) {
    throw new ApiError(500, "Something went wrong. Playlist not created");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, createdPlaylist, "Playlist created successfully.")
    );
});
const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const playlists = await Playlist.aggregate([
    {
      $match: { owner: userId },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
                    avatar: 1,
                    username: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
      },
    },
  ]);
  if (!playlists) {
    throw new ApiError(500, "Something went wrong in playlists aggregation.");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User's playlists fetched successfully.")
    );
});
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(400, "Playlist ID required.");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(playlistId) },
    },
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
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
      },
    },
  ]);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully."));
});
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  if (!videoId?.trim() || !playlistId?.trim()) {
    throw new ApiError(400, "Video ID and/or playlist ID required.");
  }
  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);
  if (!video) {
    throw new ApiError(404, "Video not found.");
  }
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  if (playlist.owner.toString() !== req.user._id?.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  if (playlist.videos.some((id) => id.toString() === videoId.toString())) {
    throw new ApiError(400, "Video already present in the playlist.");
  }
  playlist.videos.push(new mongoose.Types.ObjectId(videoId));
  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "Something went wrong. Video not added into the playlist."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to the playlist successfully."
      )
    );
});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!videoId?.trim() || !playlistId?.trim()) {
    throw new ApiError(400, "Video ID and/or playlist ID required.");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  if (playlist.owner.toString() !== req.user._id?.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  if (playlist.videos.some((id) => id.toString() === videoId.toString())) {
    playlist.videos.pull(videoId);
    const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
    if (!updatedPlaylist) {
      throw new ApiError(
        500,
        "Something went wrong. Video not removed from playlist."
      );
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedPlaylist,
          "Video removed from playlist successfully."
        )
      );
  } else throw new ApiError(404, "Video not present in the playlist.");
});
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(400, "Playlist ID is required.");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  if (playlist.owner.toString() !== req.user._id?.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  const result = Playlist.findByIdAndDelete(playlistId);
  if (!result) {
    throw new ApiError(500, "Something went wrong. Playlist not deleted.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully."));
});
const updatePlaylistDetails = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId?.trim()) {
    throw new ApiError(400, "Playlist ID is required.");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found.");
  }
  if (playlist.owner.toString() !== req.user._id?.toString()) {
    throw new ApiError(401, "Unauthorized request.");
  }
  const { name, description } = req.body;
  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, "Name and/or description  required.");
  }
  if (playlist.name === name && playlist.description === description) {
    throw new ApiError(400, "No changes made.");
  }
  playlist.name = name;
  playlist.description = description;
  const updatedPlaylist = await playlist.save();
  if (!updatedPlaylist) {
    throw new ApiError(
      500,
      "Something went wrong. Playlist details not updated."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Playlist details updated successfully."
      )
    );
});
export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylistDetails,
};
