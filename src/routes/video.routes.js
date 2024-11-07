import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateVideoDetails,
} from "../controllers/video.controller";
const router = Router();
router.route("/:videoId").get(getVideoById);

//secure routes
router.route("/").get(verifyJWT, getAllVideos);
router.route("/publish").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);
router.route("/update/:videoId").patch(verifyJWT, updateVideoDetails);
router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);
router
  .route("/togglePublishStatus/:videoId")
  .patch(verifyJWT, togglePublishStatus);
export { router };
