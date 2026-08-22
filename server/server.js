require("dotenv").config();
const authRoutes = require("./src/routes/authRoutes");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const registrationRoutes = require("./src/routes/registrationRoutes");
const { verifyEmailConnection } = require("./src/services/emailService");

const app = express();

const PORT = process.env.PORT || 5000;

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

console.log("=================================");
console.log("🔧 ENVIRONMENT CHECK");
console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
console.log("EMAIL_PORT:", process.env.EMAIL_PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
    "EMAIL_PASS configured:",
    Boolean(process.env.EMAIL_PASS)
);
console.log("=================================");

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "VOTARA server is running.",
    });
});

// Registration API
app.use(
    "/api/registration",
    registrationRoutes
);

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing from .env"
            );
        }

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "🍃 MongoDB Connected:",
            mongoose.connection.host
        );

        app.use(
    "/api/auth",
    authRoutes
);

        app.listen(PORT, () => {
            console.log(
                `🚀 VOTARA server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error(
            "❌ MongoDB connection failed:"
        );

        console.error(error.message);

        process.exit(1);
    }
};

startServer();