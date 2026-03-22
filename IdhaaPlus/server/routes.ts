import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (supports videos)
  fileFilter: (req, file, cb) => {
    const allowedImages = /jpeg|jpg|png|webp/;
    const allowedVideos = /mp4|webm|mov|avi/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const isImage = allowedImages.test(ext) && file.mimetype.startsWith('image/');
    const isVideo = allowedVideos.test(ext) && file.mimetype.startsWith('video/');
    if (isImage || isVideo) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpg, png, webp) and videos (mp4, webm, mov) are allowed"));
  },
});

const uploadFields = upload.fields([
  { name: 'imageFiles', maxCount: 20 },
  { name: 'videoFile', maxCount: 1 },
]);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.products.list.path, async (req, res) => {
    try {
      const categoryId = req.query.category ? parseInt(req.query.category as string) : undefined;
      const search = req.query.search as string | undefined;
      const products = await storage.getProducts(categoryId, search);
      res.json(products);
    } catch (e) {
      res.status(400).json({ message: "Invalid parameters" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(parseInt(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.post(api.products.create.path, uploadFields, async (req, res) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      const body = { ...req.body };

      if (body.price) body.price = parseInt(body.price);
      if (body.stock) body.stock = parseInt(body.stock);
      if (body.categoryId) body.categoryId = parseInt(body.categoryId);
      if (body.isBestSeller) body.isBestSeller = body.isBestSeller === "true";
      if (body.colors && typeof body.colors !== "string") {
        body.colors = JSON.stringify(body.colors);
      }

      if (files?.imageFiles?.length) {
        const paths = files.imageFiles.map(f => `/uploads/${f.filename}`);
        body.image = paths[0];
        body.images = JSON.stringify(paths);
      }
      if (files?.videoFile?.[0]) {
        body.video = `/uploads/${files.videoFile[0].filename}`;
      } else if (body.videoUrl) {
        body.video = body.videoUrl;
        delete body.videoUrl;
      }

      const input = api.products.create.input.parse(body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.patch(api.products.update.path, uploadFields, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as Record<string, Express.Multer.File[]>;
      const body = { ...req.body };

      if (body.price) body.price = parseInt(body.price);
      if (body.stock) body.stock = parseInt(body.stock);
      if (body.categoryId) body.categoryId = parseInt(body.categoryId);
      if (body.isBestSeller) body.isBestSeller = body.isBestSeller === "true";
      if (body.colors && typeof body.colors !== "string") {
        body.colors = JSON.stringify(body.colors);
      }

      if (files?.imageFiles?.length) {
        const newPaths = files.imageFiles.map(f => `/uploads/${f.filename}`);
        // Merge with existing images if provided
        let existingImages: string[] = [];
        if (body.existingImages) {
          try { existingImages = JSON.parse(body.existingImages); } catch {}
          delete body.existingImages;
        }
        const allPaths = [...existingImages, ...newPaths];
        body.image = allPaths[0];
        body.images = JSON.stringify(allPaths);
      } else if (body.existingImages !== undefined) {
        try {
          const imgs = JSON.parse(body.existingImages);
          body.images = body.existingImages;
          if (imgs.length > 0) body.image = imgs[0];
        } catch {}
        delete body.existingImages;
      }

      if (files?.videoFile?.[0]) {
        body.video = `/uploads/${files.videoFile[0].filename}`;
      } else if (body.videoUrl !== undefined) {
        body.video = body.videoUrl || null;
        delete body.videoUrl;
      }

      const input = api.products.update.input.parse(body);
      const product = await storage.updateProduct(id, input);
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteProduct(id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.status(204).send();
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: (err as Error).message });
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(parseInt(req.params.id), input.status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // Offers
  app.get(api.offers.list.path, async (req, res) => {
    const offers = await storage.getOffers();
    res.json(offers);
  });

  app.post(api.offers.create.path, async (req, res) => {
    try {
      const input = api.offers.create.input.parse(req.body);
      const offer = await storage.createOffer(input);
      res.status(201).json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.offers.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.offers.update.input.parse(req.body);
      const offer = await storage.updateOffer(id, input);
      if (!offer) return res.status(404).json({ message: "Offer not found" });
      res.json(offer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.offers.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteOffer(id);
    if (!deleted) return res.status(404).json({ message: "Offer not found" });
    res.status(204).send();
  });

  return httpServer;
}
