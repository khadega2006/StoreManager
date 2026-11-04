import "dotenv/config";
import bootstrap from "./src/bootstrap.js";

const PORT = process.env.PORT || 3000;

bootstrap(PORT);