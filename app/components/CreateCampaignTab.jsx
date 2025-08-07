"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  FormLayout,
  TextField,
  Select,
  Button,
  DropZone,
  Thumbnail,
  Banner,
  BlockStack,
  InlineStack,
  Layout,
  Badge,
  Toast,
  Frame,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import PuzzlePreview from "./PuzzlePreview";

export default function CreateCampaignTab() {
  const fetcher = useFetcher();
  const [campaignName, setCampaignName] = useState("");
  const [puzzlePieces, setPuzzlePieces] = useState("4");
  const [widgetPosition, setWidgetPosition] = useState("right-bottom");
  const [timer, setTimer] = useState("30");
  const [files, setFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];

  const isLoading = fetcher.state === "submitting";
  const isSuccess = fetcher.data?.success;
  const error = fetcher.data?.error;

  // Clear form after successful creation and show toast
  useEffect(() => {
    if (isSuccess && fetcher.state === "idle") {
      setCampaignName("");
      setPuzzlePieces("4");
      setWidgetPosition("right-bottom");
      setTimer("30");
      setFiles([]);
      setRejectedFiles([]);
      setPreviewImage("");

      // Show success toast
      setToastMessage("Campaign created successfully! 🎉");
      setToastError(false);
      setShowToast(true);
    } else if (error && fetcher.state === "idle") {
      // Show error toast
      setToastMessage(error);
      setToastError(true);
      setShowToast(true);
    }
  }, [isSuccess, error, fetcher.state]);

  const handleDropZoneDrop = (droppedFiles, acceptedFiles, rejectedFiles) => {
    setFiles(acceptedFiles);
    setRejectedFiles(rejectedFiles);

    // Create preview URL for the uploaded image
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (validImageTypes.includes(file.type)) {
        const imageUrl = window.URL.createObjectURL(file);
        setPreviewImage(imageUrl);
      }
    } else {
      setPreviewImage("");
    }
  };

  const handleSubmit = () => {
    if (!campaignName || files.length === 0) {
      setToastMessage("Please enter a campaign name and upload an image");
      setToastError(true);
      setShowToast(true);
      return;
    }

    const formData = new FormData();
    formData.append("name", campaignName);
    formData.append("puzzlePieces", puzzlePieces);
    formData.append("widgetPosition", widgetPosition);
    formData.append("timer", timer);
    formData.append("image", files[0]);

    fetcher.submit(formData, {
      method: "POST",
      action: "/app/campaigns/create",
      encType: "multipart/form-data",
    });
  };

  const puzzlePiecesOptions = [
    { label: "4 Pieces", value: "4" },
    { label: "8 Pieces", value: "8" },
  ];

  const widgetPositionOptions = [
    { label: "Right Bottom", value: "right-bottom" },
    { label: "Right Top", value: "right-top" },
    { label: "Bottom Center", value: "bottom-center" },
    { label: "Left Bottom", value: "left-bottom" },
  ];

  const timerOptions = [
    { label: "30 Seconds", value: "30" },
    { label: "45 Seconds", value: "45" },
  ];

  const fileUpload = !files.length && (
    <DropZone.FileUpload actionHint="Accepts .jpg, .png, .gif — Max size 10 MB" />
  );

  const uploadedFiles = files.length > 0 && (
    <div style={{ padding: "20px" }}>
      <BlockStack gap="300">
        {files.map((file, index) => (
          <InlineStack key={index} gap="300" align="center">
            <Thumbnail
              size="small"
              alt={file.name}
              source={
                validImageTypes.includes(file.type)
                  ? window.URL.createObjectURL(file)
                  : "/placeholder.png?height=40&width=40"
              }
            />
            <div>
              <Text variant="bodyMd" fontWeight="bold">
                {file.name}
              </Text>
              <Text variant="bodySm" tone="subdued">
                {file.size} bytes
              </Text>
            </div>
          </InlineStack>
        ))}
      </BlockStack>
    </div>
  );

  const toastMarkup = showToast ? (
    <Toast
      content={toastMessage}
      onDismiss={() => setShowToast(false)}
      error={toastError}
      duration={4000}
    />
  ) : null;

  return (
    <Frame>
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="500">
              <Text variant="headingMd">Create New Campaign</Text>

              <FormLayout>
                <TextField
                  label="Campaign Name"
                  value={campaignName}
                  onChange={setCampaignName}
                  placeholder="Enter campaign name"
                  disabled={isLoading}
                />

                <Text variant="headingXs">Upload Puzzle Image</Text>
                <DropZone
                  accept="image/*"
                  type="image"
                  onDrop={handleDropZoneDrop}
                  disabled={isLoading}
                >
                  {uploadedFiles}
                  {fileUpload}
                </DropZone>

                {rejectedFiles.length > 0 && (
                  <Banner title="File upload error" tone="critical">
                    Please upload a valid image file (JPG, PNG, GIF).
                  </Banner>
                )}

                <Select
                  label="Puzzle Pieces"
                  options={puzzlePiecesOptions}
                  value={puzzlePieces}
                  onChange={setPuzzlePieces}
                  disabled={isLoading}
                />

                <Select
                  label="Widget Position"
                  options={widgetPositionOptions}
                  value={widgetPosition}
                  onChange={setWidgetPosition}
                  disabled={isLoading}
                />

                <Select
                  label="Timer Duration"
                  options={timerOptions}
                  value={timer}
                  onChange={setTimer}
                  disabled={isLoading}
                />

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!campaignName || files.length === 0 || isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Creating Campaign..." : "Create Campaign"}
                </Button>
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Live Preview</Text>

              {/* Campaign Settings Preview */}
              <Card background="bg-surface-secondary">
                <BlockStack gap="300">
                  <Text variant="headingSm">Campaign Settings</Text>
                  <InlineStack gap="400" wrap>
                    <Badge tone="info">
                      Name: {campaignName || "Enter campaign name"}
                    </Badge>
                    <Badge tone="attention">{puzzlePieces} Pieces</Badge>
                    <Badge tone="success">{timer}s Timer</Badge>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued">
                    Widget Position:{" "}
                    {
                      widgetPositionOptions.find(
                        (opt) => opt.value === widgetPosition,
                      )?.label
                    }
                  </Text>
                </BlockStack>
              </Card>

              {/* Widget Position Preview */}
              <Card background="bg-surface-secondary">
                <BlockStack gap="300">
                  <Text variant="headingSm">Widget Position Preview</Text>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "200px",
                      border: "2px dashed #e1e3e5",
                      borderRadius: "8px",
                      backgroundColor: "#f6f6f7",
                    }}
                  >
                    <Text
                      variant="bodySm"
                      tone="subdued"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      Your Store Page
                    </Text>

                    {/* Widget Position Indicator */}
                    <div
                      style={{
                        position: "absolute",
                        width: "60px",
                        height: "40px",
                        backgroundColor: "#007ace",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "bold",
                        ...(widgetPosition === "right-bottom" && {
                          bottom: "10px",
                          right: "10px",
                        }),
                        ...(widgetPosition === "right-top" && {
                          top: "10px",
                          right: "10px",
                        }),
                        ...(widgetPosition === "bottom-center" && {
                          bottom: "10px",
                          left: "50%",
                          transform: "translateX(-50%)",
                        }),
                        ...(widgetPosition === "left-bottom" && {
                          bottom: "10px",
                          left: "10px",
                        }),
                      }}
                    >
                      PUZZLE
                    </div>
                  </div>
                </BlockStack>
              </Card>

              {/* Puzzle Preview */}
              {previewImage && (
                <PuzzlePreview
                  imageUrl={previewImage}
                  pieces={Number.parseInt(puzzlePieces)}
                  timer={Number.parseInt(timer)}
                  showControls={false}
                />
              )}

              {!previewImage && (
                <Card background="bg-surface-secondary">
                  <div style={{ padding: "40px", textAlign: "center" }}>
                    <Text variant="bodySm" tone="subdued">
                      Upload an image to see puzzle preview
                    </Text>
                  </div>
                </Card>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Frame>
  );
}
