"use client";

import { useEffect, useState } from "react";
import { Page, Tabs, Card, Banner, Badge } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { Redirect } from "@shopify/app-bridge/actions";
import { TitleBar } from "@shopify/app-bridge-react";
import SubscriptionBanner from "../components/SubscriptionBanner";
import TabsContent from "../components/TabsContent";
import PlanCard from "../components/PlanCard";
import { authenticate } from "../shopify.server";
import { json } from "@remix-run/node";
import {
  createOrUpdateShopMetafield,
  getActiveCampaignFromMongoDB,
  getValidDiscountCodes,
  syncDiscountCodesToMetafields,
} from "../../utils/metafields.server";

export const loader = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const host = url.searchParams.get("host");

  console.log("Index loader - URL:", url.toString());
  console.log("Index loader - Host:", host);

  if (!host) {
    console.error("Missing host parameter in index loader");
    throw new Response("Missing host parameter", {
      status: 400,
      statusText: "Bad Request - Missing host parameter",
    });
  }

  const { appSubscriptions } = await billing.check();
  const hasSubscription = appSubscriptions.length > 0;

  const activeCampaign = await getActiveCampaignFromMongoDB(shop, admin);
  const discountCodes = await syncDiscountCodesToMetafields(admin.graphql);

  console.log("🏪 Shop:", shop);
  console.log("💳 Has Subscription:", hasSubscription);
  console.log("📊 App Subscriptions:", appSubscriptions);
  console.log("🔍 Fetching active campaign...", activeCampaign);
  console.log("🎫 Syncing discount codes to metafields...", discountCodes);

  let validDiscountCodes = [];
  let hasDiscountCodes = false;

  // Check and set metafields when app loads using GraphQL
  if (hasSubscription) {
    console.log("✅ User has subscription, setting up metafields...");

    // Set subscription active metafield
    const subscriptionResult = await createOrUpdateShopMetafield(
      admin,
      "puzzle_craft",
      "subscription_active",
      "true",
      "single_line_text_field",
    );

    console.log("🔧 Subscription metafield result:", subscriptionResult);

    // Get and validate discount codes
    try {
      const { validCodes, needsUpdate } = await getValidDiscountCodes(admin);
      validDiscountCodes = validCodes || [];
      hasDiscountCodes = validDiscountCodes.length > 0;

      console.log("🎫 Valid discount codes found:", validDiscountCodes.length);
      console.log("🔄 Metafield needed update:", needsUpdate);

      if (!hasDiscountCodes) {
        console.log(
          "⚠️ No valid discount codes found. Please run discount setup.",
        );
      } else {
        console.log(
          "✅ Valid discount codes:",
          validDiscountCodes.map((code) => code.code).join(", "),
        );
        console.log(
          "📋 Full discount data:",
          JSON.stringify(validDiscountCodes, null, 2),
        );
      }
    } catch (error) {
      console.error("❌ Error fetching discount codes:", error);
      validDiscountCodes = [];
      hasDiscountCodes = false;
    }
  } else {
    console.log("❌ User has no subscription, removing metafields...");
    // Set subscription inactive
    await createOrUpdateShopMetafield(
      admin,
      "puzzle_craft",
      "subscription_active",
      "false",
      "single_line_text_field",
    );
  }

  return json({
    shop,
    admin,
    subscription: appSubscriptions?.[0],
    requiresBilling: appSubscriptions.length === 0,
    host,
    validDiscountCodes,
    hasDiscountCodes,
    activeCampaign,
    discountCodes,
  });
};

