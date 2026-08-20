require("dotenv").config();

const express = require("express");
const cors = require("cors");

const {
    verifyEmailConnection,
} = require("./src/services/emailService");

const registrationRoutes = require("./src/routes/registrationRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "VOTARA server is running.",
    });
});

// Registration routes
app.use(
    "/api/registration",
    registrationRoutes
);

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 VOTARA server running on port ${PORT}`);

    await verifyEmailConnection();
});