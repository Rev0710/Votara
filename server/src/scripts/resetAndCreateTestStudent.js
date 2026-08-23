const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("../models/Student");

// =====================================================
// STUDENTS THAT WE ARE ALLOWED TO RESET
// =====================================================
//
// IMPORTANT:
// 69700 IS NOT INCLUDED HERE.
// WE WILL NOT TOUCH 69700.
//

const studentsToReset = [
    "70550",
    "70613",
    "65185",
];

// =====================================================
// NEW TEST STUDENT
// =====================================================

const testStudent = {
    studentId: "90005",
    fullName: "Test Student",
    yearLevel: "1",
};

// =====================================================
// MAIN FUNCTION
// =====================================================

const resetAndCreateTestStudent = async () => {

    try {

        console.log("");
        console.log("========================================");
        console.log("     VOTARA TEST STUDENT SETUP");
        console.log("========================================");

        // =================================================
        // CHECK MONGO URI
        // =================================================

        if (!process.env.MONGO_URI) {

            throw new Error(
                "MONGO_URI is not configured in your .env file."
            );

        }

        // =================================================
        // CONNECT TO MONGODB
        // =================================================

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log("");
        console.log(
            `🍃 MongoDB Connected: ${mongoose.connection.host}`
        );

        // =================================================
        // RESET ONLY THE SPECIFIED OLD TEST STUDENTS
        // =================================================

        console.log("");
        console.log(
            "🔄 Resetting existing test students..."
        );

        const resetResult =
            await Student.updateMany(

                {
                    studentId: {
                        $in: studentsToReset,
                    },
                },

                {
                    $set: {

                        email: null,

                        passwordHash: null,

                        mustChangePassword: true,

                        profilePicture: null,

                        profilePictureUploadedAt: null,

                        registrationStatus:
                            "not_registered",

                        otpVerified: false,

                        otpVerifiedAt: null,

                        registeredAt: null,

                        hasVoted: false,
                    },

                    $unset: {

                        otpHash: "",

                        otpExpiresAt: "",
                    },
                }
            );

        console.log(
            `✅ Reset matched: ${resetResult.matchedCount}`
        );

        console.log(
            `✅ Reset modified: ${resetResult.modifiedCount}`
        );

        // =================================================
        // IMPORTANT CHECK:
        // MAKE SURE 69700 STILL EXISTS
        // =================================================

        const protectedStudent =
            await Student.findOne({
                studentId: "69700",
            });

        if (protectedStudent) {

            console.log("");
            console.log(
                "🛡️ Student 69700 was NOT modified."
            );

        } else {

            console.log("");
            console.log(
                "⚠️ Student 69700 was not found in MongoDB."
            );

        }

        // =================================================
        // CHECK IF 90005 ALREADY EXISTS
        // =================================================

        console.log("");
        console.log(
            "🔎 Checking Student ID 90005..."
        );

        const existingStudent =
            await Student.findOne({
                studentId:
                    testStudent.studentId,
            });

        // =================================================
        // IF 90005 EXISTS:
        // RESET IT TO UNREGISTERED STATE
        // =================================================

        if (existingStudent) {

            console.log(
                "⚠️ Student 90005 already exists."
            );

            console.log(
                "🔄 Resetting Student 90005..."
            );

            existingStudent.fullName =
                testStudent.fullName;

            existingStudent.yearLevel =
                testStudent.yearLevel;

            existingStudent.email = null;

            existingStudent.passwordHash = null;

            existingStudent.mustChangePassword =
                true;

            existingStudent.profilePicture = null;

            existingStudent.profilePictureUploadedAt =
                null;

            existingStudent.registrationStatus =
                "not_registered";

            existingStudent.otpHash = null;

            existingStudent.otpExpiresAt = null;

            existingStudent.otpVerified =
                false;

            existingStudent.otpVerifiedAt =
                null;

            existingStudent.registeredAt =
                null;

            existingStudent.hasVoted =
                false;

            await existingStudent.save();

            console.log(
                "✅ Student 90005 has been reset."
            );

        }

        // =================================================
        // OTHERWISE CREATE 90005
        // =================================================

        else {

            console.log("");
            console.log(
                "👨‍🎓 Creating Student 90005..."
            );

            await Student.create({

                studentId:
                    testStudent.studentId,

                fullName:
                    testStudent.fullName,

                yearLevel:
                    testStudent.yearLevel,

                email: null,

                passwordHash: null,

                mustChangePassword: true,

                profilePicture: null,

                profilePictureUploadedAt: null,

                registrationStatus:
                    "not_registered",

                otpHash: null,

                otpExpiresAt: null,

                otpVerified: false,

                otpVerifiedAt: null,

                registeredAt: null,

                hasVoted: false,
            });

            console.log(
                "✅ Student 90005 created."
            );
        }

        // =================================================
        // VERIFY 90005
        // =================================================

        const finalStudent =
            await Student.findOne({
                studentId: "90005",
            });

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "       STUDENT 90005 READY"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Student ID: ${finalStudent.studentId}`
        );

        console.log(
            `Full Name: ${finalStudent.fullName}`
        );

        console.log(
            `Year Level: ${finalStudent.yearLevel}`
        );

        console.log(
            `Email: ${finalStudent.email}`
        );

        console.log(
            `Password Hash: ${finalStudent.passwordHash}`
        );

        console.log(
            `Must Change Password: ${finalStudent.mustChangePassword}`
        );

        console.log(
            `Registration Status: ${finalStudent.registrationStatus}`
        );

        console.log(
            `Profile Picture: ${finalStudent.profilePicture}`
        );

        console.log(
            `OTP Verified: ${finalStudent.otpVerified}`
        );

        console.log(
            `Has Voted: ${finalStudent.hasVoted}`
        );

        console.log(
            "========================================"
        );

        console.log("");
        console.log(
            "🎉 TEST STUDENT IS READY!"
        );

        console.log("");

        console.log(
            "Use this Student ID to test registration:"
        );

        console.log(
            "👉 90005"
        );

        console.log("");

        console.log(
            "The student is currently:"
        );

        console.log(
            "👉 NOT REGISTERED"
        );

        console.log("");

        console.log(
            "The default password will NOT be stored"
        );

        console.log(
            "until registration is completed."
        );

        console.log("");

        console.log(
            "After registration, use:"
        );

        console.log(
            "👉 Student ID: 90005"
        );

        console.log(
            "👉 Default Password: votara@123"
        );

        console.log("");

        console.log(
            "Expected flow:"
        );

        console.log(
            "Register → OTP → Registration Submitted"
        );

        console.log(
            "→ Login → Change Password"
        );

        console.log(
            "→ Upload/Take Photo → Dashboard"
        );

        console.log("");

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error("");
        console.error(
            "❌ TEST STUDENT SETUP FAILED"
        );

        console.error(
            "----------------------------------------"
        );

        console.error(
            error.message
        );

        console.error(
            "----------------------------------------"
        );

    } finally {

        if (
            mongoose.connection.readyState !== 0
        ) {

            await mongoose.connection.close();

            console.log("");
            console.log(
                "🔌 MongoDB connection closed."
            );

        }
    }
};

// =====================================================
// RUN
// =====================================================

resetAndCreateTestStudent();