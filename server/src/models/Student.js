const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        // ==========================================
        // STUDENT INFORMATION
        // ==========================================

        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        yearLevel: {
            type: String,
            required: true,
            enum: ["1", "2", "3", "4"],
            trim: true,
        },

        // ==========================================
        // EMAIL
        // ==========================================

        email: {
            type: String,
            default: null,
            lowercase: true,
            trim: true,
        },

        // ==========================================
        // PASSWORD / LOGIN
        // ==========================================

        passwordHash: {
            type: String,
            default: null,
        },

        mustChangePassword: {
            type: Boolean,
            default: true,
        },

        // ==========================================
        // PROFILE PICTURE
        // ==========================================

        profilePicture: {
            type: String,
            default: null,
        },

        profilePictureUploadedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // REGISTRATION
        // ==========================================

        registrationStatus: {
            type: String,
            enum: [
                "not_registered",
                "pending",
                "submitted",
            ],
            default: "not_registered",
        },

        // ==========================================
        // OTP
        // ==========================================

        otpHash: {
            type: String,
            default: null,
            select: false,
        },

        otpExpiresAt: {
            type: Date,
            default: null,
        },

        otpVerified: {
            type: Boolean,
            default: false,
        },

        otpVerifiedAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // REGISTRATION DATE
        // ==========================================

        registeredAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // VOTING
        // ==========================================

        hasVoted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Student", studentSchema);