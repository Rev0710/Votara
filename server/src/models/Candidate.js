const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    // The election this candidate belongs to
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },

    // The position this candidate is running for
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
      index: true,
    },

    // Candidate's student account
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // Candidate name displayed to voters
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    // Candidate profile photo
    profilePicture: {
      type: String,
      default: "",
      trim: true,
    },

    // Candidate's platform / description
    platform: {
      type: String,
      default: "",
      trim: true,
    },

    // Candidate approval by Electoral Board
    approvalStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
      ],
      default: "pending",
    },

    // Optional remarks from the Electoral Board
    approvalRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    // When the EB approved/rejected the candidate
    approvedAt: {
      type: Date,
      default: null,
    },

    // EB/Admin user who performed the approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Allows a candidate to be temporarily disabled
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// A student cannot run twice for the same position
// in the same election.
candidateSchema.index(
  {
    election: 1,
    position: 1,
    student: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Candidate", candidateSchema);