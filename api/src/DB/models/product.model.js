import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    brand: {
        type: String,
        trim: true,
        default: ""
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: String,
        required: true
    },

    image: {
        type: String,
        default: ""
    },

    stock: {
        type: Number,
        default: 0,
        min: 0
    },

    lowStockThreshold:{
        type:Number,
        default:5,
        min:0
    },

        isActive: {
        type: Boolean,
        default: true
    },

    // Updated automatically every time a review is added
    ratingAverage: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },

    ratingCount: {
        type: Number,
        default: 0,
        min: 0
    }

}, {
    timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;