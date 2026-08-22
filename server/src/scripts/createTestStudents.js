require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

const createTestStudent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("🍃 MongoDB connected.");

        const studentId = "79999";

        const existingStudent = await Student.findOne({
            studentId,
        });

        if (existingStudent) {
            console.log(
                `⚠️ Student ${studentId} already exists.`
            );

            return;
        }

        await Student.create({
            studentId: "79999",
            fullName: "TEST, VOTARA STUDENT",
            yearLevel: "4",

            email: null,

            passwordHash: null,
            mustChangePassword: true,

            profilePicture: null,
            profilePictureUploadedAt: null,

            registrationStatus: "not_registered",

            otpHash: null,
            otpExpiresAt: null,
            otpVerified: false,
            otpVerifiedAt: null,

            registeredAt: null,

            hasVoted: false,
        });

        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "✅ TEST STUDENT CREATED"
        );
        console.log(
            "======================================"
        );
        console.log(
            "Student ID: 79999"
        );
        console.log(
            "Name: TEST, VOTARA STUDENT"
        );
        console.log(
            "Year Level: 4"
        );
        console.log(
            "Registration: not_registered"
        );
        console.log(
            "======================================"
        );

    } catch (error) {

        console.error(
            "❌ Failed to create test student:"
        );

        console.error(error);

    } finally {

        await mongoose.connection.close();

        console.log(
            "🔌 MongoDB connection closed."
        );
    }
};

createTestStudent();