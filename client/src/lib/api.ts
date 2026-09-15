import type { Product } from "@shared/types";

const ADMIN_TOKEN_KEY = "zanbee_admin_token";
const PRODUCTS_STORAGE_KEY = "zanbee_products_storage";
const ADMIN_PASSWORD_FALLBACK = "@zanBee3521";

export function getBase(): string {
  if (typeof window === "undefined") return "";
  const path = window.location.pathname;
  const match = path.match(/^\/([^/]+)/);
  if (match && match[1].toLowerCase() === "zanbee") {
    return `/${match[1]}`;
  }
  return "";
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export function clearAdminToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const initialFallbackProducts: Product[] = [
  { id:1, name:"Conjunto Infantil Floresta", category:"Meninos", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Verde","Marrom"], image:"./images/conjunto-floresta.jpg", description:"Conjunto infantil da coleção Universo Encantado, com estampa da Turma da Floresta e bermuda confortável.", badge:"Universo Encantado", soldOut:true, visible:true },
  { id:2, name:"Conjunto Infantil Homem-Aranha", category:"Meninos", price:40.0, stock:5, sizes:["6 a 7 anos"], colors:["Vermelho","Azul"], image:"./images/conjunto-aranha.jpg", description:"Conjunto infantil temático Homem-Aranha da coleção Universo Encantado, confortável e cheio de estilo.", badge:"Universo Encantado", visible:true },
  { id:3, name:"Conjunto Infantil Gamer Loading", category:"Meninos", price:40.0, stock:4, sizes:["6 a 7 anos"], colors:["Azul","Vermelho"], image:"./images/conjunto-gamer.jpg", description:"Conjunto infantil gamer da coleção Universo Encantado, com camiseta estilosa e bermuda leve.", badge:"Universo Encantado", visible:true },
  { id:4, name:"Conjunto Infantil Urso Moderno", category:"Meninos", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Azul","Laranja"], image:"./images/conjunto-urso.jpg", description:"Conjunto infantil descolado da coleção Universo Encantado, com estampa de urso e bermuda vibrante.", badge:"Universo Encantado", soldOut:true, visible:true },
  { id:5, name:"Conjunto Infantil Dinossauro Explorer", category:"Meninos", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Preto","Azul"], image:"./images/conjunto-dinossauro.jpg", description:"Conjunto infantil temático de dinossauro da coleção Universo Encantado, com camiseta preta estampada e bermuda azul.", badge:"Universo Encantado", soldOut:true, visible:true },
  { id:6, name:"Conjunto Infantil Happy Bear", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Rosa","Verde"], image:"./images/conjunto-esgotado-1.jpg", description:"Conjunto infantil da coleção Universo Encantado, super charmoso com camiseta de urso e bermuda verde.", badge:"Esgotado", soldOut:true, visible:true },
  { id:7, name:"Conjunto Infantil Picolé & Diversão", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Amarelo","Rosa"], image:"./images/conjunto-esgotado-2.jpg", description:"Conjunto leve com camiseta de carrinho de picolé e shorts estampado colorido.", badge:"Esgotado", soldOut:true, visible:true },
  { id:8, name:"Conjunto Infantil Doce Morango", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Creme","Vermelho"], image:"./images/conjunto-esgotado-3.jpg", description:"Conjunto infantil delicado com camiseta estampa de morangos e bermuda vermelha.", badge:"Esgotado", soldOut:true, visible:true },
  { id:9, name:"Conjunto Infantil Cachorrinho Backpack", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Lilás","Rosa"], image:"./images/conjunto-esgotado-4.jpg", description:"Conjunto fofo com camiseta estampa mochila de cachorrinho corgi e shorts rosa.", badge:"Esgotado", soldOut:true, visible:true },
  { id:10, name:"Conjunto Infantil Três Coelhinhos", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Rosa","Verde"], image:"./images/conjunto-esgotado-5.jpg", description:"Conjunto gracioso com estampa de coelhinhos e bermuda verde com corações.", badge:"Esgotado", soldOut:true, visible:true }
];

function getStoredProducts(): Product[] {
  if (typeof window === "undefined") return initialFallbackProducts;
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialFallbackProducts;
}

function saveStoredProducts(products: Product[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {}
  }
}

export async function fetchProducts(showAll = false): Promise<Product[]> {
  const base = getBase();
  const candidates = [
    showAll ? `${base}/api/products?all=true` : `${base}/api/products`,
    showAll ? `/api/products?all=true` : `/api/products`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveStoredProducts(data);
          return data;
        }
      }
    } catch {}
  }

  // Fallback to local storage (e.g. on static GitHub Pages)
  const all = getStoredProducts();
  if (showAll) return all;
  return all.filter((p) => p.visible !== false);
}

export async function fetchProductById(id: number): Promise<Product> {
  const products = await fetchProducts(true);
  const found = products.find((p) => p.id === id);
  if (!found) throw new Error("Produto não encontrado.");
  return found;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const base = getBase();
  const url = `${base}/api/products`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Local fallback for static hosting
  const products = getStoredProducts();
  const newProduct: Product = {
    id: Date.now(),
    name: data.name || "Novo Produto",
    category: data.category || "Meninos",
    price: Number(data.price) || 0,
    oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
    stock: Number(data.stock) || 0,
    sizes: data.sizes || ["6 a 7 anos"],
    colors: data.colors || [],
    image: data.image || "./images/conjunto-floresta.jpg",
    description: data.description || "",
    badge: data.badge,
    soldOut: Boolean(data.soldOut) || (Number(data.stock) || 0) <= 0,
    visible: data.visible !== false,
  };
  products.unshift(newProduct);
  saveStoredProducts(products);
  return newProduct;
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
  const base = getBase();
  const url = `${base}/api/products/${id}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Local fallback for static hosting
  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Produto não encontrado.");
  const updated = { ...products[index], ...updates };
  products[index] = updated;
  saveStoredProducts(products);
  return updated;
}

export async function deleteProduct(id: number): Promise<void> {
  const base = getBase();
  const url = `${base}/api/products/${id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) return;
  } catch {}

  // Local fallback for static hosting
  const products = getStoredProducts();
  const filtered = products.filter((p) => p.id !== id);
  saveStoredProducts(filtered);
}

export async function uploadImage(dataUrl: string, filename?: string): Promise<string> {
  const base = getBase();
  const url = `${base}/api/upload`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ dataUrl, filename }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch {}

  // Fallback: return dataUrl directly so it works anywhere
  return dataUrl;
}

export async function loginAdmin(password: string): Promise<{ success: boolean; message?: string }> {
  const base = getBase();
  const url = `${base}/api/auth/login`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.token) {
        setAdminToken(data.token);
        return { success: true };
      }
    }
    const data = await res.json().catch(() => ({}));
    if (data.message) return { success: false, message: data.message };
  } catch {}

  // Static hosting fallback (e.g. GitHub Pages)
  if (password === ADMIN_PASSWORD_FALLBACK) {
    const token = `zanbee-admin-secure-token-2026-${Date.now()}`;
    setAdminToken(token);
    return { success: true };
  }

  return { success: false, message: "Senha incorreta. Tente novamente." };
}

export async function checkAdminAuth(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;

  const base = getBase();
  const url = `${base}/api/auth/check`;
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.authenticated);
    }
  } catch {}

  // Fallback
  return token.startsWith("zanbee-admin-secure-token");
}

export async function logoutAdmin(): Promise<void> {
  clearAdminToken();
  try {
    const base = getBase();
    await fetch(`${base}/api/auth/logout`, { method: "POST" });
  } catch {}
}
