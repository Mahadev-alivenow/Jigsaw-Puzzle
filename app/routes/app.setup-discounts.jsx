"use client";

import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Card,
  Button,
  Banner,
  BlockStack,
  Text,
  DataTable,
  Badge,
  TextField,
  Select,
  InlineStack,
  Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { createDiscountCode } from "../../utils/discounts.server";
import {
  createOrUpdateShopMetafield,
  getValidDiscountCodes,
} from "../../utils/metafields.server";
import { useState } from "react";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // Check existing discount codes
  const { validCodes } = await getValidDiscountCodes(admin);

  return json({
    shop,
    existingDiscountCodes: validCodes,
    hasExistingCodes: validCodes.length > 0,
  });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const action = formData.get("_action");

    if (action === "setup_discounts") {
      console.log("🎯 Setting up discount codes for shop:", shop);

      // Check if discount codes already exist
      const { validCodes } = await getValidDiscountCodes(admin);

      if (validCodes.length > 0) {
        console.log("⚠️ Discount codes already exist, skipping creation");
        return json({
          success: true,
          message: "Discount codes already exist",
          created: 0,
          total: validCodes.length,
          discounts: validCodes,
          alreadyExists: true,
        });
      }

      // Parse custom discount codes from form data
      const customDiscounts = JSON.parse(formData.get("discounts") || "[]");

      // Validate discount codes
      if (!customDiscounts || customDiscounts.length === 0) {
        return json({ error: "No discount codes provided" }, { status: 400 });
      }

      // Validate each discount code
      for (const discount of customDiscounts) {
        if (
          !discount.code ||
          !discount.percentage ||
          !discount.title ||
          !discount.tier
        ) {
          return json(
            { error: "All discount code fields are required" },
            { status: 400 },
          );
        }
        if (discount.percentage < 1 || discount.percentage > 100) {
          return json(
            { error: "Discount percentage must be between 1 and 100" },
            { status: 400 },
          );
        }
        if (discount.minScore < 0 || discount.minScore > 100) {
          return json(
            { error: "Minimum score must be between 0 and 100" },
            { status: 400 },
          );
        }
      }

      const results = [];
      const createdDiscounts = [];

      // Create discount codes in Shopify
      for (const discount of customDiscounts) {
        console.log(`📝 Creating discount code: ${discount.code}`);

        const result = await createDiscountCode(admin, {
          ...discount,
          startsAt: new Date().toISOString(),
          endsAt: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 1 year from now
        });

        results.push(result);

        if (result.success) {
          createdDiscounts.push({
            code: discount.code,
            tier: discount.tier,
            percentage: Number.parseInt(discount.percentage),
            minScore: Number.parseInt(discount.minScore),
            shopifyId: result.discount?.id,
            title: discount.title,
          });
          console.log(`✅ Successfully created: ${discount.code}`);
        } else {
          console.error(
            `❌ Failed to create: ${discount.code}`,
            result.errors || result.error,
          );
        }
      }

      // Store discount codes in metafields using GraphQL
      if (createdDiscounts.length > 0) {
        console.log("💾 Storing discount codes in metafields...");

        const metafieldResult = await createOrUpdateShopMetafield(
          admin,
          "puzzle_craft",
          "discount_codes",
          createdDiscounts,
          "json",
        );

        if (metafieldResult.success) {
          console.log("✅ Discount codes stored in metafields successfully");
        } else {
          console.error(
            "❌ Failed to store discount codes in metafields:",
            metafieldResult.errors || metafieldResult.error,
          );
        }

        // Also set subscription active flag
        const subscriptionResult = await createOrUpdateShopMetafield(
          admin,
          "puzzle_craft",
          "subscription_active",
          "true",
          "single_line_text_field",
        );

        if (subscriptionResult.success) {
          console.log("✅ Subscription active flag set in metafields");
        } else {
          console.error(
            "❌ Failed to set subscription flag:",
            subscriptionResult.errors || subscriptionResult.error,
          );
        }
      }

      return json({
        success: true,
        created: createdDiscounts.length,
        total: customDiscounts.length,
        discounts: createdDiscounts,
        alreadyExists: false,
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("❌ Error setting up discounts:", error);
    return json({ error: "Failed to setup discount codes" }, { status: 500 });
  }
};

export default function SetupDiscounts() {
  const { shop, existingDiscountCodes, hasExistingCodes } = useLoaderData();
  const fetcher = useFetcher();

  // Default discount codes that users can edit
  const [discountCodes, setDiscountCodes] = useState([
    {
      id: 1,
      code: "PUZZLE10",
      percentage: 10,
      title: "Puzzle Bronze Reward - 10% Off",
      tier: "bronze",
      minScore: 0,
    },
    {
      id: 2,
      code: "PUZZLE20",
      percentage: 20,
      title: "Puzzle Silver Reward - 20% Off",
      tier: "silver",
      minScore: 50,
    },
    {
      id: 3,
      code: "PUZZLE25",
      percentage: 25,
      title: "Puzzle Gold Reward - 25% Off",
      tier: "gold",
      minScore: 75,
    },
    {
      id: 4,
      code: "PUZZLE30",
      percentage: 30,
      title: "Puzzle Platinum Reward - 30% Off",
      tier: "platinum",
      minScore: 90,
    },
  ]);

  const tierOptions = [
    { label: "Bronze", value: "bronze" },
    { label: "Silver", value: "silver" },
    { label: "Gold", value: "gold" },
    { label: "Platinum", value: "platinum" },
  ];

  const updateDiscountCode = (id, field, value) => {
    setDiscountCodes((prev) =>
      prev.map((discount) =>
        discount.id === id ? { ...discount, [field]: value } : discount,
      ),
    );
  };

  const addDiscountCode = () => {
    const newId = Math.max(...discountCodes.map((d) => d.id)) + 1;
    setDiscountCodes((prev) => [
      ...prev,
      {
        id: newId,
        code: `PUZZLE${(prev.length + 1) * 10}`,
        percentage: 15,
        title: `Puzzle Reward - 15% Off`,
        tier: "bronze",
        minScore: 0,
      },
    ]);
  };

  const removeDiscountCode = (id) => {
    if (discountCodes.length > 1) {
      setDiscountCodes((prev) => prev.filter((discount) => discount.id !== id));
    }
  };

  const handleSetupDiscounts = () => {
    const formData = new FormData();
    formData.append("_action", "setup_discounts");
    formData.append("discounts", JSON.stringify(discountCodes));
    fetcher.submit(formData, { method: "POST" });
  };

  const isLoading = fetcher.state === "submitting";
  const result = fetcher.data;

  return (
    <Page title="Setup Discount Codes">
      <BlockStack gap="400">
        <Banner title="Discount Code Setup" tone="info">
          <p>
            Create and customize discount codes for your puzzle game. These
            codes will be automatically assigned to players based on their
            puzzle completion performance and stored in metafields for the
            puzzle widget to use.
          </p>
        </Banner>

        {hasExistingCodes && (
          <Banner title="Discount Codes Already Active" tone="success">
            <p>
              You already have {existingDiscountCodes.length} active discount
              codes set up.
            </p>
          </Banner>
        )}

        {!hasExistingCodes && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="headingMd">Customize Discount Codes</Text>
                <Button onClick={addDiscountCode} variant="plain">
                  + Add Discount Code
                </Button>
              </InlineStack>

              {discountCodes.map((discount, index) => (
                <div key={discount.id}>
                  <Card sectioned>
                    <BlockStack gap="400">
                      <InlineStack align="space-between">
                        <Text variant="headingSm">
                          Discount Code #{index + 1}
                        </Text>
                        {discountCodes.length > 1 && (
                          <Button
                            onClick={() => removeDiscountCode(discount.id)}
                            variant="plain"
                            tone="critical"
                          >
                            Remove
                          </Button>
                        )}
                      </InlineStack>

                      <InlineStack gap="400">
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Discount Code"
                            value={discount.code}
                            onChange={(value) =>
                              updateDiscountCode(
                                discount.id,
                                "code",
                                value.toUpperCase(),
                              )
                            }
                            placeholder="PUZZLE10"
                            helpText="Unique code customers will use"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Discount Percentage"
                            type="number"
                            value={discount.percentage.toString()}
                            onChange={(value) =>
                              updateDiscountCode(
                                discount.id,
                                "percentage",
                                Number.parseInt(value) || 0,
                              )
                            }
                            suffix="%"
                            min={1}
                            max={100}
                            helpText="1-100%"
                          />
                        </div>
                      </InlineStack>

                      <TextField
                        label="Title"
                        value={discount.title}
                        onChange={(value) =>
                          updateDiscountCode(discount.id, "title", value)
                        }
                        placeholder="Puzzle Bronze Reward - 10% Off"
                        helpText="Internal title for the discount"
                      />

                      <InlineStack gap="400">
                        <div style={{ flex: 1 }}>
                          <Select
                            label="Tier"
                            options={tierOptions}
                            value={discount.tier}
                            onChange={(value) =>
                              updateDiscountCode(discount.id, "tier", value)
                            }
                            helpText="Performance tier for this discount"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <TextField
                            label="Minimum Score"
                            type="number"
                            value={discount.minScore.toString()}
                            onChange={(value) =>
                              updateDiscountCode(
                                discount.id,
                                "minScore",
                                Number.parseInt(value) || 0,
                              )
                            }
                            suffix="%"
                            min={0}
                            max={100}
                            helpText="Minimum completion score required"
                          />
                        </div>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                  {index < discountCodes.length - 1 && <Divider />}
                </div>
              ))}

              <Button
                variant="primary"
                onClick={handleSetupDiscounts}
                loading={isLoading}
                disabled={isLoading}
                size="large"
              >
                {isLoading
                  ? "Creating discount codes..."
                  : "Create Discount Codes"}
              </Button>
            </BlockStack>
          </Card>
        )}

        {hasExistingCodes && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Current Discount Codes</Text>
              <DataTable
                columnContentTypes={["text", "text", "text", "text", "text"]}
                headings={["Code", "Discount", "Title", "Tier", "Min Score"]}
                rows={existingDiscountCodes.map((discount) => [
                  discount.code,
                  `${discount.percentage}%`,
                  discount.title,
                  discount.tier.charAt(0).toUpperCase() +
                    discount.tier.slice(1),
                  `${discount.minScore}%`,
                ])}
              />
              <Banner title="Already Set Up" tone="success">
                <p>
                  Your discount codes are already active and working with the
                  puzzle widget.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        )}

        {result?.success && !result?.alreadyExists && (
          <Banner title="Success!" tone="success">
            <p>
              Successfully created {result.created} out of {result.total}{" "}
              discount codes and stored them in metafields. The puzzle widget
              should now work properly on your storefront.
            </p>
          </Banner>
        )}

        {result?.alreadyExists && (
          <Banner title="Already Exists" tone="info">
            <p>
              Discount codes are already set up. Found {result.total} existing
              codes.
            </p>
          </Banner>
        )}

        {result?.error && (
          <Banner title="Error" tone="critical">
            <p>{result.error}</p>
          </Banner>
        )}

        {result?.discounts && result.discounts.length > 0 && (
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">
                {result?.alreadyExists
                  ? "Existing Discount Codes"
                  : "Created Discount Codes"}
              </Text>
              <DataTable
                columnContentTypes={["text", "text", "text"]}
                headings={["Code", "Title", "Status"]}
                rows={result.discounts.map((discount) => [
                  discount.code,
                  discount.title,
                  <Badge key={discount.code} tone="success">
                    {result?.alreadyExists ? "Active" : "Created"}
                  </Badge>,
                ])}
              />
            </BlockStack>
          </Card>
        )}

        <Banner title="Performance Tiers Explained" tone="info">
          <BlockStack gap="200">
            <Text variant="bodyMd">
              Discount codes are assigned based on puzzle completion
              performance:
            </Text>
            <ul style={{ marginLeft: "20px" }}>
              <li>
                <strong>Platinum:</strong> Complete puzzle in ≤50% of allocated
                time
              </li>
              <li>
                <strong>Gold:</strong> Complete puzzle in ≤75% of allocated time
              </li>
              <li>
                <strong>Silver:</strong> Complete puzzle within time limit
              </li>
              <li>
                <strong>Bronze:</strong> Partial completion or time expired
              </li>
            </ul>
          </BlockStack>
        </Banner>

        <Banner title="Next Steps" tone="info">
          <p>
            After setting up discount codes:
            <br />
            1. Create a campaign in the "Create Campaign" tab
            <br />
            2. Go to your theme customizer and add the "Jigsaw Puzzle Widget"
            block
            <br />
            3. The widget will appear on your storefront for customers to play
          </p>
        </Banner>
      </BlockStack>
    </Page>
  );
}
