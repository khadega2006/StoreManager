
import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    type: {
        type: String,
        enum: [
            "stock_in",
            "stock_out",
            "adjustment",
            "sale",
            "return"
        ],
        required: true
    },

    quantity: {
        type: Number,
        required: true,
        min: 1
    },

    previousStock: {
        type: Number,
        required: true,
        min: 0
    },

    newStock: {
        type: Number,
        required: true,
        min: 0
    },

    note: {
        type: String,
        default: ""
    },

    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }

}, {
    timestamps: true
});

const InventoryMovement = mongoose.model(
    "InventoryMovement",
    inventoryMovementSchema
);

export default InventoryMovement;
