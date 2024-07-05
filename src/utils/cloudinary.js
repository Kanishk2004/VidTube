import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// need to configure dotenv here again as it wasn't working
dotenv.config();

//Configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

//the approach is to firstly save the file on our server temporarily and then
//upload it on the cloudinary and after the completion delete the locally stored file.
const uploadOnCloudinary = async (localfilepath) => {
	try {
		if (!localfilepath) return null;

		//upload the file
		const response = await cloudinary.uploader.upload(localfilepath, {
			resource_type: "auto",
		});
		fs.unlinkSync(localfilepath); //deleting the locallly stored files after uploading on cloudinary
		// console.log("File is uploaded on cloudinary", response.url);
		return response;
	} catch (error) {
		fs.unlinkSync(localfilepath); //remove the locally saved temporary file as the upload operation failed
		console.log(error)
	}
};

const deleteAssetOnCloudinary = async (cloudinaryPublicId) => {
	try {
		if (!cloudinaryPublicId) return null;

		//delete the file
		const response = await cloudinary.uploader.destroy(cloudinaryPublicId);
		
		return response;
	} catch (error) {
		console.log(error)
	}
};

export { uploadOnCloudinary, deleteAssetOnCloudinary };
