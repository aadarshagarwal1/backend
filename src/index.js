import dotenv from "dotenv";
dotenv.config({
  path: "./env",
});
import connectDb from "../src/db/index.js";
import app from "./app.js";
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`listening at ${process.env.PORT || 3000}`);
    });
    app.get("/", (req, res) => {
      res.send("apple");
    });
  })
  .catch((err) => {
    console.log("Database connection error", err);
  });
