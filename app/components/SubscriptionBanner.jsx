import { Banner, Text } from "@shopify/polaris";

export default function SubscriptionBanner({ subscription }) {
  let message = "Your plan is active and all features are unlocked.";

  if (subscription?.name?.toLowerCase() === "free plan") {
    message =
      "Only one campaign is allowed on the Free plan. Upgrade to unlock more campaigns and features.";
  } else if (subscription?.name?.toLowerCase() === "puzzle-lite") {
    message = "Your plan is active and all features are unlocked.";
  }

  return (
    <Banner
      title={`Subscription Active: ${subscription?.name || "Unknown Plan"}`}
      tone="success"
    >
      <p>{message}</p>
    </Banner>
  );
}
