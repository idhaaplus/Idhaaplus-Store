import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { OfferBanner } from "@/components/OfferBanner";
import { useProducts, useCategories } from "@/hooks/use-products";
import { useCategories as useCats } from "@/hooks/use-categories";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Link } from "wouter";
import { ArrowLeft, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import type { Offer } from "@shared/schema";

export function Home() {
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: categories } = useCats();
  const { data: offers } = useQuery<Offer[]>({
    queryKey: [api.offers.list.path],
  });

  const bestSellers = products?.filter((p) => p.isBestSeller).slice(0, 4) || [];
  const latestProducts = products?.slice(0, 8) || [];

  return (
    <Layout>
      {offers && offers.length > 0 && <OfferBanner offers={offers} />}
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-secondary min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          {/* landing page hero scenic interior lighting landscape */}
          <img 
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop" 
            alt="Modern lighting" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-transparent rtl:from-transparent rtl:via-secondary/90 rtl:to-secondary"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-2xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary-foreground font-bold mb-4 border border-primary/30">
                تشكيلة 2025 الجديدة 🌟
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-foreground">
                أضئ مساحتك <br/>
                <span className="text-primary">بأناقة وعصرية</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-6 leading-relaxed text-balance">
                اكتشف مجموعتنا الحصرية من الإضاءة الذكية والحديثة. تصميمات فريدة تضفي لمسة ساحرة على منزلك مع ضمان الجودة وتوفير الطاقة.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              <Link href="/products">
                <a className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  تسوق الآن
                </a>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: "توصيل سريع", desc: "توصيل لجميع مناطق تونس" },
              { icon: ShieldCheck, title: "ضمان الجودة", desc: "ضمان سنتين على جميع المنتجات" },
              { icon: CreditCard, title: "الدفع عند الاستلام", desc: "تسوق بثقة وادفع عند استلام طلبك" }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 p-6 rounded-2xl bg-secondary/50">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold mb-2">الأكثر مبيعاً</h2>
              <p className="text-muted-foreground">المنتجات المفضلة لدى عملائنا</p>
            </div>
            <Link href="/products?category=best-seller">
              <a className="hidden sm:flex items-center gap-2 text-primary font-bold hover:underline">
                عرض الكل <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              </a>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Banner */}
      <section className="py-10 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-foreground text-background rounded-3xl overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              {/* background texture for banner */}
              <img src="https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover" alt="" />
            </div>
            <div className="relative z-10 p-12 md:p-20 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-white">إضاءة ذكية تواكب العصر</h2>
              <p className="text-lg md:text-xl text-gray-300 mb-10">
                استكشف أحدث التقنيات في عالم الإضاءة، من اللمبات الذكية التي يمكن التحكم بها عبر الهاتف إلى الإضاءة الديكورية الفاخرة.
              </p>
              <Link href="/products">
                <a className="inline-block px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-yellow-400 transition-colors">
                  تصفح التشكيلة الكاملة
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Preview */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold mb-2">وصل حديثاً</h2>
            <p className="text-muted-foreground">أحدث إضافاتنا من الإضاءة العصرية</p>
          </div>
        </div>
        
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse bg-secondary rounded-2xl h-80"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
