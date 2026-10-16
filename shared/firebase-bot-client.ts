/**
 * ZanBee — Firebase Client para o Chat-Bot (WhatsApp)
 * 
 * Este módulo permite ao Chat-Bot:
 * 1. Consultar catálogo de produtos em tempo real no mesmo banco do site
 * 2. Verificar estoque antes de confirmar pedidos
 * 3. Dar baixa no estoque de forma atômica e consistente (transação Firestore)
 * 4. Gerar mensagens formatadas prontas para envio no WhatsApp
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import type { Product } from "./types";

export interface BotFirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const DEFAULT_BOT_FIREBASE_CONFIG: BotFirebaseConfig = {
  apiKey: "AIzaSyCW6432-vvSRZlOa48kMTpmlLBw_gVTQ6c",
  authDomain: "catalago-a07e0.firebaseapp.com",
  projectId: "catalago-a07e0",
  storageBucket: "catalago-a07e0.firebasestorage.app",
  messagingSenderId: "234094332686",
  appId: "1:234094332686:web:99475f8cdc1ec93dd6a55f",
};

let botDb: ReturnType<typeof getFirestore> | null = null;

export function initBotFirebase(config: Partial<BotFirebaseConfig> = {}) {
  const finalConfig = { ...DEFAULT_BOT_FIREBASE_CONFIG, ...config };
  const app = getApps().length === 0 ? initializeApp(finalConfig) : getApp();
  botDb = getFirestore(app);
  return botDb;
}

function getDb() {
  if (!botDb) {
    throw new Error(
      "Firebase não foi inicializado no Bot. Chame initBotFirebase(config) primeiro."
    );
  }
  return botDb;
}

/**
 * Retorna todos os produtos disponíveis no catálogo (visíveis e com estoque)
 */
export async function getBotCatalog(): Promise<Product[]> {
  const db = getDb();
  const snapshot = await getDocs(collection(db, "products"));
  const products: Product[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as Product;
    if (data.visible !== false) {
      products.push({
        ...data,
        id: Number(data.id || docSnap.id),
      });
    }
  });

  return products.sort((a, b) => Number(a.id) - Number(b.id));
}

/**
 * Consulta um produto específico pelo ID
 */
export async function getBotProductById(id: number | string): Promise<Product | null> {
  const db = getDb();
  const docRef = doc(db, "products", String(id));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { ...(docSnap.data() as Product), id: Number(docSnap.id) };
}

/**
 * Verifica se um produto tem quantidade suficiente em estoque
 */
export async function checkBotStock(
  productId: number | string,
  quantityRequested: number = 1
): Promise<{ available: boolean; currentStock: number; product: Product | null }> {
  const product = await getBotProductById(productId);
  if (!product) {
    return { available: false, currentStock: 0, product: null };
  }

  const currentStock = Number(product.stock) || 0;
  const isSoldOut = Boolean(product.soldOut) || currentStock <= 0;
  const available = !isSoldOut && currentStock >= quantityRequested;

  return {
    available,
    currentStock,
    product,
  };
}

/**
 * Dá baixa no estoque de forma atômica e segura no Firestore.
 * Evita que dois clientes comprem a mesma última peça ao mesmo tempo.
 */
export async function decrementBotStock(
  productId: number | string,
  quantityToDeduct: number
): Promise<{ success: boolean; newStock: number; message: string }> {
  const db = getDb();
  const docRef = doc(db, "products", String(productId));

  try {
    const result = await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        throw new Error("Produto não encontrado no banco.");
      }

      const data = sfDoc.data() as Product;
      const currentStock = Number(data.stock) || 0;

      if (currentStock < quantityToDeduct) {
        throw new Error(`Estoque insuficiente! Disponível: ${currentStock}, Solicitado: ${quantityToDeduct}`);
      }

      const newStock = Math.max(0, currentStock - quantityToDeduct);
      const soldOut = newStock <= 0;

      transaction.update(docRef, {
        stock: newStock,
        soldOut,
        updatedAt: new Date().toISOString(),
      });

      return { success: true, newStock, message: "Estoque atualizado com sucesso." };
    });

    return result;
  } catch (error: any) {
    return {
      success: false,
      newStock: 0,
      message: error.message || "Erro ao processar baixa de estoque.",
    };
  }
}

/**
 * Formata a lista de produtos em texto pronto para envio no WhatsApp
 */
export function formatCatalogForWhatsApp(products: Product[]): string {
  if (products.length === 0) {
    return "No momento não temos produtos disponíveis no catálogo.";
  }

  const lines = products.map((p, idx) => {
    const priceStr = p.price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const sizes = p.sizes?.join(", ") || "Tamanho padrão";
    const status = p.soldOut || (p.stock || 0) <= 0 ? "❌ (Esgotado)" : `📦 (${p.stock} em estoque)`;

    return `*${idx + 1}. ${p.name}*\n🏷️ Categoria: ${p.category}\n💰 Valor: ${priceStr}\n📏 Tamanhos: ${sizes}\n${status}`;
  });

  return `✨ *CATÁLOGO DE PRODUTOS ZANBEE* ✨\n\n${lines.join("\n\n---\n\n")}\n\nPara fazer seu pedido, responda com o número ou nome da peça! 🐝`;
}
