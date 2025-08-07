// app/routes/webhooks/gdpr/customers_redact.jsx

import { authenticate } from "../shopify.server";

// Handle GET requests (should not happen for webhooks, but just in case)
export const loader = async () => {
  return new Response("Method not allowed", { status: 405 })
}

export const action = async ({ request }) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);
    console.log(`✅ [${topic}] Customer data redaction requested for ${shop}`);

    // Handle customer data redaction here if needed
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("❌ Error handling customers_redact webhook:", err);
    return new Response("Webhook error", { status: 200 });
  }
};
