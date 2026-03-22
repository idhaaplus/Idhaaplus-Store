import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useState } from "react";
import { Filter, Search } from "lucide-react";

export function ProductsList() {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();

  const filteredProducts = products?.filter(p => {
    const matchesCategory = activeCategory === "" || p.categoryId.toString() === activeCategory || (activeCategory === 'best-seller' && p.isBestSeller);
    const matchesSearch = search === "" || p.name.includes(search) || p.description.includes(search);
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="bg-secondary/50 border-b border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4">جميع المنتجات</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            تصفح تشكيلتنا الواسعة من خيارات الإضاءة المتنوعة التي تناسب جميع أذواقك واحتياجاتك.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-8">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 font-bold text-lg mb-6 pb-4 border-b border-border">
                <Filter className="w-5 h-5" />
                تصفية النتائج
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-muted-foreground">البحث</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن منتج..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-muted-foreground">الأقسام</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveCategory("")}
                      className={`w-full text-start px-3 py-2 rounded-lg transition-colors ${activeCategory === "" ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary text-foreground"}`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setActiveCategory("best-seller")}
                      className={`w-full text-start px-3 py-2 rounded-lg transition-colors ${activeCategory === "best-seller" ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary text-foreground"}`}
                    >
                      الأكثر مبيعاً
                    </button>
                    {categories?.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id.toString())}
                        className={`w-full text-start px-3 py-2 rounded-lg transition-colors ${activeCategory === cat.id.toString() ? "bg-primary/10 text-primary font-bold" : "hover:bg-secondary text-foreground"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-secondary rounded-2xl h-80"></div>
                ))}
              </div>
            ) : filteredProducts?.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">لم يتم العثور على منتجات</h3>
                <p className="text-muted-foreground">جرب تغيير كلمات البحث أو الفلاتر المستخدمة.</p>
                <button 
                  onClick={() => {setSearch(""); setActiveCategory("");}}
                  className="mt-6 text-primary font-bold hover:underline"
                >
                  مسح جميع الفلاتر
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
