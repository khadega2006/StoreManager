import mongoose from "mongoose";
import Review from "../../DB/models/review.model.js";
import Product from "../../DB/models/product.model.js";
import Order from "../../DB/models/order.model.js";
import AppError from "../../utils/AppError.js";

// Public: the reviews of one product (with the name of who wrote each one)
export const getProductReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;

        if (!mongoose.isValidObjectId(productId)) {
            return next(new AppError("Invalid product id", 400));
        }

        const reviews = await Review.find({ product: productId })
            .populate("user", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            results: reviews.length,
            data: reviews
        });

    } catch (error) {
        next(error);
    }
};


// Normal user: review a product that was DELIVERED to him (one review per product)
export const createReview = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { rating, comment } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return next(new AppError("Invalid product id", 400));
        }

        const product = await Product.findById(productId);

        if (!product) {
            return next(new AppError("Product not found", 404));
        }

        const received = await Order.exists({
            user: req.user._id,
            status: "delivered",
            "items.product": product._id
        });

        if (!received) {
            return next(new AppError("You can review a product only after it has been delivered to you", 403));
        }

        const existing = await Review.findOne({ product: product._id, user: req.user._id });

        if (existing) {
            return next(new AppError("You already reviewed this product", 409));
        }

        const review = await Review.create({
            product: product._id,
            user: req.user._id,
            rating,
            comment
        });

        // Recalculate the average rating of the product
        const [stats] = await Review.aggregate([
            { $match: { product: product._id } },
            { $group: { _id: "$product", average: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        const updatedProduct = await Product.findByIdAndUpdate(
            product._id,
            {
                ratingAverage: Math.round(stats.average * 10) / 10,
                ratingCount: stats.count
            },
            { new: true }
        );

        res.status(201).json({
            status: "success",
            message: "Thank you for your review",
            data: review,
            rating: {
                average: updatedProduct.ratingAverage,
                count: updatedProduct.ratingCount
            }
        });

    } catch (error) {
        next(error);
    }
};