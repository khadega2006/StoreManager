import { readFileSync } from "node:fs";
import User, { ROLES } from "../DB/models/user.model.js";
import Product from "../DB/models/product.model.js";

// Creates the admin account from .env (runs every time the server starts).
// Nobody can become admin from the register page, this is the only way.
export const seedAdmin = async () => {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.warn("ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env, no admin account was created");
        return;
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });

    if (!existing) {
        await User.create({
            name: ADMIN_NAME || "Admin",
            email,
            password: ADMIN_PASSWORD,
            role: ROLES.ADMIN
        });

        console.log(`Admin account created: ${email}`);
        return;
    }

    if (existing.role !== ROLES.ADMIN) {
        existing.role = ROLES.ADMIN;
        await existing.save();

        console.log(`User ${email} is now an admin`);
    }
};


// Adds the starter products (from src/data/products.seed.json) if the products collection is empty.
// Run it with:  npm run seed
export const seedProducts = async () => {
    const count = await Product.countDocuments();

    if (count > 0) {
        console.log(`Products collection already has ${count} products, nothing to seed`);
        return;
    }

    const products = JSON.parse(
        readFileSync(new URL("../data/products.seed.json", import.meta.url), "utf-8")
    );

    await Product.insertMany(products);

    console.log(`${products.length} products added`);
};
