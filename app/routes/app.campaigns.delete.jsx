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

    if (!campaignId) {
      return json({ error: "Campaign ID is required" }, { status: 400 });
    }

    await connectDB();

    const campaign = await CampaignModel.findOneAndDelete({
      _id: campaignId,
      shop,
    });

    if (!campaign) {
      return json({ error: "Campaign not found" }, { status: 404 });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return json({ error: "Failed to delete campaign" }, { status: 500 });
  }
};
