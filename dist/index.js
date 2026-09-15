// server/index.ts
import express2 from "express";
import { createServer } from "http";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// server/api.ts
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = path.resolve(__dirname, "data");
var PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
var UPLOADS_DIR = path.resolve(__dirname, "..", "client", "public", "images", "uploads");
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@zanBee3521";
var ADMIN_TOKEN_SECRET = "zanbee-admin-secure-token-2026";
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
function readProducts() {
  ensureDirectories();
  if (!fs.existsSync(PRODUCTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading products.json:", err);
    return [];
  }
}
function writeProducts(products) {
  ensureDirectories();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}
function verifyAdminToken(token) {
  if (!token) return false;
  const clean = token.replace(/^Bearer\s+/i, "").trim();
  return clean.startsWith(ADMIN_TOKEN_SECRET);
}
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  if (verifyAdminToken(authHeader)) {
    return next();
  }
  return res.status(401).json({ error: "Acesso n\xE3o autorizado. Fa\xE7a login como administrador." });
}
var apiRouter = express.Router();
apiRouter.use(express.json({ limit: "15mb" }));
apiRouter.post("/auth/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ authenticated: false, message: "Senha n\xE3o fornecida." });
  }
  if (password === ADMIN_PASSWORD) {
    const token = `${ADMIN_TOKEN_SECRET}-${Date.now()}`;
    return res.json({
      authenticated: true,
      token,
      message: "Login realizado com sucesso."
    });
  }
  return res.status(401).json({
    authenticated: false,
    message: "Senha incorreta. Tente novamente."
  });
});
apiRouter.get("/auth/check", (req, res) => {
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  const isValid = verifyAdminToken(authHeader);
  return res.json({ authenticated: isValid });
});
apiRouter.post("/auth/logout", (_req, res) => {
  return res.json({ authenticated: false, message: "Sess\xE3o encerrada." });
});
apiRouter.get("/products", (req, res) => {
  const products = readProducts();
  const showAll = req.query.all === "true";
  const authHeader = req.headers.authorization || req.headers["x-admin-token"];
  const isAdmin = verifyAdminToken(authHeader);
  if (showAll && isAdmin) {
    return res.json(products);
  }
  const visibleProducts = products.filter((p) => p.visible !== false);
  return res.json(visibleProducts);
});
apiRouter.get("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const products = readProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ error: "Produto n\xE3o encontrado." });
  }
  return res.json(product);
});
apiRouter.post("/products", requireAdminAuth, (req, res) => {
  const {
    name,
    category,
    price,
    oldPrice,
    stock = 0,
    sizes = ["6 a 7 anos"],
    colors = [],
    image,
    description = "",
    badge,
    soldOut = false,
    visible = true
  } = req.body;
  if (!name || price === void 0) {
    return res.status(400).json({ error: "Nome e Pre\xE7o s\xE3o obrigat\xF3rios." });
  }
  const products = readProducts();
  const newProduct = {
    id: Date.now(),
    name: String(name).trim(),
    category: category || "Meninos",
    price: Number(price),
    oldPrice: oldPrice ? Number(oldPrice) : null,
    stock: Number(stock) || 0,
    sizes: Array.isArray(sizes) ? sizes : [sizes],
    colors: Array.isArray(colors) ? colors : colors ? [colors] : [],
    image: image || "./images/conjunto-floresta.jpg",
    description: String(description || ""),
    badge: badge ? String(badge).trim() : void 0,
    soldOut: Boolean(soldOut),
    visible: visible !== false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (newProduct.stock <= 0) {
    newProduct.soldOut = true;
  }
  products.unshift(newProduct);
  writeProducts(products);
  return res.status(201).json(newProduct);
});
apiRouter.put("/products/:id", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const products = readProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produto n\xE3o encontrado." });
  }
  const existing = products[index];
  const body = req.body;
  const updated = {
    ...existing,
    ...body.name !== void 0 && { name: String(body.name).trim() },
    ...body.category !== void 0 && { category: String(body.category) },
    ...body.price !== void 0 && { price: Number(body.price) },
    ...body.oldPrice !== void 0 && { oldPrice: body.oldPrice ? Number(body.oldPrice) : null },
    ...body.stock !== void 0 && { stock: Number(body.stock) },
    ...body.sizes !== void 0 && { sizes: Array.isArray(body.sizes) ? body.sizes : [body.sizes] },
    ...body.colors !== void 0 && { colors: Array.isArray(body.colors) ? body.colors : [body.colors] },
    ...body.image !== void 0 && { image: String(body.image) },
    ...body.description !== void 0 && { description: String(body.description) },
    ...body.badge !== void 0 && { badge: body.badge ? String(body.badge).trim() : void 0 },
    ...body.soldOut !== void 0 && { soldOut: Boolean(body.soldOut) },
    ...body.visible !== void 0 && { visible: Boolean(body.visible) },
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (body.stock !== void 0 && Number(body.stock) === 0 && body.soldOut === void 0) {
    updated.soldOut = true;
  }
  products[index] = updated;
  writeProducts(products);
  return res.json(updated);
});
apiRouter.delete("/products/:id", requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const products = readProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) {
    return res.status(404).json({ error: "Produto n\xE3o encontrado." });
  }
  writeProducts(filtered);
  return res.json({ success: true, id, message: "Produto exclu\xEDdo com sucesso." });
});
apiRouter.post("/upload", requireAdminAuth, (req, res) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: "Dados da imagem n\xE3o fornecidos." });
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Formato de imagem inv\xE1lido." });
    }
    const ext = matches[1].split("/")[1] || "jpg";
    const cleanExt = ext === "jpeg" ? "jpg" : ext;
    const base64Data = matches[2];
    const safeName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, "") : `prod_${Date.now()}`;
    const generatedFilename = `${safeName}_${Date.now()}.${cleanExt}`;
    ensureDirectories();
    const destPath = path.join(UPLOADS_DIR, generatedFilename);
    fs.writeFileSync(destPath, Buffer.from(base64Data, "base64"));
    const publicPath = `./images/uploads/${generatedFilename}`;
    return res.json({ url: publicPath });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Falha ao salvar imagem." });
  }
});

// server/index.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "15mb" }));
  app.use("/api", apiRouter);
  const staticPath = process.env.NODE_ENV === "production" ? path2.resolve(__dirname2, "public") : path2.resolve(__dirname2, "..", "dist", "public");
  app.use(express2.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path2.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
