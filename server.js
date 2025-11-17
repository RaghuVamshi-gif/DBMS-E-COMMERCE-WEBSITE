import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import customerRoutes from "./routes/customers.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND = path.join(__dirname, "..", "frontend");

const app = express();
app.use(cors());
app.use(express.json());

// serve frontend
app.use(express.static(FRONTEND));

// API routes
app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);

// default index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(FRONTEND, "index.html"));
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
