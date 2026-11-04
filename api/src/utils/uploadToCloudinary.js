
import cloudinary from "../config/cloudinary.js";
import { PassThrough } from "node:stream";

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "store-products",
                resource_type: "image",
                transformation: [{ width: 1000, height: 1000, crop: "limit" }]
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
