import { categories, products, orders, orderItems, offers, type Category, type Product, type Order, type OrderItem, type Offer, type InsertCategory, type InsertProduct, type InsertOrder, type InsertOrderItem, type InsertOffer, type CheckoutRequest } from "@shared/schema";

export interface IStorage {
  getCategories(): Promise<Category[]>;
  getProducts(categoryId?: number, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  createOrder(checkout: CheckoutRequest): Promise<Order>;
  getOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Offers
  getOffers(): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOffer(id: number, offer: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private categories: Map<number, Category> = new Map();
  private products: Map<number, Product> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private offers: Map<number, Offer> = new Map();
  private categoryId = 1;
  private productId = 1;
  private orderId = 1;
  private orderItemId = 1;
  private offerId = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    const cats = [
      { name: "أنابيب إضاءة LED", slug: "led-tube-lights" },
      { name: "مصابيح الطاولة", slug: "table-lamps" },
      { name: "إضاءة السقف", slug: "ceiling-lights" },
      { name: "الإضاءة الخارجية", slug: "outdoor-lighting" },
      { name: "الملحقات الكهربائية", slug: "electrical-accessories" },
      { name: "المفاتيح والمقابس", slug: "switches-sockets" },
      { name: "الكابلات والأسلاك", slug: "cables-wiring" },
    ];
    cats.forEach(c => {
      this.categories.set(this.categoryId, { ...c, id: this.categoryId });
      this.categoryId++;
    });

    const prods = [
      { categoryId: 1, name: "Premium LED Tube 18W", description: "Energy saving LED tube light, 1.2m length. Perfect for homes and offices.", price: 2500, image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&q=80", stock: 100, wattage: "18W", voltage: "220V", lumens: "1800lm", colorTemp: "6500K", isBestSeller: true },
      { categoryId: 1, name: "Eco LED Tube 9W", description: "Affordable LED tube light for small rooms.", price: 1500, image: "https://images.unsplash.com/photo-1540932239986-30128078f3ea?w=500&q=80", stock: 200, wattage: "9W", voltage: "220V", lumens: "900lm", colorTemp: "4000K", isBestSeller: false },
      { categoryId: 2, name: "Modern Desk Lamp", description: "Adjustable desk lamp for reading and studying.", price: 4500, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80", stock: 50, wattage: "10W", voltage: "220V", lumens: "800lm", colorTemp: "4000K", isBestSeller: true },
      { categoryId: 3, name: "Crystal Ceiling Light", description: "Elegant crystal ceiling light for living rooms.", price: 12000, image: "https://images.unsplash.com/photo-1565814329452-e1efa11c5e8a?w=500&q=80", stock: 20, wattage: "40W", voltage: "220V", lumens: "4000lm", colorTemp: "3000K-6000K", isBestSeller: false },
      { categoryId: 6, name: "Smart Touch Switch", description: "Modern glass touch switch, 2 gang.", price: 3500, image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=500&q=80", stock: 150, wattage: "Max 1000W", voltage: "110-240V", lumens: null, colorTemp: null, isBestSeller: true },
    ];
    prods.forEach(p => {
      this.products.set(this.productId, { ...p, id: this.productId });
      this.productId++;
    });
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getProducts(categoryId?: number, search?: string): Promise<Product[]> {
    let prods = Array.from(this.products.values());
    if (categoryId) {
      prods = prods.filter(p => p.categoryId === categoryId);
    }
    if (search) {
      const s = search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
    }
    return prods;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, update: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...update };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async createOrder(checkout: CheckoutRequest): Promise<Order> {
    let total = 0;
    const items: OrderItem[] = [];
    
    for (const item of checkout.items) {
      const product = this.products.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      const price = product.price * item.quantity;
      total += price;
      
      items.push({
        id: this.orderItemId++,
        orderId: this.orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      });
      
      this.products.set(product.id, { ...product, stock: product.stock - item.quantity });
    }

    const order: Order = {
      id: this.orderId++,
      customerName: checkout.customerName,
      customerPhone: checkout.customerPhone,
      city: checkout.city,
      area: checkout.area,
      street: checkout.street,
      status: "pending",
      total,
      createdAt: new Date()
    };

    this.orders.set(order.id, order);
    items.forEach(i => this.orderItems.set(i.id, i));
    
    return order;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  // Offers
  async getOffers(): Promise<Offer[]> {
    return Array.from(this.offers.values());
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = this.offerId++;
    const offer: Offer = { ...insertOffer, id };
    this.offers.set(id, offer);
    return offer;
  }

  async updateOffer(id: number, update: Partial<InsertOffer>): Promise<Offer | undefined> {
    const existing = this.offers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...update };
    this.offers.set(id, updated);
    return updated;
  }

  async deleteOffer(id: number): Promise<boolean> {
    return this.offers.delete(id);
  }
}

export const storage = new MemStorage();
