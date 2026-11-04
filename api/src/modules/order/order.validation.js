import Joi from "joi";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../../DB/models/order.model.js";

// NOTE: the client only sends product ids + quantities.
// Prices and the total are always calculated by the server from the database.
export const createOrderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            product: Joi.string().hex().length(24).required(),
            quantity: Joi.number().integer().min(1).max(20).required()
        })
    ).min(1).required(),

    shippingAddress: Joi.object({
        fullName: Joi.string().trim().min(2).max(60).required(),

        phone: Joi.string().trim().pattern(/^01[0125][0-9]{8}$/).required()
            .messages({ "string.pattern.base": "Phone must be a valid Egyptian mobile number, e.g. 01012345678" }),

        governorate: Joi.string().trim().min(2).max(40).required(),

        city: Joi.string().trim().min(2).max(60).required(),

        street: Joi.string().trim().min(5).max(200).required(),

        notes: Joi.string().trim().allow("").max(300)
    }).required(),

    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).default("cash_on_delivery")
}).required();


export const updateStatusSchema = Joi.object({
    status: Joi.string().valid(...ORDER_STATUSES).required()
}).required();