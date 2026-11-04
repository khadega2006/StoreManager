import express from "express";
import cors from "cors";
import connectDB from "./DB/connection.js";
import indexRoutes from "./index.routes.js";
import globalErrorHandler from "./middleware/globalErrorHandler.js";
import { seedAdmin } from "./services/seed.service.js";

const bootstrap = async (PORT) => {
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing in .env");
        process.exit(1);
    }

    const app = express();

    app.use(cors());
    app.use(express.json());

    await connectDB();
    await seedAdmin();

    app.use("/api", indexRoutes);

    app.get("/", (req, res) => {
        res.status(200).json({
            message: "Store Manager API is Running"
        });
    });

    // Global Error Handler
    app.use(globalErrorHandler);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

export default bootstrap;