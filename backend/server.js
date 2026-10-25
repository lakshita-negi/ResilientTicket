const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");

const pool = require("./src/config/db");

const trainRoutes = require("./src/routes/trainRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const healthRoutes = require("./src/routes/healthRoutes");
const recoveryRoutes = require("./src/routes/recoveryRoutes");
const stationRoutes = require("./src/routes/stationRoutes");
const adminDashboardRoutes = require("./src/routes/adminDashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/recovery", recoveryRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "ResilientTicket Backend is running"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`ResilientTicket server running on port ${PORT}`);
});