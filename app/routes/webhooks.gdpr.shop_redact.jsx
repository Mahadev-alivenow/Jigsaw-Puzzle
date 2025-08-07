// app/routes/webhooks/gdpr/shop_redact.jsx

// import { shopify } from "../../../shopify.server"; // ✅ Correct relative import
// import { shopify } from "../shopify.server"; // ✅ Correct relative import
import { authenticate } from "../shopify.server";

export const loader = async () => {
  return new Response("Method not allowed", { status: 405 });
};

export const action = async ({ request }) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);
    console.log(`✅ [${topic}] Shop data redaction requested for ${shop}`);

    // You can handle the body if needed
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("❌ Error handling shop_redact webhook:", err);
    // 👇 Shopify expects 401 on invalid HMAC
    return new Response("Unauthorized", { status: 401 });
  }
};
