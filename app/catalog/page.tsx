"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/lib/context/auth-context";
import { ProductRow } from "@/lib/supabase/database.types";
import {
  createProduct,
  listProducts,
  updateProduct,
  ProductInput,
} from "@/lib/supabase/queries-products";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardsListSkeleton } from "@/components/ui/page-skeletons";
import { Search, Plus, Pencil } from "lucide-react";
import { ProductFormDialog, CATALOG_CATEGORIES } from "@/components/forms/ProductFormDialog";
import { useActor } from "@/lib/context/actor-context";
import { logActivity } from "@/lib/supabase/activity";

export default function CatalogPage() {
  const { permissions } = useAuth();
  const { actor } = useActor();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSub, setSelectedSub] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);

  const canWrite = permissions.includes("catalog.write");

  const refresh = async () => {
    setLoading(true);
    try {
      setLoadError(null);
      setProducts(await listProducts());
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const categories = [
    "All",
    ...Array.from(
      new Set([
        ...CATALOG_CATEGORIES,
        ...products.map((p) => p.category).filter(Boolean),
      ])
    ),
  ];

  const subcategories = Array.from(
    new Set(
      products
        .filter((p) => p.category === selectedCategory && p.subcategory)
        .map((p) => p.subcategory)
    )
  );

  const filteredProducts = products.filter((prod) => {
    const matchesCategory =
      selectedCategory === "All" || prod.category === selectedCategory;
    const matchesSub =
      selectedSub === "All" || prod.subcategory === selectedSub;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSub && matchesSearch;
  });

  const handleSave = async (values: ProductInput) => {
    if (editing) {
      await updateProduct(editing.id, values);
      await logActivity({
        actor,
        action: "edited",
        entityType: "product",
        entityId: editing.id,
        entityLabel: values.name,
      });
      setEditing(null);
      if (selectedProduct?.id === editing.id) setSelectedProduct(null);
    } else {
      const created = await createProduct(values);
      await logActivity({
        actor,
        action: "added",
        entityType: "product",
        entityId: created.id,
        entityLabel: created.name,
      });
    }
    await refresh();
  };

  if (loading) return <CardsListSkeleton cards={4} />;

  return (
    <RouteGuard
      requiredPermission="catalog.read"
      requiredFeature="catalog"
      moduleName="Catalog"
    >
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-[#E6E3DB]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-black tracking-tight">
              Catalog
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Garments, knitwear, bags, and atelier inventory records.
            </p>
          </div>
          {canWrite && (
            <Button variant="default" size="sm" className="h-8 text-xs shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Product
            </Button>
          )}
        </div>

        {loadError && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xs">
            {loadError}{" "}
            <button onClick={refresh} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedSub("All"); }}
                className={`px-3.5 py-1.5 transition-colors rounded-xs whitespace-nowrap ${
                  isSelected
                    ? "bg-black text-white font-medium"
                    : "bg-white border border-[#E6E3DB] text-neutral-600 hover:text-black hover:border-black"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sub-Type Pills (e.g. Blouses → Plain / Work) */}
        {subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {["All", ...subcategories].map((sub) => {
              const isSelected = selectedSub === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSub(sub)}
                  className={`px-3 py-1 transition-colors rounded-xs whitespace-nowrap ${
                    isSelected
                      ? "bg-black text-white font-medium"
                      : "bg-white border border-[#E6E3DB] text-neutral-600 hover:text-black hover:border-black"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center bg-white p-3 border border-[#E6E3DB] rounded-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search garments, knitwear, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9F6] border border-[#E6E3DB] text-xs focus:outline-none focus:border-black rounded-xs"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="group cursor-pointer flex flex-col bg-white border border-[#E6E3DB] hover:border-black transition-colors rounded-xs overflow-hidden"
            >
              {/* Product Image Frame */}
              <div className="aspect-[3/4] relative overflow-hidden bg-[#F7F5F0]">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-102 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-neutral-300">
                    {product.name.charAt(0)}
                  </div>
                )}
                {canWrite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(product); setFormOpen(true); }}
                    className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-xs bg-white border border-[#E6E3DB] hover:border-black opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit product"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono text-neutral-400">
                    {product.sku}
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-black mt-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                    {product.material}
                  </p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-[#F0ECE1] flex items-center justify-between">
                  <span className="font-mono text-xs sm:text-sm font-semibold text-black">
                    ${Number(product.price)}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    {product.stock} in stock
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && !loadError && (
          <div className="text-center py-12 text-xs text-neutral-400">
            No products found.
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <Dialog
            open={Boolean(selectedProduct)}
            onOpenChange={(open) => !open && setSelectedProduct(null)}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-neutral-400">
                    {selectedProduct.sku}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedProduct.category}
                    {selectedProduct.subcategory ? ` · ${selectedProduct.subcategory}` : ""}
                  </Badge>
                </div>
                <DialogTitle className="text-base font-semibold text-black">
                  {selectedProduct.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedProduct.material}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                <div className="aspect-[4/3] relative overflow-hidden bg-[#F7F5F0] border border-[#E6E3DB]">
                  {selectedProduct.image_url ? (
                    <Image
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-medium text-neutral-300">
                      {selectedProduct.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB]">
                    <span className="text-neutral-400 text-[10px]">Price</span>
                    <div className="text-base font-semibold text-black mt-0.5">
                      ${Number(selectedProduct.price)}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FAF9F6] border border-[#E6E3DB]">
                    <span className="text-neutral-400 text-[10px]">Inventory</span>
                    <div className="text-base font-semibold text-black mt-0.5">
                      {selectedProduct.stock} Available
                    </div>
                  </div>
                </div>

                {canWrite && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => { setEditing(selectedProduct); setSelectedProduct(null); setFormOpen(true); }}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit Product
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <ProductFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editing}
          categories={categories.filter((c) => c !== "All")}
          onSave={handleSave}
        />
      </div>
    </RouteGuard>
  );
}
