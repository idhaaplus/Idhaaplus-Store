import { Layout } from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/utils";
import { Tag, Plus, Edit2, Trash2, X, Clock, CheckCircle2, AlertCircle, Gift } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Offer, InsertOffer } from "@shared/schema";

const DISCOUNT_TYPES = [
  { value: "percentage", label: "نسبة مئوية (%)" },
  { value: "fixed", label: "مبلغ ثابت (TND)" },
  { value: "bogo_1_1", label: "اشترِ قطعة واحصل على الثانية مجانًا (1+1)" },
  { value: "bogo_2_1", label: "اشترِ قطعتين واحصل على الثالثة مجانًا (2+1)" },
];

function getDiscountLabel(offer: Offer) {
  if (offer.discountType === "bogo_1_1") return "1 + 1 مجاناً";
  if (offer.discountType === "bogo_2_1") return "2 + 1 مجاناً";
  if (offer.discountType === "percentage") return `${offer.discountValue}%`;
  return formatPrice(offer.discountValue);
}

export function AdminOffers() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [selectedType, setSelectedType] = useState<string>("percentage");

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: [api.offers.list.path],
  });

  const { data: products } = useQuery<{ id: number; name: string }[]>({
    queryKey: [api.products.list.path],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.offers.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.offers.list.path] });
      toast({ title: "تم حذف العرض بنجاح" });
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: InsertOffer) => {
      if (editingOffer) {
        const res = await apiRequest("PATCH", buildUrl(api.offers.update.path, { id: editingOffer.id }), data);
        return res.json();
      } else {
        const res = await apiRequest("POST", api.offers.create.path, data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.offers.list.path] });
      setIsFormOpen(false);
      setEditingOffer(null);
      toast({ title: editingOffer ? "تم تحديث العرض" : "تم إضافة العرض بنجاح" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const discountType = formData.get("discountType") as string;
    const isBogo = discountType === "bogo_1_1" || discountType === "bogo_2_1";

    const data: InsertOffer = {
      title: formData.get("title") as string,
      discountType: discountType as InsertOffer["discountType"],
      discountValue: isBogo ? 0 : parseInt(formData.get("discountValue") as string || "0"),
      productId: formData.get("productId") ? parseInt(formData.get("productId") as string) : null,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      isActive: formData.get("isActive") === "on",
    };

    upsertMutation.mutate(data);
  };

  const openForm = (offer: Offer | null) => {
    setEditingOffer(offer);
    setSelectedType(offer?.discountType ?? "percentage");
    setIsFormOpen(true);
  };

  const getStatus = (offer: Offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (!offer.isActive) return { label: "متوقف", color: "bg-gray-100 text-gray-600", icon: X };
    if (now < start) return { label: "مجدول", color: "bg-blue-100 text-blue-600", icon: Clock };
    if (now > end) return { label: "منتهي", color: "bg-red-100 text-red-600", icon: AlertCircle };
    return { label: "نشط", color: "bg-green-100 text-green-600", icon: CheckCircle2 };
  };

  const isBogo = selectedType === "bogo_1_1" || selectedType === "bogo_2_1";

  return (
    <Layout>
      <div className="bg-foreground text-background py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-extrabold">إدارة العروض</h1>
            </div>
            <button
              onClick={() => openForm(null)}
              className="flex items-center gap-2 bg-primary text-foreground px-6 py-3 rounded-xl font-bold hover-elevate shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> إضافة عرض جديد
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-secondary/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold">العرض</th>
                  <th className="px-6 py-4 font-bold">الخصم</th>
                  <th className="px-6 py-4 font-bold">الفترة</th>
                  <th className="px-6 py-4 font-bold">الحالة</th>
                  <th className="px-6 py-4 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center">جاري التحميل...</td></tr>
                ) : offers?.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">لا توجد عروض حالياً</td></tr>
                ) : (
                  offers?.map((offer) => {
                    const status = getStatus(offer);
                    const StatusIcon = status.icon;
                    const isBogOffer = offer.discountType === "bogo_1_1" || offer.discountType === "bogo_2_1";
                    return (
                      <tr key={offer.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isBogOffer && <Gift className="w-4 h-4 text-green-600 shrink-0" />}
                            <span className="font-bold text-lg">{offer.title}</span>
                          </div>
                          {offer.productId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              منتج: {products?.find(p => p.id === offer.productId)?.name ?? `#${offer.productId}`}
                            </div>
                          )}
                          {!offer.productId && <div className="text-xs text-muted-foreground mt-1">جميع المنتجات</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold text-lg ${isBogOffer ? "text-green-600" : "text-primary"}`}>
                            {getDiscountLabel(offer)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <div className="text-xs">من: {new Date(offer.startDate).toLocaleDateString('ar-TN')}</div>
                          <div className="text-xs">إلى: {new Date(offer.endDate).toLocaleDateString('ar-TN')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openForm(offer)}
                              className="p-2 bg-secondary rounded-lg hover:bg-primary transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm("حذف العرض؟")) deleteMutation.mutate(offer.id); }}
                              className="p-2 bg-secondary rounded-lg hover:bg-destructive hover:text-white transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
              <h3 className="text-xl font-bold">{editingOffer ? "تعديل عرض" : "إضافة عرض جديد"}</h3>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold">عنوان العرض</label>
                <input name="title" defaultValue={editingOffer?.title} required className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary" placeholder="مثلاً: عرض 1+1 على مصابيح LED" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">نوع العرض</label>
                <select
                  name="discountType"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary"
                >
                  {DISCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {isBogo && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <Gift className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-bold mb-1">
                      {selectedType === "bogo_1_1" ? "اشترِ قطعة واحصل على الثانية مجانًا" : "اشترِ قطعتين واحصل على الثالثة مجانًا"}
                    </p>
                    <p className="text-green-700">يُطبَّق هذا العرض تلقائياً عند إضافة الكمية المطلوبة إلى السلة.</p>
                  </div>
                </div>
              )}

              {!isBogo && (
                <div className="space-y-2">
                  <label className="text-sm font-bold">قيمة الخصم</label>
                  <input
                    name="discountValue"
                    type="number"
                    defaultValue={editingOffer?.discountValue}
                    required
                    className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary"
                    placeholder={selectedType === "percentage" ? "مثلاً: 20" : "مثلاً: 5000 (= 50.00 TND)"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold">تطبيق على منتج محدد <span className="text-muted-foreground font-normal">(اختياري)</span></label>
                <select name="productId" defaultValue={editingOffer?.productId ?? ""} className="w-full bg-background border border-border rounded-xl p-3 outline-none focus:border-primary">
                  <option value="">جميع المنتجات</option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">تاريخ البدء</label>
                  <input name="startDate" type="datetime-local" defaultValue={editingOffer?.startDate ? new Date(editingOffer.startDate).toISOString().slice(0, 16) : ""} required className="w-full bg-background border border-border rounded-xl p-3 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">تاريخ الانتهاء</label>
                  <input name="endDate" type="datetime-local" defaultValue={editingOffer?.endDate ? new Date(editingOffer.endDate).toISOString().slice(0, 16) : ""} required className="w-full bg-background border border-border rounded-xl p-3 outline-none" />
                </div>
              </div>

              <div className="flex items-center gap-3 bg-secondary/30 p-4 rounded-xl">
                <input type="checkbox" name="isActive" id="isActive" defaultChecked={editingOffer?.isActive ?? true} className="w-5 h-5 accent-primary" />
                <label htmlFor="isActive" className="font-bold cursor-pointer">تفعيل العرض فوراً</label>
              </div>

              <button
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full bg-primary text-foreground font-bold py-4 rounded-2xl hover-elevate disabled:opacity-50"
              >
                {upsertMutation.isPending ? "جاري الحفظ..." : editingOffer ? "حفظ التعديلات" : "إضافة العرض"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
