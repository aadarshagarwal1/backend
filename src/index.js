import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import connectDb from "../src/db/index.js";
connectDb();
