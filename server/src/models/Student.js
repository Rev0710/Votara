const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
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
    enum: [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
    ],
    trim: true,
},

        email: {
            type: String,
            default: null,
            lowercase: true,
            trim: true,
        },

        // ==========================================
        // PROFILE INFORMATION
        // ==========================================

        firstName: {
            type: String,
            default: "",
            trim: true,
        },

        middleName: {
            type: String,
            default: "",
            trim: true,
        },

        lastName: {
            type: String,
            default: "",
            trim: true,
        },

        birthday: {
            type: String,
            default: "",
            trim: true,
        },

        contactNumber: {
            type: String,
            default: "",
            trim: true,
        },

        // ==========================================
        // CURRENT ADDRESS
        // ==========================================

        province: {
            type: String,
            default: "",
            trim: true,
        },

        barangay: {
            type: String,
            default: "",
            trim: true,
        },

        city: {
            type: String,
            default: "",
            trim: true,
        },

        // ==========================================
        // PASSWORD
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
        // REGISTRATION TYPE
        // ==========================================

        registrationType: {
            type: String,
            enum: [
                "normal",
                "late_enrollee",
            ],
            default: "normal",
        },

        // ==========================================
        // EB APPROVAL
        // ==========================================

        ebApprovalStatus: {
            type: String,
            enum: [
                "not_required",
                "pending",
                "approved",
                "rejected",
            ],
            default: "not_required",
        },

        ebApprovedAt: {
            type: Date,
            default: null,
        },

        ebRejectedAt: {
            type: Date,
            default: null,
        },

        ebApprovalRemarks: {
            type: String,
            default: "",
            trim: true,
        },

        // ==========================================
        // LATE ENROLLEE VERIFICATION
        // ==========================================

        lateEnrolleeVerification: {
            identityDocument: {
                type: String,
                default: null,
            },

            identityDocumentUploadedAt: {
                type: Date,
                default: null,
            },

            selfie: {
                type: String,
                default: null,
            },

            selfieUploadedAt: {
                type: Date,
                default: null,
            },

            verificationStatus: {
                type: String,
                enum: [
                    "not_required",
                    "pending",
                    "in_progress",
                    "completed",
                    "rejected",
                ],
                default: "not_required",
            },

            verifiedAt: {
                type: Date,
                default: null,
            },
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

module.exports =
    mongoose.model("Student", studentSchema);