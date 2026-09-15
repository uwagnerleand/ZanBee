import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_PUBLIC = path.join(ROOT_DIR, "dist", "public");
const CLIENT_PUBLIC = path.join(ROOT_DIR, "client", "public");
const PRODUCTS_JSON = path.join(ROOT_DIR, "server", "data", "products.json");

// 1. Copy index.html -> 404.html for GitHub Pages SPA routing
const indexHtmlPath = path.join(DIST_PUBLIC, "index.html");
const notFoundHtmlPath = path.join(DIST_PUBLIC, "404.html");

if (fs.existsSync(indexHtmlPath)) {
  fs.copyFileSync(indexHtmlPath, notFoundHtmlPath);
  console.log("✓ Copied dist/public/index.html -> dist/public/404.html (GitHub Pages SPA)");
}

// 2. Copy products.json to dist/public and client/public for static hosting
if (fs.existsSync(PRODUCTS_JSON)) {
  fs.copyFileSync(PRODUCTS_JSON, path.join(DIST_PUBLIC, "products.json"));
  fs.copyFileSync(PRODUCTS_JSON, path.join(CLIENT_PUBLIC, "products.json"));
  
  // Also create a static dist/public/api/products file without extension
  const apiDir = path.join(DIST_PUBLIC, "api");
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  fs.copyFileSync(PRODUCTS_JSON, path.join(apiDir, "products"));
  console.log("✓ Synchronized products.json to public assets for static environments");
}
