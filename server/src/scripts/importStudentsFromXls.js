require("dotenv").config();

const path = require("path");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const Student = require("../models/Student");

// =====================================================
// EXCEL FILE LOCATION
// =====================================================

const filePath = path.join(
    __dirname,
    "../data/Student file.csv.xlsx"
);


// =====================================================
// READ EXCEL FILE
// =====================================================

const readStudentFile = () => {

    console.log("📄 Reading student Excel file:");
    console.log(filePath);

    // Check if file exists
    const fs = require("fs");

    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Excel file not found:\n${filePath}`
        );
    }

    // Read workbook
    const workbook = XLSX.readFile(filePath);

    // Get first worksheet
    const sheetName =
        workbook.SheetNames[0];

    const worksheet =
        workbook.Sheets[sheetName];

    console.log(
        `📑 Worksheet: ${sheetName}`
    );

    // Convert worksheet to JSON
    const rows =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: "",
            }
        );

    console.log(
        `📊 Rows found in Excel: ${rows.length}`
    );

    const students = [];

    // =================================================
    // READ STUDENTS
    // =================================================

    for (const row of rows) {

        const studentId =
            String(
                row["Student ID"] ?? ""
            ).trim();

        const fullName =
            String(
                row["Student Name"] ?? ""
            ).trim();

        const yearLevel =
            String(
                row["Year"] ?? ""
            ).trim();


        // ---------------------------------------------
        // Skip incomplete records
        // ---------------------------------------------

        if (
            !studentId ||
            !fullName ||
            !yearLevel
        ) {
            continue;
        }


        // ---------------------------------------------
        // Validate year
        // ---------------------------------------------

        if (
            !["1", "2", "3", "4"].includes(
                yearLevel
            )
        ) {

            console.log(
                `⚠️ Skipping invalid year - Student ID: ${studentId}, Year: ${yearLevel}`
            );

            continue;
        }


        // ---------------------------------------------
        // Add student
        // ---------------------------------------------

        students.push({
            studentId,
            fullName,
            yearLevel,
        });
    }


    // =================================================
    // REMOVE DUPLICATE STUDENT IDS
    // =================================================

    const uniqueStudents =
        Array.from(
            new Map(
                students.map(
                    (student) => [
                        student.studentId,
                        student,
                    ]
                )
            ).values()
        );


    console.log(
        `📚 Valid unique students found: ${uniqueStudents.length}`
    );


    return uniqueStudents;
};


// =====================================================
// IMPORT STUDENTS
// =====================================================

const importStudents = async () => {

    try {

        // =================================================
        // CHECK ENVIRONMENT
        // =================================================

        if (!process.env.MONGO_URI) {

            throw new Error(
                "MONGO_URI is missing from .env"
            );

        }


        // =================================================
        // READ EXCEL
        // =================================================

        const students =
            readStudentFile();


        if (
            students.length === 0
        ) {

            throw new Error(
                "No valid student records were found."
            );

        }


        // =================================================
        // CONNECT MONGODB
        // =================================================

        console.log(
            "🔌 Connecting to MongoDB..."
        );

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "🍃 MongoDB Connected:",
            mongoose.connection.host
        );


        // =================================================
        // PREPARE BULK OPERATIONS
        // =================================================

        console.log(
            "⚙️ Preparing MongoDB import..."
        );

        const operations =
            students.map(
                (student) => ({

                    updateOne: {

                        filter: {
                            studentId:
                                student.studentId,
                        },

                        // ---------------------------------
                        // UPDATE EXISTING STUDENT
                        // ---------------------------------

                        update: {

                            $set: {

                                // These are official
                                // enrollment records.

                                fullName:
                                    student.fullName,

                                yearLevel:
                                    student.yearLevel,

                            },

                            // ---------------------------------
                            // ONLY FOR NEW STUDENTS
                            // ---------------------------------

                            $setOnInsert: {

                                email: null,

                                passwordHash: null,

                                mustChangePassword:
                                    true,

                                profilePicture: null,

                                profilePictureUploadedAt:
                                    null,

                                registrationStatus:
                                    "not_registered",

                                otpHash: null,

                                otpExpiresAt: null,

                                otpVerified:
                                    false,

                                otpVerifiedAt:
                                    null,

                                registeredAt:
                                    null,

                                hasVoted:
                                    false,

                            },
                        },

                        upsert: true,

                    },

                })
            );


        console.log(
            `📦 MongoDB operations prepared: ${operations.length}`
        );


        // =================================================
        // BULK WRITE
        // =================================================

        console.log(
            "🚀 Importing students into MongoDB..."
        );

        const result =
            await Student.bulkWrite(
                operations,
                {
                    ordered: false,
                }
            );


        // =================================================
        // RESULTS
        // =================================================

        console.log("");

        console.log(
            "=========================================="
        );

        console.log(
            "✅ STUDENT IMPORT COMPLETED"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `📚 Excel records: ${students.length}`
        );

        console.log(
            `➕ New students inserted: ${
                result.upsertedCount || 0
            }`
        );

        console.log(
            `🔄 Existing students matched: ${
                result.matchedCount || 0
            }`
        );

        console.log(
            `✏️ Existing students modified: ${
                result.modifiedCount || 0
            }`
        );

        console.log(
            `⚠️ Upserted documents: ${
                result.upsertedCount || 0
            }`
        );

        console.log(
            "=========================================="
        );


    } catch (error) {

        console.error("");

        console.error(
            "❌ STUDENT IMPORT FAILED"
        );

        console.error(
            "=========================================="
        );

        console.error(
            error.message
        );

        console.error(
            "=========================================="
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
// START IMPORT
// =====================================================

importStudents();