import { json } from "@remix-run/node";

export async function loader({ request }) {
  try {
    // Basic health check response
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3000,
      host: process.env.HOST || "0.0.0.0",
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      url: request.url,
      shopifyAppUrl: process.env.SHOPIFY_APP_URL,
    };

    console.log("Health check accessed:", healthData);

    return json(healthData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Health check error:", error);

    return json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      },
    );
  }
}

// Handle GET requests explicitly
export const GET = loader;
