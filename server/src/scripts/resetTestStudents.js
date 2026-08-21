require("dotenv").config();

const mongoose = require("mongoose");
const Student = require("../models/Student");

const resetTestStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("🍃 MongoDB connected.");

        const result = await Student.updateMany(
            {
                studentId: {
                    $in: [
                        "70550",
                        "65185"
                    ]
                }
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

                    hasVoted: false
                },

                $unset: {
                    otpHash: "",
                    otpExpiresAt: ""
                }
            }
        );

        console.log(
            "✅ Reset completed."
        );

        console.log(
            `Matched: ${result.matchedCount}`
        );

        console.log(
            `Modified: ${result.modifiedCount}`
        );

    } catch (error) {

        console.error(
            "❌ Reset failed:",
            error
        );

    } finally {

        await mongoose.connection.close();

        console.log(
            "🔌 MongoDB connection closed."
        );
    }
};

resetTestStudents();