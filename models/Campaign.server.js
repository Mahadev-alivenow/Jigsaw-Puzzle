import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema({
  shop: { type: String, required: true },
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  puzzlePieces: { type: Number, enum: [4, 8], default: 4 },
  widgetPosition: {
    type: String,
    enum: ["right-bottom", "right-top", "bottom-center", "left-bottom"],
    default: "right-bottom",
  },
  timer: { type: Number, enum: [30, 45], default: 30 },
  isActive: { type: Boolean, default: true }, // Default to true, but logic ensures only one is active
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const CampaignModel =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

// Get all campaigns for a shop
export async function getCampaigns(shop) {
  try {
    console.log("🔍 [MongoDB] Fetching campaigns for shop:", shop);

    const campaigns = await CampaignModel.find({ shop: shop }).sort({
      createdAt: -1,
    });

    console.log(
      `📊 [MongoDB] Found ${campaigns.length} campaigns for shop ${shop}`,
    );

    // Log campaign details for debugging
    campaigns.forEach((campaign, index) => {
      console.log(`📋 [MongoDB] Campaign ${index + 1}:`);
      console.log(`  🏷️  ID: ${campaign._id}`);
      console.log(`  📝 Name: ${campaign.name}`);
      console.log(`  ✅ Active: ${campaign.isActive}`);
      console.log(`  🧩 Pieces: ${campaign.puzzlePieces}`);
      console.log(`  ⏱️  Timer: ${campaign.timer}`);
      console.log(`  📍 Position: ${campaign.widgetPosition}`);
      console.log(`  🖼️  Image: ${campaign.imageUrl}`);
    });

    return campaigns;
  } catch (error) {
    console.error("❌ [MongoDB] Error fetching campaigns:", error);
    console.error("📊 [MongoDB] Error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    return [];
  }
}

// Get a single campaign by ID
export async function getCampaign(id) {
  try {
    console.log("🔍 [MongoDB] Fetching campaign with ID:", id);

    const campaign = await CampaignModel.findById(id);

    if (campaign) {
      console.log(`✅ [MongoDB] Found campaign: ${campaign.name}`);
      console.log("📊 [MongoDB] Campaign details:");
      console.log(`  🏷️  ID: ${campaign._id}`);
      console.log(`  📝 Name: ${campaign.name}`);
      console.log(`  🏪 Shop: ${campaign.shop}`);
      console.log(`  ✅ Active: ${campaign.isActive}`);
      console.log(`  🧩 Pieces: ${campaign.puzzlePieces}`);
      console.log(`  ⏱️  Timer: ${campaign.timer}`);
    } else {
      console.log("❌ [MongoDB] Campaign not found");
    }

    return campaign;
  } catch (error) {
    console.error("❌ [MongoDB] Error fetching campaign:", error);
    return null;
  }
}

// Create a new campaign
export async function createCampaign(data) {
  try {
    console.log("📝 [MongoDB] Creating new campaign:", data.name);
    console.log("📊 [MongoDB] Campaign data:");
    console.log("  🏪 Shop:", data.shop);
    console.log("  📝 Name:", data.name);
    console.log("  🖼️  Image URL:", data.imageUrl);
    console.log("  🧩 Pieces:", data.puzzlePieces);
    console.log("  ⏱️  Timer:", data.timer);
    console.log("  📍 Position:", data.widgetPosition);

    // First, set all other campaigns for this shop to inactive
    const updateResult = await CampaignModel.updateMany(
      { shop: data.shop },
      { isActive: false, updatedAt: new Date() },
    );

    console.log(
      `🔄 [MongoDB] Set ${updateResult.modifiedCount} existing campaigns to inactive`,
    );

    // Create the new campaign as active
    const campaign = await CampaignModel.create({
      ...data,
      isActive: true, // New campaigns are always active
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `✅ [MongoDB] Created campaign: ${campaign.name} (ID: ${campaign._id})`,
    );
    console.log("📊 [MongoDB] New campaign details:");
    console.log(`  🏷️  ID: ${campaign._id}`);
    console.log(`  📝 Name: ${campaign.name}`);
    console.log(`  ✅ Active: ${campaign.isActive}`);
    console.log(`  🧩 Pieces: ${campaign.puzzlePieces}`);
    console.log(`  ⏱️  Timer: ${campaign.timer}`);

    return campaign;
  } catch (error) {
    console.error("❌ [MongoDB] Error creating campaign:", error);
    console.error("📊 [MongoDB] Error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    throw error;
  }
}

// Update an existing campaign
export async function updateCampaign(id, data) {
  try {
    console.log("🔄 [MongoDB] Updating campaign:", id);
    console.log("📊 [MongoDB] Update data:", data);

    // If setting this campaign to active, deactivate all others first
    if (data.isActive === true) {
      const campaign = await CampaignModel.findById(id);

      if (campaign) {
        console.log(
          `🔄 [MongoDB] Setting campaign to active, deactivating others for shop: ${campaign.shop}`,
        );

        const updateResult = await CampaignModel.updateMany(
          { shop: campaign.shop, _id: { $ne: id } },
          { isActive: false, updatedAt: new Date() },
        );

        console.log(
          `🔄 [MongoDB] Deactivated ${updateResult.modifiedCount} other campaigns`,
        );
      }
    }

    const updatedCampaign = await CampaignModel.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true },
    );

    if (updatedCampaign) {
      console.log(`✅ [MongoDB] Updated campaign: ${updatedCampaign.name}`);
      console.log("📊 [MongoDB] Updated campaign details:");
      console.log(`  🏷️  ID: ${updatedCampaign._id}`);
      console.log(`  📝 Name: ${updatedCampaign.name}`);
      console.log(`  ✅ Active: ${updatedCampaign.isActive}`);
      console.log(`  🧩 Pieces: ${updatedCampaign.puzzlePieces}`);
      console.log(`  ⏱️  Timer: ${updatedCampaign.timer}`);
    } else {
      console.log("❌ [MongoDB] Campaign not found for update");
    }

    return updatedCampaign;
  } catch (error) {
    console.error("❌ [MongoDB] Error updating campaign:", error);
    console.error("📊 [MongoDB] Error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    throw error;
  }
}

// Delete a campaign
export async function deleteCampaign(id) {
  try {
    console.log("🗑️ [MongoDB] Deleting campaign:", id);

    const deletedCampaign = await CampaignModel.findByIdAndDelete(id);

    if (deletedCampaign) {
      console.log(`✅ [MongoDB] Deleted campaign: ${deletedCampaign.name}`);
      console.log("📊 [MongoDB] Deleted campaign details:");
      console.log(`  🏷️  ID: ${deletedCampaign._id}`);
      console.log(`  📝 Name: ${deletedCampaign.name}`);
      console.log(`  🏪 Shop: ${deletedCampaign.shop}`);
    } else {
      console.log("❌ [MongoDB] Campaign not found for deletion");
    }

    return deletedCampaign;
  } catch (error) {
    console.error("❌ [MongoDB] Error deleting campaign:", error);
    console.error("📊 [MongoDB] Error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    throw error;
  }
}

// Toggle campaign active status
export async function toggleCampaign(id) {
  try {
    console.log("🔄 [MongoDB] Toggling campaign:", id);

    const campaign = await CampaignModel.findById(id);

    if (!campaign) {
      console.log("❌ [MongoDB] Campaign not found for toggle");
      throw new Error("Campaign not found");
    }

    console.log(`📊 [MongoDB] Current campaign status: ${campaign.isActive}`);
    console.log(`🔄 [MongoDB] Will set to: ${!campaign.isActive}`);

    // If activating this campaign, deactivate all others first
    if (!campaign.isActive) {
      console.log(
        `🔄 [MongoDB] Activating campaign, deactivating others for shop: ${campaign.shop}`,
      );

      const updateResult = await CampaignModel.updateMany(
        { shop: campaign.shop, _id: { $ne: id } },
        { isActive: false, updatedAt: new Date() },
      );

      console.log(
        `🔄 [MongoDB] Deactivated ${updateResult.modifiedCount} other campaigns`,
      );
    }

    const updatedCampaign = await CampaignModel.findByIdAndUpdate(
      id,
      { isActive: !campaign.isActive, updatedAt: new Date() },
      { new: true },
    );

    console.log(
      `✅ [MongoDB] Toggled campaign: ${updatedCampaign.name} - Active: ${updatedCampaign.isActive}`,
    );
    console.log("📊 [MongoDB] Updated campaign details:");
    console.log(`  🏷️  ID: ${updatedCampaign._id}`);
    console.log(`  📝 Name: ${updatedCampaign.name}`);
    console.log(`  ✅ Active: ${updatedCampaign.isActive}`);

    return updatedCampaign;
  } catch (error) {
    console.error("❌ [MongoDB] Error toggling campaign:", error);
    console.error("📊 [MongoDB] Error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    throw error;
  }
}

// Get the active campaign for a shop - THIS IS THE MISSING FUNCTION
export async function getActiveCampaign(shop) {
  try {
    console.log("🎯 [MongoDB] Fetching active campaign for shop:", shop);

    const activeCampaign = await CampaignModel.findOne({
      shop: shop,
      isActive: true,
    }).sort({ createdAt: -1 });

    if (activeCampaign) {
      console.log(`✅ [MongoDB] Found active campaign: ${activeCampaign.name}`);
      console.log("📊 [MongoDB] Active campaign details:");
      console.log(`  🏷️  ID: ${activeCampaign._id}`);
      console.log(`  📝 Name: ${activeCampaign.name}`);
      console.log(`  🏪 Shop: ${activeCampaign.shop}`);
      console.log(`  🖼️  Image URL: ${activeCampaign.imageUrl}`);
      console.log(`  🧩 Puzzle Pieces: ${activeCampaign.puzzlePieces}`);
      console.log(`  ⏱️  Timer: ${activeCampaign.timer}`);
      console.log(`  📍 Widget Position: ${activeCampaign.widgetPosition}`);
      console.log(`  ✅ Is Active: ${activeCampaign.isActive}`);
      console.log(`  📅 Created At: ${activeCampaign.createdAt}`);
      console.log(`  🔄 Updated At: ${activeCampaign.updatedAt}`);

      // Convert Mongoose document to plain object for easier handling
      const campaignObject = {
        id: activeCampaign._id.toString(),
        shop: activeCampaign.shop,
        name: activeCampaign.name,
        imageUrl: activeCampaign.imageUrl,
        puzzlePieces: activeCampaign.puzzlePieces,
        timer: activeCampaign.timer,
        widgetPosition: activeCampaign.widgetPosition,
        isActive: activeCampaign.isActive,
        createdAt: activeCampaign.createdAt,
        updatedAt: activeCampaign.updatedAt,
      };

      console.log("📦 [MongoDB] Converted to plain object:");
      console.log(JSON.stringify(campaignObject, null, 2));

      return campaignObject;
    } else {
      console.log("❌ [MongoDB] No active campaign found for shop:", shop);

      // Let's also check if there are any campaigns at all for this shop
      const allCampaigns = await CampaignModel.find({ shop: shop });
      console.log(
        `📊 [MongoDB] Total campaigns for shop ${shop}: ${allCampaigns.length}`,
      );

      if (allCampaigns.length > 0) {
        console.log("📋 [MongoDB] Available campaigns:");
        allCampaigns.forEach((campaign, index) => {
          console.log(
            `  ${index + 1}. ${campaign.name} - Active: ${campaign.isActive}`,
          );
        });
      }

      return null;
    }
  } catch (error) {
    console.error("❌ [MongoDB] Error fetching active campaign:", error);
    console.error("📊 [MongoDB] Error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    console.error("  Name:", error.name);

    // Additional MongoDB connection debugging
    if (error.name === "MongooseError") {
      console.error("🔌 [MongoDB] Mongoose connection issue detected");
      console.error("  Connection state:", mongoose.connection.readyState);
      console.error(
        "  Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting",
      );
    }

    return null;
  }
}

// Get campaign statistics for a shop
export async function getCampaignStats(shop) {
  try {
    console.log("📊 [MongoDB] Fetching campaign statistics for shop:", shop);

    const totalCampaigns = await CampaignModel.countDocuments({ shop: shop });
    const activeCampaigns = await CampaignModel.countDocuments({
      shop: shop,
      isActive: true,
    });
    const inactiveCampaigns = totalCampaigns - activeCampaigns;

    console.log("📊 [MongoDB] Campaign statistics:");
    console.log(`  📈 Total campaigns: ${totalCampaigns}`);
    console.log(`  ✅ Active campaigns: ${activeCampaigns}`);
    console.log(`  ❌ Inactive campaigns: ${inactiveCampaigns}`);

    return {
      total: totalCampaigns,
      active: activeCampaigns,
      inactive: inactiveCampaigns,
    };
  } catch (error) {
    console.error("❌ [MongoDB] Error fetching campaign stats:", error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
    };
  }
}
