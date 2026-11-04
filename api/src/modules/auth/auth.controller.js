import jwt from "jsonwebtoken";
import User from "../../DB/models/user.model.js";
import AppError from "../../utils/AppError.js";

const signToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return next(new AppError("This email is already registered", 409));
        }

        // role is always "user" here (default in the model)
        const user = await User.create({ name, email, password });

        res.status(201).json({
            status: "success",
            message: "Account created successfully",
            data: {
                token: signToken(user),
                user: user.toSafeObject()
            }
        });

    } catch (error) {
        next(error);
    }
};


export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return next(new AppError("Invalid email or password", 401));
        }

        res.status(200).json({
            status: "success",
            message: "Logged in successfully",
            data: {
                token: signToken(user),
                user: user.toSafeObject()
            }
        });

    } catch (error) {
        next(error);
    }
};


export const getMe = (req, res) => {
    res.status(200).json({
        status: "success",
        data: {
            user: req.user.toSafeObject()
        }
    });
};
