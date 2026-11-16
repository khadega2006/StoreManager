import { Router } from "express";
import { getProductReviews, createReview } from "./review.controller.js";
import validate from "../../middleware/validation.middleware.js";
import { createReviewSchema } from "./review.validation.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ROLES } from "../../DB/models/user.model.js";

// Mounted on /api/products/:productId/reviews
const router = Router({ mergeParams: true });

// Everyone can read the reviews
router.get("/", getProductReviews);

// Only a logged in user (the controller also checks that he received the product)
router.post("/", authenticate, authorize(ROLES.USER), validate(createReviewSchema), createReview);

export default router;