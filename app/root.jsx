// app/root.jsx - Fixed with proper CSS imports
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "./shopify.server";

// This is crucial - export the links function to load CSS
export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "preconnect", href: "https://cdn.shopify.com/" },
  {
    rel: "stylesheet",
    href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css",
  },
];

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
  } catch (error) {
    console.error("Authentication error:", error);
  }

  const url = new URL(request.url);
  let host = url.searchParams.get("host");

  // Handle missing host parameter
  if (!host) {
    const shopDomain = url.searchParams.get("shop");
    if (shopDomain) {
      const hostString = `${shopDomain}/admin`;
      host = Buffer.from(hostString).toString("base64");
    }
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: host || "",
    environment: process.env.NODE_ENV || "development",
  });
};

export default function App() {
  const { apiKey, host, environment } = useLoaderData();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  if (host && !searchParams.get("host")) {
    searchParams.set("host", host);
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider
          isEmbeddedApp
          apiKey={apiKey}
          host={host}
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

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.error("Root Error Boundary:", error);

  return (
    <html>
      <head>
        <title>App Error</title>
        <Links />
      </head>
      <body>
        <div style={{ padding: "20px" }}>
          <h1>Something went wrong</h1>
          <p>Please try refreshing the page or contact support.</p>
          {process.env.NODE_ENV === "development" && (
            <pre style={{ whiteSpace: "pre-wrap" }}>{error.stack}</pre>
          )}
        </div>
        <Scripts />
      </body>
    </html>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
