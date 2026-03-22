import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(0),
  wattage: text("wattage"),
  voltage: text("voltage"),
  lumens: text("lumens"),
  colorTemp: text("color_temp"),
  isBestSeller: boolean("is_best_seller").default(false),
  video: text("video"),
  colors: text("colors"), // JSON: [{name,hex,image?}]
  images: text("images"), // JSON: ["/uploads/a.jpg", ...]
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  city: text("city").notNull(),
  area: text("area").notNull(),
  street: text("street").notNull(),
  status: text("status").notNull().default('pending'), // pending, confirmed, shipped, delivered
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  discountType: text("discount_type").notNull(), // "percentage" or "fixed"
  discountValue: integer("discount_value").notNull(),
  productId: integer("product_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, status: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertOfferSchema = createInsertSchema(offers).omit({ id: true });

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Offer = typeof offers.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

// Complex request for checkout
export const checkoutSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  customerPhone: z.string().min(8, "رقم الهاتف مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  area: z.string().min(2, "المنطقة مطلوبة"),
  street: z.string().min(2, "الشارع مطلوب"),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1)
  })).min(1, "يجب إضافة منتجات للسلة")
});

export const updateProductSchema = insertProductSchema.partial();

export type CheckoutRequest = z.infer<typeof checkoutSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
