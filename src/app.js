import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import { router as userRouter } from "./routes/user.routes.js";
import { router as commentRouter } from "./routes/comment.routes.js";
import { router as likeRouter } from "./routes/like.routes.js";
//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
export default app;
