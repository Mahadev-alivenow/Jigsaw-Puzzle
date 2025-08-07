import { authenticate } from "../shopify.server";
import db from "../db.server";
import { createSubscriptionMetafield } from "../../utils/metafields.server";

export const loader = () => {
  return new Response("Webhook route. POST only.", { status: 405 });
};

export const action = async ({ request }) => {
  console.log("General webhook route called:", request.method, request.url);

  try {
    const { topic, shop, session, admin, payload } =
      await authenticate.webhook(request);

    console.log(`Received webhook: ${topic} for shop: ${shop}`);

    if (!admin && topic !== "APP_UNINSTALLED") {
      console.log("No admin context available");
      return new Response(null, { status: 200 });
    }

    switch (topic) {
      case "APP_UNINSTALLED":
        if (session) {
          await db.session.deleteMany({ where: { shop } });
          console.log(`Successfully deleted sessions for ${shop}`);
        }
        break;

      case "APP_SUBSCRIPTIONS_UPDATE":
        console.log("Processing subscription update:", payload);

        if (payload.app_subscription.status === "ACTIVE") {
          await createSubscriptionMetafield(admin.graphql, "true");
          console.log("Subscription activated");
        } else {
          await createSubscriptionMetafield(admin.graphql, "false");
          console.log("Subscription deactivated");
        }
        break;

    case "CUSTOMERS_DATA_REQUEST":
         console.log("Processing CUSTOMERS_DATA_REQUEST webhook");
        // Handle customers data request logic here
        break;
        case "CUSTOMERS_REDACT":    
        console.log("Processing CUSTOMERS_REDACT webhook");
        // Handle customers redact logic here
        break;
    case "SHOP_REDACT":
        console.log("Processing SHOP_REDACT webhook");

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
        break;
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    console.error("Full error:", error);

    // Still return 200 to acknowledge receipt
    return new Response(null, { status: 200 });
  }
};
