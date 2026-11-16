import mongoose from "mongoose";
import { getDeliveredAt, getEstimatedDelivery } from "../../utils/orderTracking.js";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
export const PAYMENT_METHODS = ["cash_on_delivery", "vodafone_cash", "instapay"];
// The customer sends the money first (and uploads a screenshot of the payment)
export const TRANSFER_METHODS = ["vodafone_cash", "instapay"];

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

    // Screenshot of the transfer (Cloudinary url), only for the transfer methods
    paymentProof: {
        type: String,
        default: ""
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
    },

    // When the order reached each status (used for the delivery estimate)
    statusHistory: [{
        status: { type: String, enum: ORDER_STATUSES, required: true },
        at: { type: Date, required: true },
        _id: false
    }]

}, {
    timestamps: true,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Sent to the frontend with every order
orderSchema.virtual("estimatedDelivery").get(function () {
    return getEstimatedDelivery(this);
});

orderSchema.virtual("deliveredAt").get(function () {
    return getDeliveredAt(this);
});

const Order = mongoose.model("Order", orderSchema);

export default Order;