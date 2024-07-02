import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		fullName: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},
		avatar: {
			type: String, //cloudinary url
			required: true,
		},
		coverImage: {
			type: String, //cloudinary url
		},
		watchHistory: [
			{
				type: Schema.Types.ObjectId,
				ref: "Video",
			},
		],
		password: {
			type: String,
			required: [true, "Password is required"],
		},
		refreshToken: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

//the pre hook provided by mongoose is used to execute certain function just before performing the method ("save" in this case)
//here we are using this to encrypt the plain text password before saving it into the database
//remember - never use arrow functions while writing hooks instead use normal function method.
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next(); //returning next if password field is not modified.

	this.password = bcrypt.hash(this.password, 10);
	next();
});

//self created method to compare the user given password and the password stored in database.
userSchema.methods.isPasswordCorrect = async function (password) {
	return await bcrypt.compare(password, this.password); //returns the boolean value
};

// generating access and refresh tokens using jwt (jsonwebtokens)
userSchema.methods.generateAccessToken = function () {
	return jwt.sign(
		{
			_id: this._id,
			email: this.email,
			username: this.username,
			fullName: this.fullName,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};
userSchema.methods.generateRefreshToken = function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		}
	);
};

export const User = mongoose.model("User", userSchema);
