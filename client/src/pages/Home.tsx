/* ZanBee — Mel Editorial: vitrine assimétrica, paleta mel/creme/cacau, Fraunces + DM Sans, microinterações discretas. */
import { useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, ShoppingBag, Menu, X, ArrowRight, ChevronRight, Heart, MessageCircle, Minus, Plus, Trash2, Check, Instagram, MapPin, Lock } from "lucide-react";
import { toast } from "sonner";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@shared/types";

const LOGO = "./images/zanbee-logo.png";
const HERO = "./images/zanbee-hero.jpg";
const GIRLS = "./images/zanbee-category-girls.jpg";
const BOYS = "./images/zanbee-category-boys.jpg";
const BEE = "./images/zanbee-bee-icon.png";
const WA = "https://wa.me/5593991574982";

const FLORESTA = "./images/conjunto-floresta.jpg";
const ARANHA = "./images/conjunto-aranha.jpg";
const GAMER = "./images/conjunto-gamer.jpg";
const URSO = "./images/conjunto-urso.jpg";
const DINOSSAURO = "./images/conjunto-dinossauro.jpg";

const ESG_BEAR = "./images/conjunto-esgotado-1.jpg";
const ESG_PICOLLE = "./images/conjunto-esgotado-2.jpg";
const ESG_STRAWBERRY = "./images/conjunto-esgotado-3.jpg";
const ESG_DOG = "./images/conjunto-esgotado-4.jpg";
const ESG_RABBITS = "./images/conjunto-esgotado-5.jpg";

