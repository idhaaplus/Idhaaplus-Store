import React, { createContext, useContext, useState, useEffect } from "react";
import type { Product, Offer } from "@shared/schema";

export type ProductColor = {
  name: string;
  hex: string;
  image?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  selectedColor?: ProductColor;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: ProductColor) => void;
  removeFromCart: (productId: number, colorName?: string) => void;
  updateQuantity: (productId: number, quantity: number, colorName?: string) => void;
  clearCart: () => void;
  total: number;
  originalTotal: number;
  bogoSavings: number;
  freeItemsMap: Record<string, number>;
  activeBogoOffers: Offer[];
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function computeBogoFreeItems(quantity: number, bogoType: string): number {
  if (bogoType === "bogo_1_1") return Math.floor(quantity / 2);
  if (bogoType === "bogo_2_1") return Math.floor(quantity / 3);
  return 0;
}

function cartKey(productId: number, colorName?: string) {
  return colorName ? `${productId}__${colorName}` : `${productId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    setIsMounted(true);
    fetch("/api/offers")
      .then((r) => r.json())
      .then((data: Offer[]) => setOffers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (product: Product, quantity = 1, selectedColor?: ProductColor) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor?.name === selectedColor?.name
      );
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id &&
          item.selectedColor?.name === selectedColor?.name
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number, colorName?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor?.name === colorName
          )
      )
    );
  };

  const updateQuantity = (productId: number, quantity: number, colorName?: string) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedColor?.name === colorName
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const now = new Date();
  const activeBogoOffers = offers.filter((o) => {
    return (
      o.isActive &&
      (o.discountType === "bogo_1_1" || o.discountType === "bogo_2_1") &&
      new Date(o.startDate) <= now &&
      new Date(o.endDate) >= now
    );
  });

  const freeItemsMap: Record<string, number> = {};
  let bogoSavings = 0;

  items.forEach((item) => {
    const key = cartKey(item.product.id, item.selectedColor?.name);
    const matchingOffer = activeBogoOffers.find(
      (o) => o.productId === item.product.id || o.productId === null
    );
    if (matchingOffer) {
      const freeCount = computeBogoFreeItems(item.quantity, matchingOffer.discountType);
      if (freeCount > 0) {
        freeItemsMap[key] = freeCount;
        bogoSavings += freeCount * item.product.price;
      }
    }
  });

  const originalTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const total = originalTotal - bogoSavings;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isMounted) return null;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
        originalTotal,
        bogoSavings,
        freeItemsMap,
        activeBogoOffers,
        itemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
