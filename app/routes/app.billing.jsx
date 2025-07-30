import { Banner, Button, Card, Layout, Page,InlineStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import connectDB from "../../utils/db.server";
import { AppProvider } from "@shopify/shopify-app-remix/react";

export const loader = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  const { appSubscriptions } = await billing.check();
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  console.log("App Subscriptions:", appSubscriptions);
  return {
    shop,
    admin,
    subscription: appSubscriptions?.[0],
    host,
    apiKey: process.env.SHOPIFY_API_KEY,
  };
};

export const action = async ({ request }) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const shop = session.shop;
  
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  // Connect to the database
  await connectDB();

  // Check if the shop already has a subscription
  const { appSubscriptions } = await billing.check();
  await billing.cancel({ subscriptionId: appSubscriptions?.[0]?.id });

  return json({ message: "Subscription Cancelled", success: true });
};

export default function Billing() {
  const { shop, subscription, host, apiKey } = useLoaderData();
  const actionData = useActionData();

  const submit = useSubmit();
  const shopName = shop.split(".")[0];
  console.log("Shop name:", shopName);
  console.log("Shop from billin:", subscription);

  const MANAGED_BILLING_URL = `https://admin.shopify.com/store/${shopName}/charges/jigsaw-puzzle-1/pricing_plans`;


  if (actionData?.success) {
    shopify.toast.show("Plan cancelled successfully");
  }

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} host={host}>
      <Page title="Billing">
        <Layout>
          <Layout.Section>
            {subscription ? (
              <Banner
                title={`You are subscribed to the ${subscription.name} plan.`}
                tone="success"
                secondaryAction={{
                  content: "Cancel Plan",
                  tone: "critical",
                  onAction: () => {
                    submit({}, { method: "POST" });
                  },
                }}
              />
            ) : (
              <>
                <Banner title="No active subscription" tone="warning">
                  <p>
                    You are currently not subscribed to any plan. To access
                    premium features, please choose a subscription plan.
                  </p>
                </Banner>

                <Card sectioned>
                  <Layout>
                    <Layout.Section>
                      <InlineStack spacing="loose" gap={500}>
                        {" "}
                        {/* Options: 'extraTight', 'tight', 'base', 'loose', 'extraLoose' */}
                        <Button
                          tone="success"
                          variant="primary"
                          url={`https://admin.shopify.com/store/${shopName}/charges/jigsaw-puzzle-1/pricing_plans`}
                          target="_top"
                        >
                          View Plan
                        </Button>

                      </InlineStack>
                    </Layout.Section>
                  </Layout>
                </Card>
              </>
            )}
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}
