import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import connectDB from "../../utils/db.server";
import { CampaignModel } from "../../models/Campaign.server";

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const campaignId = formData.get("campaignId");
    const isActive = formData.get("isActive") === "true";

    if (!campaignId) {
      return json({ error: "Campaign ID is required" }, { status: 400 });
    }

    await connectDB();

    // If activating a campaign, first deactivate all other campaigns
    if (isActive) {
      await CampaignModel.updateMany(
        { shop, _id: { $ne: campaignId } },
        { isActive: false, updatedAt: new Date() },
      );
    }

    const campaign = await CampaignModel.findOneAndUpdate(
      { _id: campaignId, shop },
      { isActive, updatedAt: new Date() },
      { new: true },
    );

    if (!campaign) {
      return json({ error: "Campaign not found" }, { status: 404 });
    }

    return json({ success: true, campaign: campaign.toObject() });
  } catch (error) {
    console.error("Error toggling campaign status:", error);
    return json({ error: "Failed to toggle campaign status" }, { status: 500 });
  }
};
