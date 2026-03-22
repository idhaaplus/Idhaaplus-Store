import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product, InsertProduct } from "@shared/schema";

export function useProducts(filters?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: [api.products.list.path, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append("category", filters.category);
      if (filters?.search) params.append("search", filters.search);
      
      const url = `${api.products.list.path}${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Failed to fetch products");
      return (await res.json()) as Product[];
    },
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return (await res.json()) as Product;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (product: InsertProduct) => {
      const res = await apiRequest("POST", api.products.create.path, product);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, product }: { id: number; product: Partial<InsertProduct> }) => {
      const res = await apiRequest("PATCH", buildUrl(api.products.update.path, { id }), product);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.products.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}
