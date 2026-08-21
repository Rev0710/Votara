require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

const checkStudent = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("🍃 MongoDB Connected");

        const student = await Student.findOne({
            studentId: "70613",
        });

        if (!student) {
            console.log("❌ STUDENT NOT FOUND");
        } else {
            console.log("================================");
            console.log("✅ STUDENT FOUND");
            console.log("================================");
            console.log("Student ID:", student.studentId);
            console.log("Full Name:", student.fullName);
            console.log("Year Level:", student.yearLevel);
            console.log("Email:", student.email);
            console.log("Registration:", student.registrationStatus);
            console.log("================================");
        }

    } catch (error) {

        console.error("❌ Error:");
        console.error(error);

    } finally {

        await mongoose.connection.close();

        console.log("🔌 MongoDB connection closed.");
    }
};

checkStudent();