import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import connectDB from "../../utils/db.server";
import { CampaignModel } from "../../models/Campaign.server";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const shop = session.shop;

  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions.length > 0;
  const userSubscription = appSubscriptions[0].name;
  // console.log("userSubscription:", userSubscription);

  try {
    await connectDB();
    const campaigns = await CampaignModel.find({ shop }).sort({
      createdAt: -1,
    });

    // Transform the campaigns to include the full image URL if needed
    const transformedCampaigns = campaigns.map((campaign) => {
      const campaignObj = campaign.toObject();
      campaignObj._id = campaignObj._id.toString();

      // If the imageUrl doesn't start with data:, it's a file path
      if (campaignObj.imageUrl && !campaignObj.imageUrl.startsWith("data:")) {
        // Make sure the URL is properly formatted
        if (
          !campaignObj.imageUrl.startsWith("http") &&
          !campaignObj.imageUrl.startsWith("/")
        ) {
          campaignObj.imageUrl = `/${campaignObj.imageUrl}`;
        }
      }

      return campaignObj;
    });

    return json({
      campaigns: transformedCampaigns,
      subscription: userSubscription, // default if missing
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return json({ campaigns: [], error: "Failed to fetch campaigns" });
  }
};
