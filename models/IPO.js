import mongoose from "mongoose";

const ipoSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    symbol: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    
    logo: {
      type: String,
      default: "",
    },

    overallSubscription: {
      type: String,
      default: "0x",
    },

    openDate: {
      type: Date,
      required: true,
    },

    closeDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("IPO", ipoSchema);