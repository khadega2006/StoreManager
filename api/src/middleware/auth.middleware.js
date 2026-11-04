import jwt from "jsonwebtoken";
import User from "../DB/models/user.model.js";
import AppError from "../utils/AppError.js";

// 1) Checks that the request has a valid token and loads the user from the DB
export const authenticate = async (req, res, next) => {
    try {
        const [scheme, token] = (req.headers.authorization || "").split(" ");

        if (scheme !== "Bearer" || !token) {
            return next(new AppError("Please login first", 401));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return next(new AppError("Invalid or expired token, please login again", 401));
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new AppError("This user no longer exists", 401));
        }

        req.user = user;
        next();

    } catch (error) {
        next(error);
    }
};

// 2) Checks that the logged in user has one of the allowed roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You are not allowed to do this action", 403));
        }

        next();
    };
};
