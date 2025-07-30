import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  shop: { type: String, required: true, unique: true },
  plan: { type: String, default: "none" },
  chargeId: { type: String },
  activatedAt: { type: Date },
});

export const ShopModel =
  mongoose.models.project || mongoose.model("project", shopSchema);
