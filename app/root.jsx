"use client";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { createApp } from "@shopify/app-bridge";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import { useMemo, useEffect, useState } from "react";
import "@shopify/polaris/build/esm/styles.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const chargeId = url.searchParams.get("charge_id");
  const host = url.searchParams.get("host");

  if (chargeId) {
    return redirect(`/app?_action=savePlan&charge_id=${chargeId}`);
  }

  return json({
    apiKey: process.env.SHOPIFY_API_KEY,
    host,
  });
};

export default function App() {
  const { apiKey, host } = useLoaderData();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const appBridge = useMemo(() => {
    if (!isMounted || !apiKey || !host) {
      return null;
    }

    try {
      return createApp({
        apiKey,
        host,
        forceRedirect: true,
      });
    } catch (error) {
      console.error("Failed to create App Bridge:", error);
      return null;
    }
  }, [apiKey, host, isMounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <link rel="preconnect" href="https://cdn.shopify.com/" />
          <link
            rel="stylesheet"
            href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
          />
          <Meta />
          <Links />
        </head>
        <body>
          <div>Loading...</div>
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <PolarisAppProvider
          i18n={{}} // Required by Polaris, use empty or actual translations
          linkComponent={({ url, children, ...rest }) => (
            <a href={url} {...rest}>
              {children}
            </a>
          )}
        >
          <Outlet context={{ appBridge }} />
        </PolarisAppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
