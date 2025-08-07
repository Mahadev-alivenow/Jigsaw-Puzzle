import crypto from "crypto";

export const action = async ({ request }) => {
  console.log("CUSTOMERS_DATA_REQUEST webhook received");

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
      console.error("CUSTOMERS_DATA_REQUEST: HMAC verification failed");
      return new Response("Unauthorized - Invalid HMAC", { status: 401 });
    }

    console.log("CUSTOMERS_DATA_REQUEST: HMAC verification successful");

    // Parse the webhook payload
    const payload = JSON.parse(body);
    console.log("CUSTOMERS_DATA_REQUEST payload:", payload);

    // Process the customer data request
    // In a real app, you would gather and return customer data here
    console.log(
      `Processing CUSTOMERS_DATA_REQUEST for customer: ${payload.customer?.email}`,
    );

    return new Response("CUSTOMERS_DATA_REQUEST processed successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("CUSTOMERS_DATA_REQUEST error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

// Handle GET requests (should not happen for webhooks, but just in case)
export const loader = async () => {
  return new Response("Method not allowed", { status: 405 });
};
