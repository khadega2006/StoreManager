import { Router } from "express";
import { register, login, getMe } from "./auth.controller.js";
import validate from "../../middleware/validation.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import loginLimiter from "../../middleware/loginLimiter.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login",loginLimiter , validate(loginSchema), login);

router.get("/me", authenticate, getMe);

export default router;
