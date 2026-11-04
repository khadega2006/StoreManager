import Joi from "joi";

// NOTE: "role" is intentionally NOT allowed here, so nobody can register as admin.
export const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),

    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),

    password: Joi.string().min(6).max(72).required()
}).required();


export const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),

    password: Joi.string().required()
}).required();
