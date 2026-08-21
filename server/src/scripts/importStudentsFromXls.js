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

    // Read workbook
    const workbook = XLSX.readFile(filePath);

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];

    const worksheet =
        workbook.Sheets[sheetName];

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

    for (const row of rows) {

        // ---------------------------------------------
        // Read exact column names from your Excel file
        // ---------------------------------------------

        const studentId =
            String(
                row["Student ID"] || ""
            ).trim();

        const fullName =
            String(
                row["Student Name"] || ""
            ).trim();

        const yearLevel =
            String(
                row["Year"] || ""
            ).trim();


        // ---------------------------------------------
        // Skip incomplete rows
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
                `⚠️ Skipping invalid year for Student ID ${studentId}: ${yearLevel}`
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


    return students;
};


// =====================================================
// IMPORT STUDENTS TO MONGODB
// =====================================================

const importStudents = async () => {

    try {

        // ---------------------------------------------
        // Check MongoDB URI
        // ---------------------------------------------

        if (!process.env.MONGO_URI) {

            throw new Error(
                "MONGO_URI is missing from .env"
            );

        }


        // ---------------------------------------------
        // Read Excel
        // ---------------------------------------------

        const students =
            readStudentFile();


        console.log(
            `📚 Valid students found: ${students.length}`
        );


        if (students.length === 0) {

            throw new Error(
                "No valid student records were found in the Excel file."
            );

        }


        // ---------------------------------------------
        // Connect MongoDB
        // ---------------------------------------------

        await mongoose.connect(
            process.env.MONGO_URI
        );


        console.log(
            "🍃 MongoDB Connected:",
            mongoose.connection.host
        );


        // ---------------------------------------------
        // Import students
        // ---------------------------------------------

        let inserted = 0;
        let updated = 0;
        let skipped = 0;


        for (const studentData of students) {

            try {

                const existingStudent =
                    await Student.findOne({
                        studentId:
                            studentData.studentId,
                    });


                // =====================================
                // STUDENT ALREADY EXISTS
                // =====================================

                if (existingStudent) {

                    // Only update official
                    // enrollment information.

                    existingStudent.fullName =
                        studentData.fullName;

                    existingStudent.yearLevel =
                        studentData.yearLevel;

                    await existingStudent.save();

                    updated++;

                    continue;
                }


                // =====================================
                // NEW STUDENT
                // =====================================

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

            } catch (studentError) {

                console.error(
                    `❌ Error importing Student ID ${studentData.studentId}:`
                );

                console.error(
                    studentError.message
                );

                skipped++;

            }
        }


        // =================================================
        // IMPORT RESULT
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
            `📚 Records read: ${students.length}`
        );

        console.log(
            `➕ New students inserted: ${inserted}`
        );

        console.log(
            `🔄 Existing students updated: ${updated}`
        );

        console.log(
            `⚠️ Students skipped: ${skipped}`
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