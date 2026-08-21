const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("../models/Student");

const MONGO_URI = process.env.MONGO_URI;

const DATA_FILE = path.join(
    __dirname,
    "../data/students.seed.json"
);

const importStudents = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing from your .env file."
            );
        }

        console.log("📄 Reading student file:");
        console.log(DATA_FILE);

        if (!fs.existsSync(DATA_FILE)) {
            throw new Error(
                `Student seed file not found:\n${DATA_FILE}`
            );
        }

        // Read JSON file
        const fileContent = fs.readFileSync(
            DATA_FILE,
            "utf8"
        );

        if (!fileContent.trim()) {
            throw new Error(
                "Student seed file is empty."
            );
        }

        let students;

        try {
            students = JSON.parse(fileContent);
        } catch (error) {
            throw new Error(
                "students.seed.json contains invalid JSON."
            );
        }

        if (!Array.isArray(students)) {
            throw new Error(
                "students.seed.json must contain an array of students."
            );
        }

        if (students.length === 0) {
            throw new Error(
                "students.seed.json contains no students."
            );
        }

        // Validate each student
        for (const student of students) {
            if (
                !student.studentId ||
                !student.fullName ||
                !student.yearLevel
            ) {
                throw new Error(
                    `Invalid student record: ${JSON.stringify(student)}`
                );
            }

            if (
                !["1", "2", "3", "4"].includes(
                    String(student.yearLevel)
                )
            ) {
                throw new Error(
                    `Invalid year level for student ${student.studentId}.`
                );
            }
        }

        // Connect MongoDB
        await mongoose.connect(MONGO_URI);

        console.log(
            "🍃 MongoDB Connected:",
            mongoose.connection.host
        );

        // Insert/update students
        let inserted = 0;
        let updated = 0;

        for (const student of students) {
            const existingStudent =
                await Student.findOne({
                    studentId: String(
                        student.studentId
                    ),
                });

            if (existingStudent) {
                existingStudent.fullName =
                    student.fullName;

                existingStudent.yearLevel =
                    String(student.yearLevel);

                await existingStudent.save();

                updated++;
            } else {
                await Student.create({
                    studentId: String(
                        student.studentId
                    ),
                    fullName: student.fullName,
                    yearLevel: String(
                        student.yearLevel
                    ),
                });

                inserted++;
            }
        }

        console.log("");
        console.log("================================");
        console.log("✅ STUDENT IMPORT COMPLETED");
        console.log("================================");
        console.log(
            `📚 Total records: ${students.length}`
        );
        console.log(
            `➕ New students: ${inserted}`
        );
        console.log(
            `🔄 Updated students: ${updated}`
        );
        console.log("================================");

    } catch (error) {
        console.error("");
        console.error("❌ Student import failed:");
        console.error(error);

        process.exitCode = 1;

    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();

            console.log(
                "🔌 MongoDB connection closed."
            );
        }
    }
};

importStudents();