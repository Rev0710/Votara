const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Student = require("../models/Student");

// =====================================================
// EXISTING TEST STUDENTS TO RESET
// =====================================================

const studentsToReset = [
    "70550",
    "70613",
    "65185",
];

// =====================================================
// NEW TEST STUDENTS
// =====================================================

const testStudents = [
    {
        studentId: "90001",
        fullName: "TEST, VOTARA STUDENT ONE",
        yearLevel: "1",
        email: "test.student1@votara.test",
    },

    {
        studentId: "90002",
        fullName: "TEST, VOTARA STUDENT TWO",
        yearLevel: "2",
        email: "test.student2@votara.test",
    },

    {
        studentId: "90003",
        fullName: "TEST, VOTARA STUDENT THREE",
        yearLevel: "3",
        email: "test.student3@votara.test",
    },
];

// =====================================================
// DEFAULT PASSWORD
// =====================================================

const DEFAULT_PASSWORD =
    "Votara@1234";

// =====================================================
// SIMPLE TEST PROFILE PICTURE
// =====================================================
//
// This prevents the existing login flow from thinking
// that the student still needs to upload a picture.
//
// It is only a small SVG placeholder.
//

const createTestProfilePicture = (
    studentNumber
) => {

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="300"
            height="300"
            viewBox="0 0 300 300"
        >

            <rect
                width="300"
                height="300"
                fill="#0647ff"
            />

            <circle
                cx="150"
                cy="110"
                r="55"
                fill="#ffffff"
            />

            <circle
                cx="150"
                cy="270"
                r="95"
                fill="#ffffff"
            />

            <text
                x="150"
                y="175"
                text-anchor="middle"
                font-family="Arial"
                font-size="20"
                font-weight="bold"
                fill="#0647ff"
            >
                VOTARA TEST
            </text>

            <text
                x="150"
                y="200"
                text-anchor="middle"
                font-family="Arial"
                font-size="18"
                fill="#0647ff"
            >
                ${studentNumber}
            </text>

        </svg>
    `;

    return (
        "data:image/svg+xml;base64," +
        Buffer.from(svg).toString("base64")
    );
};

// =====================================================
// MAIN FUNCTION
// =====================================================

const resetAndCreateTests = async () => {

    try {

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "   VOTARA TEST STUDENT RESET + CREATE"
        );

        console.log(
            "========================================"
        );

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
        // RESET EXISTING TEST STUDENTS
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
            `✅ Existing test students matched: ${resetResult.matchedCount}`
        );

        console.log(
            `✅ Existing test students modified: ${resetResult.modifiedCount}`
        );

        // =================================================
        // HASH DEFAULT PASSWORD
        // =================================================

        console.log("");
        console.log(
            "🔐 Creating password hash..."
        );

        const passwordHash =
            await bcrypt.hash(
                DEFAULT_PASSWORD,
                10
            );

        console.log(
            "✅ Password hash generated."
        );

        // =================================================
        // CREATE NEW TEST STUDENTS
        // =================================================

        console.log("");
        console.log(
            "👨‍🎓 Creating new dashboard test students..."
        );

        let created = 0;
        let skipped = 0;

        for (
            const testStudent of testStudents
        ) {

            // =============================================
            // CHECK IF STUDENT ALREADY EXISTS
            // =============================================

            const existingStudent =
                await Student.findOne({
                    studentId:
                        testStudent.studentId,
                });

            if (existingStudent) {

                console.log(
                    `⚠️ ${testStudent.studentId} already exists. Skipping.`
                );

                skipped++;

                continue;
            }

            // =============================================
            // CREATE STUDENT
            // =============================================

            await Student.create({

                // -----------------------------------------
                // BASIC INFORMATION
                // -----------------------------------------

                studentId:
                    testStudent.studentId,

                fullName:
                    testStudent.fullName,

                yearLevel:
                    testStudent.yearLevel,

                // -----------------------------------------
                // EMAIL
                // -----------------------------------------

                email:
                    testStudent.email,

                // -----------------------------------------
                // PASSWORD
                // -----------------------------------------

                passwordHash,

                mustChangePassword:
                    false,

                // -----------------------------------------
                // PROFILE
                // -----------------------------------------

                profilePicture:
                    createTestProfilePicture(
                        testStudent.studentId
                    ),

                profilePictureUploadedAt:
                    new Date(),

                // -----------------------------------------
                // REGISTRATION
                // -----------------------------------------

                registrationStatus:
                    "submitted",

                // -----------------------------------------
                // OTP
                // -----------------------------------------

                otpHash: null,

                otpExpiresAt: null,

                otpVerified: true,

                otpVerifiedAt:
                    new Date(),

                registeredAt:
                    new Date(),

                // -----------------------------------------
                // VOTING
                // -----------------------------------------

                hasVoted: false,
            });

            created++;

            console.log("");
            console.log(
                "----------------------------------------"
            );

            console.log(
                `✅ Created: ${testStudent.studentId}`
            );

            console.log(
                `   Name: ${testStudent.fullName}`
            );

            console.log(
                `   Year: ${testStudent.yearLevel}`
            );

            console.log(
                `   Email: ${testStudent.email}`
            );

            console.log(
                `   Password: ${DEFAULT_PASSWORD}`
            );

            console.log(
                "   Registration: submitted"
            );

            console.log(
                "   Password change required: NO"
            );

            console.log(
                "   Profile picture: YES (test placeholder)"
            );

            console.log(
                "----------------------------------------"
            );
        }

        // =================================================
        // FINAL COUNT
        // =================================================

        const totalStudents =
            await Student.countDocuments();

        // =================================================
        // CHECK NEW TEST STUDENTS
        // =================================================

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "       TEST STUDENT SUMMARY"
        );

        console.log(
            "========================================"
        );

        console.log(
            `➕ New students created: ${created}`
        );

        console.log(
            `⏭️ Existing test IDs skipped: ${skipped}`
        );

        console.log(
            `📊 Total students in MongoDB: ${totalStudents}`
        );

        console.log(
            "========================================"
        );

        console.log(
            "       LOGIN INFORMATION"
        );

        console.log(
            "========================================"
        );

        for (
            const student of testStudents
        ) {

            console.log("");
            console.log(
                `Student ID: ${student.studentId}`
            );

            console.log(
                `Name: ${student.fullName}`
            );

            console.log(
                `Year Level: ${student.yearLevel}`
            );

            console.log(
                `Email: ${student.email}`
            );

            console.log(
                `Password: ${DEFAULT_PASSWORD}`
            );
        }

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "🎉 TEST STUDENTS READY"
        );

        console.log(
            "========================================"
        );

        console.log("");
        console.log(
            "These accounts can now be used to test"
        );

        console.log(
            "the VOTARA Student Login and Dashboard."
        );

        console.log("");

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

            console.log(
                "🔌 MongoDB connection closed."
            );
        }
    }
};

// =====================================================
// RUN
// =====================================================

resetAndCreateTests();
