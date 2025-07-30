import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const loader = async ({ params, request }) => {
  try {
    const filename = params["*"]; // Get the filename from the wildcard route

    if (!filename) {
      throw new Response("File not found", { status: 404 });
    }

    console.log(`📁 Serving file: ${filename}`);
    console.log(`🌐 Request URL: ${request.url}`);

    // Construct the file path
    const filePath = join(process.cwd(), "public", "uploads", filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      throw new Response("File not found", { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const ext = filename.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
    }

    console.log(`✅ Serving ${filename} as ${contentType}`);

    // Return the file with proper headers
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Content-Length": fileBuffer.length.toString(),
        "Access-Control-Allow-Origin": "*", // Allow cross-origin access
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("❌ Error serving file:", error);

    if (error instanceof Response) {
      return error;
    }

    return new Response("Internal Server Error", { status: 500 });
  }
};
