const mongoose = require("mongoose");


// =====================================================
// USER SCHEMA
// Used for Electoral Board and Admin accounts
// =====================================================

const userSchema = new mongoose.Schema(
    {

        // =================================================
        // BASIC INFORMATION
        // =================================================

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },


        // =================================================
        // PASSWORD
        // =================================================

        passwordHash: {
            type: String,
            required: true,
        },


        // =================================================
        // ROLE
        // =================================================

        role: {
            type: String,
            required: true,
            enum: [
                "admin",
                "electoral_board",
            ],
            default: "electoral_board",
        },


        // =================================================
        // ACCOUNT STATUS
        // =================================================

        isActive: {
            type: Boolean,
            default: true,
        },


        // =================================================
        // LOGIN SECURITY
        // =================================================

        failedLoginAttempts: {
            type: Number,
            default: 0,
        },

        lockedUntil: {
            type: Date,
            default: null,
        },


        // =================================================
        // LOGIN INFORMATION
        // =================================================

        lastLoginAt: {
            type: Date,
            default: null,
        },


        // =================================================
        // ACCOUNT CREATION
        // =================================================

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

    },
    {
        timestamps: true,
    }
);


// =====================================================
// INDEXES
// =====================================================

userSchema.index({
    email: 1,
});

userSchema.index({
    role: 1,
});


// =====================================================
// MODEL
// =====================================================

module.exports =
    mongoose.model("User", userSchema);