import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { supabaseAdmin } from "./lib/supabase.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import addressesRoutes from "./routes/addresses.routes.js";
import choresRoutes from "./routes/chores.routes.js";
import quotesRoutes from "./routes/quotes.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import careersRoutes from "./routes/careers.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import publicServicesRoutes from "./routes/public/services.routes.js";
import publicReviewsRoutes from "./routes/public/reviews.routes.js";
import customerBookingsRoutes from "./routes/customer/bookings.routes.js";
import adminRoutes from "./routes/admin/index.js";
import workerRoutes from "./routes/worker/index.js";
import workerApplicationRoutes from "./routes/worker-application.routes.js";
import workerApplyRoutes from "./routes/worker/apply.routes.js";

const app = express();

// --- CORS Setup ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://chorescape.pages.dev",
      process.env.FRONTEND_URL
    ].filter(Boolean);
    if (allowedOrigins.includes(origin) || origin.endsWith(".pages.dev")) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With"]
}));

// --- Middleware ---
app.use(helmet());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- Public Routes (mounted first) ---
app.use("/api/public/services", publicServicesRoutes);
app.use("/api/public/reviews", publicReviewsRoutes);

// --- Auth Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// --- Customer Routes ---
app.use("/api/bookings", bookingsRoutes);
app.use("/api/chores", choresRoutes);
app.use("/api/quotes", quotesRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/careers", careersRoutes);
app.use("/api/contact", contactRoutes);
app.use("/customer/bookings", customerBookingsRoutes);

// --- Admin Routes ---
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes); // Legacy compatibility

// --- Worker Routes ---
app.use("/api/worker/apply", workerApplyRoutes); // Worker apply route (public with optional auth) - BEFORE protected routes
app.use("/api/worker", workerRoutes);
app.use("/api/worker-applications", workerApplicationRoutes);

// --- Root route / health check ---
app.get("/", (req,res) => res.json({
  status: "Backend is live",
  timestamp: new Date().toISOString()
}));
app.get("/api/health", (req,res) => res.json({ ok: true }));

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error("[Error Handler]", err.message, err.stack);
  
  // Handle "entity too large" errors specifically
  if (err.type === 'entity.too.large' || err.statusCode === 413 || err.message.includes('too large')) {
    return res.status(413).json({
      message: 'File size is too large. Maximum allowed size is 10MB (10,000 KB). Please compress your image and try again.',
      data: []
    });
  }
  
  const response = {
    message: err.message || "Internal Server Error",
    data: Array.isArray(err.data) ? err.data : [],
  };
  if (process.env.NODE_ENV !== "production") response.error = err.stack;
  res.status(err.statusCode || err.status || 500).json(response);
});

// --- 404 Handler ---
app.use((req,res) => res.status(404).json({ message: "Route not found", data: [] }));

export default app;

