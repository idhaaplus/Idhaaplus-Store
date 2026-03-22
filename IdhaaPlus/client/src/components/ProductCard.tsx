import { Link } from "wouter";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@shared/schema";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden group hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col h-full">
      <Link href={`/product/${product.id}`}>
        <a className="block relative aspect-square overflow-hidden bg-secondary">
          {product.isBestSeller && (
            <div className="absolute top-4 start-4 z-10 bg-destructive text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" />
              الأكثر مبيعاً
            </div>
          )}
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </a>
      </Link>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-2">
          <Link href={`/product/${product.id}`}>
            <a className="text-lg font-bold text-foreground hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </a>
          </Link>
          <div className="flex flex-wrap gap-2 mt-2">
            {product.wattage && (
              <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-md font-medium">
                {product.wattage}
              </span>
            )}
            {product.colorTemp && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">
                {product.colorTemp}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="text-xl font-extrabold text-primary">
            {formatPrice(product.price)}
          </div>
          <button
            onClick={() => addToCart(product)}
            className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 active:translate-y-0"
            aria-label="أضف للسلة"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
