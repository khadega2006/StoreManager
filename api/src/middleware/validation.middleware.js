import AppError from "../utils/AppError.js";

const validate = (schema) => {
    return (req, res, next) => {

        const { error, value } = schema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            const message = error.details
                .map(detail => detail.message)
                .join(", ");

            return next(new AppError(message, 400));
        }

        req.body = value;

        next();
    };
};

export default validate;