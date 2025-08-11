"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Badge,
  Button,
  Modal,
  TextField,
  FormLayout,
  Banner,
  BlockStack,
  InlineStack,
  EmptyState,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

export default function CampaignsTab() {
  const fetcher = useFetcher();
  const [campaigns, setCampaigns] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [editName, setEditName] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);
  const [subscription, setSubscription] = useState("");

  useEffect(() => {
    fetcher.load("/app/campaigns");
  }, []);

  useEffect(() => {
    if (fetcher.data?.campaigns) {
      setCampaigns(fetcher.data.campaigns);
    }
    if (fetcher.data?.subscription) {
      setSubscription(fetcher.data.subscription);
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      setToastMessage("Campaign updated successfully!");
      setToastError(false);
      setShowToast(true);
      setTimeout(() => {
        fetcher.load("/app/campaigns");
      }, 100);
    } else if (fetcher.data?.error && fetcher.state === "idle") {
      setToastMessage(fetcher.data.error);
      setToastError(true);
      setShowToast(true);
    }
  }, [fetcher.data?.success, fetcher.data?.error, fetcher.state]);

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setEditName(campaign.name);
    setEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    const formData = new FormData();
    formData.append("campaignId", editingCampaign._id);
    formData.append("name", editName);
    fetcher.submit(formData, {
      method: "POST",
      action: "/app/campaigns/update",
    });
    setEditModal(false);
    setEditingCampaign(null);
    setEditName("");
  };

  const handleDeleteClick = (campaign) => {
    setDeletingCampaign(campaign);
    setDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingCampaign) return;
    const formData = new FormData();
    formData.append("campaignId", deletingCampaign._id);
    fetcher.submit(formData, {
      method: "POST",
      action: "/app/campaigns/delete",
    });
    setDeleteModal(false);
    setDeletingCampaign(null);
  };

  const handleCancelDelete = () => {
    setDeleteModal(false);
    setDeletingCampaign(null);
  };

  const handleToggleStatus = (campaign) => {
    const formData = new FormData();
    formData.append("campaignId", campaign._id);
    formData.append("isActive", !campaign.isActive);
    fetcher.submit(formData, {
      method: "POST",
      action: "/app/campaigns/toggle",
    });
  };

  const getPositionLabel = (position) => {
    const positions = {
      "right-bottom": "Right Bottom",
      "right-top": "Right Top",
      "bottom-center": "Bottom Center",
      "left-bottom": "Left Bottom",
    };
    return positions[position] || position;
  };

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setShowToast(false)}
      error={toastError}
      duration={4000}
    />
  ) : null;

  if (fetcher.state === "loading") {
    return (
      <Frame>
        <Card>
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Text>Loading campaigns...</Text>
          </div>
        </Card>
        {toastMarkup}
      </Frame>
    );
  }

  // Empty state
  if (campaigns.length === 0) {
    return (
      <Frame>
        <Card>
          <EmptyState
            heading="No campaigns yet"
            image="/placeholder.png?height=200&width=200"
          >
            <p>Create your first puzzle campaign to get started!</p>
          </EmptyState>
        </Card>
        {toastMarkup}
      </Frame>
    );
  }

  // Free plan logic: more than 1 campaign
  if (subscription === "Free plan" && campaigns.length > 1) {
    return (
      <Frame>
        <Banner tone="warning" title="Free Plan Limit">
          Only one campaign is allowed on the Free plan. Please delete extra
          campaigns or upgrade your plan to add more.
        </Banner>
        <Card>
          <BlockStack gap="400">
            <Text variant="headingMd">Delete Extra Campaigns</Text>
            <ResourceList
              items={campaigns}
              renderItem={(campaign) => {
                const { _id, name, imageUrl, createdAt } = campaign;
                return (
                  <ResourceItem
                    id={_id}
                    media={
                      <Thumbnail
                        source={
                          imageUrl || "/placeholder.png?height=50&width=50"
                        }
                        alt={name}
                        size="medium"
                      />
                    }
                    accessibilityLabel={`Campaign ${name}`}
                  >
                    <BlockStack gap="200">
                      <Text variant="bodyMd" fontWeight="bold">
                        {name}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        Created: {new Date(createdAt).toLocaleDateString()}
                      </Text>
                      <Button
                        size="slim"
                        tone="critical"
                        onClick={() => handleDeleteClick(campaign)}
                        loading={fetcher.state === "submitting"}
                      >
                        Delete
                      </Button>
                    </BlockStack>
                  </ResourceItem>
                );
              }}
            />
          </BlockStack>
        </Card>
        {toastMarkup}

        {/* Delete Modal */}
        <Modal
          open={deleteModal}
          onClose={handleCancelDelete}
          title="Delete Campaign"
          primaryAction={{
            content: "Delete Campaign",
            onAction: handleConfirmDelete,
            destructive: true,
            loading: fetcher.state === "submitting",
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: handleCancelDelete,
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text variant="bodyMd">
                Are you sure you want to delete the campaign "
                {deletingCampaign?.name}"?
              </Text>
              <Banner title="This action cannot be undone" tone="warning">
                <p>
                  Deleting this campaign will permanently remove it from your
                  account.
                </p>
              </Banner>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </Frame>
    );
  }

  // Otherwise: puzzle-lite or paid plan → show full list
  return (
    <Frame>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text variant="headingMd">Your Campaigns ({campaigns.length})</Text>
          </InlineStack>

          <ResourceList
            items={campaigns}
            renderItem={(campaign) => {
              const {
                _id,
                name,
                imageUrl,
                puzzlePieces,
                widgetPosition,
                timer,
                isActive,
                createdAt,
              } = campaign;

              return (
                <ResourceItem
                  id={_id}
                  media={
                    <Thumbnail
                      source={imageUrl || "/placeholder.png?height=50&width=50"}
                      alt={name}
                      size="medium"
                    />
                  }
                  accessibilityLabel={`Campaign ${name}`}
                >
                  <BlockStack gap="200">
                    <InlineStack gap="300" align="space-between">
                      <Text variant="bodyMd" fontWeight="bold">
                        {name}
                      </Text>
                      <Badge tone={isActive ? "success" : "subdued"}>
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </InlineStack>

                    <InlineStack gap="400">
                      <Text variant="bodySm" tone="subdued">
                        {puzzlePieces} pieces
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        {timer}s timer
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        {getPositionLabel(widgetPosition)}
                      </Text>
                    </InlineStack>

                    <Text variant="bodySm" tone="subdued">
                      Created: {new Date(createdAt).toLocaleDateString()}
                    </Text>

                    <InlineStack gap="200">
                      <Button size="slim" onClick={() => handleEdit(campaign)}>
                        Edit Name
                      </Button>
                      <Button
                        size="slim"
                        tone={isActive ? "critical" : "success"}
                        onClick={() => handleToggleStatus(campaign)}
                        loading={fetcher.state === "submitting"}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="slim"
                        tone="critical"
                        onClick={() => handleDeleteClick(campaign)}
                        loading={fetcher.state === "submitting"}
                      >
                        Delete
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </ResourceItem>
              );
            }}
          />
        </BlockStack>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Campaign Name"
        primaryAction={{
          content: "Save Changes",
          onAction: handleSaveEdit,
          disabled: !editName.trim() || fetcher.state === "submitting",
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setEditModal(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Campaign Name"
              value={editName}
              onChange={setEditName}
              autoComplete="off"
              disabled={fetcher.state === "submitting"}
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteModal}
        onClose={handleCancelDelete}
        title="Delete Campaign"
        primaryAction={{
          content: "Delete Campaign",
          onAction: handleConfirmDelete,
          destructive: true,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCancelDelete,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd">
              Are you sure you want to delete the campaign "
              {deletingCampaign?.name}"?
            </Text>
            <Banner title="This action cannot be undone" tone="warning">
              <p>
                Deleting this campaign will permanently remove it from your
                account. Any active puzzle widgets using this campaign will stop
                working.
              </p>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {toastMarkup}
    </Frame>
  );
}
