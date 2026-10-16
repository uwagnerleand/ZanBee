import type { Product } from "@shared/types";
import { db, storage, isFirebaseConfigured } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { compressImage } from "./image-compressor";

const ADMIN_TOKEN_KEY = "zanbee_admin_token";
const PRODUCTS_STORAGE_KEY = "zanbee_products_storage";
const ADMIN_PASSWORD_FALLBACK = "@zanBee3521";
const FIRESTORE_COLLECTION = "products";

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

export const initialFallbackProducts: Product[] = [
  { id: 1, name: "Conjunto Infantil Floresta", category: "Meninos", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Verde", "Marrom"], image: "./images/conjunto-floresta.jpg", description: "Conjunto infantil da coleção Universo Encantado, com estampa da Turma da Floresta e bermuda confortável.", badge: "Universo Encantado", soldOut: true, visible: true },
  { id: 2, name: "Conjunto Infantil Homem-Aranha", category: "Meninos", price: 40.0, stock: 5, sizes: ["6 a 7 anos"], colors: ["Vermelho", "Azul"], image: "./images/conjunto-aranha.jpg", description: "Conjunto infantil temático Homem-Aranha da coleção Universo Encantado, confortável e cheio de estilo.", badge: "Universo Encantado", soldOut: false, visible: true },
  { id: 3, name: "Conjunto Infantil Gamer Loading", category: "Meninos", price: 40.0, stock: 4, sizes: ["6 a 7 anos"], colors: ["Azul", "Vermelho"], image: "./images/conjunto-gamer.jpg", description: "Conjunto infantil gamer da coleção Universo Encantado, com camiseta estilosa e bermuda leve.", badge: "Universo Encantado", soldOut: false, visible: true },
  { id: 4, name: "Conjunto Infantil Urso Moderno", category: "Meninos", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Azul", "Laranja"], image: "./images/conjunto-urso.jpg", description: "Conjunto infantil descolado da coleção Universo Encantado, com estampa de urso e bermuda vibrante.", badge: "Universo Encantado", soldOut: true, visible: true },
  { id: 5, name: "Conjunto Infantil Dinossauro Explorer", category: "Meninos", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Preto", "Azul"], image: "./images/conjunto-dinossauro.jpg", description: "Conjunto infantil temático de dinossauro da coleção Universo Encantado, com camiseta preta estampada e bermuda azul.", badge: "Universo Encantado", soldOut: true, visible: true },
  { id: 6, name: "Conjunto Infantil Happy Bear", category: "Meninas", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Rosa", "Verde"], image: "./images/conjunto-esgotado-1.jpg", description: "Conjunto infantil da coleção Universo Encantado, super charmoso com camiseta de urso e bermuda verde.", badge: "Esgotado", soldOut: true, visible: true },
  { id: 7, name: "Conjunto Infantil Picolé & Diversão", category: "Meninas", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Amarelo", "Rosa"], image: "./images/conjunto-esgotado-2.jpg", description: "Conjunto leve com camiseta de carrinho de picolé e shorts estampado colorido.", badge: "Esgotado", soldOut: true, visible: true },
  { id: 8, name: "Conjunto Infantil Doce Morango", category: "Meninas", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Creme", "Vermelho"], image: "./images/conjunto-esgotado-3.jpg", description: "Conjunto infantil delicado com camiseta estampa de morangos e bermuda vermelha.", badge: "Esgotado", soldOut: true, visible: true },
  { id: 9, name: "Conjunto Infantil Cachorrinho Backpack", category: "Meninas", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Lilás", "Rosa"], image: "./images/conjunto-esgotado-4.jpg", description: "Conjunto fofo com camiseta estampa mochila de cachorrinho corgi e shorts rosa.", badge: "Esgotado", soldOut: true, visible: true },
  { id: 10, name: "Conjunto Infantil Três Coelhinhos", category: "Meninas", price: 40.0, stock: 0, sizes: ["6 a 7 anos"], colors: ["Rosa", "Verde"], image: "./images/conjunto-esgotado-5.jpg", description: "Conjunto gracioso com estampa de coelhinhos e bermuda verde com corações.", badge: "Esgotado", soldOut: true, visible: true },
];

export function getStoredProducts(): Product[] {
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

export function saveStoredProducts(products: Product[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch {}
  }
}

/**
 * Seed initial catalog items to Firestore if the collection is empty.
 */
export async function seedProductsToFirestore(force = false): Promise<number> {
  if (!db) return 0;
  try {
    const collRef = collection(db, FIRESTORE_COLLECTION);
    const snap = await getDocs(collRef);
    if (!snap.empty && !force) {
      return snap.size;
    }

    const itemsToSeed = getStoredProducts().length > 0 ? getStoredProducts() : initialFallbackProducts;
    for (const item of itemsToSeed) {
      const docRef = doc(db, FIRESTORE_COLLECTION, String(item.id));
      await setDoc(docRef, {
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      });
    }
    return itemsToSeed.length;
  } catch (error) {
    console.error("Falha ao semear produtos no Firestore:", error);
    throw error;
  }
}

/**
 * Fetch products: prioritized by Firebase Firestore -> Backend API -> LocalStorage fallback
 */
export async function fetchProducts(showAll = false): Promise<Product[]> {
  // 1. Try Firebase Firestore
  if (db) {
    try {
      const collRef = collection(db, FIRESTORE_COLLECTION);
      const snapshot = await getDocs(collRef);

      if (snapshot.empty) {
        // Auto-seed initially
        await seedProductsToFirestore();
        const recheck = await getDocs(collRef);
        const seededList = recheck.docs.map((d) => d.data() as Product);
        seededList.sort((a, b) => Number(a.id) - Number(b.id));
        saveStoredProducts(seededList);
        return showAll ? seededList : seededList.filter((p) => p.visible !== false);
      }

      const list: Product[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: Number(data.id || d.id),
          name: data.name || "",
          category: data.category || "Meninos",
          price: Number(data.price) || 0,
          oldPrice: data.oldPrice !== undefined ? Number(data.oldPrice) : null,
          stock: Number(data.stock) || 0,
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          colors: Array.isArray(data.colors) ? data.colors : [],
          image: data.image || "./images/conjunto-floresta.jpg",
          description: data.description || "",
          badge: data.badge || undefined,
          soldOut: Boolean(data.soldOut) || (Number(data.stock) || 0) <= 0,
          visible: data.visible !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      // Sort by id descending so newest appears first, or ascending by id
      list.sort((a, b) => Number(a.id) - Number(b.id));
      saveStoredProducts(list);

      return showAll ? list : list.filter((p) => p.visible !== false);
    } catch (err) {
      console.warn("Erro ao buscar no Firestore, tentando fallback:", err);
    }
  }

  // 2. Try Node/Express server if running
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

  // 3. Fallback to local storage
  const all = getStoredProducts();
  if (showAll) return all;
  return all.filter((p) => p.visible !== false);
}

/**
 * Subscribe to real-time changes in Firestore (live updates for catalog and dashboard)
 */
export function subscribeToProducts(
  callback: (products: Product[]) => void,
  showAll = false
): Unsubscribe | null {
  if (!db) return null;
  try {
    const collRef = collection(db, FIRESTORE_COLLECTION);
    return onSnapshot(
      collRef,
      (snapshot) => {
        const list: Product[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: Number(data.id || d.id),
            name: data.name || "",
            category: data.category || "Meninos",
            price: Number(data.price) || 0,
            oldPrice: data.oldPrice !== undefined ? Number(data.oldPrice) : null,
            stock: Number(data.stock) || 0,
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            colors: Array.isArray(data.colors) ? data.colors : [],
            image: data.image || "./images/conjunto-floresta.jpg",
            description: data.description || "",
            badge: data.badge || undefined,
            soldOut: Boolean(data.soldOut) || (Number(data.stock) || 0) <= 0,
            visible: data.visible !== false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        list.sort((a, b) => Number(a.id) - Number(b.id));
        saveStoredProducts(list);
        callback(showAll ? list : list.filter((p) => p.visible !== false));
      },
      (err) => {
        console.warn("Erro no listener do Firestore:", err);
      }
    );
  } catch {
    return null;
  }
}

export async function fetchProductById(id: number): Promise<Product> {
  if (db) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, String(id));
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: Number(data.id || snap.id),
          name: data.name || "",
          category: data.category || "Meninos",
          price: Number(data.price) || 0,
          oldPrice: data.oldPrice !== undefined ? Number(data.oldPrice) : null,
          stock: Number(data.stock) || 0,
          sizes: Array.isArray(data.sizes) ? data.sizes : [],
          colors: Array.isArray(data.colors) ? data.colors : [],
          image: data.image || "./images/conjunto-floresta.jpg",
          description: data.description || "",
          badge: data.badge || undefined,
          soldOut: Boolean(data.soldOut) || (Number(data.stock) || 0) <= 0,
          visible: data.visible !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
    } catch (err) {
      console.warn("Erro ao buscar produto no Firestore:", err);
    }
  }

  const products = await fetchProducts(true);
  const found = products.find((p) => p.id === id);
  if (!found) throw new Error("Produto não encontrado.");
  return found;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const newId = Date.now();
  const newProduct: Product = {
    id: newId,
    name: data.name || "Novo Produto",
    category: data.category || "Meninos",
    price: Number(data.price) || 0,
    oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
    stock: Number(data.stock) || 0,
    sizes: Array.isArray(data.sizes) ? data.sizes : ["6 a 7 anos"],
    colors: Array.isArray(data.colors) ? data.colors : [],
    image: data.image || "./images/conjunto-floresta.jpg",
    description: data.description || "",
    badge: data.badge,
    soldOut: Boolean(data.soldOut) || (Number(data.stock) || 0) <= 0,
    visible: data.visible !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Se a imagem for um Base64 pesado (>150KB), comprime antes para caber folgado no Firestore (limite de 1MB)
  if (newProduct.image && newProduct.image.startsWith("data:image/") && newProduct.image.length > 150000) {
    try {
      newProduct.image = await compressImage(newProduct.image);
    } catch {}
  }

  // 1. Try Firebase Firestore
  if (db) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, String(newId));
      await setDoc(docRef, cleanFirestoreObject(newProduct));
      const local = getStoredProducts();
      local.unshift(newProduct);
      saveStoredProducts(local);
      return newProduct;
    } catch (err) {
      console.error("Falha ao salvar produto no Firestore:", err);
    }
  }

  // 2. Try Backend API
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

  // 3. Local fallback
  const products = getStoredProducts();
  products.unshift(newProduct);
  saveStoredProducts(products);
  return newProduct;
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
  const updatedAt = new Date().toISOString();

  // Se a imagem for atualizada com Base64 pesado (>150KB), comprime antes
  if (updates.image && updates.image.startsWith("data:image/") && updates.image.length > 150000) {
    try {
      updates.image = await compressImage(updates.image);
    } catch {}
  }

  const cleanUpdates = cleanFirestoreObject({
    ...updates,
    updatedAt,
  });

  // 1. Try Firebase Firestore
  if (db) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, String(id));
      await setDoc(docRef, cleanUpdates, { merge: true });

      const local = getStoredProducts();
      const idx = local.findIndex((p) => p.id === id);
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...updates, updatedAt };
        saveStoredProducts(local);
        return local[idx];
      }
      return { id, ...updates } as Product;
    } catch (err) {
      console.error("Falha ao atualizar no Firestore:", err);
    }
  }

  // 2. Try Backend API
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

  // 3. Local fallback
  const products = getStoredProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Produto não encontrado.");
  const updated = { ...products[index], ...updates, updatedAt };
  products[index] = updated;
  saveStoredProducts(products);
  return updated;
}

