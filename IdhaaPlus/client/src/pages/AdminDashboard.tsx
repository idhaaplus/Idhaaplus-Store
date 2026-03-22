import { Layout } from "@/components/Layout";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { formatPrice } from "@/lib/utils";
import {
  Settings, Package, Truck, CheckCircle2, Clock,
  Plus, Edit2, Trash2, X, Tag, Video, Link2, Palette, Images
} from "lucide-react";
import { useState, useRef } from "react";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type AdminColor = { name: string; hex: string; image: string };

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending:          { label: "قيد الانتظار",    icon: Clock,        color: "text-amber-500 bg-amber-50" },
  confirmed:        { label: "مؤكد",            icon: CheckCircle2, color: "text-blue-500 bg-blue-50" },
  preparing:        { label: "جاري التجهيز",    icon: Clock,        color: "text-indigo-500 bg-indigo-50" },
  out_for_delivery: { label: "خارج للتوصيل",    icon: Truck,        color: "text-purple-500 bg-purple-50" },
  delivered:        { label: "تم التسليم",       icon: Package,      color: "text-green-600 bg-green-50" },
  paid:             { label: "تم الدفع",         icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
};

export function AdminDashboard() {
  const { data: orders,   isLoading: ordersLoading }   = useOrders();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();

  const [activeTab,       setActiveTab]       = useState<"orders" | "products">("orders");
  const [editingProduct,  setEditingProduct]  = useState<any>(null);
  const [isFormOpen,      setIsFormOpen]      = useState(false);
  const [videoInputMode,  setVideoInputMode]  = useState<"upload" | "url">("upload");
  const [videoPreview,    setVideoPreview]    = useState<string | null>(null);
  const [productColors,   setProductColors]   = useState<AdminColor[]>([]);

  // ─── Multi-image state ────────────────────────────────────────────────────
  const [existingImages,  setExistingImages]  = useState<string[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewFilePreviews(prev => [...prev, ...previews]);
    // Reset input so same file can be re-added if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingImage = (idx: number) =>
    setExistingImages(prev => prev.filter((_, i) => i !== idx));

  const removeNewFile = (idx: number) =>
    setNewFilePreviews(prev => prev.filter((_, i) => i !== idx));

  // ─── Colors helpers ───────────────────────────────────────────────────────
  const addColor    = () => setProductColors(prev => [...prev, { name: "", hex: "#000000", image: "" }]);
  const removeColor = (idx: number) => setProductColors(prev => prev.filter((_, i) => i !== idx));
  const updateColor = (idx: number, field: keyof AdminColor, value: string) =>
    setProductColors(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  // ─── Video ────────────────────────────────────────────────────────────────
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoPreview(URL.createObjectURL(file));
  };

  // ─── Open form ────────────────────────────────────────────────────────────
  const openForm = (product: any | null) => {
    setEditingProduct(product);
    setIsFormOpen(true);
    setVideoPreview(null);
    setVideoInputMode(product?.video && !product.video.startsWith('/uploads') ? "url" : "upload");
    setProductColors(product?.colors ? (() => { try { return JSON.parse(product.colors); } catch { return []; } })() : []);

    // Load existing images
    let imgs: string[] = [];
    if (product?.images) {
      try { imgs = JSON.parse(product.images); } catch {}
    } else if (product?.image) {
      imgs = [product.image];
    }
    setExistingImages(imgs);
    setNewFilePreviews([]);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleProductSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const priceRaw = formData.get("price") as string;
    formData.set("price", Math.round(parseFloat(priceRaw) * 100).toString());
    formData.set("isBestSeller", (editingProduct?.isBestSeller ?? false).toString());

    const validColors = productColors.filter(c => c.name.trim());
    formData.set("colors", validColors.length > 0 ? JSON.stringify(validColors) : "");

    // Send existing images list so backend can merge
    formData.set("existingImages", JSON.stringify(existingImages));

    // Remove old single image field — backend derives image from images array
    formData.delete("imageFile");

    // Append new files under 'imageFiles'
    newFilePreviews.forEach(({ file }) => formData.append("imageFiles", file));

    if (existingImages.length === 0 && newFilePreviews.length === 0) {
      toast({ title: "يرجى رفع صورة واحدة على الأقل", variant: "destructive" });
      return;
    }

    try {
      const url    = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";
      const res    = await fetch(url, { method, body: formData });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
        setIsFormOpen(false);
        setEditingProduct(null);
        setExistingImages([]);
        setNewFilePreviews([]);
        setVideoPreview(null);
        setProductColors([]);
        toast({ title: editingProduct ? "تم التعديل بنجاح" : "تم الإضافة بنجاح" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: err.message || "حدث خطأ", variant: "destructive" });
      }
    } catch {
      toast({ title: "حدث خطأ في الاتصال", variant: "destructive" });
    }
  };

  // ─── Delete product ───────────────────────────────────────────────────────
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("حذف المنتج؟")) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "تم الحذف بنجاح" });
    } catch {
      toast({ title: "حدث خطأ", variant: "destructive" });
    }
  };

  const allImagePreviews = [
    ...existingImages.map(src => ({ src, isExisting: true, idx: existingImages.indexOf(src) })),
    ...newFilePreviews.map((f, i) => ({ src: f.preview, isExisting: false, idx: i })),
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* Header */}
      <div className="bg-foreground text-background py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-extrabold">لوحة التحكم</h1>
            </div>
            <div className="flex bg-white/10 p-1 rounded-xl gap-1">
              <button onClick={() => setActiveTab("orders")}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "orders" ? "bg-primary text-foreground" : "text-white hover:bg-white/5"}`}>
                الطلبات
              </button>
              <button onClick={() => setActiveTab("products")}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === "products" ? "bg-primary text-foreground" : "text-white hover:bg-white/5"}`}>
                المنتجات
              </button>
              <Link href="/admin/offers">
                <a className="px-6 py-2 rounded-lg font-bold text-white hover:bg-white/5 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> العروض
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Orders tab ── */}
        {activeTab === "orders" ? (
          <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold">رقم الطلب</th>
                    <th className="px-6 py-4 font-bold">العميل</th>
                    <th className="px-6 py-4 font-bold">التاريخ</th>
                    <th className="px-6 py-4 font-bold">الإجمالي</th>
                    <th className="px-6 py-4 font-bold">الحالة</th>
                    <th className="px-6 py-4 font-bold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ordersLoading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center">جاري التحميل...</td></tr>
                  ) : orders?.map((order) => {
                    const statusInfo = statusMap[order.status] || statusMap.pending;
                    const StatusIcon = statusInfo.icon;
                    return (
                      <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-bold">#{order.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(order.createdAt!).toLocaleDateString('ar-TN')}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-primary">{formatPrice(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select value={order.status}
                            onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                            className="bg-background border border-border text-xs rounded-lg p-2 outline-none">
                            {Object.entries(statusMap).map(([val, info]) => (
                              <option key={val} value={val}>{info.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          /* ── Products tab ── */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">إدارة المنتجات ({products?.length || 0})</h2>
              <button onClick={() => openForm(null)}
                className="flex items-center gap-2 bg-primary text-foreground px-4 py-2 rounded-xl font-bold hover-elevate">
                <Plus className="w-5 h-5" /> إضافة منتج جديد
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map(product => {
                let parsedColors: AdminColor[] = [];
                try { if (product.colors) parsedColors = JSON.parse(product.colors); } catch {}
                let imgs: string[] = [];
                try { if (product.images) imgs = JSON.parse(product.images); } catch {}
                const thumbs = imgs.length > 0 ? imgs : [product.image];
                return (
                  <div key={product.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
                    <div className="relative shrink-0">
                      <img src={thumbs[0]} className="w-20 h-20 object-cover rounded-xl" />
                      {thumbs.length > 1 && (
                        <span className="absolute -bottom-1 -end-1 bg-primary text-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {thumbs.length}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate">{product.name}</h3>
                      <p className="text-primary font-bold">{formatPrice(product.price)}</p>
                      <p className="text-xs text-muted-foreground mt-1">المخزون: {product.stock}</p>
                      {parsedColors.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {parsedColors.map(c => (
                            <span key={c.name} title={c.name}
                              className="w-4 h-4 rounded-full border border-border inline-block"
                              style={{ backgroundColor: c.hex }} />
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => openForm(product)}
                          className="p-2 bg-secondary rounded-lg hover:bg-primary transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-secondary rounded-lg hover:bg-destructive hover:text-white transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Product Form Modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30 sticky top-0 z-10">
              <h3 className="text-xl font-bold">{editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 grid grid-cols-2 gap-5">
              {/* Name */}
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">اسم المنتج</label>
                <input name="name" defaultValue={editingProduct?.name} required
                  className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary" />
              </div>

              {/* Price + Stock */}
              <div>
                <label className="block text-sm font-bold mb-1">السعر (TND)</label>
                <input name="price" type="number" step="0.001"
                  defaultValue={editingProduct ? editingProduct.price / 100 : ""} required
                  className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">المخزون</label>
                <input name="stock" type="number" defaultValue={editingProduct?.stock ?? 0} required
                  className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary" />
              </div>

              {/* Category */}
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">التصنيف</label>
                <select name="categoryId" defaultValue={editingProduct?.categoryId} required
                  className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary">
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">الوصف</label>
                <textarea name="description" defaultValue={editingProduct?.description} required
                  className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary h-24 resize-none" />
              </div>

              {/* ── Multi-Image Upload ── */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-primary" />
                    <label className="text-sm font-bold">
                      صور المنتج
                      <span className="text-muted-foreground font-normal"> ({allImagePreviews.length} صورة)</span>
                    </label>
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/40 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> إضافة صور
                  </button>
                </div>

                {/* Hidden multi-file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="hidden"
                />

                {allImagePreviews.length === 0 ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors group">
                    <Images className="w-10 h-10 mx-auto mb-2 opacity-40 group-hover:opacity-70 transition-opacity" />
                    <p className="text-sm font-medium">اضغط لرفع صور المنتج</p>
                    <p className="text-xs mt-1 opacity-70">يمكن رفع أكثر من صورة في آنٍ واحد</p>
                  </button>
                ) : (
                  <div>
                    {/* Primary image indicator */}
                    {allImagePreviews.length > 0 && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">الصورة الأولى هي الصورة الرئيسية للمنتج</span>
                      </div>
                    )}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {allImagePreviews.map((img, i) => (
                        <div key={i} className={`relative rounded-xl overflow-hidden border-2 group ${i === 0 ? "border-primary" : "border-border"}`}>
                          <img src={img.src} alt="" className="w-full aspect-square object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1 start-1 bg-primary text-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">رئيسية</span>
                          )}
                          <button
                            type="button"
                            onClick={() => img.isExisting ? removeExistingImage(img.idx) : removeNewFile(img.idx)}
                            className="absolute top-1 end-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {/* Add more button inside grid */}
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Colors ── */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <label className="text-sm font-bold">ألوان المنتج <span className="text-muted-foreground font-normal">(اختياري)</span></label>
                  </div>
                  <button type="button" onClick={addColor}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary border border-primary/40 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> إضافة لون
                  </button>
                </div>
                {productColors.length === 0 ? (
                  <p className="text-xs text-muted-foreground bg-secondary/40 rounded-xl p-3 text-center">
                    لا توجد ألوان. اضغط "إضافة لون" لإضافة خيارات لون.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {productColors.map((color, idx) => (
                      <div key={idx} className="flex gap-3 items-start bg-secondary/30 p-3 rounded-xl border border-border/50">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <input type="color" value={color.hex}
                            onChange={e => updateColor(idx, "hex", e.target.value)}
                            className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-background" />
                          <span className="text-[10px] text-muted-foreground font-mono">{color.hex}</span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <input type="text" placeholder="اسم اللون بالعربية (مثلاً: أبيض)"
                            value={color.name} onChange={e => updateColor(idx, "name", e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm outline-none focus:border-primary" />
                          <input type="url" placeholder="رابط صورة هذا اللون (اختياري)"
                            value={color.image} onChange={e => updateColor(idx, "image", e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <button type="button" onClick={() => removeColor(idx)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Video ── */}
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-2">
                  فيديو المنتج <span className="text-muted-foreground font-normal">(اختياري)</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setVideoInputMode("upload")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${videoInputMode === "upload" ? "bg-primary text-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary"}`}>
                    <Video className="w-4 h-4" /> رفع فيديو
                  </button>
                  <button type="button" onClick={() => setVideoInputMode("url")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${videoInputMode === "url" ? "bg-primary text-foreground border-primary" : "bg-background border-border text-muted-foreground hover:border-primary"}`}>
                    <Link2 className="w-4 h-4" /> رابط فيديو
                  </button>
                </div>
                {videoInputMode === "upload" ? (
                  <div>
                    <input name="videoFile" type="file" accept="video/*" onChange={handleVideoFileChange}
                      className="w-full text-sm text-muted-foreground file:me-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-foreground hover:file:bg-primary/90 cursor-pointer" />
                    {(videoPreview || editingProduct?.video?.startsWith('/uploads')) && (
                      <video src={videoPreview || editingProduct.video} controls
                        className="mt-3 w-full max-h-40 rounded-xl border border-border object-cover" />
                    )}
                  </div>
                ) : (
                  <div>
                    <input name="videoUrl" type="url"
                      placeholder="https://www.youtube.com/embed/... أو رابط فيديو مباشر"
                      defaultValue={editingProduct?.video && !editingProduct.video.startsWith('/uploads') ? editingProduct.video : ""}
                      className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary text-sm" />
                    <p className="text-xs text-muted-foreground mt-1">أدخل رابط YouTube Embed أو فيديو مباشر (mp4)</p>
                  </div>
                )}
              </div>

              {/* ── Technical specs ── */}
              <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-border pt-4 mt-2">
                <h4 className="col-span-2 font-bold text-sm text-primary">المواصفات الفنية</h4>
                <input name="wattage"   placeholder="الواط (مثلاً: 18W)"    defaultValue={editingProduct?.wattage}    className="bg-background border border-border rounded-xl p-3 outline-none" />
                <input name="voltage"   placeholder="الجهد (مثلاً: 220V)"   defaultValue={editingProduct?.voltage}    className="bg-background border border-border rounded-xl p-3 outline-none" />
                <input name="lumens"    placeholder="اللومن (مثلاً: 1800lm)" defaultValue={editingProduct?.lumens}    className="bg-background border border-border rounded-xl p-3 outline-none" />
                <input name="colorTemp" placeholder="حرارة اللون (مثلاً: 6500K)" defaultValue={editingProduct?.colorTemp} className="bg-background border border-border rounded-xl p-3 outline-none" />
              </div>

              {/* Submit */}
              <div className="col-span-2 mt-4">
                <button type="submit" className="w-full bg-primary text-foreground font-bold py-4 rounded-2xl hover-elevate">
                  {editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
