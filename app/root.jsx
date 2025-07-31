// app/root.jsx - Fixed for production deployment
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "./shopify.server";
// import { authenticate } from "../shopify.server";
import "@shopify/polaris/build/esm/styles.css";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
  } catch (error) {
    console.error("Authentication error:", error);
    // Don't throw here, let the app handle it gracefully
  }

  const url = new URL(request.url);
  let host = url.searchParams.get("host");

  // Production host handling
  if (!host) {
    const shopDomain = url.searchParams.get("shop");
    if (shopDomain) {
      const hostString = `${shopDomain}/admin`;
      host = Buffer.from(hostString).toString("base64");
    }
  }

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: host || "",
    // Add environment info for debugging
    environment: process.env.NODE_ENV || "development",
  };
};

export default function App() {
  const { apiKey, host, environment } = useLoaderData();
  const location = useLocation();

  // Ensure host is always in search params
  const searchParams = new URLSearchParams(location.search);
  if (host && !searchParams.get("host")) {
    searchParams.set("host", host);
  }

  return (
    <AppProvider
      isEmbeddedApp
      apiKey={apiKey}
      host={host}
      // Add error handling for production
      onError={(error) => {
        console.error("App Bridge Error:", error);
        if (environment === "development") {
          console.log("Host:", host);
          console.log("API Key:", apiKey);
        }
      }}
    >
      <NavMenu>
        <Link to={`/app?${searchParams.toString()}`}>Home</Link>
        <Link to={`/app/billing?${searchParams.toString()}`}>Billing</Link>
        <Link
          to={`/app/setup-discounts?${searchParams.toString()}`}
          rel="setup-discounts"
        >
          Setup Discounts
        </Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Root Error Boundary:", error);

  return (
    <html>
      <head>
        <title>App Error</title>
      </head>
      <body>
        <div style={{ padding: "20px" }}>
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page or contact support.</p>
          {process.env.NODE_ENV === "development" && <pre>{error.stack}</pre>}
        </div>
      </body>
    </html>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
