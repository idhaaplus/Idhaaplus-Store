import { Layout } from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { useCreateOrder } from "@/hooks/use-orders";
import { formatPrice } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkoutSchema, type CheckoutRequest } from "@shared/schema";
import { useLocation } from "wouter";
import { Loader2, ShieldCheck, MapPin, Gift } from "lucide-react";
import { useEffect } from "react";

export function Checkout() {
  const { items, total, originalTotal, bogoSavings, freeItemsMap, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();

  const form = useForm<CheckoutRequest>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      city: "",
      area: "",
      street: "",
      items: [],
    }
  });

  // Keep form items in sync with cart
  useEffect(() => {
    form.setValue("items", items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    })));
  }, [items, form]);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-bold mb-4">سلتك فارغة</h1>
          <p className="text-muted-foreground mb-8">قم بإضافة بعض المنتجات للسلة قبل إتمام الطلب.</p>
          <button 
            onClick={() => setLocation('/products')}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold inline-block"
          >
            تصفح المنتجات
          </button>
        </div>
      </Layout>
    );
  }

  const onSubmit = (data: CheckoutRequest) => {
    createOrder.mutate(data, {
      onSuccess: () => {
        clearCart();
        setLocation("/confirmation");
      },
    });
  };

  return (
    <Layout>
      <div className="bg-secondary/50 border-b border-border py-8 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold">إتمام الطلب</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Order Summary */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm sticky top-28">
              <h2 className="text-xl font-bold mb-6 pb-4 border-b border-border">ملخص الطلب</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                {items.map((item) => {
                  const key = item.selectedColor?.name
                    ? `${item.product.id}__${item.selectedColor.name}`
                    : `${item.product.id}`;
                  const freeCount = freeItemsMap[key] || 0;
                  const displayImg = item.selectedColor?.image || item.product.image;
                  return (
                  <div key={key} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border/50">
                      <img src={displayImg} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.product.name}</h4>
                      {item.selectedColor && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-3 h-3 rounded-full border border-border inline-block" style={{ backgroundColor: item.selectedColor.hex }} />
                          <span className="text-xs text-muted-foreground">{item.selectedColor.name}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">الكمية: {item.quantity}</p>
                      {freeCount > 0 && (
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-0.5">
                          <Gift className="w-3 h-3" /> {freeCount} قطعة مجانية
                        </p>
                      )}
                    </div>
                    <div className="font-bold text-sm">
                      {freeCount > 0 ? (
                        <div className="text-end">
                          <span className="line-through text-muted-foreground text-xs block">{formatPrice(item.product.price * item.quantity)}</span>
                          <span>{formatPrice(item.product.price * (item.quantity - freeCount))}</span>
                        </div>
                      ) : (
                        formatPrice(item.product.price * item.quantity)
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>المجموع الفرعي</span>
                  <span>{formatPrice(originalTotal)}</span>
                </div>
                {bogoSavings > 0 && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span className="flex items-center gap-1"><Gift className="w-4 h-4" /> خصم عروض الهدية</span>
                    <span>− {formatPrice(bogoSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>التوصيل</span>
                  <span className="text-green-600 font-bold">مجاناً</span>
                </div>
                <div className="flex justify-between text-xl font-extrabold pt-4 border-t border-border">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-8 bg-green-50 text-green-800 p-4 rounded-xl flex items-center gap-3 border border-green-200">
                <ShieldCheck className="w-6 h-6 shrink-0" />
                <p className="text-sm font-medium">الدفع عند الاستلام متاح. سيتم تحصيل المبلغ نقداً عند تسليم الطلب.</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <form onSubmit={form.handleSubmit(onSubmit)} className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                معلومات التوصيل
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">الاسم الكامل</label>
                    <input
                      {...form.register("customerName")}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${form.formState.errors.customerName ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"}`}
                      placeholder="أدخل اسمك الكامل"
                    />
                    {form.formState.errors.customerName && (
                      <p className="text-destructive text-sm font-medium">{form.formState.errors.customerName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">رقم الهاتف</label>
                    <input
                      {...form.register("customerPhone")}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-background text-start focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${form.formState.errors.customerPhone ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"}`}
                      placeholder="2X XXX XXX"
                      dir="ltr"
                    />
                    {form.formState.errors.customerPhone && (
                      <p className="text-destructive text-sm font-medium">{form.formState.errors.customerPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">المدينة</label>
                    <input
                      {...form.register("city")}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${form.formState.errors.city ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"}`}
                      placeholder="تونس، سوسة، صفاقس..."
                    />
                    {form.formState.errors.city && (
                      <p className="text-destructive text-sm font-medium">{form.formState.errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">المنطقة / الحي</label>
                    <input
                      {...form.register("area")}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${form.formState.errors.area ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"}`}
                      placeholder="اسم الحي"
                    />
                    {form.formState.errors.area && (
                      <p className="text-destructive text-sm font-medium">{form.formState.errors.area.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">اسم الشارع ومعلومات إضافية</label>
                  <textarea
                    {...form.register("street")}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${form.formState.errors.street ? "border-destructive focus:border-destructive" : "border-border focus:border-primary"}`}
                    placeholder="رقم المبنى، الشارع، أي علامة مميزة..."
                  />
                  {form.formState.errors.street && (
                    <p className="text-destructive text-sm font-medium">{form.formState.errors.street.message}</p>
                  )}
                </div>

                {createOrder.isError && (
                  <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-bold">
                    حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createOrder.isPending}
                  className="w-full mt-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-xl hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {createOrder.isPending ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> جاري إرسال الطلب...</>
                  ) : (
                    "تأكيد الطلب والدفع عند الاستلام"
                  )}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}
