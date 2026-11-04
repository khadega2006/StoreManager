
import Product from "../../DB/models/product.model.js";
import AppError from "../../utils/AppError.js";
import uploadToCloudinary from "../../utils/uploadToCloudinary.js";
import cloudinary from "../../config/cloudinary.js";
import getPublicId from "../../utils/getPublicId.js";
import mongoose from "mongoose";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const checkId = (id, next) => {
    if (!mongoose.isValidObjectId(id)) {
        next(new AppError("Invalid product id", 400));
        return false;
    }
    return true;
};

// Get all products (or only the products of one category)
export const getProducts = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.category) {
            const category = String(req.query.category).trim();

            // exact match, but not case sensitive ("lipstick" = "Lipstick")
            filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
        }

        const products = await Product.find(filter).sort({ createdAt: 1, _id: 1 });

        res.status(200).json({
            status: "success",
            results: products.length,
            data: products
        });

    } catch (error) {
        next(error);
    }
};


export const getProductById = async (req, res, next) => {
    try {
        if (!checkId(req.params.id, next)) return;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError("Product not found", 404));
        }

        res.status(200).json({
            status: "success",
            data: product
        });

    } catch (error) {
        next(error);
    }
};


export const createProduct = async (req, res, next) => {
    try {
        let imageUrl = "";

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const product = await Product.create({
            ...req.body,
            image: imageUrl
        });

        res.status(201).json({
            status: "success",
            message: "Product created successfully",
            data: product
        });

    } catch (error) {
        next(error);
    }
};


export const updateProduct = async (req, res, next) => {
    try {
        if (!checkId(req.params.id, next)) return;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError("Product not found", 404));
        }

        const updatedData = { ...req.body };

        if (req.file) {
            // Upload new image
            const result = await uploadToCloudinary(req.file.buffer);

            // Delete old image
            if (product.image) {
                const publicId = getPublicId(product.image);

                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            updatedData.image = result.secure_url;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updatedData,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            status: "success",
            message: "Product updated successfully",
            data: updatedProduct
        });

    } catch (error) {
        next(error);
    }
};


export const deleteProduct = async (req, res, next) => {
    try {
        if (!checkId(req.params.id, next)) return;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return next(new AppError("Product not found", 404));
        }

        // Delete the image from Cloudinary too (if it is a Cloudinary image)
        if (product.image) {
            const publicId = getPublicId(product.image);

            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.error("Cloudinary delete error:", error.message);
                }
            }
        }

        await product.deleteOne();

        res.status(200).json({
            status: "success",
            message: "Product deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};
