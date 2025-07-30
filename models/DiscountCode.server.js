import mongoose from "mongoose";

const discountCodeSchema = new mongoose.Schema({
  shop: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  tier: {
    type: String,
    required: true,
    enum: ["bronze", "silver", "gold", "platinum"],
  },
  minScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  percentage: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 10,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique codes per shop
discountCodeSchema.index({ shop: 1, code: 1 }, { unique: true });

// Update the updatedAt field before saving
discountCodeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export const DiscountCodeModel =
  mongoose.models.DiscountCode ||
  mongoose.model("DiscountCode", discountCodeSchema);
