import Joi from "joi";


export const createProductSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),

    brand: Joi.string().trim().allow(""),

    description: Joi.string().trim().min(10).required(),

    price: Joi.number().min(0).required(),

    category: Joi.string().trim().required(),

    stock: Joi.number().integer().min(0),

    isActive: Joi.boolean()
}).required();


export const updateProductSchema = Joi.object({
    name: Joi.string().trim().min(3).max(100),

    brand: Joi.string().trim().allow(""),

    description: Joi.string().trim().min(10),

    price: Joi.number().min(0),

    category: Joi.string().trim(),

    image: Joi.string().allow(""),

    stock: Joi.number().integer().min(0),

    isActive: Joi.boolean()
}).required().min(1);