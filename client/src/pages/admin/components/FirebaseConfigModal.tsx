import React, { useState, useEffect } from "react";
import { X, Database, Check, AlertCircle, RefreshCw, Sparkles, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  isFirebaseConfigured,
  FirebaseConfigOptions,
} from "@/lib/firebase";
import { seedProductsToFirestore } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FirebaseConfigModal({ isOpen, onClose }: Props) {
  const isConfigured = isFirebaseConfigured();
  const currentConfig = getFirebaseConfig();

  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [showJsonHelper, setShowJsonHelper] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setApiKey(currentConfig.apiKey || "");
      setAuthDomain(currentConfig.authDomain || "");
      setProjectId(currentConfig.projectId || "");
      setStorageBucket(currentConfig.storageBucket || "");
      setMessagingSenderId(currentConfig.messagingSenderId || "");
      setAppId(currentConfig.appId || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleParseJson = () => {
    try {
      // Clean possible js object like "const firebaseConfig = { ... };"
      let clean = jsonInput.trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        clean = match[0];
      }

      // Convert unquoted keys to quoted JSON keys if user pasted a JS object
      const formatted = clean
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"')
        .replace(/,\s*}/g, "}");

      const parsed = JSON.parse(formatted);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);

      toast.success("Credenciais importadas com sucesso do texto!");
      setShowJsonHelper(false);
      setJsonInput("");
    } catch (e: any) {
      toast.error("Não foi possível reconhecer o formato. Cole o objeto JS ou JSON gerado pelo Firebase.");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      toast.error("Chave de API (apiKey) e ID do Projeto (projectId) são obrigatórios.");
      return;
    }

    const newConfig: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || undefined,
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveCustomFirebaseConfig(newConfig);
    toast.success("Configuração do Firebase salva! A página será reiniciada com o banco ativo.");
    onClose();
  };

  const handleClear = () => {
    if (confirm("Deseja realmente remover as credenciais salvas do Firebase? O site voltará para o modo local/mock.")) {
      clearCustomFirebaseConfig();
      toast.info("Configurações removidas.");
      onClose();
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const count = await seedProductsToFirestore(true);
      toast.success(`${count} produtos foram sincronizados no Cloud Firestore com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao sincronizar produtos: " + (err.message || "Verifique permissões do Firestore"));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Banco de Dados Online (Firebase)</h2>
              <p className="text-xs text-gray-500">
                Sincronização em tempo real entre Catálogo, Painel e Chat-bot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status card */}
        <div
          className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
            isConfigured
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {isConfigured ? (
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs">
            <p className="font-semibold text-sm mb-0.5">
              {isConfigured ? "Firebase Conectado Online!" : "Modo Local / Armazenamento Temporário"}
            </p>
            <p>
              {isConfigured
                ? `Conectado ao projeto "${currentConfig?.projectId}". Qualquer alteração é salva no Cloud Firestore e compartilhada com o Chat-bot e todos os clientes.`
                : "Insira as credenciais do seu projeto Firebase Console abaixo para ativar o banco consistente em nuvem na vitrine e no chat-bot."}
            </p>
          </div>
        </div>

        {/* Sync / Seed button if configured */}
        {isConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Sincronizar Coleção Inicial
              </p>
              <p className="text-xs text-gray-500">
                Envie todos os produtos da loja ZanBee para o Cloud Firestore agora.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
              {isSeeding ? "Sincronizando..." : "Sincronizar Agora"}
            </button>
          </div>
        )}

        {/* Toggle paste JSON */}
        <div className="mb-4 flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-700">Parâmetros de Conexão</label>
          <button
            type="button"
            onClick={() => setShowJsonHelper(!showJsonHelper)}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 hover:underline"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {showJsonHelper ? "Ocultar colagem rápida" : "Colar objeto do Firebase Console"}
          </button>
        </div>

        {showJsonHelper && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 animate-in fade-in">
            <p className="text-xs text-gray-600 mb-2 font-medium">
              Copie o código <code className="bg-white px-1 py-0.5 rounded text-amber-700">firebaseConfig = {"{ ... }"}</code> do Firebase Console e cole abaixo:
            </p>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  apiKey: "AIzaSy...",\n  authDomain: "zanbee-app.firebaseapp.com",\n  projectId: "zanbee-app",\n  storageBucket: "zanbee-app.firebasestorage.app",\n  messagingSenderId: "...",\n  appId: "..."\n}`}
              rows={4}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            />
            <button
              type="button"
              onClick={handleParseJson}
              className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Preencher Campos Automaticamente
            </button>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Project ID (ID do Projeto Firebase) *
            </label>
            <input
              type="text"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="ex: zanbee-catalogo-2026"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              API Key (Chave da API Web) *
            </label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ex: AIzaSyD3x9..."
              className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="ex: zanbee.firebaseapp.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Storage Bucket <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="Vazio = salva fotos direto no banco (Grátis)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Messaging Sender ID
              </label>
              <input
                type="text"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                placeholder="ex: 10839281726"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                App ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="ex: 1:10839281726:web:48a7b..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3 mt-6">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Desconectar Firebase
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Salvar e Conectar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
