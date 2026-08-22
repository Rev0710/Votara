const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("../models/Student");

// =====================================================
// IMPORT STUDENTS
// =====================================================

const importStudents = async () => {
    try {

        // =================================================
        // STUDENT SEED FILE
        // =================================================

        const filePath = path.join(
            __dirname,
            "../data/students.seed.json"
        );

        console.log("");
        console.log("========================================");
        console.log("       VOTARA STUDENT IMPORT");
        console.log("========================================");

        console.log("");
        console.log("📄 Student seed file:");
        console.log(filePath);

        // =================================================
        // CHECK FILE
        // =================================================

        if (!fs.existsSync(filePath)) {

            throw new Error(
                `Student seed file not found:\n${filePath}`
            );
        }

        // =================================================
        // READ JSON
        // =================================================

        const fileData =
            fs.readFileSync(
                filePath,
                "utf8"
            );

        // =================================================
        // PARSE JSON
        // =================================================

        let students;

        try {

            students =
                JSON.parse(fileData);

        } catch (error) {

            throw new Error(
                "students.seed.json contains invalid JSON."
            );
        }

        // =================================================
        // CHECK ARRAY
        // =================================================

        if (!Array.isArray(students)) {

            throw new Error(
                "students.seed.json must contain an array of students."
            );
        }

        console.log("");
        console.log(
            `📚 Found ${students.length} student records.`
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
        // STATISTICS
        // =================================================

        let newStudents = 0;

        let updatedStudents = 0;

        let skippedStudents = 0;

        let errorStudents = 0;

        // =================================================
        // PROCESS STUDENTS
        // =================================================

        for (
            const studentData of students
        ) {

            try {

                // =========================================
                // GET STUDENT INFORMATION
                // =========================================

                const studentId =
                    String(
                        studentData.studentId ?? ""
                    ).trim();

                const fullName =
                    String(
                        studentData.fullName ?? ""
                    ).trim();

                const yearLevel =
                    String(
                        studentData.yearLevel ?? ""
                    ).trim();

                // =========================================
                // VALIDATE
                // =========================================

                if (
                    !studentId ||
                    !fullName ||
                    !yearLevel
                ) {

                    console.log("");
                    console.log(
                        "⚠️ Skipping incomplete record:"
                    );

                    console.log(
                        studentData
                    );

                    skippedStudents++;

                    continue;
                }

                // =========================================
                // VALIDATE YEAR LEVEL
                // =========================================

                if (
                    !["1", "2", "3", "4"].includes(
                        yearLevel
                    )
                ) {

                    console.log("");
                    console.log(
                        `⚠️ Invalid year level for ${studentId}: ${yearLevel}`
                    );

                    skippedStudents++;

                    continue;
                }

                // =========================================
                // FIND EXISTING STUDENT
                // =========================================

                const existingStudent =
                    await Student.findOne({
                        studentId,
                    });

                // =========================================
                // EXISTING STUDENT
                // =========================================

                if (existingStudent) {

                    /*
                     * IMPORTANT:
                     *
                     * We ONLY update:
                     *
                     * - fullName
                     * - yearLevel
                     *
                     * We DO NOT modify:
                     *
                     * - email
                     * - passwordHash
                     * - mustChangePassword
                     * - profilePicture
                     * - OTP
                     * - registrationStatus
                     * - registeredAt
                     * - hasVoted
                     *
                     * This protects students who have
                     * already registered.
                     */

                    let changed = false;

                    if (
                        existingStudent.fullName !==
                        fullName
                    ) {

                        existingStudent.fullName =
                            fullName;

                        changed = true;
                    }

                    if (
                        existingStudent.yearLevel !==
                        yearLevel
                    ) {

                        existingStudent.yearLevel =
                            yearLevel;

                        changed = true;
                    }

                    if (changed) {

                        await existingStudent.save();

                        updatedStudents++;

                        console.log(
                            `🔄 Updated: ${studentId} - ${fullName}`
                        );

                    } else {

                        skippedStudents++;

                        console.log(
                            `⏭️ Already up to date: ${studentId} - ${fullName}`
                        );
                    }

                    continue;
                }

                // =========================================
                // CREATE NEW STUDENT
                // =========================================

                await Student.create({

                    // -----------------------------
                    // BASIC INFORMATION
                    // -----------------------------

                    studentId,

                    fullName,

                    yearLevel,

                    // -----------------------------
                    // ACCOUNT
                    // -----------------------------

                    email: null,

                    passwordHash: null,

                    mustChangePassword: true,

                    // -----------------------------
                    // PROFILE PICTURE
                    // -----------------------------

                    profilePicture: null,

                    profilePictureUploadedAt: null,

                    // -----------------------------
                    // REGISTRATION
                    // -----------------------------

                    registrationStatus:
                        "not_registered",

                    // -----------------------------
                    // OTP
                    // -----------------------------

                    otpHash: null,

                    otpExpiresAt: null,

                    otpVerified: false,

                    otpVerifiedAt: null,

                    registeredAt: null,

                    // -----------------------------
                    // VOTING
                    // -----------------------------

                    hasVoted: false,
                });

                newStudents++;

                console.log(
                    `✅ Added: ${studentId} - ${fullName} - Year ${yearLevel}`
                );

            } catch (error) {

                errorStudents++;

                console.error("");

                console.error(
                    `❌ Error processing student: ${studentData.studentId}`
                );

                console.error(
                    error.message
                );
            }
        }

        // =================================================
        // FINAL DATABASE COUNT
        // =================================================

        const totalStudents =
            await Student.countDocuments();

        // =================================================
        // RESULTS
        // =================================================

        console.log("");

        console.log(
            "========================================"
        );

        console.log(
            "       STUDENT IMPORT COMPLETED"
        );

        console.log(
            "========================================"
        );

        console.log(
            `📚 Records in JSON:       ${students.length}`
        );

        console.log(
            `➕ New students:          ${newStudents}`
        );

        console.log(
            `🔄 Updated students:      ${updatedStudents}`
        );

        console.log(
            `⏭️ Skipped/up-to-date:    ${skippedStudents}`
        );

        console.log(
            `❌ Errors:                ${errorStudents}`
        );

        console.log(
            "----------------------------------------"
        );

        console.log(
            `📊 Total MongoDB students: ${totalStudents}`
        );

        console.log(
            "========================================"
        );

        if (
            totalStudents >= students.length
        ) {

            console.log(
                "✅ Student database contains all seed records."
            );

        } else {

            console.log(
                `⚠️ Database contains ${students.length - totalStudents} fewer students than the seed file.`
            );
        }

        console.log(
            "========================================"
        );

        console.log("");

    } catch (error) {

        console.error("");

        console.error(
            "❌ STUDENT IMPORT FAILED"
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

        // =================================================
        // CLOSE MONGODB
        // =================================================

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
// RUN IMPORT
// =====================================================

importStudents();
