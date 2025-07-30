import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  getValidDiscountCodes,
  getActiveCampaignFromMongoDB,
} from "../../utils/metafields.server";

export const loader = async ({ request }) => {
  try {
    console.log("🌐 [Storefront API] Puzzle config request received");
    console.log("🕐 [Storefront API] Timestamp:", new Date().toISOString());

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    console.log("🏪 [Storefront API] Shop parameter:", shop);
    console.log("🔗 [Storefront API] Full URL:", url.toString());
    console.log(
      "📋 [Storefront API] All URL params:",
      Object.fromEntries(url.searchParams),
    );

    if (!shop) {
      console.log("❌ [Storefront API] No shop parameter provided");
      return json(
        {
          error: "Shop parameter is required",
          campaign: null,
          discountCodes: [],
          timestamp: new Date().toISOString(),
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      );
    }

    // Clean shop domain (remove protocol if present)
    const cleanShop = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
    console.log("🧹 [Storefront API] Cleaned shop domain:", cleanShop);

    let admin = null;
    let authError = null;

    // Try to authenticate with Shopify
    try {
      console.log("🔐 [Storefront API] Attempting Shopify authentication...");
      const { admin: authenticatedAdmin } =
        await authenticate.public.appProxy(request);
      admin = authenticatedAdmin;
      console.log("✅ [Storefront API] Shopify authentication successful");
    } catch (error) {
      console.log(
        "⚠️ [Storefront API] Shopify authentication failed:",
        error.message,
      );
      console.log("📊 [Storefront API] Auth error details:");
      console.log("  Error name:", error.name);
      console.log("  Error stack:", error.stack);
      authError = error.message;
    }

    // Get active campaign from MongoDB (this doesn't require Shopify auth)
    console.log("🎯 [Storefront API] Fetching active campaign from MongoDB...");
    const campaignResult = await getActiveCampaignFromMongoDB(cleanShop);

    console.log("📊 [Storefront API] Campaign fetch result:");
    console.log("  Success:", campaignResult.success);
    console.log("  Message:", campaignResult.message);
    console.log("  Has campaign:", !!campaignResult.campaign);
    console.log("  Stats:", campaignResult.stats);

    if (campaignResult.success && campaignResult.campaign) {
      console.log("✅ [Storefront API] Active campaign found:");
      console.log("  Name:", campaignResult.campaign.name);
      console.log("  Pieces:", campaignResult.campaign.puzzlePieces);
      console.log("  Timer:", campaignResult.campaign.timer);
      console.log("  Position:", campaignResult.campaign.widgetPosition);
      console.log("  Image URL:", campaignResult.campaign.imageUrl);
    } else {
      console.log("❌ [Storefront API] No active campaign available");
      if (campaignResult.error) {
        console.log("  Error:", campaignResult.error);
      }
    }

    // Get discount codes (requires Shopify auth)
    let discountCodes = [];
    if (admin) {
      console.log(
        "🎫 [Storefront API] Fetching discount codes from Shopify...",
      );
      try {
        const { validCodes } = await getValidDiscountCodes(admin);
        discountCodes = validCodes || [];
        console.log(
          `✅ [Storefront API] Retrieved ${discountCodes.length} discount codes`,
        );

        if (discountCodes.length > 0) {
          console.log(
            "🎫 [Storefront API] Available discount codes:",
            discountCodes.map((c) => c.code).join(", "),
          );
        } else {
          console.log("📭 [Storefront API] No discount codes available");
        }
      } catch (error) {
        console.error(
          "❌ [Storefront API] Error fetching discount codes:",
          error,
        );
        console.error("📊 [Storefront API] Discount code error details:");
        console.error("  Message:", error.message);
        console.error("  Stack:", error.stack);
      }
    } else {
      console.log(
        "⚠️ [Storefront API] Skipping discount codes fetch due to auth failure",
      );
    }

    // Prepare response data
    const responseData = {
      success: true,
      campaign: campaignResult.campaign,
      discountCodes: discountCodes,
      shop: cleanShop,
      timestamp: new Date().toISOString(),
      authError: authError,
      campaignMessage: campaignResult.message,
      validationErrors: campaignResult.validationErrors,
      stats: campaignResult.stats,
      debug: {
        mongodbConnection: campaignResult.success,
        shopifyAuth: !!admin,
        campaignFound: !!campaignResult.campaign,
        discountCodesCount: discountCodes.length,
      },
    };

    console.log("📤 [Storefront API] Sending response to storefront:");
    console.log("  Campaign available:", !!responseData.campaign);
    console.log("  Campaign name:", responseData.campaign?.name || "N/A");
    console.log("  Discount codes count:", responseData.discountCodes.length);
    console.log("  Auth error:", !!responseData.authError);
    console.log("  MongoDB success:", responseData.debug.mongodbConnection);
    console.log(
      "  Response size:",
      JSON.stringify(responseData).length,
      "bytes",
    );

    return json(responseData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("❌ [Storefront API] Critical error:", error);
    console.error("📊 [Storefront API] Critical error details:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    console.error("  Name:", error.name);

    return json(
      {
        error: "Internal server error",
        message: error.message,
        campaign: null,
        discountCodes: [],
        timestamp: new Date().toISOString(),
        debug: {
          errorName: error.name,
          errorMessage: error.message,
        },
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  }
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};
