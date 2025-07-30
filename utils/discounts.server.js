export const createDiscountCode = async (admin, discountData) => {
  const { code, percentage, title, startsAt, endsAt } = discountData;

  const mutation = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) {
                  nodes {
                    code
                  }
                }
                startsAt
                endsAt
                customerSelection {
                  ... on DiscountCustomerAll {
                    allCustomers
                  }
                }
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                  }
                  items {
                    ... on DiscountProducts {
                      products(first: 1) {
                        nodes {
                          id
                        }
                      }
                    }
                    ... on DiscountCollections {
                      collections(first: 1) {
                        nodes {
                          id
                        }
                      }
                    }
                  }
                }
                usageLimit
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

  const variables = {
    basicCodeDiscount: {
      title,
      code,
      startsAt,
      endsAt,
      customerSelection: {
        all: true,
      },
      customerGets: {
        value: {
          percentage: percentage / 100, // Convert to decimal (10% = 0.1)
        },
        items: {
          all: true,
        },
      },
      appliesOncePerCustomer: false,
      usageLimit: null, // No usage limit
    },
  };

  try {
    console.log(`📝 Creating discount code: ${code} (${percentage}%)`);
    console.log("🔧 Discount variables:", JSON.stringify(variables, null, 2));

    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();

    console.log(
      "📊 Discount creation result:",
      JSON.stringify(result, null, 2),
    );

    if (result.data?.discountCodeBasicCreate?.userErrors?.length > 0) {
      console.error(
        "❌ Discount creation errors:",
        result.data.discountCodeBasicCreate.userErrors,
      );
      return {
        success: false,
        errors: result.data.discountCodeBasicCreate.userErrors,
      };
    }

    const discount = result.data?.discountCodeBasicCreate?.codeDiscountNode;
    console.log("✅ Discount created successfully:", discount);

    return {
      success: true,
      discount: {
        id: discount?.id,
        title: discount?.codeDiscount?.title,
        code: discount?.codeDiscount?.codes?.nodes?.[0]?.code,
        percentage,
        startsAt: discount?.codeDiscount?.startsAt,
        endsAt: discount?.codeDiscount?.endsAt,
      },
    };
  } catch (error) {
    console.error("❌ Error creating discount code:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
