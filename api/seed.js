import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./src/DB/connection.js";
import { seedProducts } from "./src/services/seed.service.js";

await connectDB();
await seedProducts();
await mongoose.disconnect();
