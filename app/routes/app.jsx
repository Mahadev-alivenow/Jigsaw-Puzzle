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

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// export const loader = async ({ request }) => {
//   await authenticate.admin(request);
//   const url = new URL(request.url);
//   const host = url.searchParams.get("host");

//   return { apiKey: process.env.SHOPIFY_API_KEY || "", host };
// };

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const host = url.searchParams.get("host");
  // console.log("Loader called with host:", host);

  if (!host) {
    throw new Response("Missing host parameter", {
      status: 302,
      headers: {
        Location: `/exitframe?${url.searchParams.toString()}`, // Or redirect to a safe fallback
      },
    });
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "", host };
};

export default function App() {
  const { apiKey, host } = useLoaderData();

  const location = useLocation();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const searchParams = new URLSearchParams(location.search);
  searchParams.set("host", host);

  if (!isMounted) return null; // Prevent SSR mismatch

  // console.log("Search params set with host:", searchParams.toString(),'h host:', host );
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
