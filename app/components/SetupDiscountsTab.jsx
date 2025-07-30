"use client";

import { useFetcher } from "@remix-run/react";
import {
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
import { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function SetupDiscountsTab() {
  const fetcher = useFetcher();
  const app = useAppBridge();

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

  // Handle toast notifications based on fetcher results
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      const result = fetcher.data;

      if (result.success && !result.alreadyExists) {
        // Success toast for created discount codes
        app.toast.show(
          `🎉 Successfully created ${result.created} discount codes!`,
          {
            duration: 5000,
            isError: false,
          },
        );
      } else if (result.alreadyExists) {
        // Info toast for existing codes
        app.toast.show(
          `ℹ️ Discount codes already exist (${result.total} found)`,
          {
            duration: 4000,
            isError: false,
          },
        );
      } else if (result.error) {
        // Error toast
        app.toast.show(`❌ Error: ${result.error}`, {
          duration: 6000,
          isError: true,
        });
      }
    }
  }, [fetcher.data, fetcher.state, app]);

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

    // Toast for adding new discount code
    app.toast.show("➕ New discount code added", {
      duration: 2000,
      isError: false,
    });
  };

  const removeDiscountCode = (id) => {
    if (discountCodes.length > 1) {
      const removedCode = discountCodes.find((discount) => discount.id === id);
      setDiscountCodes((prev) => prev.filter((discount) => discount.id !== id));

      // Toast for removing discount code
      app.toast.show(`🗑️ Removed discount code: ${removedCode?.code}`, {
        duration: 3000,
        isError: false,
      });
    }
  };

  const handleSetupDiscounts = () => {
    // Validation before submission
    const invalidCodes = discountCodes.filter(
      (discount) =>
        !discount.code ||
        !discount.title ||
        discount.percentage < 1 ||
        discount.percentage > 100 ||
        discount.minScore < 0 ||
        discount.minScore > 100,
    );

    if (invalidCodes.length > 0) {
      app.toast.show("⚠️ Please fix validation errors before creating codes", {
        duration: 4000,
        isError: true,
      });
      return;
    }

    // Show loading toast
    app.toast.show("🔄 Creating discount codes in Shopify...", {
      duration: 2000,
      isError: false,
    });

    const formData = new FormData();
    formData.append("_action", "setup_discounts");
    formData.append("discounts", JSON.stringify(discountCodes));
    fetcher.submit(formData, {
      method: "POST",
      action: "/app/setup-discounts",
    });
  };

  const isLoading = fetcher.state === "submitting";
  const result = fetcher.data;

  return (
    <BlockStack gap="400">
      <Banner title="Discount Code Setup" tone="info">
        <p>
          Create and customize discount codes for your puzzle game. These codes
          will be automatically assigned to players based on their puzzle
          completion performance and stored in metafields for the puzzle widget
          to use.
        </p>
      </Banner>

      {result?.success && !result?.alreadyExists && (
        <Banner title="Success!" tone="success">
          <p>
            Successfully created {result.created} out of {result.total} discount
            codes and stored them in metafields. The puzzle widget should now
            work properly on your storefront.
          </p>
        </Banner>
      )}

      {result?.alreadyExists && (
        <Banner title="Discount Codes Already Active" tone="success">
          <p>You already have {result.total} active discount codes set up.</p>
        </Banner>
      )}

      {!result?.alreadyExists && (
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
                          error={!discount.code ? "Code is required" : ""}
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
                          error={
                            discount.percentage < 1 || discount.percentage > 100
                              ? "Percentage must be between 1-100%"
                              : ""
                          }
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
                      error={!discount.title ? "Title is required" : ""}
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
                          error={
                            discount.minScore < 0 || discount.minScore > 100
                              ? "Score must be between 0-100%"
                              : ""
                          }
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

      {/* {result?.success && !result?.alreadyExists && (
        <Banner title="Success!" tone="success">
          <p>
            Successfully created {result.created} out of {result.total} discount
            codes and stored them in metafields. The puzzle widget should now
            work properly on your storefront.
          </p>
        </Banner>
      )} */}

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
              columnContentTypes={["text", "text", "text", "text", "text"]}
              headings={["Code", "Discount", "Title", "Tier", "Status"]}
              rows={result.discounts.map((discount) => [
                discount.code,
                `${discount.percentage}%`,
                discount.title,
                discount.tier.charAt(0).toUpperCase() + discount.tier.slice(1),
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
            Discount codes are assigned based on puzzle completion performance:
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
  );
}
