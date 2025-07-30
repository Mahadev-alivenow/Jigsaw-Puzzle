import {
  json,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import { authenticate } from "../shopify.server";
import connectDB from "../../utils/db.server";
import { CampaignModel } from "../../models/Campaign.server";
import AWS from "aws-sdk";
import crypto from "crypto";

const uploadHandler = unstable_createMemoryUploadHandler({
  maxPartSize: 5_000_000, // 5MB
});

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
});

const s3 = new AWS.S3();

// Generate a unique filename that's not too long
const generateUniqueFilename = (originalFilename, shopDomain) => {
  // Get file extension
  const ext = originalFilename.split(".").pop().toLowerCase();

  // Create a timestamp component
  const timestamp = Date.now().toString().slice(-6);

  // Create a short hash (8 chars)
  const hash = crypto.randomBytes(4).toString("hex");

  // Create a shop identifier (first 10 chars max)
  const shopPrefix = shopDomain.replace(/[^a-z0-9]/gi, "").slice(0, 10);

  // Combine parts to create unique name (max ~30 chars)
  const uniqueName = `${shopPrefix}_${timestamp}_${hash}.${ext}`;

  return uniqueName;
};

// Upload file to S3
const uploadToS3 = async (fileBuffer, filename, mimetype) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `puzzle_craft/uploads/${filename}`, // Store in puzzle_craft/uploads folder
    Body: fileBuffer,
    ContentType: mimetype,
    ACL: "public-read", // Make the file publicly accessible
  };

  console.log(`📤 [S3] Uploading file to S3:`, {
    bucket: params.Bucket,
    key: params.Key,
    contentType: params.ContentType,
  });

  try {
    const result = await s3.upload(params).promise();
    console.log(`✅ [S3] File uploaded successfully:`, result.Location);
    return result.Location;
  } catch (error) {
    console.error(`❌ [S3] Error uploading file:`, error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    console.log(
      `📝 [Campaign Create] Starting campaign creation for shop: ${shop}`,
    );

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler,
    );

    const name = formData.get("name");
    const puzzlePieces = Number.parseInt(formData.get("puzzlePieces"));
    const widgetPosition = formData.get("widgetPosition");
    const timer = Number.parseInt(formData.get("timer"));
    const imageFile = formData.get("image");

    console.log(`📋 [Campaign Create] Form data received:`, {
      name,
      puzzlePieces,
      widgetPosition,
      timer,
      imageFile: imageFile
        ? `${imageFile.name} (${imageFile.size} bytes)`
        : "No file",
    });

    if (!name || !imageFile) {
      console.error(`❌ [Campaign Create] Missing required fields`);
      return json({ error: "Name and image are required" }, { status: 400 });
    }

    // Validate AWS S3 configuration
    if (
      !process.env.AWS_S3_BUCKET_NAME ||
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY
    ) {
      console.error(`❌ [Campaign Create] AWS S3 configuration missing`);
      return json(
        { error: "AWS S3 configuration is not properly set up" },
        { status: 500 },
      );
    }

    // Generate a unique filename for the image
    const uniqueFilename = generateUniqueFilename(imageFile.name, shop);
    console.log(
      `🏷️ [Campaign Create] Generated unique filename: ${uniqueFilename}`,
    );

    // Convert image file to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    console.log(
      `📦 [Campaign Create] Image buffer created, size: ${imageBuffer.length} bytes`,
    );

    // Upload image to S3
    console.log(`☁️ [Campaign Create] Uploading image to S3...`);
    const imageUrl = await uploadToS3(
      imageBuffer,
      uniqueFilename,
      imageFile.type,
    );
    console.log(`✅ [Campaign Create] Image uploaded to S3: ${imageUrl}`);

    await connectDB();

    // First, deactivate all existing campaigns for this shop
    console.log(
      `🔄 [Campaign Create] Deactivating existing campaigns for shop: ${shop}`,
    );
    await CampaignModel.updateMany(
      { shop },
      { isActive: false, updatedAt: new Date() },
    );

    // Create new campaign as active (since all others are now inactive)
    const campaignData = {
      shop,
      name,
      imageUrl, // Store the S3 URL
      puzzlePieces,
      widgetPosition,
      timer,
      isActive: true, // New campaign will be the only active one
    };

    console.log(
      `💾 [Campaign Create] Creating campaign in MongoDB:`,
      campaignData,
    );

    const campaign = new CampaignModel(campaignData);
    await campaign.save();

    console.log(`✅ [Campaign Create] Campaign created successfully:`, {
      id: campaign.id,
      name: campaign.name,
      imageUrl: campaign.imageUrl,
      puzzlePieces: campaign.puzzlePieces,
      timer: campaign.timer,
    });

    return json({
      success: true,
      campaign: campaign.toObject(),
      message: "Campaign created and image uploaded to S3 successfully",
    });
  } catch (error) {
    console.error(`❌ [Campaign Create] Error creating campaign:`, error);
    console.error(`🔍 [Campaign Create] Error stack:`, error.stack);

    return json(
      {
        error: error.message || "Failed to create campaign",
        details: error.stack,
      },
      { status: 500 },
    );
  }
};
