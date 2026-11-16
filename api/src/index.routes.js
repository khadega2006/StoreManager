import { Router } from "express";
import productRoutes from "./modules/product/product.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products/:productId/reviews", reviewRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

export default router;