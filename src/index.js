import dotenv from "dotenv";
dotenv.config();
import connectDb from "../src/db/index.js";
import app from "./app.js";
connectDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`listening at ${process.env.PORT || 3000}`);
    });
  })
  .catch((err) => {
    console.log("Database connection error", err);
  });
