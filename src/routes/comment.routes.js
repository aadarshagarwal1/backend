import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
const router = Router();
router.route("/:videoId").get(getVideoComments);

//secured routes
router.route("/:videoId").post(verifyJWT, addComment);
router
  .route("/:commentId")
  .delete(verifyJWT, deleteComment)
  .patch(verifyJWT, updateComment);
export { router };
