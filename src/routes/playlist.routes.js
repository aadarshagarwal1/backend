import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylistDetails,
} from "../controllers/playlist.controller.js";
const router = Router();
router.route("/:playlistId").get(getPlaylistById);
router.use(verifyJWT).route("/").post(createPlaylist).get(getUserPlaylists);
router.route("/add/:playlistId/:videoId").post(verifyJWT, addVideoToPlaylist);
router
  .route("/remove/:playlistId/:videoId")
  .patch(verifyJWT, removeVideoFromPlaylist);
router
  .route("/:playlistId")
  .delete(verifyJWT, deletePlaylist)
  .patch(verifyJWT, updatePlaylistDetails);
export { router };
