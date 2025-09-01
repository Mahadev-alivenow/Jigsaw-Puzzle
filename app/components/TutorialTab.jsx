import { Card, Text, BlockStack } from "@shopify/polaris";

export default function TutorialTab() {
  return (
    <Card>
      <BlockStack gap="400">
        {/* Tutorial Heading */}
        <Text variant="headingMd">Tutorial</Text>
        <Text>
          Learn how to use <strong>Prizzzle</strong> with our step-by-step
          guide.
        </Text>

        {/* Tutorial Video */}
        <video width="100%" height="auto" controls>
          <source src="/Shopify.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Storefront Instructions */}
        <div>
          <Text variant="headingMd">Storefront Instructions</Text>
          <Text as="p">
            Follow these steps to explore and customize Prizzzle in your Shopify
            theme:
          </Text>
          <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
            <li>
              Go to your Shopify admin dashboard and navigate to{" "}
              <strong>Online Store &gt; Themes</strong>.
            </li>
            <li>
              Click on <strong>Customize</strong> for the theme where you want
              to add Prizzzle.
            </li>
            <li>
              In the left-hand sidebar, locate <strong>App blocks</strong> or
              <strong>Sections</strong>.
            </li>
            <li>
              Add <strong>Prizzzle</strong> from the available app blocks and
              place it wherever you want in your storefront (e.g., Homepage,
              Product page).
            </li>
            <li>
              Adjust the settings and styling as per your requirements. You can
              preview changes in real-time within the Theme Editor.
            </li>
            <li>
              Once satisfied, click <strong>Save</strong> to publish your
              changes.
            </li>
          </ul>
          <Text as="p" tone="subdued" fontWeight="medium">
            Tip: You can always re-arrange or remove Prizzzle from your theme
            editor without affecting your products or store settings.
          </Text>
        </div>
      </BlockStack>
    </Card>
  );
}