export async function deleteProduct(id: number): Promise<void> {
  // 1. Try Firebase Firestore
  if (db) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, String(id));
      await deleteDoc(docRef);
      const local = getStoredProducts();
      saveStoredProducts(local.filter((p) => p.id !== id));
      return;
    } catch (err) {
      console.error("Falha ao excluir no Firestore:", err);
    }
  }

  // 2. Try Backend API
  const base = getBase();
  const url = `${base}/api/products/${id}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) return;
  } catch {}

  // 3. Local fallback
  const products = getStoredProducts();
  const filtered = products.filter((p) => p.id !== id);
  saveStoredProducts(filtered);
}

/**
 * Upload de imagem inteligente:
 * 1. Sempre comprime e otimiza via Canvas (~40KB - 80KB)
 * 2. Se o Firebase Storage estiver ativo, envia para a nuvem
 * 3. Se não houver Storage (plano gratuito sem Blaze), retorna a imagem otimizada em Base64
 *    que é salva diretamente no Firestore (Database) ocupando menos de 10% do limite de 1MB!
 */
export async function uploadImage(dataUrl: string, filename?: string): Promise<string> {
  const safeName = filename ? filename.replace(/[^a-zA-Z0-9_-]/g, "") : `prod_${Date.now()}`;
  const generatedFilename = `${safeName}_${Date.now()}.jpg`;

  // Comprime automaticamente para garantir tamanho leve (< 100KB)
  const optimizedDataUrl = await compressImage(dataUrl).catch(() => dataUrl);

  // 1. Tenta Firebase Storage (se tiver bucket configurado)
  if (storage) {
    try {
      const storageRef = ref(storage, `products/${generatedFilename}`);
      await uploadString(storageRef, optimizedDataUrl, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (err) {
      console.warn("Firebase Storage indisponível ou exige plano Blaze. Salvando direto no Database (Firestore):", err);
    }
  }

  // 2. Tenta Backend API
  const base = getBase();
  const url = `${base}/api/upload`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ dataUrl: optimizedDataUrl, filename }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
  } catch {}

  // 3. Fallback: salva direto no Firestore Database como Base64 otimizado
  return optimizedDataUrl;
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

  return token.startsWith("zanbee-admin-secure-token");
}

export async function logoutAdmin(): Promise<void> {
  clearAdminToken();
  try {
    const base = getBase();
    await fetch(`${base}/api/auth/logout`, { method: "POST" });
  } catch {}
}

/**
 * Remove undefined values as Firestore throws on undefined fields
 */
function cleanFirestoreObject(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreObject);
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanFirestoreObject(val);
    }
  }
  return cleaned;
}
