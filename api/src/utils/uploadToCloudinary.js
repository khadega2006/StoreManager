
import cloudinary from "../config/cloudinary.js";
import { PassThrough } from "node:stream";

// options (optional): overrides the folder / transformation (used by the payment screenshots)
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "store-products",
                resource_type: "image",
                transformation: [{ width: 1000, height: 1000, crop: "limit" }],
                ...options
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        const bufferStream = new PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(stream);
    });
};

export default uploadToCloudinary;