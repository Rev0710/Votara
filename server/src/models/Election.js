const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
    {
        // ==========================================
        // ELECTION INFORMATION
        // ==========================================

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        // ==========================================
        // ELECTION DATE & TIME
        // ==========================================

        electionDate: {
            type: Date,
            required: true,
        },

        startTime: {
            type: String,
            required: true,
            trim: true,
        },

        endTime: {
            type: String,
            required: true,
            trim: true,
        },

        // ==========================================
        // ELECTION STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "draft",
                "scheduled",
                "active",
                "closed",
                "cancelled",
            ],
            default: "draft",
        },

        // ==========================================
        // YEAR-LEVEL ACCESS
        // ==========================================

        yearLevelAccess: {
            type: [
                {
                    type: String,
                    enum: [
                        "1st Year",
                        "2nd Year",
                        "3rd Year",
                        "4th Year",
                    ],
                },
            ],
            default: [],
        },

        // ==========================================
        // REGISTRATION PERIOD
        // ==========================================

        registrationStart: {
            type: Date,
            default: null,
        },

        registrationEnd: {
            type: Date,
            default: null,
        },

        // ==========================================
        // ELECTION CONTROL
        // ==========================================

        isPublished: {
            type: Boolean,
            default: false,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        closedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Election", electionSchema);