import { json } from "@remix-run/node";
import connectDB from "../../utils/db.server";
import { GameDataModel } from "../../models/GameData.server";

// CORS configuration
const CORS_CONFIG = {
  allowedOrigins: [
    "https://jigsaw-craft.myshopify.com",
    "https://your-shop.myshopify.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  allowedMethods: ["POST", "OPTIONS", "GET"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  maxAge: "86400",
};

// Helper function to get CORS headers
function getCorsHeaders(origin) {
  const isAllowedOrigin =
    CORS_CONFIG.allowedOrigins.includes(origin) ||
    (origin && origin.includes(".myshopify.com")) ||
    (origin && origin.includes("shopify.com")) ||
    (origin && origin.includes("trycloudflare.com"));

  return {
    "Access-Control-Allow-Origin": isAllowedOrigin
      ? origin
      : CORS_CONFIG.allowedOrigins[0],
    "Access-Control-Allow-Methods": CORS_CONFIG.allowedMethods.join(", "),
    "Access-Control-Allow-Headers": CORS_CONFIG.allowedHeaders.join(", "),
    "Access-Control-Allow-Credentials": "false",
    "Access-Control-Max-Age": CORS_CONFIG.maxAge,
    Vary: "Origin",
    "Content-Type": "application/json",
  };
}

// Handle GET requests and OPTIONS preflight requests via loader
export const loader = async ({ request }) => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  console.log("🔧 [CORS] Handling request via loader");
  console.log("🌐 [CORS] Method:", request.method);
  console.log("🌐 [CORS] Origin:", origin);

  // Handle OPTIONS preflight request
  if (request.method === "OPTIONS") {
    console.log("🔧 [CORS] Handling OPTIONS preflight request in loader");
    const requestMethod = request.headers.get("access-control-request-method");
    const requestHeaders = request.headers.get(
      "access-control-request-headers",
    );

    console.log("🌐 [CORS] Request Method:", requestMethod);
    console.log("🌐 [CORS] Request Headers:", requestHeaders);
    console.log("✅ [CORS] Sending CORS headers:", corsHeaders);

    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Handle GET requests (for testing)
  if (request.method === "GET") {
    console.log("🔧 [API] Handling GET request for testing");
    return json(
      {
        success: true,
        message: "Puzzle API endpoint is working",
        timestamp: new Date().toISOString(),
        methods: ["POST", "OPTIONS"],
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  }

  // For other methods, return method not allowed
  return json(
    {
      success: false,
      error: "Method not allowed in loader",
      allowedMethods: ["GET", "OPTIONS"],
    },
    {
      status: 405,
      headers: corsHeaders,
    },
  );
};

export const action = async ({ request }) => {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    console.log("🎮 [Game Submit] Received game submission request");
    console.log("🌐 [Game Submit] Request method:", request.method);
    console.log("🌐 [Game Submit] Request origin:", origin);
    console.log(
      "🌐 [Game Submit] User Agent:",
      request.headers.get("user-agent"),
    );

    // Parse the request body
    const body = await request.text();
    console.log("📄 [Game Submit] Raw request body length:", body.length);

    let gameData;
    try {
      // Try to parse as JSON first
      gameData = JSON.parse(body);
      console.log("✅ [Game Submit] Successfully parsed JSON data");
    } catch (jsonError) {
      console.error("❌ [Game Submit] JSON parsing failed:", jsonError);
      // If JSON parsing fails, try URL-encoded
      const formData = new URLSearchParams(body);
      gameData = Object.fromEntries(formData.entries());

      // Convert string numbers to actual numbers
      if (gameData.score) gameData.score = Number.parseInt(gameData.score);
      if (gameData.completionPercentage)
        gameData.completionPercentage = Number.parseInt(
          gameData.completionPercentage,
        );
      if (gameData.timeUsed)
        gameData.timeUsed = Number.parseInt(gameData.timeUsed);
      if (gameData.totalTime)
        gameData.totalTime = Number.parseInt(gameData.totalTime);
      if (gameData.puzzlePieces)
        gameData.puzzlePieces = Number.parseInt(gameData.puzzlePieces);
      if (gameData.completed)
        gameData.completed = gameData.completed === "true";
      if (gameData.discountPercentage)
        gameData.discountPercentage = Number.parseInt(
          gameData.discountPercentage,
        );

      console.log("✅ [Game Submit] Successfully parsed form data");
    }

    console.log("📊 [Game Submit] Parsed game data:", {
      shop: gameData.shop,
      campaignName: gameData.campaignName,
      playerEmail: gameData.playerEmail,
      score: gameData.score,
      completionPercentage: gameData.completionPercentage,
      discountCode: gameData.discountCode,
    });

    // Validate required fields
    const requiredFields = ["shop", "campaignName", "playerEmail", "score"];
    const missingFields = requiredFields.filter((field) => !gameData[field]);

    if (missingFields.length > 0) {
      console.error("❌ [Game Submit] Missing required fields:", missingFields);
      return json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          receivedFields: Object.keys(gameData),
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    // Connect to database
    console.log("🔌 [Game Submit] Connecting to database...");
    await connectDB();
    console.log("✅ [Game Submit] Connected to database successfully");

    // Parse allLogs if it's a string
    let parsedLogs = [];
    if (gameData.allLogs) {
      try {
        parsedLogs =
          typeof gameData.allLogs === "string"
            ? JSON.parse(gameData.allLogs)
            : gameData.allLogs;
      } catch (e) {
        console.warn(
          "⚠️ [Game Submit] Failed to parse allLogs, using empty array",
        );
        parsedLogs = [];
      }
    }

    // Create game data record
    const gameRecord = new GameDataModel({
      shop: gameData.shop,
      campaignName: gameData.campaignName,
      playerEmail: gameData.playerEmail,
      score: gameData.score || 0,
      completionPercentage: gameData.completionPercentage || 0,
      timeUsed: gameData.timeUsed || 0,
      totalTime: gameData.totalTime || 0,
      puzzlePieces: gameData.puzzlePieces || 0,
      completed: gameData.completed || false,
      discountCode: gameData.discountCode || "",
      discountTier: gameData.discountTier || "bronze",
      discountPercentage: gameData.discountPercentage || 0,
      timestamp: new Date(),
      isEarlySubmission: gameData.isEarlySubmission || false,
      imageLoaded: gameData.imageLoaded || false,
      sessionId: gameData.sessionId || "",
      // Additional metadata
      userAgent: request.headers.get("user-agent") || "",
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      allLogs: parsedLogs,
    });

    console.log("💾 [Game Submit] Attempting to save game record...");

    // Save to database
    const savedRecord = await gameRecord.save();
    console.log(
      "✅ [Game Submit] Game data saved successfully with ID:",
      savedRecord._id,
    );

    // Return success response
    return json(
      {
        success: true,
        message: "Game data saved successfully to puzzle_craft database",
        gameId: savedRecord._id.toString(),
        discountCode: gameData.discountCode,
        discountTier: gameData.discountTier,
        discountPercentage: gameData.discountPercentage,
        timestamp: new Date().toISOString(),
        collection: "gameData",
        database: "puzzle_craft",
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("❌ [Game Submit] Error saving game data:", error);
    console.error("📊 [Game Submit] Error stack:", error.stack);

    return json(
      {
        success: false,
        error: "Failed to save game data to database",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
};
