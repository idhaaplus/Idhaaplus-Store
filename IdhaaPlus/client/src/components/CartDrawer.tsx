import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { X, Plus, Minus, ShoppingBag, Gift } from "lucide-react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

function cartKey(productId: number, colorName?: string) {
  return colorName ? `${productId}__${colorName}` : `${productId}`;
}

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, total, originalTotal, bogoSavings, freeItemsMap } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 bottom-0 end-0 w-full max-w-md bg-background shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary" />
                سلة المشتريات
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-muted-foreground">
                  <ShoppingBag className="w-16 h-16 opacity-20" />
                  <p className="text-lg">السلة فارغة حالياً</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-primary font-bold hover:underline"
                  >
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const key = cartKey(item.product.id, item.selectedColor?.name);
                  const freeCount = freeItemsMap[key] || 0;
                  const paidCount = item.quantity - freeCount;
                  const displayImage = item.selectedColor?.image || item.product.image;

                  return (
                    <div key={key} className="flex gap-4 p-4 bg-secondary/50 rounded-2xl border border-border/50">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shrink-0 relative">
                        <img
                          src={displayImage}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                        {freeCount > 0 && (
                          <div className="absolute top-1 start-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Gift className="w-2.5 h-2.5" />
                            {freeCount} مجاناً
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold line-clamp-2">{item.product.name}</h3>
                            {item.selectedColor && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-border inline-block"
                                  style={{ backgroundColor: item.selectedColor.hex }}
                                />
                                <span className="text-xs text-muted-foreground">{item.selectedColor.name}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedColor?.name)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {freeCount > 0 && (
                          <div className="mt-1 text-xs bg-green-50 border border-green-200 text-green-700 rounded-lg px-2 py-1 flex items-center gap-1">
                            <Gift className="w-3 h-3 shrink-0" />
                            <span>{paidCount} مدفوعة + {freeCount} مجاناً</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div className="flex flex-col">
                            {freeCount > 0 ? (
                              <>
                                <span className="text-xs text-muted-foreground line-through">{formatPrice(item.product.price * item.quantity)}</span>
                                <span className="text-primary font-bold">{formatPrice(item.product.price * paidCount)}</span>
                              </>
                            ) : (
                              <span className="text-primary font-bold">{formatPrice(item.product.price)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 bg-white rounded-full px-3 py-1 border border-border">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.selectedColor?.name)}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-semibold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedColor?.name)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-background">
                {bogoSavings > 0 && (
                  <div className="flex items-center justify-between mb-3 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                    <span className="text-green-700 font-bold flex items-center gap-1">
                      <Gift className="w-4 h-4" /> وفّرت من العروض:
                    </span>
                    <span className="text-green-700 font-bold">{formatPrice(bogoSavings)}</span>
                  </div>
                )}
                {bogoSavings > 0 && (
                  <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                    <span>المجموع قبل الخصم:</span>
                    <span className="line-through">{formatPrice(originalTotal)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg text-muted-foreground">المجموع الكلي:</span>
                  <span className="text-2xl font-bold">{formatPrice(total)}</span>
                </div>
                <Link href="/checkout">
                  <a
                    onClick={() => setIsCartOpen(false)}
                    className="w-full flex items-center justify-center py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    إتمام الطلب
                  </a>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
