"use client";

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
import { authenticate } from "../shopify.server";
import { useEffect, useState } from "react";
import { json } from "@remix-run/node";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const host = url.searchParams.get("host");

  console.log("App loader - URL:", url.toString());
  console.log("App loader - Host from params:", host);

  if (!host) {
    console.error("Missing host parameter in app loader");
    throw new Response("Missing host parameter", {
      status: 400,
      statusText: "Bad Request - Missing host parameter",
    });
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    host: host,
  });
};

export default function App() {
  const { apiKey, host } = useLoaderData();
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!isMounted) {
    return <div>Loading app...</div>;
  }

  if (!host || !apiKey) {
    console.error("Missing required props:", { host, apiKey: !!apiKey });
    return <div>Error: Missing required configuration</div>;
  }

  const searchParams = new URLSearchParams(location.search);
  if (!searchParams.has("host")) {
    searchParams.set("host", host);
  }

  console.log("App component - Host:", host);
  console.log("App component - Search params:", searchParams.toString());

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} host={host}>
      <NavMenu>
        <Link to={`/app?${searchParams.toString()}`}>Home</Link>
        <Link to={`/app/billing?${searchParams.toString()}`}>Billing</Link>
        <Link
          to={`/app/setup-discounts?${searchParams.toString()}`}
          rel="setup-discounts"
        >
          Setup Discounts
        </Link>
        {/* <Link
          to={`/app/discount-codes?${searchParams.toString()}`}
          rel="discount-codes"
        >
          Discount Codes
        </Link>
        <Link
          to={`/app/game-analytics?${searchParams.toString()}`}
          rel="game-analytics"
        >
          Game Analytics
        </Link> */}
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
