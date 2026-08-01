import mongoose from "mongoose";

const userIpoSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    ipoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IPO",
      required: true,
    },

    subscribed: {
      type: Boolean,
      default: true,
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },

    pricePerShare: {
      type: Number,
      default: 0,
    },

    winningQuantity: {
      type: Number,
      default: 0,
    },

    subscriptionQuantity: {
      type: Number,
      default: 0,
    },

    amountToBePaid: {
      type: Number,
      default: 0,
    },

    subscribedAmount: {
      type: Number,
      default: 0,
    },

    unsubscribedAmount: {
      type: Number,
      default: 0,
    },

  },
  {
    timestamps: true,
  }
);

// Ek user ek IPO ko sirf ek baar subscribe kar sake
userIpoSchema.index(
  {
    username: 1,
    ipoId: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model("UserIPO", userIpoSchema);