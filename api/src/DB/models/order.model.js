import mongoose from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
export const PAYMENT_METHODS = ["cash_on_delivery"];

// A copy of the product at the time of the order (so old orders never change if the product is edited)
const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    items: {
        type: [orderItemSchema],
        required: true
    },

    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        governorate: { type: String, required: true },
        city: { type: String, required: true },
        street: { type: String, required: true },
        notes: { type: String, default: "" }
    },

    paymentMethod: {
        type: String,
        enum: PAYMENT_METHODS,
        default: "cash_on_delivery"
    },

    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ORDER_STATUSES,
        default: "pending"
    }

}, {
    timestamps: true
});

const Order = mongoose.model("Order", orderSchema);

export default Order;