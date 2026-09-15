import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Plus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
  Search,
  LogOut,
  Store,
  DollarSign,
  Boxes,
  Minus,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@shared/types";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { fetchProducts, updateProduct, deleteProduct } from "@/lib/api";
import ProductFormModal from "./components/ProductFormModal";

const LOGO = "./images/zanbee-logo.png";
const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "ocultos" | "esgotados">("todos");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Delete confirmation
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAllProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProducts(true); // true = show all including hidden
      setProducts(data);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar catálogo.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllProducts();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());

      // Category
      const matchesCategory =
        categoryFilter === "Todas" || p.category === categoryFilter;

      // Status
      let matchesStatus = true;
      if (statusFilter === "ativos") {
        matchesStatus = p.visible !== false;
      } else if (statusFilter === "ocultos") {
        matchesStatus = p.visible === false;
      } else if (statusFilter === "esgotados") {
        matchesStatus = Boolean(p.soldOut) || (p.stock ?? 0) <= 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // Summary metrics
  const totalItems = products.length;
  const visibleItems = products.filter((p) => p.visible !== false).length;
  const soldOutItems = products.filter((p) => p.soldOut || (p.stock ?? 0) <= 0).length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalStockValue = products.reduce((sum, p) => sum + p.price * (p.stock || 0), 0);

  // Quick Inline Actions
  const handleToggleVisible = async (p: Product) => {
    const newVisible = !p.visible;
    // Optimistic update
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, visible: newVisible } : item))
    );
    try {
      await updateProduct(p.id, { visible: newVisible });
      toast.success(
        newVisible
          ? `"${p.name}" agora está visível na loja pública.`
          : `"${p.name}" foi ocultado da vitrine.`
      );
    } catch {
      toast.error("Falha ao alterar visibilidade.");
      loadAllProducts();
    }
  };

  const handleToggleSoldOut = async (p: Product) => {
    const newSoldOut = !p.soldOut;
    setProducts((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, soldOut: newSoldOut } : item))
    );
    try {
      await updateProduct(p.id, { soldOut: newSoldOut });
      toast.success(
        newSoldOut
          ? `"${p.name}" marcado como Esgotado.`
          : `"${p.name}" agora está marcado como Em Estoque.`
      );
    } catch {
      toast.error("Falha ao alterar status de esgotado.");
      loadAllProducts();
    }
  };

  const handleAdjustStock = async (p: Product, delta: number) => {
    const currentStock = p.stock ?? 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    const willBeSoldOut = newStock === 0 ? true : p.soldOut;

    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, stock: newStock, soldOut: willBeSoldOut } : item
      )
    );

    try {
      await updateProduct(p.id, {
        stock: newStock,
        ...(newStock === 0 ? { soldOut: true } : {}),
      });
      toast.success(`Estoque de "${p.name}" atualizado para ${newStock} un.`);
    } catch {
      toast.error("Erro ao atualizar estoque.");
      loadAllProducts();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      toast.success(`"${productToDelete.name}" foi removido do catálogo.`);
      setProductToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir produto.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setSelectedProduct(p);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#4b2b1d] pb-20 selection:bg-[#f4b72b]/40">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#eadbc7] bg-[#fffaf2]/95 backdrop-blur-md">
        <div className="container flex h-16 sm:h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="ZanBee" className="h-9 sm:h-11 object-contain" />
            <div className="hidden sm:block border-l border-[#eadbc7] pl-3">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#a37331] block">
                Painel do Administrador
              </span>
              <span className="text-xs text-[#856c5a]">Gestão de Catálogo & Estoque</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#eadbc7] bg-[#fffdf9] text-xs font-bold text-[#6d4b39] hover:bg-[#fff6d8] hover:border-[#f4b72b] transition-all"
            >
              <Store size={15} />
              <span className="hidden sm:inline">Ver Vitrine Pública</span>
            </a>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#fce5df] text-[#c53030] text-xs font-bold hover:bg-[#fbd3b6] transition-colors"
              title="Sair do Painel"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container pt-6 sm:pt-8 space-y-6">
        {/* Title and Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#4b2b1d]">
              Controle de Estoque & Produtos
            </h1>
            <p className="text-xs sm:text-sm text-[#856c5a] mt-1">
              Adicione peças, ajuste valores, controle quantidades e defina o que fica visível na loja.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#f4b72b] hover:bg-[#ebae21] text-[#4b2b1d] font-bold text-xs sm:text-sm shadow-md shadow-[#f4b72b]/25 transition-all hover:-translate-y-0.5 cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Adicionar Novo Produto</span>
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#eadbc7] shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#fff4cf] text-[#a37331] flex items-center justify-center shrink-0">
              <Package size={22} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#856c5a] block">
                Total de Peças
              </span>
              <strong className="text-xl sm:text-2xl font-bold text-[#4b2b1d]">
                {totalItems}
              </strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#eadbc7] shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#eef8eb] text-[#52a447] flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#856c5a] block">
                Visíveis na Loja
              </span>
              <strong className="text-xl sm:text-2xl font-bold text-[#4b2b1d]">
                {visibleItems}
              </strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#eadbc7] shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#fce5df] text-[#c53030] flex items-center justify-center shrink-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#856c5a] block">
                Esgotados
              </span>
              <strong className="text-xl sm:text-2xl font-bold text-[#4b2b1d]">
                {soldOutItems}
              </strong>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#eadbc7] shadow-sm flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#fff4cf] text-[#d27b34] flex items-center justify-center shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#856c5a] block">
                Valor em Estoque
              </span>
              <strong className="text-lg sm:text-xl font-bold text-[#4b2b1d]">
                {money(totalStockValue)}
              </strong>
              <span className="text-[10px] text-[#856c5a] block">
                ({totalStockUnits} un. totais)
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#eadbc7] space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#856c5a]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome do produto..."
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-xs sm:text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              />
            </div>

            {/* Category selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#856c5a] whitespace-nowrap">
                Categoria:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 px-3 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-xs sm:text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              >
                <option value="Todas">Todas as Categorias</option>
                <option value="Meninos">Meninos</option>
                <option value="Meninas">Meninas</option>
                <option value="Bebê">Bebê</option>
                <option value="Calçados">Calçados</option>
                <option value="Acessórios">Acessórios</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 border-t border-[#eadbc7]/60 pt-3 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-[#856c5a] mr-2">Filtrar por:</span>
            {(
              [
                { id: "todos", label: "Todos os Produtos", count: totalItems },
                { id: "ativos", label: "Visíveis na Vitrine", count: visibleItems },
                {
                  id: "ocultos",
                  label: "Ocultos / Rascunhos",
                  count: totalItems - visibleItems,
                },
                { id: "esgotados", label: "Esgotados", count: soldOutItems },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-[#4b2b1d] text-[#fff8eb]"
                    : "bg-[#fffaf2] text-[#6d4b39] border border-[#eadbc7] hover:bg-[#fff6d8]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-[#eadbc7] text-[#6d4b39]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Products List / Table */}
        <div className="bg-[#fffdf9] border border-[#eadbc7] rounded-3xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-20 text-center text-[#856c5a] space-y-2">
              <div className="w-8 h-8 border-3 border-[#f4b72b] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm">Carregando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-[#856c5a] space-y-3 px-4">
              <Boxes size={40} className="mx-auto text-[#d9c4af]" />
              <h3 className="font-serif text-lg font-bold text-[#4b2b1d]">
                Nenhum produto encontrado
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                Tente ajustar os filtros ou a busca, ou adicione um novo produto ao estoque.
              </p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-[#f4b72b] text-[#4b2b1d] font-bold text-xs"
              >
                Adicionar Produto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#eadbc7] bg-[#fffaf2] text-[11px] font-bold uppercase tracking-wider text-[#856c5a]">
                    <th className="py-3.5 px-4">Produto</th>
                    <th className="py-3.5 px-3">Preço</th>
                    <th className="py-3.5 px-3">Estoque</th>
                    <th className="py-3.5 px-3 text-center">Esgotado?</th>
                    <th className="py-3.5 px-3 text-center">Visível na Loja?</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eadbc7]/70 text-xs sm:text-sm">
                  {filteredProducts.map((p) => {
                    const isSoldOut = Boolean(p.soldOut) || (p.stock ?? 0) <= 0;
                    const isVisible = p.visible !== false;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-[#fff9ef] transition-colors ${
                          !isVisible ? "bg-[#fef9f7]/60 opacity-80" : ""
                        }`}
                      >
                        {/* Image & Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 rounded-lg bg-[#f5eadc] border border-[#eadbc7] overflow-hidden shrink-0 relative">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=300";
                                }}
                              />
                              {!isVisible && (
                                <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white" title="Oculto">
                                  <EyeOff size={14} />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a37331]">
                                  {p.category}
                                </span>
                                {p.badge && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#f4b72b]/30 text-[#4b2b1d]">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-[#4b2b1d] truncate max-w-xs sm:max-w-sm">
                                {p.name}
                              </h4>
                              <span className="text-[11px] text-[#856c5a]">
                                Tam: {p.sizes?.join(", ") || "Único"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-3 font-semibold text-[#d27b34] whitespace-nowrap">
                          {money(p.price)}
                          {p.oldPrice && (
                            <del className="block text-[11px] text-[#aa9885] font-normal">
                              {money(p.oldPrice)}
                            </del>
                          )}
                        </td>

                        {/* Stock Counter with Quick +/- */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#fffaf2] border border-[#eadbc7]">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p, -1)}
                              disabled={(p.stock ?? 0) <= 0}
                              className="w-6 h-6 rounded-lg bg-white border border-[#eadbc7] flex items-center justify-center text-[#6d4b39] hover:bg-[#fff6d8] disabled:opacity-40 transition-colors"
                              title="Diminuir 1 unidade"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center font-bold text-xs text-[#4b2b1d]">
                              {p.stock ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(p, 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-[#eadbc7] flex items-center justify-center text-[#6d4b39] hover:bg-[#fff6d8] transition-colors"
                              title="Adicionar 1 unidade"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </td>

                        {/* Sold Out Switch */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSoldOut(p)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isSoldOut
                                ? "bg-[#fce5df] text-[#c53030] hover:bg-[#fbd3b6]"
                                : "bg-[#eef8eb] text-[#52a447] hover:bg-[#dff0d8]"
                            }`}
                            title="Clique para alternar status de esgotado"
                          >
                            {isSoldOut ? (
                              <>
                                <AlertCircle size={12} /> Esgotado
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} /> Em Estoque
                              </>
                            )}
                          </button>
                        </td>

                        {/* Visibility Switch */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isVisible
                                ? "bg-[#fff4cf] text-[#8b5b35] hover:bg-[#fbebb7]"
                                : "bg-[#f1ebe5] text-[#856c5a] hover:bg-[#e4dcd3]"
                            }`}
                            title={
                              isVisible
                                ? "Clique para ocultar da vitrine"
                                : "Clique para exibir na vitrine"
                            }
                          >
                            {isVisible ? (
                              <>
                                <Eye size={13} className="text-[#a37331]" />
                                <span>Visível</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={13} className="text-[#856c5a]" />
                                <span>Oculto</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-2 rounded-xl border border-[#eadbc7] bg-white text-[#6d4b39] hover:bg-[#f4b72b]/20 hover:border-[#f4b72b] transition-colors"
                              title="Editar informações completas"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-2 rounded-xl border border-[#eadbc7] bg-white text-[#c53030] hover:bg-[#fce5df] hover:border-[#fcd3cf] transition-colors"
                              title="Excluir produto do catálogo"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Full Edit / Create Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadAllProducts();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-[#2e1b12]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#fffdf9] border border-[#eadbc7] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fce5df] text-[#c53030] flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-[#4b2b1d]">
                Excluir este produto?
              </h3>
              <p className="text-xs sm:text-sm text-[#856c5a] mt-1.5 leading-relaxed">
                Você tem certeza que deseja remover <strong>"{productToDelete.name}"</strong>?
                Esta ação não pode ser desfeita. Se você só quer que os clientes não vejam o
                produto, basta marcar como <strong>Oculto</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-[#eadbc7] bg-white text-xs font-bold text-[#6d4b39] hover:bg-[#fff6d8] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-[#c53030] hover:bg-[#b02020] text-xs font-bold text-white shadow-md transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir Produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
