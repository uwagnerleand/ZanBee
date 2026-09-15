import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Product } from "../shared/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data file path
const DATA_DIR = path.resolve(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const UPLOADS_DIR = path.resolve(__dirname, "..", "client", "public", "images", "uploads");

// Password configuration
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@zanBee3521";
const ADMIN_TOKEN_SECRET = "zanbee-admin-secure-token-2026";

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function readProducts(): Product[] {
  ensureDirectories();
  if (!fs.existsSync(PRODUCTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(PRODUCTS_FILE, "utf-8");
    return JSON.parse(data) as Product[];
  } catch (err) {
    console.error("Error reading products.json:", err);
    return [];
  }
}

export function writeProducts(products: Product[]): void {
  ensureDirectories();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
}

// Authentication middleware helper
export function verifyAdminToken(token?: string): boolean {
  if (!token) return false;
  const clean = token.replace(/^Bearer\s+/i, "").trim();
  return clean.startsWith(ADMIN_TOKEN_SECRET);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || (req.headers["x-admin-token"] as string);
  if (verifyAdminToken(authHeader)) {
    return next();
  }
  return res.status(401).json({ error: "Acesso não autorizado. Faça login como administrador." });
}

export const apiRouter = express.Router();

// Middleware to parse JSON
apiRouter.use(express.json({ limit: "15mb" }));

// -------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------
apiRouter.post("/auth/login", (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ authenticated: false, message: "Senha não fornecida." });
  }

  if (password === ADMIN_PASSWORD) {
    const token = `${ADMIN_TOKEN_SECRET}-${Date.now()}`;
    return res.json({
      authenticated: true,
      token,
      message: "Login realizado com sucesso.",
    });
  }

  return res.status(401).json({
    authenticated: false,
    message: "Senha incorreta. Tente novamente.",
  });
});

apiRouter.get("/auth/check", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || (req.headers["x-admin-token"] as string);
  const isValid = verifyAdminToken(authHeader);
  return res.json({ authenticated: isValid });
});

apiRouter.post("/auth/logout", (_req: Request, res: Response) => {
  return res.json({ authenticated: false, message: "Sessão encerrada." });
});

// -------------------------------------------------------------
// Products Routes
// -------------------------------------------------------------

// GET /api/products - List products (admin gets all, public gets visible only)
apiRouter.get("/products", (req: Request, res: Response) => {
  const products = readProducts();
  const showAll = req.query.all === "true";
  const authHeader = req.headers.authorization || (req.headers["x-admin-token"] as string);
  const isAdmin = verifyAdminToken(authHeader);

  if (showAll && isAdmin) {
    return res.json(products);
  }

  // Filter visible for public catalog
  const visibleProducts = products.filter((p) => p.visible !== false);
  return res.json(visibleProducts);
});

// GET /api/products/:id - Single product
apiRouter.get("/products/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const products = readProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ error: "Produto não encontrado." });
  }

  return res.json(product);
});

// POST /api/products - Add product (admin only)
apiRouter.post("/products", requireAdminAuth, (req: Request, res: Response) => {
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
    visible = true,
  } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: "Nome e Preço são obrigatórios." });
  }

  const products = readProducts();

  const newProduct: Product = {
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
    badge: badge ? String(badge).trim() : undefined,
    soldOut: Boolean(soldOut),
    visible: visible !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // If stock is 0 and soldOut wasn't set, auto-set soldOut
  if (newProduct.stock <= 0) {
    newProduct.soldOut = true;
  }

  products.unshift(newProduct);
  writeProducts(products);

  return res.status(201).json(newProduct);
});

// PUT /api/products/:id - Update product (admin only)
apiRouter.put("/products/:id", requireAdminAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const products = readProducts();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Produto não encontrado." });
  }

  const existing = products[index];
  const body = req.body;

  const updated: Product = {
    ...existing,
    ...(body.name !== undefined && { name: String(body.name).trim() }),
    ...(body.category !== undefined && { category: String(body.category) }),
    ...(body.price !== undefined && { price: Number(body.price) }),
    ...(body.oldPrice !== undefined && { oldPrice: body.oldPrice ? Number(body.oldPrice) : null }),
    ...(body.stock !== undefined && { stock: Number(body.stock) }),
    ...(body.sizes !== undefined && { sizes: Array.isArray(body.sizes) ? body.sizes : [body.sizes] }),
    ...(body.colors !== undefined && { colors: Array.isArray(body.colors) ? body.colors : [body.colors] }),
    ...(body.image !== undefined && { image: String(body.image) }),
    ...(body.description !== undefined && { description: String(body.description) }),
    ...(body.badge !== undefined && { badge: body.badge ? String(body.badge).trim() : undefined }),
    ...(body.soldOut !== undefined && { soldOut: Boolean(body.soldOut) }),
    ...(body.visible !== undefined && { visible: Boolean(body.visible) }),
    updatedAt: new Date().toISOString(),
  };

  // Auto-sync soldOut if stock was explicitly updated to 0
  if (body.stock !== undefined && Number(body.stock) === 0 && body.soldOut === undefined) {
    updated.soldOut = true;
  }

  products[index] = updated;
  writeProducts(products);

  return res.json(updated);
});

// DELETE /api/products/:id - Delete product (admin only)
apiRouter.delete("/products/:id", requireAdminAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const products = readProducts();
  const filtered = products.filter((p) => p.id !== id);

  if (filtered.length === products.length) {
    return res.status(404).json({ error: "Produto não encontrado." });
  }

  writeProducts(filtered);
  return res.json({ success: true, id, message: "Produto excluído com sucesso." });
});

// POST /api/upload - Upload base64 image
apiRouter.post("/upload", requireAdminAuth, (req: Request, res: Response) => {
  const { dataUrl, filename } = req.body;
  if (!dataUrl) {
    return res.status(400).json({ error: "Dados da imagem não fornecidos." });
  }

  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Formato de imagem inválido." });
    }

    const ext = matches[1].split("/")[1] || "jpg";
    const cleanExt = ext === "jpeg" ? "jpg" : ext;
    const base64Data = matches[2];
    const safeName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, "") : `prod_${Date.now()}`;
    const generatedFilename = `${safeName}_${Date.now()}.${cleanExt}`;

    ensureDirectories();
    const destPath = path.join(UPLOADS_DIR, generatedFilename);
    fs.writeFileSync(destPath, Buffer.from(base64Data, "base64"));

    // Return the public web path
    const publicPath = `./images/uploads/${generatedFilename}`;
    return res.json({ url: publicPath });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Falha ao salvar imagem." });
  }
});
