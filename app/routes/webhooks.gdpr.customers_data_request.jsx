// app/routes/webhooks/gdpr/customers_data_request.jsx

import { authenticate } from "../shopify.server";

// Handle GET requests (should not happen for webhooks, but just in case)
export const loader = async () => {
  return new Response("Method not allowed", { status: 405 })
}

export const action = async ({ request }) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);
    console.log(`✅ [${topic}] Customers data request from ${shop}`);

    // Handle customer data request logic here if needed
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("❌ Error handling customers_data_request webhook:", err);
    return new Response("Webhook error", { status: 200 });
  }
};