const initialProducts: Product[] = [
  { id:1, name:"Conjunto Infantil Floresta", category:"Meninos", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Verde","Marrom"], image:FLORESTA, description:"Conjunto infantil da coleção Universo Encantado, com estampa da Turma da Floresta e bermuda confortável.", badge:"Universo Encantado", soldOut:true, visible:true },
  { id:2, name:"Conjunto Infantil Homem-Aranha", category:"Meninos", price:40.0, stock:5, sizes:["6 a 7 anos"], colors:["Vermelho","Azul"], image:ARANHA, description:"Conjunto infantil temático Homem-Aranha da coleção Universo Encantado, confortável e cheio de estilo.", badge:"Universo Encantado", visible:true },
  { id:3, name:"Conjunto Infantil Gamer Loading", category:"Meninos", price:40.0, stock:4, sizes:["6 a 7 anos"], colors:["Azul","Vermelho"], image:GAMER, description:"Conjunto infantil gamer da coleção Universo Encantado, com camiseta estilosa e bermuda leve.", badge:"Universo Encantado", visible:true },
  { id:4, name:"Conjunto Infantil Urso Moderno", category:"Meninos", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Azul","Laranja"], image:URSO, description:"Conjunto infantil descolado da coleção Universo Encantado, com estampa de urso e bermuda vibrante.", badge:"Universo Encantado", soldOut:true, visible:true },
  { id:5, name:"Conjunto Infantil Dinossauro Explorer", category:"Meninos", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Preto","Azul"], image:DINOSSAURO, description:"Conjunto infantil temático de dinossauro da coleção Universo Encantado, com camiseta preta estampada e bermuda azul.", badge:"Universo Encantado", soldOut:true, visible:true },
  { id:6, name:"Conjunto Infantil Happy Bear", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Rosa","Verde"], image:ESG_BEAR, description:"Conjunto infantil da coleção Universo Encantado, super charmoso com camiseta de urso e bermuda verde.", badge:"Esgotado", soldOut:true, visible:true },
  { id:7, name:"Conjunto Infantil Picolé & Diversão", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Amarelo","Rosa"], image:ESG_PICOLLE, description:"Conjunto leve com camiseta de carrinho de picolé e shorts estampado colorido.", badge:"Esgotado", soldOut:true, visible:true },
  { id:8, name:"Conjunto Infantil Doce Morango", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Creme","Vermelho"], image:ESG_STRAWBERRY, description:"Conjunto infantil delicado com camiseta estampa de morangos e bermuda vermelha.", badge:"Esgotado", soldOut:true, visible:true },
  { id:9, name:"Conjunto Infantil Cachorrinho Backpack", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Lilás","Rosa"], image:ESG_DOG, description:"Conjunto fofo com camiseta estampa mochila de cachorrinho corgi e shorts rosa.", badge:"Esgotado", soldOut:true, visible:true },
  { id:10, name:"Conjunto Infantil Três Coelhinhos", category:"Meninas", price:40.0, stock:0, sizes:["6 a 7 anos"], colors:["Rosa","Verde"], image:ESG_RABBITS, description:"Conjunto gracioso com estampa de coelhinhos e bermuda verde com corações.", badge:"Esgotado", soldOut:true, visible:true }
];
const categories = [
  { name:"Bebê", desc:"Conforto para os primeiros momentos.", image:GIRLS, tone:"cream" },
  { name:"Meninas", desc:"Delicadeza para brincar e celebrar.", image:GIRLS, tone:"pink" },
  { name:"Meninos", desc:"Estilo leve para todos os momentos.", image:BOYS, tone:"honey" },
  { name:"Calçados", desc:"Passos confortáveis e cheios de atitude.", image:BOYS, tone:"brown" },
];
const money = (v:number) => v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });

function SafeImage({ src, alt, className, type }: { src: string; alt: string; className?: string; type?: 'hero' | 'girls' | 'boys' }) {
  const getFallback = () => {
    if (type === 'hero') return "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800";
    if (src.includes('esgotado')) return "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800";
    if (type === 'boys' || src.includes('boys') || src.includes('conjunto-')) return "https://images.unsplash.com/photo-1471286174240-e6458e7b3044?auto=format&fit=crop&q=80&w=800";
    return "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800";
  };
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = getFallback();
      }}
    />
  );
}

export default function Home() {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<{product:Product; qty:number; size:string}[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("destaques");

  useEffect(() => {
    fetchProducts(false)
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setProductsList(data);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar produtos:", err);
      });
  }, []);

  const filtered = useMemo(() => productsList.filter(p => (category === "Todos" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())), [productsList, category, search]);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const add = (p:Product, size=p.sizes[0]) => { setCart(prev => { const found=prev.find(i=>i.product.id===p.id && i.size===size); return found ? prev.map(i=>i.product.id===p.id&&i.size===size?{...i,qty:i.qty+1}:i) : [...prev,{product:p,qty:1,size}]; }); toast.success(`${p.name} entrou na sua lista.`); };
  const sendWhatsApp = () => { if (!cart.length) { toast.info("Adicione pelo menos um produto à lista."); return; } const lines=cart.map(i=>`${i.qty}x ${i.product.name}\nTamanho: ${i.size}\nValor: ${money(i.product.price*i.qty)}`).join("\n\n"); const msg=`Olá, ZanBee! Gostaria de fazer um pedido:\n\n${lines}\n\nTotal estimado: ${money(total)}\n\nGostaria de confirmar disponibilidade.`; window.open(`${WA}?text=${encodeURIComponent(msg)}`, "_blank"); };
  const scrollTo = (id:string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({behavior:"smooth"}); };
  return <div className="min-h-screen bg-[#fffaf2] text-[#4b2b1d] selection:bg-[#f5c84b]/40">
    <div className="top-strip"><span>Entrega e atendimento em Óbidos – PA</span><span className="hidden sm:inline">Pedidos simples pelo WhatsApp • (93) 99157-4982</span></div>
    <header className="sticky top-0 z-40 border-b border-[#eadbc7] bg-[#fffaf2]/95 backdrop-blur-md"><div className="container flex h-[76px] items-center justify-between gap-5">
      <button onClick={()=>scrollTo("inicio")} className="brand-lockup" aria-label="Ir para o início"><img src={LOGO} alt="ZanBee — O lado doce de vestir" /></button>
      <nav className="hidden xl:flex items-center gap-6 text-[13px] font-semibold text-[#6d4b39]"><button onClick={()=>scrollTo("inicio")}>Início</button><button onClick={()=>{setCategory("Todos");scrollTo("produtos")}}>Produtos</button><button onClick={()=>{setCategory("Meninos");scrollTo("produtos")}}>Meninos</button><button onClick={()=>{setCategory("Meninas");scrollTo("produtos")}}>Meninas</button><button onClick={()=>scrollTo("contato")}>Contato</button></nav>
      <div className="flex items-center gap-2"><div className="search-mini hidden md:flex"><Search size={16}/><input value={search} onChange={e=>{setSearch(e.target.value);scrollTo("produtos")}} placeholder="Buscar produto" /></div><button className="icon-btn" onClick={()=>setCartOpen(true)} aria-label="Abrir lista de pedido"><ShoppingBag size={19}/>{count>0&&<b>{count}</b>}</button><a className="wa-top hidden sm:flex" href={WA} target="_blank" rel="noreferrer"><MessageCircle size={17}/> WhatsApp</a><button className="icon-btn xl:hidden" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen?<X/>:<Menu/>}</button></div>
    </div>{menuOpen&&<div className="mobile-menu xl:hidden">{["Início","Produtos","Meninos","Meninas","Contato"].map(item=><button key={item} onClick={()=>{ if(item==="Meninos"||item==="Meninas") { setCategory(item); scrollTo("produtos"); } else { scrollTo(item==="Início"?"inicio":item==="Contato"?"contato":"produtos"); } }}>{item}<ChevronRight size={15}/></button>)}</div>}</header>
    <main id="inicio">
      <section className="hero container"><div className="hero-copy"><div className="eyebrow"><span className="dot"></span> Moda infantil em Óbidos</div><h1>Pequenos looks,<br/><em>grandes memórias.</em></h1><p>Roupas, calçados e acessórios escolhidos com carinho para deixar cada momento da infância ainda mais especial.</p><div className="hero-actions"><button className="btn-primary" onClick={()=>scrollTo("produtos")}>Ver produtos <ArrowRight size={17}/></button><a className="btn-quiet" href={WA} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Falar no WhatsApp</a></div><div className="hero-note"><img src={BEE} alt=""/> <span>O lado doce de vestir</span></div></div><div className="hero-visual"><div className="hero-image-wrap"><SafeImage src={HERO} alt="Criança usando look ZanBee" type="hero" /></div><div className="hero-sticker"><span>feito com</span><strong>carinho</strong><Heart size={16} fill="currentColor"/></div><div className="hero-scribble">seleções que<br/><span>fazem sorrir</span></div></div></section>
      <section className="trust-row container"><div><Check size={17}/> Seleção cuidadosa</div><div><Check size={17}/> Preços acessíveis</div><div><Check size={17}/> Atendimento próximo</div><div><MapPin size={17}/> Óbidos – PA</div></section>
      <section className="catalog-section" id="produtos"><div className="container"><div className="section-heading"><div><span className="eyebrow">Vitrine ZanBee</span><h2>Coleção Universo Encantado (6 a 7 anos)</h2></div></div><div className="catalog-toolbar"><div className="search-large"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar produtos..." /></div><div className="filter-pills">{["Todos","Meninos","Meninas"].map(c=><button key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div></div><div className="product-grid">{filtered.map(p=>{ const isEsgotado = p.soldOut || (p.stock ?? 0) <= 0; return <article className={`product-card ${isEsgotado ? 'opacity-70' : ''}`} key={p.id}><div className="product-image"><SafeImage src={p.image} alt={p.name}/>{isEsgotado ? <span className="badge" style={{backgroundColor: '#856c5a'}}>Esgotado</span> : p.badge && <span className="badge">{p.badge}</span>}<button className="heart-btn" aria-label="Favoritar"><Heart size={17}/></button></div><div className="product-info"><span className="product-category">{p.category}</span><h3>{p.name}</h3><div className="price-row"><strong>{money(p.price)}</strong>{p.oldPrice&&<del>{money(p.oldPrice)}</del>}</div><p>Tamanhos: {p.sizes.join(", ")}</p><div className="product-actions"><button className="detail-btn" onClick={()=>setSelected(p)}>Ver detalhes</button>{isEsgotado ? <button className="add-btn cursor-not-allowed bg-[#efe2d3] text-[#856c5a]" disabled>Esgotado</button> : <button className="add-btn" onClick={()=>add(p)}>Adicionar <Plus size={15}/></button>}</div></div></article> })}</div>{!filtered.length&&<div className="empty-state">Nenhum produto encontrado. Tente outra busca.</div>}</div></section>
      <section className="about-section" id="contato"><div className="container about-inner"><img src={BEE} alt="" className="about-bee"/><div><span className="eyebrow">Sobre a ZanBee</span><h2>O lado doce<br/><em>de vestir.</em></h2><p>A ZanBee nasceu para tornar a experiência de vestir as crianças ainda mais especial. Reunimos roupas, calçados e acessórios infantis escolhidos com carinho para acompanhar cada fase e cada momento da infância.</p><div className="about-meta"><span><MapPin size={16}/> Óbidos, Pará</span><span><Instagram size={16}/> @zanbeeobidos</span><span className="md:border-l border-white/20 md:pl-4 text-xs font-semibold text-[#f4b72b]">Aceitamos: Pix, Cartão e espécie</span></div></div><a className="about-cta" href={WA} target="_blank" rel="noreferrer"><MessageCircle size={24}/><span>Quer conversar?<strong>Chame no WhatsApp</strong></span><ArrowRight size={18}/></a></div></section>
    </main>
    <footer><div className="container footer-main"><div className="footer-brand"><img src={LOGO} alt="ZanBee"/><p>O lado doce de vestir.</p><span>Óbidos – Pará</span></div><div><h4>Navegue</h4><button onClick={()=>scrollTo("inicio")}>Início</button><button onClick={()=>scrollTo("produtos")}>Produtos</button><button onClick={()=>scrollTo("contato")}>Contato</button></div><div><h4>Fale conosco</h4><a href={WA} target="_blank" rel="noreferrer">(93) 99157-4982</a><a href="https://wa.me/5593991589475" target="_blank" rel="noreferrer">(93) 99158-9475</a><a href="https://instagram.com/zanbeeobidos" target="_blank" rel="noreferrer">@zanbeeobidos</a></div><div className="footer-note"><img src={BEE} alt=""/><p>Moda infantil escolhida com carinho para as famílias de Óbidos.</p></div></div><div className="container footer-bottom"><span>© 2026 ZanBee. Dados de produtos demonstrativos.</span><div className="flex items-center gap-4"><span>Roupas • Calçados • Acessórios</span><Link href="/admin" className="inline-flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity" title="Acesso do Administrador"><Lock size={10}/> <span>Lojista</span></Link></div></div></footer>
    <a className="floating-wa" href={WA} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><MessageCircle size={24}/><span>Fale com a ZanBee</span></a>
     {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="product-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}><X size={20}/></button><SafeImage src={selected.image} alt={selected.name}/><div className="modal-content"><span className="product-category">{selected.category}</span><h2>{selected.name}</h2><p>{selected.description}</p><strong className="modal-price">{money(selected.price)}</strong><div className="mb-4 flex flex-col gap-1 rounded-lg border border-[#eadbc7] bg-[#fffdf9] p-3 text-xs text-[#6d4b39]"><span className="font-semibold text-[#8b5b35]">Formas de Pagamento</span><span>Aceitamos: Pix, Cartão e espécie</span></div>{(selected.soldOut || (selected.stock ?? 0) <= 0) ? <div className="my-4 p-3 bg-[#fce5df] text-[#c53030] text-sm font-semibold rounded-lg text-center">Este produto está esgotado</div> : <><label>Tamanho<select defaultValue={selected.sizes[0]}><option>{selected.sizes.join("</option><option>")}</option></select></label><button className="btn-primary full" onClick={()=>{add(selected);setSelected(null)}}>Adicionar ao pedido <ShoppingBag size={17}/></button></>}<a className="btn-quiet full justify-center" href={WA} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Comprar pelo WhatsApp</a></div></div></div>}
    {cartOpen&&<div className="drawer-backdrop" onClick={()=>setCartOpen(false)}><aside className="cart-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-header"><div><span className="eyebrow">Seu pedido</span><h2>Lista de escolhas</h2></div><button className="icon-btn" onClick={()=>setCartOpen(false)}><X/></button></div>{cart.length===0?<div className="cart-empty"><ShoppingBag size={36}/><h3>Sua lista está vazia.</h3><p>Adicione peças para montar seu pedido.</p><button className="btn-primary" onClick={()=>{setCartOpen(false);scrollTo("produtos")}}>Explorar produtos</button></div>:<><div className="cart-items">{cart.map(item=><div className="cart-item" key={`${item.product.id}-${item.size}`}><SafeImage src={item.product.image} alt=""/><div className="cart-item-info"><h3>{item.product.name}</h3><span>Tamanho {item.size}</span><strong>{money(item.product.price*item.qty)}</strong><div className="qty"><button onClick={()=>setCart(prev=>prev.map(i=>i===item?{...i,qty:Math.max(1,i.qty-1)}:i))}><Minus size={13}/></button><span>{item.qty}</span><button onClick={()=>setCart(prev=>prev.map(i=>i===item?{...i,qty:i.qty+1}:i))}><Plus size={13}/></button><button className="remove" onClick={()=>setCart(prev=>prev.filter(i=>i!==item))}><Trash2 size={14}/></button></div></div></div>)}</div><div className="cart-summary"><div><span>Total estimado</span><strong>{money(total)}</strong></div><div className="my-3 flex flex-col gap-1 rounded-lg border border-[#eadbc7] bg-[#fffdf9] p-3 text-xs text-[#6d4b39]"><span className="font-semibold text-[#8b5b35]">Formas de Pagamento</span><span>Aceitamos: Pix, Cartão e espécie</span></div><p>A disponibilidade e o tamanho serão confirmados pelo WhatsApp.</p><button className="btn-primary full" onClick={sendWhatsApp}>Enviar pedido pelo WhatsApp <MessageCircle size={17}/></button></div></>}</aside></div>}
  </div>;
}
