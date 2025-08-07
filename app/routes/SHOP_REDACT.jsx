import crypto from "crypto";

export const action = async ({ request }) => {
  console.log("SHOP_REDACT webhook received");

  try {
    // Verify HMAC
    const shopifyHmac = request.headers.get("x-shopify-hmac-sha256");
    const secret = process.env.SHOPIFY_API_SECRET;

    if (!secret) {
      console.error("SHOPIFY_API_SECRET is not defined");
      return new Response("Server configuration error", { status: 500 });
    }

    if (!shopifyHmac) {
      console.error("Missing HMAC header");
      return new Response("Unauthorized - Missing HMAC", { status: 401 });
    }

    // Get the raw body
    const body = await request.text();

    // Calculate HMAC
    const calculatedHmac = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("base64");

    // Verify HMAC
    const hmacValid = crypto.timingSafeEqual(
      Buffer.from(calculatedHmac),
      Buffer.from(shopifyHmac),
    );

    if (!hmacValid) {
      console.error("SHOP_REDACT: HMAC verification failed");
      return new Response("Unauthorized - Invalid HMAC", { status: 401 });
    }

    console.log("SHOP_REDACT: HMAC verification successful");

    // Parse the webhook payload
    const payload = JSON.parse(body);
    console.log("SHOP_REDACT payload:", payload);

    // Process the shop redaction request
    // In a real app, you would delete all shop data here
    console.log(`Processing SHOP_REDACT for shop: ${payload.shop_domain}`);

    return new Response("SHOP_REDACT processed successfully", { status: 200 });
  } catch (error) {
    console.error("SHOP_REDACT error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

// Handle GET requests (should not happen for webhooks, but just in case)
export const loader = async () => {
  return new Response("Method not allowed", { status: 405 });
};
