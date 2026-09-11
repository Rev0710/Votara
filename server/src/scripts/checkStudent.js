require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

const checkStudent = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);

        console.log("🍃 MongoDB Connected");
        console.log("");

        // Student ID to check
        const studentId = "58498";

        console.log("🔎 Checking Student:", studentId);
        console.log("");

        const student = await Student.findOne({
            studentId: studentId,
        });

        if (!student) {
            console.log("❌ STUDENT NOT FOUND");
            console.log("Student ID:", studentId);
        } else {
            console.log("================================");
            console.log("✅ STUDENT FOUND");
            console.log("================================");

            console.log("Student ID:", student.studentId);
            console.log("Full Name:", student.fullName);
            console.log("Year Level:", student.yearLevel);
            console.log("Email:", student.email);
            console.log("Registration:", student.registrationStatus);
            console.log("OTP Verified:", student.otpVerified);
            console.log("Password Hash:", student.passwordHash ? "EXISTS" : "NULL");
            console.log("Must Change Password:", student.mustChangePassword);
            console.log("Profile Picture:", student.profilePicture || "NULL");
            console.log("Has Voted:", student.hasVoted);

            console.log("================================");
        }

    } catch (error) {
        console.error("");
        console.error("❌ Error:");
        console.error(error.message);

    } finally {

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log("");
            console.log("🔌 MongoDB connection closed.");
        }
    }
};

checkStudent();