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
    console.log("📄 Reading student file:");
    console.log(filePath);

    // Check if file exists
    const fs = require("fs");

    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Student Excel file not found:\n${filePath}`
        );
    }

    // Read Excel workbook
    const workbook = XLSX.readFile(filePath);

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new Error(
            "No worksheet was found in the Excel file."
        );
    }

    console.log(`📑 Worksheet: ${sheetName}`);

    const worksheet =
        workbook.Sheets[sheetName];

    // Convert worksheet to JSON
    const rows = XLSX.utils.sheet_to_json(
        worksheet,
        {
            defval: "",
        }
    );

    console.log(
        `📚 Rows found in Excel file: ${rows.length}`
    );

    if (rows.length === 0) {
        throw new Error(
            "The Excel file contains no student records."
        );
    }

    // Show actual column names
    console.log(
        "📋 Excel columns:"
    );

    console.log(
        Object.keys(rows[0])
    );

    const students = [];

    for (const row of rows) {

        // -------------------------------------------------
        // Find Student ID
        // -------------------------------------------------

        const studentId =
            row["Student ID"] ??
            row["StudentId"] ??
            row["studentId"] ??
            row["Student No."] ??
            row["Student No"] ??
            row["ID"] ??
            row["id"] ??
            "";


        // -------------------------------------------------
        // Find Full Name
        // -------------------------------------------------

        const fullName =
            row["Full Name"] ??
            row["FullName"] ??
            row["fullName"] ??
            row["Name"] ??
            row["name"] ??
            "";


        // -------------------------------------------------
        // Find Year Level
        // -------------------------------------------------

        const yearLevel =
            row["Year Level"] ??
            row["YearLevel"] ??
            row["yearLevel"] ??
            row["Year"] ??
            row["year"] ??
            "";


        // -------------------------------------------------
        // Clean values
        // -------------------------------------------------

        const cleanStudentId =
            String(studentId)
                .trim();

        const cleanFullName =
            String(fullName)
                .trim();

        const cleanYearLevel =
            String(yearLevel)
                .trim()
                .replace(
                    /^Year\s*/i,
                    ""
                );


        // -------------------------------------------------
        // Skip invalid rows
        // -------------------------------------------------

        if (
            !cleanStudentId ||
            !cleanFullName ||
            !["1", "2", "3", "4"].includes(
                cleanYearLevel
            )
        ) {
            continue;
        }


        // -------------------------------------------------
        // Add valid student
        // -------------------------------------------------

        students.push({
            studentId:
                cleanStudentId,

            fullName:
                cleanFullName,

            yearLevel:
                cleanYearLevel,
        });
    }

    return students;
};


// =====================================================
// IMPORT STUDENTS TO MONGODB
// =====================================================

const importStudents = async () => {

    try {

        // -------------------------------------------------
        // Check MongoDB URI
        // -------------------------------------------------

        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing from .env"
            );
        }


        // -------------------------------------------------
        // Read Excel
        // -------------------------------------------------

        const students =
            readStudentFile();


        console.log(
            `✅ Valid student records: ${students.length}`
        );


        if (students.length === 0) {

            throw new Error(
                "No valid student records were found. Check the Excel column names and year-level values."
            );

        }


        // -------------------------------------------------
        // Connect MongoDB
        // -------------------------------------------------

        await mongoose.connect(
            process.env.MONGO_URI
        );


        console.log(
            "🍃 MongoDB Connected:",
            mongoose.connection.host
        );


        // -------------------------------------------------
        // Import students
        // -------------------------------------------------

        let inserted = 0;
        let updated = 0;
        let skipped = 0;


        for (const studentData of students) {

            const existingStudent =
                await Student.findOne({
                    studentId:
                        studentData.studentId,
                });


            // -------------------------------------------------
            // EXISTING STUDENT
            // -------------------------------------------------

            if (existingStudent) {

                /*
                 * IMPORTANT:
                 *
                 * We only update official enrollment
                 * information.
                 *
                 * We DO NOT reset:
                 *
                 * - email
                 * - password
                 * - OTP
                 * - registration status
                 * - voting status
                 */

                existingStudent.fullName =
                    studentData.fullName;

                existingStudent.yearLevel =
                    studentData.yearLevel;

                await existingStudent.save();

                updated++;

                continue;
            }


            // -------------------------------------------------
            // NEW STUDENT
            // -------------------------------------------------

            await Student.create({

                studentId:
                    studentData.studentId,

                fullName:
                    studentData.fullName,

                yearLevel:
                    studentData.yearLevel,

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


            inserted++;
        }


        // -------------------------------------------------
        // RESULT
        // -------------------------------------------------

        console.log("");

        console.log(
            "======================================"
        );

        console.log(
            "✅ STUDENT IMPORT COMPLETED"
        );

        console.log(
            "======================================"
        );

        console.log(
            `📚 Records read: ${students.length}`
        );

        console.log(
            `➕ New students: ${inserted}`
        );

        console.log(
            `🔄 Updated students: ${updated}`
        );

        console.log(
            `⏭️ Skipped students: ${skipped}`
        );

        console.log(
            "======================================"
        );


    } catch (error) {

        console.error("");

        console.error(
            "❌ Student import failed:"
        );

        console.error(
            error.message
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
// START IMPORT
// =====================================================

importStudents();