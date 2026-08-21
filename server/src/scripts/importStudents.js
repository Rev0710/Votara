const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("../models/Student");

const importStudents = async () => {
    try {
        // ==========================================
        // STUDENT FILE
        // ==========================================

        const filePath = path.join(
            __dirname,
            "../data/students.seed.json"
        );

        console.log("📄 Reading student file:");
        console.log(filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(
                `Student seed file not found:\n${filePath}`
            );
        }

        // Read JSON file
        const fileData = fs.readFileSync(
            filePath,
            "utf8"
        );

        // Parse JSON
        const students = JSON.parse(fileData);

        // Make sure JSON contains an array
        if (!Array.isArray(students)) {
            throw new Error(
                "students.seed.json must contain an array of students."
            );
        }

        console.log(
            `📚 Found ${students.length} student records.`
        );

        // ==========================================
        // CONNECT TO MONGODB
        // ==========================================

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            `🍃 MongoDB Connected: ${mongoose.connection.host}`
        );

        // ==========================================
        // IMPORT STUDENTS
        // ==========================================

        let newStudents = 0;
        let updatedStudents = 0;

        for (const studentData of students) {

            const studentId =
                String(studentData.studentId).trim();

            const fullName =
                String(studentData.fullName).trim();

            const yearLevel =
                String(studentData.yearLevel).trim();

            // Validate required data
            if (
                !studentId ||
                !fullName ||
                !yearLevel
            ) {
                console.log(
                    "⚠️ Skipping incomplete record:",
                    studentData
                );

                continue;
            }

            // Find existing student
            const existingStudent =
                await Student.findOne({
                    studentId,
                });

            if (existingStudent) {

                // Update only enrollment information
                existingStudent.fullName =
                    fullName;

                existingStudent.yearLevel =
                    yearLevel;

                await existingStudent.save();

                updatedStudents++;

            } else {

                // Create new student
                await Student.create({
                    studentId,
                    fullName,
                    yearLevel,

                    email: null,

                    registrationStatus:
                        "not_registered",

                    otpHash: null,

                    otpExpiresAt: null,

                    otpVerified: false,

                    otpVerifiedAt: null,

                    registeredAt: null,

                    hasVoted: false,
                });

                newStudents++;
            }
        }

        // ==========================================
        // RESULT
        // ==========================================

        console.log("");
        console.log("================================");
        console.log("✅ STUDENT IMPORT COMPLETED");
        console.log("================================");

        console.log(
            `📚 Total records: ${students.length}`
        );

        console.log(
            `➕ New students: ${newStudents}`
        );

        console.log(
            `🔄 Updated students: ${updatedStudents}`
        );

        console.log("================================");

    } catch (error) {

        console.error(
            "❌ Student import failed:"
        );

        console.error(error);

    } finally {

        await mongoose.connection.close();

        console.log(
            "🔌 MongoDB connection closed."
        );
    }
};


// Run import
importStudents();