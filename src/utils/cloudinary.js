import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
		//file has been uploaded successfully
		console.log("File is uploaded on cloudinary", response.url);
		return response;
	} catch (error) {
		fs.unlinkSync(localfilepath); //remove the locally saved temporary file as the upload operation failed
	}
};

export { uploadOnCloudinary };
