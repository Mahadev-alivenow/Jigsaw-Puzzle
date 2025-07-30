"use client";

import { useState } from "react";
import {
  Page,
  Card,
  DataTable,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
  BlockStack,
  Badge,
  EmptyState,
  ButtonGroup,
} from "@shopify/polaris";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import connectDB from "../../utils/db.server";
import { DiscountCodeModel } from "../../models/DiscountCode.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    await connectDB();
    const discountCodes = await DiscountCodeModel.find({ shop }).sort({
      tier: 1,
    });

    return json({
      discountCodes: discountCodes.map((code) => ({
        ...code.toObject(),
        _id: code._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return json({ discountCodes: [], error: "Failed to fetch discount codes" });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const action = formData.get("_action");

    await connectDB();

    if (action === "create") {
      const code = formData.get("code");
      const tier = formData.get("tier");
      const minScore = Number.parseInt(formData.get("minScore"));
      const percentage = Number.parseInt(formData.get("percentage"));

      const discountCode = new DiscountCodeModel({
        shop,
        code,
        tier,
        minScore,
        percentage,
      });

      await discountCode.save();
      return json({
        success: true,
        message: "Discount code created successfully!",
      });
    } else if (action === "update") {
      const codeId = formData.get("codeId");
      const code = formData.get("code");
      const tier = formData.get("tier");
      const minScore = Number.parseInt(formData.get("minScore"));
      const percentage = Number.parseInt(formData.get("percentage"));

      await DiscountCodeModel.findByIdAndUpdate(codeId, {
        code,
        tier,
        minScore,
        percentage,
        updatedAt: new Date(),
      });

      return json({
        success: true,
        message: "Discount code updated successfully!",
      });
    } else if (action === "delete") {
      const codeId = formData.get("codeId");
      await DiscountCodeModel.findByIdAndDelete(codeId);
      return json({
        success: true,
        message: "Discount code deleted successfully!",
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing discount codes:", error);
    return json({ error: "Failed to manage discount codes" }, { status: 500 });
  }
};

export default function DiscountCodes() {
  const { discountCodes } = useLoaderData();
  const fetcher = useFetcher();
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    tier: "bronze",
    minScore: 0,
    percentage: 10,
  });

  const tierOptions = [
    { label: "Bronze (0-49%)", value: "bronze" },
    { label: "Silver (50-74%)", value: "silver" },
    { label: "Gold (75-89%)", value: "gold" },
    { label: "Platinum (90-100%)", value: "platinum" },
  ];

  const defaultMinScores = {
    bronze: 0,
    silver: 50,
    gold: 75,
    platinum: 90,
  };

  const defaultPercentages = {
    bronze: 10,
    silver: 15,
    gold: 20,
    platinum: 25,
  };

  const handleSubmit = () => {
    const submitData = new FormData();

    if (editingCode) {
      submitData.append("_action", "update");
      submitData.append("codeId", editingCode._id);
    } else {
      submitData.append("_action", "create");
    }

    submitData.append("code", formData.code);
    submitData.append("tier", formData.tier);
    submitData.append("minScore", formData.minScore);
    submitData.append("percentage", formData.percentage);

    fetcher.submit(submitData, { method: "POST" });
    handleCloseModal();
  };

  const handleEdit = (code) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      tier: code.tier,
      minScore: code.minScore,
      percentage: code.percentage || 10,
    });
    setShowModal(true);
  };

  const handleDelete = (codeId) => {
    if (confirm("Are you sure you want to delete this discount code?")) {
      const submitData = new FormData();
      submitData.append("_action", "delete");
      submitData.append("codeId", codeId);
      fetcher.submit(submitData, { method: "POST" });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setFormData({ code: "", tier: "bronze", minScore: 0, percentage: 10 });
  };

  const getTierBadge = (tier) => {
    const colors = {
      bronze: "warning",
      silver: "info",
      gold: "success",
      platinum: "attention",
    };
    return <Badge tone={colors[tier]}>{tier.toUpperCase()}</Badge>;
  };

  const handleTierChange = (value) => {
    setFormData({
      ...formData,
      tier: value,
      minScore: defaultMinScores[value],
      percentage: defaultPercentages[value],
    });
  };

  const rows = discountCodes.map((code) => [
    code.code,
    getTierBadge(code.tier),
    `${code.minScore}%`,
    `${code.percentage || 10}%`,
    code.isActive ? (
      <Badge key="active" tone="success">
        Active
      </Badge>
    ) : (
      <Badge key="inactive" tone="critical">
        Inactive
      </Badge>
    ),
    <ButtonGroup key={code._id}>
      <Button size="slim" onClick={() => handleEdit(code)}>
        Edit
      </Button>
      <Button
        size="slim"
        tone="critical"
        onClick={() => handleDelete(code._id)}
      >
        Delete
      </Button>
    </ButtonGroup>,
  ]);

  return (
    <Page
      title="Discount Codes"
      primaryAction={{
        content: "Add Discount Code",
        onAction: () => setShowModal(true),
      }}
    >
      <BlockStack gap="400">
        {fetcher.data?.message && (
          <Banner title="Success" tone="success" onDismiss={() => {}}>
            <p>{fetcher.data.message}</p>
          </Banner>
        )}

        {fetcher.data?.error && (
          <Banner title="Error" tone="critical" onDismiss={() => {}}>
            <p>{fetcher.data.error}</p>
          </Banner>
        )}

        <Banner title="Default Discount Codes" tone="info">
          <p>
            If you don't create custom codes, the system will use these
            defaults: PUZZLE10 (Bronze - 10%), PUZZLE20 (Silver - 20%), PUZZLE25
            (Gold - 25%), PUZZLE30 (Platinum - 30%)
          </p>
        </Banner>

        <Card>
          {discountCodes.length > 0 ? (
            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "text",
                "text",
                "text",
                "text",
              ]}
              headings={[
                "Code",
                "Tier",
                "Min Score",
                "Discount %",
                "Status",
                "Actions",
              ]}
              rows={rows}
            />
          ) : (
            <EmptyState
              heading="No custom discount codes"
              image="/placeholder.png?height=200&width=200"
              action={{
                content: "Add your first discount code",
                onAction: () => setShowModal(true),
              }}
            >
              <p>
                Create custom discount codes for different score tiers with
                custom discount percentages.
              </p>
            </EmptyState>
          )}
        </Card>

        <Modal
          open={showModal}
          onClose={handleCloseModal}
          title={editingCode ? "Edit Discount Code" : "Add Discount Code"}
          primaryAction={{
            content: editingCode ? "Update Code" : "Add Code",
            onAction: handleSubmit,
            disabled:
              !formData.code ||
              !formData.percentage ||
              fetcher.state === "submitting",
            loading: fetcher.state === "submitting",
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleCloseModal,
            },
          ]}
        >
          <Modal.Section>
            <FormLayout>
              <TextField
                label="Discount Code"
                value={formData.code}
                onChange={(value) =>
                  setFormData({ ...formData, code: value.toUpperCase() })
                }
                placeholder="e.g., PUZZLE25OFF"
                helpText="Enter a unique discount code (e.g., SUMMER20, PUZZLE15OFF)"
                autoComplete="off"
              />

              <Select
                label="Tier"
                options={tierOptions}
                value={formData.tier}
                onChange={handleTierChange}
                helpText="Select the tier based on puzzle completion percentage"
              />

              <TextField
                label="Minimum Score (%)"
                type="number"
                value={formData.minScore.toString()}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    minScore: Math.max(
                      0,
                      Math.min(100, Number.parseInt(value) || 0),
                    ),
                  })
                }
                helpText="Minimum puzzle completion percentage required to earn this discount"
                min="0"
                max="100"
                suffix="%"
              />

              <TextField
                label="Discount Percentage"
                type="number"
                value={formData.percentage.toString()}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    percentage: Math.max(
                      1,
                      Math.min(100, Number.parseInt(value) || 1),
                    ),
                  })
                }
                placeholder="e.g., 15"
                helpText="Enter the discount percentage (1-100%)"
                min="1"
                max="100"
                suffix="%"
              />

              <Banner tone="info">
                <p>
                  <strong>Preview:</strong> Users who complete at least{" "}
                  {formData.minScore}% of the puzzle will receive the code "
                  {formData.code}" for {formData.percentage}% off their
                  purchase.
                </p>
              </Banner>
            </FormLayout>
          </Modal.Section>
        </Modal>
      </BlockStack>
    </Page>
  );
}
