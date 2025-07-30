// Utility functions for managing metafields
export const createOrUpdateMetafield = async (
  admin,
  namespace,
  key,
  value,
  type = "json",
) => {
  // First, get the shop ID to use as ownerId
  const shopQuery = `
      query getShop {
        shop {
          id
        }
      }
    `;

  try {
    const shopResponse = await admin.graphql(shopQuery);
    const shopResult = await shopResponse.json();
    const shopId = shopResult.data?.shop?.id;

    if (!shopId) {
      console.error("Could not get shop ID");
      return { success: false, error: "Could not get shop ID" };
    }

    console.log("🏪 Shop ID for metafield:", shopId);

    const metafieldInput = {
      ownerId: shopId,
      namespace,
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
      type,
    };

    console.log("📝 Creating metafield with input:", metafieldInput);

    const mutation = `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

    const response = await admin.graphql(mutation, {
      variables: {
        metafields: [metafieldInput],
      },
    });

    const result = await response.json();
    console.log("📊 Metafield creation result:", result);

    if (result.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(
        "❌ Metafield errors:",
        result.data.metafieldsSet.userErrors,
      );
      return { success: false, errors: result.data.metafieldsSet.userErrors };
    }

    console.log(
      "✅ Metafield created successfully:",
      result.data?.metafieldsSet?.metafields?.[0],
    );
    return {
      success: true,
      metafield: result.data?.metafieldsSet?.metafields?.[0],
    };
  } catch (error) {
    console.error("❌ Error creating metafield:", error);
    return { success: false, error: error.message };
  }
};

export const getMetafield = async (admin, namespace, key) => {
  const query = `
      query getMetafield($namespace: String!, $key: String!) {
        shop {
          metafield(namespace: $namespace, key: $key) {
            id
            namespace
            key
            value
            type
          }
        }
      }
    `;

  try {
    const response = await admin.graphql(query, {
      variables: { namespace, key },
    });

    const result = await response.json();
    console.log(
      `🔍 Fetched metafield ${namespace}.${key}:`,
      result.data?.shop?.metafield,
    );
    return result.data?.shop?.metafield;
  } catch (error) {
    console.error("❌ Error fetching metafield:", error);
    return null;
  }
};

// Delete a metafield using namespace and key (not ID)
export const deleteMetafield = async (admin, namespace, key) => {
  try {
    console.log(`🗑️ Deleting metafield: ${namespace}.${key}`);

    // First get the shop ID
    const shopQuery = `
        query getShop {
          shop {
            id
          }
        }
      `;

    const shopResponse = await admin.graphql(shopQuery);
    const shopResult = await shopResponse.json();
    const shopId = shopResult.data?.shop?.id;

    if (!shopId) {
      console.error("❌ Could not get shop ID for deletion");
      return { success: false, error: "Could not get shop ID" };
    }

    const mutation = `
        mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
          metafieldsDelete(metafields: $metafields) {
            deletedMetafields {
              ownerId
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

    const response = await admin.graphql(mutation, {
      variables: {
        metafields: [
          {
            ownerId: shopId,
            namespace: namespace,
            key: key,
          },
        ],
      },
    });

    const result = await response.json();
    console.log("📊 Metafield deletion result:", result);

    if (result.data?.metafieldsDelete?.userErrors?.length > 0) {
      console.error(
        "❌ Metafield deletion errors:",
        result.data.metafieldsDelete.userErrors,
      );
      return {
        success: false,
        errors: result.data.metafieldsDelete.userErrors,
      };
    }

    console.log(
      "✅ Metafield deleted successfully:",
      result.data?.metafieldsDelete?.deletedMetafields,
    );
    return {
      success: true,
      deletedMetafields: result.data?.metafieldsDelete?.deletedMetafields,
    };
  } catch (error) {
    console.error("❌ Error deleting metafield:", error);
    return { success: false, error: error.message };
  }
};

// Validate if discount codes still exist in Shopify - IMPROVED VERSION
export const validateDiscountCodes = async (admin, discountCodes) => {
  if (!discountCodes || !Array.isArray(discountCodes)) {
    console.log("⚠️ No discount codes provided for validation");
    return [];
  }

  console.log(
    `🔍 Starting validation of ${discountCodes.length} discount codes...`,
  );
  const validDiscounts = [];

  for (const discount of discountCodes) {
    if (!discount.shopifyId) {
      console.log(
        `⚠️ Discount ${discount.code} has no shopifyId, skipping validation`,
      );
      continue;
    }

    try {
      console.log(
        `🔍 Validating discount: ${discount.code} (ID: ${discount.shopifyId})`,
      );

      // Use a more robust query that handles different discount types
      const query = `
          query getDiscountNode($id: ID!) {
            discountNode(id: $id) {
              id
              discount {
                ... on DiscountCodeBasic {
                  title
                  status
                  codes(first: 10) {
                    nodes {
                      code
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  status
                  codes(first: 10) {
                    nodes {
                      code
                    }
                  }
                }
                ... on DiscountCodeFreeShipping {
                  title
                  status
                  codes(first: 10) {
                    nodes {
                      code
                    }
                  }
                }
              }
            }
          }
        `;

      const response = await admin.graphql(query, {
        variables: { id: discount.shopifyId },
      });

      const result = await response.json();

      // Check for GraphQL errors first
      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors[0].message;
        console.log(
          `❌ GraphQL error for discount ${discount.code}:`,
          errorMessage,
        );

        // Check for various "not found" error patterns
        if (
          errorMessage.includes("not found") ||
          errorMessage.includes("does not exist") ||
          errorMessage.includes("Could not find") ||
          errorMessage.includes("No such id")
        ) {
          console.log(
            `❌ Discount ${discount.code} no longer exists in Shopify`,
          );
          continue;
        } else {
          // For other errors, log but assume the discount exists to be safe
          console.log(
            `⚠️ Unknown error for ${discount.code}, assuming it exists`,
          );
          validDiscounts.push(discount);
          continue;
        }
      }

      const discountNode = result.data?.discountNode;
      const discountData = discountNode?.discount;

      if (
        discountNode &&
        discountData &&
        discountData.codes?.nodes?.length > 0
      ) {
        const actualCode = discountData.codes.nodes[0].code;
        console.log(
          `✅ Discount ${discount.code} exists in Shopify as "${actualCode}" with status: ${discountData.status}`,
        );
        validDiscounts.push(discount);
      } else if (discountNode && discountData) {
        console.log(
          `⚠️ Discount ${discount.code} exists but has no codes, keeping it`,
        );
        validDiscounts.push(discount);
      } else {
        console.log(
          `❌ Discount ${discount.code} no longer exists in Shopify (no data returned)`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error validating discount ${discount.code}:`,
        error.message,
      );
      // On error, assume the discount exists to avoid accidentally removing valid codes
      console.log(
        `⚠️ Assuming ${discount.code} exists due to validation error`,
      );
      validDiscounts.push(discount);
    }
  }

  console.log(
    `📊 Validation complete: ${validDiscounts.length}/${discountCodes.length} codes are valid`,
  );
  return validDiscounts;
};

// Create or update shop metafield with proper handling - FIXED VERSION
export const createOrUpdateShopMetafield = async (
  admin,
  namespace,
  key,
  value,
  type = "json",
) => {
  try {
    console.log(`📝 Creating/updating shop metafield: ${namespace}.${key}`);

    // First get the shop ID
    const shopQuery = `
        query getShop {
          shop {
            id
          }
        }
      `;

    const shopResponse = await admin.graphql(shopQuery);
    const shopResult = await shopResponse.json();
    const shopId = shopResult.data?.shop?.id;

    if (!shopId) {
      console.error("❌ Could not get shop ID");
      return { success: false, error: "Could not get shop ID" };
    }

    console.log("🏪 Using shop ID:", shopId);

    // Check if metafield already exists
    const existingMetafield = await getMetafield(admin, namespace, key);

    if (existingMetafield?.id) {
      console.log("🔄 Metafield exists, deleting and recreating...");

      // Delete existing metafield using namespace and key
      const deleteResult = await deleteMetafield(admin, namespace, key);

      if (!deleteResult.success) {
        console.error(
          "❌ Failed to delete existing metafield, but continuing...",
        );
        // Continue anyway - the metafieldsSet might overwrite
      }
    } else {
      console.log("🆕 Creating new metafield");
    }

    // Create new metafield with correct input structure
    const metafieldInput = {
      ownerId: shopId,
      namespace,
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
      type,
    };

    console.log("📝 Metafield input:", metafieldInput);

    const mutation = `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
              type
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

    const response = await admin.graphql(mutation, {
      variables: {
        metafields: [metafieldInput],
      },
    });

    const result = await response.json();
    console.log("📊 Metafield creation result:", result);

    if (result.data?.metafieldsSet?.userErrors?.length > 0) {
      console.error(
        "❌ Metafield errors:",
        result.data.metafieldsSet.userErrors,
      );
      return { success: false, errors: result.data.metafieldsSet.userErrors };
    }

    const metafield = result.data?.metafieldsSet?.metafields?.[0];
    console.log("✅ Metafield operation successful:", metafield);
    return { success: true, metafield };
  } catch (error) {
    console.error("❌ Error with metafield operation:", error);
    return { success: false, error: error.message };
  }
};

export const getShopMetafield = async (admin, namespace, key) => {
  try {
    console.log(`🔍 Fetching shop metafield: ${namespace}.${key}`);
    return await getMetafield(admin, namespace, key);
  } catch (error) {
    console.error("❌ Error fetching metafield:", error);
    return null;
  }
};

// Get and validate discount codes from metafields - IMPROVED VERSION
export const getValidDiscountCodes = async (
  admin,
  namespace = "puzzle_craft",
  key = "discount_codes",
) => {
  try {
    console.log("🔍 Fetching and validating discount codes...");

    // Get discount codes from metafield
    const metafield = await getShopMetafield(admin, namespace, key);

    if (!metafield || !metafield.value) {
      console.log("📭 No discount codes metafield found");
      return { validCodes: [], needsUpdate: false };
    }

    let discountCodes = [];
    try {
      discountCodes = JSON.parse(metafield.value);
      console.log(
        "📋 Parsed discount codes from metafield:",
        discountCodes.map((c) => c.code).join(", "),
      );
    } catch (error) {
      console.error("❌ Error parsing discount codes JSON:", error);
      return { validCodes: [], needsUpdate: true };
    }

    if (!Array.isArray(discountCodes) || discountCodes.length === 0) {
      console.log("📭 No discount codes found in metafield");
      return { validCodes: [], needsUpdate: false };
    }

    console.log(
      `🔍 Found ${discountCodes.length} discount codes in metafield, validating...`,
    );

    // For now, let's be less aggressive with validation to avoid removing valid codes
    // We'll validate but be more conservative about removing codes
    const validCodes = await validateDiscountCodes(admin, discountCodes);

    // Only update if we lost more than half the codes (to avoid false positives)
    const needsUpdate = validCodes.length < discountCodes.length * 0.5;

    console.log(
      `📊 Validation result: ${validCodes.length}/${discountCodes.length} codes are valid`,
    );
    console.log(
      `🔄 Needs update: ${needsUpdate} (threshold: lost more than 50% of codes)`,
    );

    if (needsUpdate && validCodes.length > 0) {
      console.log(
        `🔄 Updating metafield: ${discountCodes.length} -> ${validCodes.length} codes`,
      );
      const updateResult = await createOrUpdateShopMetafield(
        admin,
        namespace,
        key,
        validCodes,
        "json",
      );
      if (!updateResult.success) {
        console.error("❌ Failed to update metafield with valid codes");
      }
    } else if (needsUpdate && validCodes.length === 0) {
      console.log("🗑️ All codes invalid, deleting metafield");
      const deleteResult = await deleteMetafield(admin, namespace, key);
      if (!deleteResult.success) {
        console.error("❌ Failed to delete empty metafield");
      }
    }

    // Return the original codes if validation didn't trigger an update
    // This prevents UI from showing empty when codes actually exist
    const codesToReturn = needsUpdate ? validCodes : discountCodes;
    console.log(
      `📤 Returning ${codesToReturn.length} codes to UI:`,
      codesToReturn.map((c) => c.code).join(", "),
    );

    return { validCodes: codesToReturn, needsUpdate };
  } catch (error) {
    console.error("❌ Error getting valid discount codes:", error);
    return { validCodes: [], needsUpdate: false };
  }
};

// Get active campaign from MongoDB with detailed logging - FIXED VERSION
export const getActiveCampaignFromMongoDB = async (shop,admin) => {
  try {
    console.log(
      "🎯 [Metafields] Starting active campaign fetch from MongoDB...",
    );
    console.log("🏪 [Metafields] Shop domain:", shop);

    // Import the Campaign model functions
    console.log("📦 [Metafields] Importing Campaign model...");
    const { getActiveCampaign, getCampaignStats } = await import(
      "../models/Campaign.server.js"
    );
    console.log("✅ [Metafields] Campaign model imported successfully");

    // Get campaign statistics first for debugging
    console.log("📊 [Metafields] Fetching campaign statistics...");
    const stats = await getCampaignStats(shop);
    console.log("📊 [Metafields] Campaign statistics:");
    console.log(`  📈 Total campaigns: ${stats.total}`);
    console.log(`  ✅ Active campaigns: ${stats.active}`);
    console.log(`  ❌ Inactive campaigns: ${stats.inactive}`);

    // Fetch active campaign from MongoDB
    console.log("🎯 [Metafields] Fetching active campaign...");
    const activeCampaign = await getActiveCampaign(shop);

    // App installation ID
    const appIdQuery = await admin.graphql(`
      #graphql
      query {
        currentAppInstallation {
          id
        }
        shop {
          id
        }
      }
    `);
    // const appInstallationID = (await appIdQuery.json()).data
    //   .shop.id;

    const appIdQueryData = await appIdQuery.json();
    const appInstallationID = appIdQueryData.data.currentAppInstallation.id;
    // const appInstallationID = appIdQueryData.data.shop.id;

    console.log("Shop Installation ID:", appInstallationID);

    // Build all metafields including subscription status
    const metafieldsInput = [
      // Subscription status
      {
        namespace: "puzzle_craft",
        key: "name",
        type: "single_line_text_field",
        value: activeCampaign.name,
        ownerId: appInstallationID,
      },
      {
        namespace: "puzzle_craft",
        key: "imageUrl",
        type: "single_line_text_field",
        value: activeCampaign.imageUrl,
        ownerId: appInstallationID,
      },
      {
        namespace: "puzzle_craft",
        key: "puzzlePieces",
        type: "number_integer",
        value: activeCampaign.puzzlePieces.toString(),
        ownerId: appInstallationID,
      },
      {
        namespace: "puzzle_craft",
        key: "widgetPosition",
        type: "single_line_text_field",
        value: activeCampaign.widgetPosition,
        ownerId: appInstallationID,
      },
      {
        namespace: "puzzle_craft",
        key: "timer",
        type: "number_integer",
        value: activeCampaign.timer.toString(),
        ownerId: appInstallationID,
      },
      {
        namespace: "puzzle_craft",
        key: "isActive",
        type: "single_line_text_field",
        value: activeCampaign.isActive.toString(),
        ownerId: appInstallationID,
      },
    ];

    // Remove any entries with blank values to avoid Shopify errors
    const filteredMetafields = metafieldsInput.filter(
      (mf) => mf.value !== undefined && mf.value !== null && mf.value !== "",
    );

    // Execute mutation
    const metafieldsMutation = await admin.graphql(
      `
        mutation CreateAppDataMetafield($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      { variables: { metafields: filteredMetafields } },
    );

    const data = await metafieldsMutation.json();
    if (data.data?.metafieldsSet?.userErrors?.length) {
      console.error(
        "Metafield userErrors:",
        data.data.metafieldsSet.userErrors,
      );
      return { success: false, errors: data.data.metafieldsSet.userErrors };
    }

    console.log("from subscription.server.js");
    // console.log("✅ Successfully synced campaign to metafields :",data.data.metafieldsSet.metafields);
    console.log("✅ Successfully synced campaign to metafields :");

    return {
      success: true,
      metafields: data.data.metafieldsSet.metafields,
      campaignId: activeCampaign.id,
    };
  } catch (error) {
    console.error("nitta Error syncing campaign to metafields:", error);
    return { success: false, error: error.message };
  }
};

export async function syncDiscountCodesToMetafields(graphql) {
  try {
    // Step 1: Get App Installation ID
    const appIdQuery = await graphql(`
      query {
        currentAppInstallation {
          id
        }
      }
    `);

    const appInstallationID = (await appIdQuery.json()).data
      .currentAppInstallation.id;
    console.log("App Installation ID:", appInstallationID);

    // Step 2: Get Discount Codes from Shopify
    const discountCodesQuery = await graphql(`
      query getDiscountCodes {
        discountNodes(first: 50) {
          edges {
            node {
              id
              discount {
                __typename
                ... on DiscountCodeBasic {
                  title
                  summary
                  codes(first: 10) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeBxgy {
                  title
                  summary
                  codes(first: 10) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
                ... on DiscountCodeFreeShipping {
                  title
                  summary
                  codes(first: 10) {
                    edges {
                      node {
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const discountsResult = await discountCodesQuery.json();

    // Step 3: Format discount codes as flat array (or grouped, based on your logic)
    const codes = [];

    discountsResult.data.discountNodes.edges.forEach(({ node }) => {
      const discount = node.discount;
      if (discount?.codes?.edges) {
        discount.codes.edges.forEach(({ node: codeNode }) => {
          codes.push(codeNode.code);
        });
      }
    });

    console.log("Collected Discount Codes:", codes);

    // Step 4: Save to App Metafield
    const metafieldsMutation = await graphql(
      `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              namespace
              value
              type
              ownerType
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          metafields: [
            {
              namespace: "codes",
              key: "puzzle_craft_discount_codes",
              type: "json",
              value: JSON.stringify(codes),
              ownerId: appInstallationID,
            },
          ],
        },
      },
    );

    const data = await metafieldsMutation.json();

    if (data.data?.metafieldsSet?.userErrors?.length) {
      console.error(
        "Metafield userErrors:",
        data.data.metafieldsSet.userErrors,
      );
      return {
        success: false,
        errors: data.data.metafieldsSet.userErrors,
      };
    }

    console.log(
      "✅ Successfully synced discount codes to metafields:",
      data.data.metafieldsSet.metafields,
    );

    return {
      success: true,
      metafields: data.data.metafieldsSet.metafields,
      discountCodes: codes,
    };
  } catch (error) {
    console.error("❌ Error syncing discount codes to metafields:", error);
    return { success: false, error: error.message };
  }
}
  
