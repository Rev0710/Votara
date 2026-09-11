require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

// =====================================================
// TEST STUDENT
// =====================================================

const TEST_STUDENT_ID = "90005";


// =====================================================
// RESET TEST STUDENT
// =====================================================

const resetTestStudent = async () => {

    try {

        // =================================================
        // CONNECT TO MONGODB
        // =================================================

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("");
        console.log("🍃 MongoDB Connected");
        console.log("----------------------------------------");


        // =================================================
        // FIND ONLY TEST STUDENT
        // =================================================

        const student =
            await Student.findOne({
                studentId: TEST_STUDENT_ID,
            });


        if (!student) {

            console.log(
                `❌ Student ${TEST_STUDENT_ID} was not found.`
            );

            await mongoose.connection.close();

            process.exit(1);
        }


        // =================================================
        // RESET ACCOUNT INFORMATION
        // =================================================
        //
        // IMPORTANT:
        //
        // studentId
        // fullName
        // yearLevel
        //
        // WILL NOT BE CHANGED.
        //
        // Only testing/account information is reset.
        // =================================================

        student.email = null;

        student.passwordHash = null;

        student.mustChangePassword = true;

        student.profilePicture = null;

        student.profilePictureUploadedAt = null;

        student.registrationStatus =
            "not_registered";

        student.otpHash = null;

        student.otpExpiresAt = null;

        student.otpVerified = false;

        student.otpVerifiedAt = null;

        student.registeredAt = null;

        student.hasVoted = false;


        // =================================================
        // SAVE CHANGES
        // =================================================

        await student.save();


        // =================================================
        // DISPLAY RESULT
        // =================================================

        console.log("");
        console.log("========================================");
        console.log("✅ TEST STUDENT RESET SUCCESSFULLY");
        console.log("========================================");

        console.log(
            "Student ID:",
            student.studentId
        );

        console.log(
            "Full Name:",
            student.fullName
        );

        console.log(
            "Year Level:",
            student.yearLevel
        );

        console.log(
            "Email:",
            student.email
        );

        console.log(
            "Registration:",
            student.registrationStatus
        );

        console.log(
            "Password Hash:",
            student.passwordHash
        );

        console.log(
            "Must Change Password:",
            student.mustChangePassword
        );

        console.log(
            "Profile Picture:",
            student.profilePicture
        );

        console.log(
            "OTP Verified:",
            student.otpVerified
        );

        console.log(
            "Has Voted:",
            student.hasVoted
        );

        console.log("========================================");

        console.log(
            `🧪 Student ${TEST_STUDENT_ID} is ready for testing.`
        );

        console.log("========================================");
        console.log("");


        // =================================================
        // CLOSE DATABASE
        // =================================================

        await mongoose.connection.close();

        process.exit(0);


    } catch (error) {

        console.error("");
        console.error("❌ Reset failed:");
        console.error(error);


        try {

            await mongoose.connection.close();

        } catch (closeError) {

            console.error(
                "❌ Database close error:",
                closeError.message
            );
        }


        process.exit(1);
    }
};


// =====================================================
// RUN
// =====================================================

resetTestStudent();