export default function Index() {
  const loaderData = useLoaderData();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [appBridge, setAppBridge] = useState(null);

  const {
    shop,
    subscription,
    requiresBilling,
    validDiscountCodes,
    hasDiscountCodes,
    host,
  } = loaderData;

  const shopName = shop.split(".")[0];

  // Debug logging
  console.log("🎯 UI Debug - validDiscountCodes:", validDiscountCodes);
  console.log("🎯 UI Debug - hasDiscountCodes:", hasDiscountCodes);
  console.log(
    "🎯 UI Debug - validDiscountCodes length:",
    validDiscountCodes?.length,
  );
  console.log("🎯 UI Debug - host:", host);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize App Bridge safely
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      // Wait for shopify global to be available
      const checkShopifyGlobal = () => {
        if (window.shopify) {
          try {
            // Import App Bridge dynamically to avoid SSR issues
            import("@shopify/app-bridge")
              .then(({ createApp }) => {
                const app = createApp({
                  apiKey: process.env.SHOPIFY_API_KEY || "",
                  host: host,
                  forceRedirect: true,
                });
                setAppBridge(app);
                console.log("✅ App Bridge initialized successfully");
              })
              .catch((error) => {
                console.error("❌ Failed to initialize App Bridge:", error);
              });
          } catch (error) {
            console.error("❌ Error creating App Bridge:", error);
          }
        } else {
          // Retry after a short delay
          setTimeout(checkShopifyGlobal, 100);
        }
      };

      checkShopifyGlobal();
    }
  }, [isMounted, host]);

  // Handle billing redirect
  useEffect(() => {
    if (isMounted && requiresBilling && appBridge) {
      try {
        Redirect.toAdminPath({
          app: appBridge,
          path: `/apps/jigsaw-puzzle-1/pricing_plans`,
        });
      } catch (error) {
        console.error("❌ Failed to redirect to billing:", error);
        // Fallback: redirect using window.location
        window.location.href = `/admin/apps/jigsaw-puzzle-1/pricing_plans`;
      }
    }
  }, [appBridge, requiresBilling, isMounted]);

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (!loaderData) {
    return (
      <Banner title="Error" tone="critical">
        App data could not be loaded.
      </Banner>
    );
  }

  if (!host) {
    return (
      <Banner title="Configuration Error" tone="critical">
        Missing host parameter. Please refresh the page.
      </Banner>
    );
  }

  // Define tabs
  const baseTabs = [
    { id: "home-tab", content: "Home", panelID: "home-content" },
  ];

  if (subscription) {
    baseTabs.push(
      {
        id: "campaigns-tab",
        content: "Campaigns",
        panelID: "campaigns-content",
      },
      { id: "tutorial-tab", content: "Tutorial", panelID: "tutorial-content" },
      {
        id: "create-campaign-tab",
        content: (
          <span>
            Create Campaign <Badge tone="attention">New</Badge>
          </span>
        ),
        panelID: "create-campaign-content",
      },
      {
        id: "setup-discounts-tab",
        content: (
          <span>
            Setup Discounts{" "}
            <Badge tone={hasDiscountCodes ? "success" : "attention"}>
              {hasDiscountCodes ? "Active" : "Required"}
            </Badge>
          </span>
        ),
        panelID: "setup-discounts-content",
      },
    );
  }

  const tabs = baseTabs.map((tab) => ({
    id: tab.id,
    content: tab.content,
    panelID: tab.panelID,
  }));

  return (
    <Page>
      {appBridge && <TitleBar title="Puzzle Craft" />}
      <div style={{ paddingBottom: "20px" }}>
        <Tabs
          tabs={tabs}
          selected={selectedTab}
          onSelect={setSelectedTab}
          fitted
        />
      </div>

      {/* Tabs Content */}
      {selectedTab === 0 && (
        <Card sectioned>
          {subscription ? (
            <>
              <SubscriptionBanner subscription={subscription} />
              {hasDiscountCodes &&
              validDiscountCodes &&
              validDiscountCodes.length > 0 ? (
                <Banner
                  title="Active Discount Codes"
                  tone="success"
                  style={{ marginTop: "16px" }}
                >
                  <p>These codes will be given as puzzle rewards:</p>
                  <ul style={{ marginTop: "8px" }}>
                    {validDiscountCodes.map((codeObj) => (
                      <li key={codeObj.code} style={{ marginBottom: "6px" }}>
                        <strong>{codeObj.code}</strong> - {codeObj.title} (
                        {codeObj.percentage}% Off)
                      </li>
                    ))}
                  </ul>
                  <p
                    style={{
                      marginTop: "12px",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    Found {validDiscountCodes.length} active discount codes
                  </p>
                </Banner>
              ) : (
                <Banner
                  title="Important: Setup Required"
                  tone="warning"
                  style={{ marginTop: "16px" }}
                >
                  <p>
                    Please go to the <strong>"Setup Discounts"</strong> tab to
                    create discount codes and enable the puzzle widget on your
                    storefront. This is required for the theme extension to work
                    properly.
                  </p>
                  {validDiscountCodes && validDiscountCodes.length > 0 && (
                    <p
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      Debug: Found {validDiscountCodes.length} codes but
                      hasDiscountCodes is {String(hasDiscountCodes)}
                    </p>
                  )}
                </Banner>
              )}
            </>
          ) : (
            <PlanCard shopName={shopName} />
          )}
        </Card>
      )}

      {selectedTab > 0 && <TabsContent selectedTab={selectedTab} />}
    </Page>
  );
}
