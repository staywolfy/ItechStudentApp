// backend/server.js
import express from "express";
import cors from "cors"; // Remove the require statement
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import routes from "./routes/routes.js";

dotenv.config();
const app = express();
const __dirname = path.resolve();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Fix CORS configuration
app.use(
  cors({
    origin: "https://studentapp.i-tech.net.in",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests
app.options("*", cors());

// API routes
app.use("/api/v1/routes", routes);

// Serve React build (production)
const clientBuildPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(clientBuildPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
