import mongoose from "mongoose";
import Order from "../../DB/models/order.model.js";
import Product from "../../DB/models/product.model.js";
import User from "../../DB/models/user.model.js";
import AppError from "../../utils/AppError.js";

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;
const CANCELLABLE_STATUSES = ["pending", "confirmed"];

export const createOrder = async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod } = req.body;

        // Merge the same product if it was sent twice
        const quantities = new Map();
        for (const item of items) {
            quantities.set(item.product, (quantities.get(item.product) || 0) + item.quantity);
        }

        // Prices come from the database, never from the client
        const products = await Product.find({ _id: { $in: [...quantities.keys()] } });

        if (products.length !== quantities.size || products.some(p => p.isActive === false)) {
            return next(new AppError("Some products in your cart are no longer available", 400));
        }

        const orderItems = products.map(p => ({
            product: p._id,
            name: p.name,
            price: p.price,
            image: p.image,
            quantity: quantities.get(String(p._id))
        }));

        const totalPrice = Math.round(
            orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100
        ) / 100;

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice
        });

        // Save the address for the next order
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                phone: shippingAddress.phone,
                address: {
                    governorate: shippingAddress.governorate,
                    city: shippingAddress.city,
                    street: shippingAddress.street
                }
            },
            { new: true }
        );

        res.status(201).json({
            status: "success",
            message: "Order placed successfully",
            data: order,
            user: user.toSafeObject()
        });

    } catch (error) {
        next(error);
    }
};


// Orders of the logged in user
export const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            results: orders.length,
            data: orders
        });

    } catch (error) {
        next(error);
    }
};


// Admin: all orders
export const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            results: orders.length,
            data: orders
        });

    } catch (error) {
        next(error);
    }
};


// Admin: change the order status
export const updateOrderStatus = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return next(new AppError("Invalid order id", 400));
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return next(new AppError("Order not found", 404));
        }

        res.status(200).json({
            status: "success",
            message: "Order status updated",
            data: order
        });

    } catch (error) {
        next(error);
    }
};

// User: cancel his own order only withen 24 hours
export const cancelOrder = async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return next(new AppError("Invalid order id", 400));
        }

        const cutoff = new Date(Date.now() - CANCEL_WINDOW_MS);

        // One atomic update: it only matches if ALL the rules are true
        const order = await Order.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id,
                status: { $in: CANCELLABLE_STATUSES },
                createdAt: { $gte: cutoff }
            },
            { status: "cancelled" },
            { new: true }
        );

        if (order) {
            return res.status(200).json({
                status: "success",
                message: "Order cancelled",
                data: order
            });
        }

        // It did not match: find out why, to send a clear message
        const existing = await Order.findOne({ _id: req.params.id, user: req.user._id });

        if (!existing) {
            return next(new AppError("Order not found", 404));
        }

        if (existing.status === "cancelled") {
            return next(new AppError("This order is already cancelled", 400));
        }

        if (!CANCELLABLE_STATUSES.includes(existing.status)) {
            return next(new AppError(`This order can no longer be cancelled because it is ${existing.status}`, 400));
        }

        return next(new AppError("Orders can only be cancelled within 24 hours of placing them", 400));

    } catch (error) {
        next(error);
    }
};