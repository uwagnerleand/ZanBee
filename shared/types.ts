export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  image: string;
  description: string;
  badge?: string;
  soldOut?: boolean;
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export interface AdminAuthResponse {
  authenticated: boolean;
  token?: string;
  message?: string;
}
