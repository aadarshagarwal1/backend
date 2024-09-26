import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudnary = async (filePath) => {
  try {
    if (!filePath) return null; // empty file path handler
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    }); // file uploaded on cloudinary
    console.log("file uploaded on cloudinary at", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(filePath); // remove the locally saved file which was temporarily stored on the server
    return error;
  }
};
export default uploadOnCloudnary;
