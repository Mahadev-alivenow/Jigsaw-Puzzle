import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-07";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
    APP_SUBSCRIPTIONS_UPDATE: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/gdpr/customers_data_request",
      callback: async (_topic, _shop, _body) => {
        console.log("→ Customers Data Request webhook received");
      },
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/gdpr/customers_redact",
      callback: async (_topic, _shop, _body) => {
        console.log("→ Customers Redact webhook received");
      },
    },
    SHOP_REDACT: {
      deliveryMethod: "http",
      callbackUrl: "/webhooks/gdpr/shop_redact",
      callback: async (_topic, _shop, _body) => {
        console.log("→ Shop Redact webhook received");
      },
    },
  },

  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
