require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

const resetStudent69700 = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("🍃 MongoDB Connected");

        const student = await Student.findOne({
            studentId: "69700",
        });

        if (!student) {
            console.log("❌ Student 69700 was not found.");
            process.exit(1);
        }

        // Keep the existing student information.
        // Only reset testing/onboarding information.

        student.email = null;

        student.passwordHash = null;
        student.mustChangePassword = true;

        student.profilePicture = null;
        student.profilePictureUploadedAt = null;

        student.registrationStatus = "not_registered";

        student.otpHash = null;
        student.otpExpiresAt = null;
        student.otpVerified = false;
        student.otpVerifiedAt = null;

        student.registeredAt = null;

        student.hasVoted = false;

        await student.save();

        console.log("=================================");
        console.log("✅ STUDENT 69700 RESET SUCCESSFULLY");
        console.log("=================================");
        console.log("Student ID:", student.studentId);
        console.log("Full Name:", student.fullName);
        console.log("Year Level:", student.yearLevel);
        console.log("Registration:", student.registrationStatus);
        console.log("Password Hash:", student.passwordHash);
        console.log("Must Change Password:", student.mustChangePassword);
        console.log("Profile Picture:", student.profilePicture);
        console.log("Has Voted:", student.hasVoted);
        console.log("=================================");

        process.exit(0);

    } catch (error) {

        console.error("❌ Reset failed:");
        console.error(error);

        process.exit(1);
    }
};

resetStudent69700();