import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId?.trim()) {
    throw new ApiError(400, "Channel ID is required.");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found.");
  }
  const subscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });
  try {
    if (subscription) {
      const result = await Subscription.findByIdAndDelete(subscription?._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Channel unsubscribed successfully."));
    } else {
      const createdSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channel._id,
      });
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            createdSubscription,
            "Channel subscribed successfully."
          )
        );
    }
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, error.message, "Something went wrong."));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
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
      $project: {
        subscriber: 1,
      },
    },
    {
      $addFields: { subscriber: { $first: "$subscriber" } },
    },
    {
      $replaceRoot: { newRoot: "$subscriber" },
    },
  ]);
  if (!subscriptions) {
    throw new ApiError(
      500,
      "Something went wrong with subscription aggregation."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribers' list fetched successfully."
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        channel: 1,
      },
    },
    {
      $addFields: { channel: { $first: "$channel" } },
    },
    {
      $replaceRoot: { newRoot: "$channel" },
    },
  ]);
  if (!subscribedChannels) {
    throw new ApiError(
      500,
      "Something went wrong with subscription aggregation."
    );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "List of subscribed channels fetched successfully."
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
