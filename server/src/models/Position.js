const mongoose = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    // The election this position belongs to
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Election",
      required: true,
      index: true,
    },

    // Example: President, Vice President, 1st Year Representative
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional explanation/details about the position
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Determines the order in which positions appear
    order: {
      type: Number,
      default: 0,
    },

    // Whether voters must select someone for this position
    isRequired: {
      type: Boolean,
      default: true,
    },

    // Which year levels can vote for this position
    // Empty array = available to all year levels
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

    // Allows EB/Admin to temporarily disable a position
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate position names within the same election
positionSchema.index(
  { election: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Position", positionSchema);