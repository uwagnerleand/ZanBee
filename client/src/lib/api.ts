import type { Product } from "@shared/types";

const ADMIN_TOKEN_KEY = "zanbee_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchProducts(showAll = false): Promise<Product[]> {
  const url = showAll ? "/api/products?all=true" : "/api/products";
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Erro ao carregar lista de produtos.");
  }
  return res.json();
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Produto não encontrado.");
  }
  return res.json();
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao adicionar produto.");
  }
  return res.json();
}

export async function updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao atualizar produto.");
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao excluir produto.");
  }
}

export async function uploadImage(dataUrl: string, filename?: string): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ dataUrl, filename }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao fazer upload da imagem.");
  }
  const data = await res.json();
  return data.url;
}

export async function loginAdmin(password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.authenticated && data.token) {
      setAdminToken(data.token);
      return { success: true };
    }
    return { success: false, message: data.message || "Senha incorreta." };
  } catch (err) {
    return { success: false, message: "Erro de conexão com o servidor." };
  }
}

export async function checkAdminAuth(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch("/api/auth/check", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.authenticated);
  } catch {
    return false;
  }
}

export async function logoutAdmin(): Promise<void> {
  clearAdminToken();
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore network error on logout
  }
}
