import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = "zanbee_firebase_custom_config";

const DEFAULT_FIREBASE_CONFIG: FirebaseConfigOptions = {
  apiKey: "AIzaSyCW6432-vvSRZlOa48kMTpmlLBw_gVTQ6c",
  authDomain: "catalago-a07e0.firebaseapp.com",
  projectId: "catalago-a07e0",
  storageBucket: "", // Salva imagens direto no Firestore Database sem custos
  messagingSenderId: "234094332686",
  appId: "1:234094332686:web:99475f8cdc1ec93dd6a55f",
};

/**
 * Retrieve Firebase credentials from Environment Variables, Local Storage or Built-in defaults
 */
export function getFirebaseConfig(): FirebaseConfigOptions | null {
  // 1. Check LocalStorage override first (allows runtime configuration on GitHub Pages)
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.apiKey && parsed?.projectId) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Failed to read custom Firebase config from localStorage", err);
    }
  }

  // 2. Check Vite Environment variables
  const envConfig: FirebaseConfigOptions = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || "",
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || "",
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || "",
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || "",
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "",
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || "",
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // 3. Fallback to built-in default config
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveCustomFirebaseConfig(config: FirebaseConfigOptions): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
    // Reload or reinitialize
    window.location.reload();
  }
}

export function clearCustomFirebaseConfig(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    window.location.reload();
  }
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
}

// Global instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  const config = getFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    if (config.storageBucket) {
      storage = getStorage(app);
    }
  }
} catch (error) {
  console.error("Erro ao inicializar o Firebase:", error);
}

export { app, db, storage };
