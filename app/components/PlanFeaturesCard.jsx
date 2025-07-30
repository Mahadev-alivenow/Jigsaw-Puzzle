import {
  Card,
  ResourceList,
  ResourceItem,
  Icon,
  Text,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { useFetcher } from "@remix-run/react";

const PLAN_FEATURES = [
  "Create Custom Puzzles",
  "Unlimited Campaign Creation",
  "Leaderboard Access",
  "Basic Analytics",
  "Mobile & Desktop Support",
  "Standard Puzzle Templates",
];

export default function PlanFeaturesCard({ shopName }) {
  const fetcher = useFetcher();

  return (
    <BlockStack gap="400">
      <Card padding="800">
        <BlockStack gap="500">
          <Text variant="headingLg">Puzzle Lite - $5 / 30 days</Text>
          <Text tone="subdued">Unlock all features with this plan:</Text>

          <ResourceList
            items={PLAN_FEATURES}
            renderItem={(feature, index) => (
              <ResourceItem id={index}>
                <Icon source={CheckIcon} tone="success" />
                <Text>{feature}</Text>
              </ResourceItem>
            )}
          />

          <fetcher.Form method="POST">
            <Button
              tone="success"
              variant="primary"
              url={`https://admin.shopify.com/store/${shopName}/charges/jigsaw-puzzle-1/pricing_plans`}
              target="_top"
            >
              Subscribe Now
            </Button>
          </fetcher.Form>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}
