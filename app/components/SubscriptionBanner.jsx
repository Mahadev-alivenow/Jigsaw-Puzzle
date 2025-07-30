import { Banner, Text } from "@shopify/polaris";

export default function SubscriptionBanner({ subscription }) {
  return (
    <Banner title={`Subscription Active: ${subscription.name}`} tone="success">
      <p>Your plan is active and all features are unlocked.</p>
    </Banner>
  );
}
