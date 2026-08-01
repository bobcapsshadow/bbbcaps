import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["deposit", "withdraw"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      required: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },
    withdrawRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WithdrawRequest",
        default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("History", historySchema);