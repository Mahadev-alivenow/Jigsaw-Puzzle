import mongoose from "mongoose";

const gameDataSchema = new mongoose.Schema(
  {
    // Basic game information
    shop: { type: String, required: true, index: true },
    campaignName: { type: String, required: true, index: true },
    playerEmail: { type: String, required: true, index: true },

    // Game performance metrics
    score: { type: Number, required: true, min: 0, index: true },
    completionPercentage: { type: Number, required: true, min: 0, max: 100 },
    timeUsed: { type: Number, required: true, min: 0 }, // in milliseconds
    totalTime: { type: Number, required: true, min: 0 }, // in milliseconds
    puzzlePieces: { type: Number, required: true, min: 1 },
    completed: { type: Boolean, required: true, default: false, index: true },

    // Reward information
    discountCode: { type: String, required: true },
    discountTier: {
      type: String,
      required: true,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },

    // Metadata
    timestamp: { type: Date, default: Date.now, index: true },
    isEarlySubmission: { type: Boolean, default: false },
    imageLoaded: { type: Boolean, default: false },
    sessionId: { type: String, required: true, index: true },

    // Technical information
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "unknown" },

    // Game logs (limited to prevent storage issues)
    allLogs: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: "gameData", // Explicitly set collection name
  },
);

// Create indexes for better query performance
gameDataSchema.index({ shop: 1, campaignName: 1 });
gameDataSchema.index({ playerEmail: 1, timestamp: -1 });
gameDataSchema.index({ score: -1 });
gameDataSchema.index({ completionPercentage: -1 });
gameDataSchema.index({ discountTier: 1 });
gameDataSchema.index({ timestamp: -1 });

// Add a method to get discount tier based on score
gameDataSchema.methods.getDiscountTier = function () {
  if (this.score >= 150) return "platinum";
  if (this.score >= 120) return "gold";
  if (this.score >= 90) return "silver";
  return "bronze";
};

// Add a static method to find games by shop
gameDataSchema.statics.findByShop = function (shopDomain) {
  return this.find({ shop: shopDomain }).sort({ timestamp: -1 });
};

// Add a static method to get analytics
gameDataSchema.statics.getAnalytics = function (shopDomain, campaignName) {
  return this.aggregate([
    {
      $match: {
        shop: shopDomain,
        ...(campaignName && { campaignName }),
      },
    },
    {
      $group: {
        _id: null,
        totalGames: { $sum: 1 },
        averageScore: { $avg: "$score" },
        averageCompletion: { $avg: "$completionPercentage" },
        completedGames: {
          $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] },
        },
        discountTiers: {
          $push: "$discountTier",
        },
      },
    },
  ]);
};

// Pre-save middleware to ensure data consistency
gameDataSchema.pre("save", function (next) {
  // Ensure completion percentage matches completed status
  if (this.completionPercentage === 100) {
    this.completed = true;
  }

  // Ensure discount tier matches score
  this.discountTier = this.getDiscountTier();

  next();
});

// Create the model
export const GameDataModel =
  mongoose.models.GameData || mongoose.model("GameData", gameDataSchema);
