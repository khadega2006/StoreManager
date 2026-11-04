
import { Router } from "express";
import {
    createProduct,
    updateProduct,
    getProducts,
    getProductById,
    deleteProduct
} from "./product.controller.js";
import validate from "../../middleware/validation.middleware.js";
import { createProductSchema, updateProductSchema } from "./product.validation.js";
import upload from "../../middleware/upload.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ROLES } from "../../DB/models/user.model.js";

const router = Router();

// ---------- Public (everyone, even without login) ----------

// Get all products  (optional filter: GET /api/products?category=Lipstick)
router.get("/", getProducts);

// Get one product
router.get("/:id", getProductById);

// ---------- Admin only ----------

//Add Product:
router.post(
    "/",
    authenticate,
    authorize(ROLES.ADMIN),
    upload.single("image"),
    validate(createProductSchema),
    createProduct
);

//Update product:
router.patch(
    "/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    upload.single("image"),
    validate(updateProductSchema),
    updateProduct
);

//Delete product:
router.delete(
    "/:id",
    authenticate,
    authorize(ROLES.ADMIN),
    deleteProduct
);

export default router;
