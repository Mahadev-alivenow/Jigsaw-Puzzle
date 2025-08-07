// Simple ping endpoint as backup health check
export async function loader() {
  console.log("Ping endpoint accessed at:", new Date().toISOString());

  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  });
}

export const GET = loader;
