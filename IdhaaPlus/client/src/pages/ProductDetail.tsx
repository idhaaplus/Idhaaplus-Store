import { Layout } from "@/components/Layout";
import { useProduct, useProducts } from "@/hooks/use-products";
import { useCart, type ProductColor } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { useParams, Link } from "wouter";
import { useState, useMemo } from "react";
import {
  ShoppingCart, ShieldCheck, Truck, Plus, Minus,
  PlayCircle, Gift, Palette, ChevronLeft, ChevronRight
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Offer } from "@shared/schema";

export function ProductDetail() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "0");
  const { data: product, isLoading } = useProduct(productId);
  const { data: allProducts } = useProducts();
  const { data: offers } = useQuery<Offer[]>({ queryKey: [api.offers.list.path] });
  const { addToCart } = useCart();

  const [quantity,       setQuantity]       = useState(1);
  const [selectedColor,  setSelectedColor]  = useState<ProductColor | undefined>(undefined);
  const [activeIndex,    setActiveIndex]    = useState(0);

  /* ── Gallery images ── */
  const galleryImages = useMemo(() => {
    if (!product) return [];
    let imgs: string[] = [];
    if (product.images) {
      try { imgs = JSON.parse(product.images); } catch {}
    }
    if (imgs.length === 0 && product.image) imgs = [product.image];
    return imgs;
  }, [product]);

  /* ── Active display image (color overrides gallery) ── */
  const displayImage = selectedColor?.image || galleryImages[activeIndex] || product?.image || "";

  /* ── Colors ── */
  const colors: ProductColor[] = useMemo(() => {
    if (!product?.colors) return [];
    try { return JSON.parse(product.colors); } catch { return []; }
  }, [product?.colors]);

  /* ── BOGO offer ── */
  const now = new Date();
  const activeBogoOffer = offers?.find(
    (o) =>
      o.isActive &&
      (o.discountType === "bogo_1_1" || o.discountType === "bogo_2_1") &&
      new Date(o.startDate) <= now &&
      new Date(o.endDate) >= now &&
      (o.productId === productId || o.productId === null)
  );

  /* ── Gallery navigation ── */
  const prevImage = () => setActiveIndex(i => (i - 1 + galleryImages.length) % galleryImages.length);
  const nextImage = () => setActiveIndex(i => (i + 1) % galleryImages.length);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-secondary rounded-3xl" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-16 bg-secondary rounded-xl" />)}
              </div>
            </div>
            <div className="space-y-6 pt-8">
              <div className="h-10 bg-secondary w-3/4 rounded-lg" />
              <div className="h-6 bg-secondary w-1/4 rounded-lg" />
              <div className="h-32 bg-secondary rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-bold mb-4">المنتج غير موجود</h1>
          <Link href="/products"><a className="text-primary hover:underline">العودة للتسوق</a></Link>
        </div>
      </Layout>
    );
  }

  const relatedProducts = allProducts
    ?.filter(p => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4) || [];

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="bg-secondary/30 border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-muted-foreground flex gap-2 items-center flex-wrap">
          <Link href="/"><a className="hover:text-foreground">الرئيسية</a></Link>
          <span>/</span>
          <Link href="/products"><a className="hover:text-foreground">المنتجات</a></Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">

          {/* ── Left: Image Gallery ── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white border border-border shadow-sm group">
              <img
                key={displayImage}
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Gallery arrows (only when multiple images and no color override) */}
              {galleryImages.length > 1 && !selectedColor?.image && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute start-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    aria-label="الصورة السابقة"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute end-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                    aria-label="الصورة التالية"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {galleryImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`rounded-full transition-all duration-200 ${
                          i === activeIndex
                            ? "bg-primary w-5 h-2"
                            : "bg-white/70 w-2 h-2 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Selected color badge */}
              {selectedColor && (
                <div className="absolute bottom-3 start-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm">
                  <span className="w-3.5 h-3.5 rounded-full border border-border/50 inline-block" style={{ backgroundColor: selectedColor.hex }} />
                  <span className="text-xs font-bold text-foreground">{selectedColor.name}</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {galleryImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveIndex(i); setSelectedColor(undefined); }}
                    className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      !selectedColor?.image && activeIndex === i
                        ? "border-primary shadow-md scale-105"
                        : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={src} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Color variant thumbnails (when colors have images) */}
            {colors.some(c => c.image) && (
              <div className="flex gap-2 flex-wrap">
                {colors.filter(c => c.image).map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name === selectedColor?.name ? undefined : color)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedColor?.name === color.name
                        ? "border-primary shadow-md scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                    title={color.name}
                  >
                    <img src={color.image!} alt={color.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Video */}
            {product.video && (
              <div className="rounded-2xl overflow-hidden border border-border bg-black shadow-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/60 border-b border-border">
                  <PlayCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold">فيديو المنتج</span>
                </div>
                {product.video.includes('youtube.com') || product.video.includes('youtu.be') || product.video.includes('/embed/') ? (
                  <iframe src={product.video} className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                ) : (
                  <video src={product.video} controls className="w-full aspect-video object-contain" preload="metadata" />
                )}
              </div>
            )}
          </div>

          {/* ── Right: Details ── */}
          <div className="flex flex-col pt-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.isBestSeller && (
                <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                  الأكثر مبيعاً
                </span>
              )}
              {activeBogoOffer && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-bold border border-green-200">
                  <Gift className="w-4 h-4" />
                  {activeBogoOffer.discountType === "bogo_1_1"
                    ? "اشترِ قطعة واحصل على الثانية مجاناً"
                    : "اشترِ قطعتين واحصل على الثالثة مجاناً"}
                </span>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-4">{product.name}</h1>
            <div className="text-3xl font-extrabold text-primary mb-6">{formatPrice(product.price)}</div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">{product.description}</p>

            {/* Color Picker */}
            {colors.length > 0 && (
              <div className="mb-8 p-5 bg-secondary/40 rounded-2xl border border-border/60">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">اختر اللون</span>
                  {selectedColor && (
                    <span className="text-sm text-muted-foreground">— {selectedColor.name}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name === selectedColor?.name ? undefined : color)}
                      title={color.name}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={`w-10 h-10 rounded-full border-4 shadow-sm transition-all duration-200 block ${
                          selectedColor?.name === color.name
                            ? "border-primary scale-110 shadow-md"
                            : "border-white hover:border-primary/40 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className={`text-xs font-medium transition-colors ${selectedColor?.name === color.name ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
                {colors.length > 0 && !selectedColor && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">يرجى اختيار لون قبل الإضافة للسلة</p>
                )}
              </div>
            )}

            {/* Technical Specs */}
            {(product.wattage || product.colorTemp || product.lumens || product.voltage) && (
              <div className="grid grid-cols-2 gap-4 mb-10 p-6 bg-secondary/50 rounded-2xl border border-border/50">
                {product.wattage && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">القدرة (واط)</span>
                    <span className="font-bold">{product.wattage}</span>
                  </div>
                )}
                {product.colorTemp && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">لون الإضاءة</span>
                    <span className="font-bold">{product.colorTemp}</span>
                  </div>
                )}
                {product.lumens && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">شدة الإضاءة (لومن)</span>
                    <span className="font-bold">{product.lumens}</span>
                  </div>
                )}
                {product.voltage && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">الجهد الكهربائي</span>
                    <span className="font-bold">{product.voltage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-secondary rounded-xl border border-border h-14">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-10 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity, selectedColor)}
                  disabled={colors.length > 0 && !selectedColor}
                  className="flex-1 h-14 bg-primary text-primary-foreground font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <ShoppingCart className="w-6 h-6" />
                  أضف إلى السلة
                </button>
              </div>

              <div className="flex items-center gap-6 py-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  ضمان سنتين
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Truck className="w-5 h-5 text-primary" />
                  الدفع عند الاستلام
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-secondary/30 py-20 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">منتجات مشابهة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
