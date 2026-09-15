import React, { useState, useEffect } from "react";
import { X, Upload, Check, AlertCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@shared/types";
import { createProduct, updateProduct, uploadImage } from "@/lib/api";

const PRESET_IMAGES = [
  { label: "Floresta", url: "./images/conjunto-floresta.jpg" },
  { label: "Aranha", url: "./images/conjunto-aranha.jpg" },
  { label: "Gamer", url: "./images/conjunto-gamer.jpg" },
  { label: "Urso", url: "./images/conjunto-urso.jpg" },
  { label: "Dinossauro", url: "./images/conjunto-dinossauro.jpg" },
  { label: "Happy Bear", url: "./images/conjunto-esgotado-1.jpg" },
  { label: "Picolé", url: "./images/conjunto-esgotado-2.jpg" },
  { label: "Morango", url: "./images/conjunto-esgotado-3.jpg" },
  { label: "Cachorrinho", url: "./images/conjunto-esgotado-4.jpg" },
  { label: "Coelhinhos", url: "./images/conjunto-esgotado-5.jpg" },
];

const CATEGORIES = ["Meninos", "Meninas", "Bebê", "Calçados", "Acessórios"];

interface Props {
  product: Product | null; // If null, create mode. If provided, edit mode.
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedProduct: Product) => void;
}

