import { Router } from "express";
import {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder
} from "./order.controller.js";
import validate from "../../middleware/validation.middleware.js";
import { createOrderSchema, updateStatusSchema } from "./order.validation.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ROLES } from "../../DB/models/user.model.js";

const router = Router();

// Every order route needs a logged in user
router.use(authenticate);

// Place an order (normal users only)
router.post("/", authorize(ROLES.USER), validate(createOrderSchema), createOrder);

// My orders
router.get("/my", authorize(ROLES.USER), getMyOrders);

// ---------- Admin only ----------

router.get("/", authorize(ROLES.ADMIN), getAllOrders);

router.patch("/:id/status", authorize(ROLES.ADMIN), validate(updateStatusSchema), updateOrderStatus);
router.patch("/:id/cancel", authorize(ROLES.USER), cancelOrder);

export default router;