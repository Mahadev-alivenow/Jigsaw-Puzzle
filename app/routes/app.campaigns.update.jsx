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
    const name = formData.get("name");

    if (!campaignId || !name) {
      return json(
        { error: "Campaign ID and name are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const campaign = await CampaignModel.findOneAndUpdate(
      { _id: campaignId, shop },
      { name, updatedAt: new Date() },
      { new: true },
    );

    if (!campaign) {
      return json({ error: "Campaign not found" }, { status: 404 });
    }

    return json({ success: true, campaign: campaign.toObject() });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return json({ error: "Failed to update campaign" }, { status: 500 });
  }
};
