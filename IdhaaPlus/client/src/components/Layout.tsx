import { Link } from "wouter";
import { useCart } from "@/context/CartContext";
import { CartDrawer } from "./CartDrawer";
import { ShoppingBag, Search, Menu, Zap } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { itemCount, setIsCartOpen } = useCart();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Zap className="w-8 h-8 text-primary fill-primary" />
                <span>إضاءة <span className="text-primary">بلس</span></span>
              </a>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 ms-8 text-muted-foreground font-medium">
              <Link href="/"><a className="hover:text-primary transition-colors">الرئيسية</a></Link>
              <Link href="/products"><a className="hover:text-primary transition-colors">المنتجات</a></Link>
              <Link href="/products?category=best-seller"><a className="hover:text-primary transition-colors">الأكثر مبيعاً</a></Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors hidden sm:block">
              <Search className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-foreground hover:text-primary transition-colors relative"
            >
              <ShoppingBag className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute top-0 end-0 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background transform translate-x-1/4 -translate-y-1/4">
                  {itemCount}
                </span>
              )}
            </button>
            <button className="p-2 text-foreground hover:text-primary transition-colors md:hidden">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-secondary mt-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2 space-y-4">
              <Link href="/">
                <a className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Zap className="w-8 h-8 text-primary fill-primary" />
                  <span>إضاءة <span className="text-primary">بلس</span></span>
                </a>
              </Link>
              <p className="text-muted-foreground max-w-sm leading-relaxed text-balance">
                نقدم لك أفضل حلول الإضاءة العصرية والموفرة للطاقة لمنزلك ومكتبك. جودة عالية وضمان على جميع المنتجات.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-4">روابط سريعة</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="/products"><a className="hover:text-primary transition-colors">جميع المنتجات</a></Link></li>
                <li><Link href="/products?category=indoor"><a className="hover:text-primary transition-colors">إضاءة داخلية</a></Link></li>
                <li><Link href="/products?category=outdoor"><a className="hover:text-primary transition-colors">إضاءة خارجية</a></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-4">تواصل معنا</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>idhaaplus@zohomail.com</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} إضاءة بلس. جميع الحقوق محفوظة.</p>
            <div className="flex gap-4">
              <Link href="/admin"><a className="hover:text-foreground transition-colors">لوحة التحكم</a></Link>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