export default function ProductFormModal({ product, isOpen, onClose, onSuccess }: Props) {
  const isEditing = Boolean(product);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Meninos");
  const [price, setPrice] = useState<number | string>("");
  const [oldPrice, setOldPrice] = useState<number | string>("");
  const [stock, setStock] = useState<number | string>(5);
  const [sizesInput, setSizesInput] = useState("6 a 7 anos");
  const [colorsInput, setColorsInput] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [image, setImage] = useState("./images/conjunto-floresta.jpg");
  const [soldOut, setSoldOut] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category || "Meninos");
      setPrice(product.price);
      setOldPrice(product.oldPrice || "");
      setStock(product.stock ?? 0);
      setSizesInput(product.sizes ? product.sizes.join(", ") : "6 a 7 anos");
      setColorsInput(product.colors ? product.colors.join(", ") : "");
      setDescription(product.description || "");
      setBadge(product.badge || "");
      setImage(product.image || "./images/conjunto-floresta.jpg");
      setSoldOut(Boolean(product.soldOut));
      setVisible(product.visible !== false);
    } else {
      // Reset defaults for new product
      setName("");
      setCategory("Meninos");
      setPrice("");
      setOldPrice("");
      setStock(5);
      setSizesInput("6 a 7 anos");
      setColorsInput("");
      setDescription("");
      setBadge("Universo Encantado");
      setImage("./images/conjunto-floresta.jpg");
      setSoldOut(false);
      setVisible(true);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 8MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const uploadedUrl = await uploadImage(dataUrl, file.name.replace(/\.[^/.]+$/, ""));
        setImage(uploadedUrl);
        toast.success("Foto enviada com sucesso!");
      } catch (err) {
        toast.error("Erro ao enviar a imagem.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Erro ao ler o arquivo selecionado.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error("Informe um preço válido maior que zero.");
      return;
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      toast.error("A quantidade em estoque não pode ser negativa.");
      return;
    }

    const parsedSizes = sizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedColors = colorsInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: Partial<Product> = {
      name: name.trim(),
      category,
      price: numPrice,
      oldPrice: oldPrice ? Number(oldPrice) : null,
      stock: numStock,
      sizes: parsedSizes.length ? parsedSizes : ["Único"],
      colors: parsedColors,
      description: description.trim(),
      badge: badge.trim() || undefined,
      image,
      soldOut: soldOut || numStock === 0,
      visible,
    };

    setIsSaving(true);
    try {
      if (isEditing && product) {
        const updated = await updateProduct(product.id, payload);
        toast.success("Produto atualizado com sucesso!");
        onSuccess(updated);
      } else {
        const created = await createProduct(payload);
        toast.success("Produto adicionado ao estoque!");
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2e1b12]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#fffdf9] border border-[#eadbc7] rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#eadbc7] flex items-center justify-between bg-[#fffaf2]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a37331]">
              {isEditing ? "Edição de Cadastro" : "Novo Item no Catálogo"}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#4b2b1d]">
              {isEditing ? `Editar: ${product?.name}` : "Adicionar Produto ao Estoque"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#eadbc7] bg-white flex items-center justify-center text-[#6d4b39] hover:bg-[#f4b72b]/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Nome da Peça / Produto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Conjunto Infantil Leão Safari"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b] focus:ring-1 focus:ring-[#f4b72b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Selo / Coleção (Opcional)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ex: Universo Encantado, Lançamento"
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Preço de Venda (R$) *
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="40.00"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm font-semibold text-[#d27b34] focus:outline-none focus:border-[#f4b72b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Preço Anterior / De (R$) <span className="text-[#856c5a] font-normal">(Opcional)</span>
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                placeholder="55.00"
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#856c5a] focus:outline-none focus:border-[#f4b72b]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Quantidade em Estoque *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => {
                  const val = e.target.value;
                  setStock(val);
                  if (Number(val) === 0) {
                    setSoldOut(true);
                  }
                }}
                required
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm font-bold text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              />
              <span className="text-[11px] text-[#856c5a] mt-1 block">
                Se for 0, o produto será sinalizado como esgotado.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Tamanhos Disponíveis
              </label>
              <input
                type="text"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                placeholder="Ex: 6 a 7 anos, 4 a 5 anos"
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              />
              <span className="text-[11px] text-[#856c5a] mt-1 block">Separar por vírgula.</span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Cores Disponíveis
              </label>
              <input
                type="text"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Ex: Verde, Marrom, Amarelo"
                className="w-full h-11 px-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39] mb-1.5">
                Descrição da Peça
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalhes do tecido, caimento e recomendações..."
                className="w-full p-3.5 rounded-xl bg-[#fffaf2] border border-[#eadbc7] text-sm text-[#4b2b1d] focus:outline-none focus:border-[#f4b72b] resize-none"
              />
            </div>
          </div>

          {/* Image Selection Section */}
          <div className="p-4 rounded-2xl bg-[#fffaf2] border border-[#eadbc7] space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6d4b39]">
              Foto do Produto
            </label>

            <div className="flex items-center gap-4">
              <div className="w-24 h-28 rounded-xl border border-[#eadbc7] bg-white overflow-hidden shrink-0 flex items-center justify-center relative">
                {image ? (
                  <img src={image} alt="Prévia" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-[#c9b5a0]" size={28} />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
                    Enviando...
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4b2b1d] text-[#fff8eb] text-xs font-bold cursor-pointer hover:bg-[#382015] transition-colors">
                  <Upload size={14} />
                  <span>{isUploading ? "Carregando foto..." : "Enviar Foto do Dispositivo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-[#856c5a]">
                  Ou cole um link ou escolha uma das fotos de vitrine abaixo:
                </p>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="./images/..."
                  className="w-full h-9 px-3 rounded-lg bg-white border border-[#eadbc7] text-xs text-[#4b2b1d]"
                />
              </div>
            </div>

            {/* Quick preset selection */}
            <div>
              <span className="text-[10px] font-bold text-[#856c5a] uppercase tracking-wider block mb-1.5">
                Fotos de demonstração existentes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setImage(preset.url)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                      image === preset.url
                        ? "bg-[#f4b72b] border-[#d49915] text-[#4b2b1d] font-bold"
                        : "bg-white border-[#eadbc7] text-[#6d4b39] hover:bg-[#fff6d8]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility and Sold Out Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Visible Switch */}
            <div
              onClick={() => setVisible(!visible)}
              className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                visible
                  ? "bg-[#f0f9eb] border-[#c2e7b0]"
                  : "bg-[#fef6f5] border-[#fcd3cf]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  visible ? "bg-[#52a447] text-white" : "bg-[#c53030] text-white"
                }`}
              >
                {visible ? <Check size={14} /> : <X size={14} />}
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#4b2b1d]">
                  {visible ? "Visível na Vitrine" : "Oculto dos Clientes"}
                </strong>
                <span className="text-xs text-[#856c5a]">
                  {visible
                    ? "O produto aparece normalmente no catálogo público."
                    : "Item invisível na loja, salvo apenas no seu painel."}
                </span>
              </div>
            </div>

            {/* Sold Out Switch */}
            <div
              onClick={() => setSoldOut(!soldOut)}
              className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                soldOut
                  ? "bg-[#fff2e8] border-[#fbd3b6]"
                  : "bg-[#fdfaf5] border-[#eadbc7]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  soldOut ? "bg-[#d27b34] text-white" : "bg-[#cfbaa8] text-white"
                }`}
              >
                {soldOut ? <AlertCircle size={14} /> : <Check size={14} />}
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#4b2b1d]">
                  {soldOut ? "Marcado como Esgotado" : "Disponível para Pedido"}
                </strong>
                <span className="text-xs text-[#856c5a]">
                  {soldOut
                    ? "Exibe selo 'Esgotado' e desabilita pedidos na vitrine."
                    : "Clientes podem adicionar à sacola normalmente."}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#eadbc7] bg-[#fffaf2] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl border border-[#eadbc7] bg-white text-xs font-bold text-[#6d4b39] hover:bg-[#fff6d8] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#f4b72b] hover:bg-[#ebae21] text-xs font-bold text-[#4b2b1d] shadow-md shadow-[#f4b72b]/25 transition-transform hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Produto"}
          </button>
        </div>
      </div>
    </div>
  );
}
