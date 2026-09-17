"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  SlidersHorizontal,
  ExternalLink,
  Camera,
} from "lucide-react";
import { Product, Category } from "@/types";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions";
import AIInventoryScannerModal from "@/components/admin/AIInventoryScannerModal";

interface AdminProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
}

const PRODUCT_IMAGE_PRESETS = [
  { label: "Maggi 2-Min Noodles", value: "/images/products/maggi_noodles.svg" },
  { label: "Amul Taaza Milk (1L)", value: "/images/products/amul_taaza_milk.svg" },
  { label: "Surf Excel Easy Wash (1kg)", value: "/images/products/surf_excel.svg" },
  { label: "Tata Tea Gold (500g)", value: "/images/products/tata_tea_gold.svg" },
  { label: "Lay's Classic Salted", value: "/images/products/lays_chips.svg" },
  { label: "Cadbury Dairy Milk Silk", value: "/images/products/cadbury_silk.svg" },
  { label: "Dettol Antiseptic Soap", value: "/images/products/dettol.svg" },
  { label: "Tata Salt Vacuum Packed (1kg)", value: "/images/products/tata_salt.svg" },
  { label: "Fortune Sunflower Oil (1L)", value: "/images/products/fortune_sunflower_oil.svg" },
  { label: "California Almonds Badam (250g)", value: "/images/products/california_badam.svg" },
  { label: "King Cashews Kaju (250g)", value: "/images/products/king_kaju.svg" },
  { label: "Colgate Strong Teeth (200g)", value: "/images/products/colgate.svg" },
  { label: "Vim Dishwash Gel (750ml)", value: "/images/products/vim_gel.svg" },
  { label: "Fortune Chana Besan (500g)", value: "/images/products/fortune_besan.svg" },
  { label: "Daawat Rozana Basmati Rice (5kg)", value: "/images/products/daawat_rice.svg" },
  { label: "Kissan Tomato Ketchup (950g)", value: "/images/products/kissan_ketchup.svg" },
  { label: "Kellogg's Corn Flakes (475g)", value: "/images/products/kelloggs_cornflakes.svg" },
  { label: "Parle-G Gold Biscuits (1kg)", value: "/images/products/parle_g.svg" },
  { label: "Tata Sampann Moong Dal (1kg)", value: "/images/products/moong_dal.svg" },
  { label: "Aashirvaad Chakki Atta (5kg)", value: "/images/products/aashirvaad_atta.jpg" },
  { label: "Amul Pure Ghee (1L)", value: "/images/products/amul_pure_ghee.jpg" },
  { label: "Bail Kolhu Mustard Oil (1L)", value: "/images/products/bail_kolhu_oil.jpg" },
  { label: "MDH Deggi Mirch (100g)", value: "/images/products/mdh_deggi_mirch.jpg" },
  { label: "Everest Garam Masala (100g)", value: "/images/products/everest_garam_masala.jpg" },
  { label: "Haldiram's Bhujia Sev (400g)", value: "/images/products/haldirams_bhujia.jpg" },
];

export default function AdminProductsClient({
  initialProducts,
  categories,
}: AdminProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    categoryId: categories[0]?.id || "",
    price: 99,
    mrp: 120,
    stock: 50,
    unit: "1 kg",
    imageUrl: "/images/products/maggi_noodles.svg",
    badge: "",
    brand: "Grocery for All",
    description: "Fresh quality item direct from Grocery for All aisles.",
    isFeatured: false,
    isVegetarian: true,
  });

  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormError(null);
    setFormData({
      name: "",
      categoryId: categories[0]?.id || "",
      price: 99,
      mrp: 120,
      stock: 50,
      unit: "1 kg",
      imageUrl: "/images/products/maggi_noodles.svg",
      badge: "",
      brand: "Grocery for All",
      description: "Fresh quality item direct from Grocery for All aisles.",
      isFeatured: false,
      isVegetarian: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormError(null);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      mrp: product.mrp,
      stock: product.stock,
      unit: product.unit,
      imageUrl: product.imageUrl,
      badge: product.badge || "",
      brand: product.brand || "",
      description: product.description || "",
      isFeatured: product.isFeatured,
      isVegetarian: product.isVegetarian,
    });
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setToastMessage("Product deleted successfully");
        setTimeout(() => setToastMessage(null), 3500);
      } else {
        alert(res.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Product title is required");
      return;
    }
    setIsSaving(true);
    setFormError(null);

    try {
      if (editingProduct) {
        // Update
        const res = await updateProduct(editingProduct.id, formData);
        if (res.success && res.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? (res.product as any) : p))
          );
          setIsModalOpen(false);
          setToastMessage(`Updated "${res.product.name}" successfully!`);
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          setFormError(res.error || "Failed to update product details");
        }
      } else {
        // Create
        const res = await createProduct(formData);
        if (res.success && res.product) {
          setProducts((prev) => [res.product as any, ...prev]);
          setIsModalOpen(false);
          setToastMessage(`Product "${res.product.name}" added to catalog!`);
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          setFormError(res.error || "Failed to create product");
        }
      }
    } catch (err: any) {
      console.error("Save product failed:", err);
      setFormError(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            Supermarket Catalog
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Product Inventory ({products.length})
          </h1>
          <p className="text-xs text-slate-400">
            Create, edit, and update items displayed in the customer store
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-lg shadow-brand-900/40 flex items-center gap-2 hover:scale-[1.02] transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>AI Photo Inventory</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* AI Scanner Modal */}
      <AIInventoryScannerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onInventoryUpdated={() => window.location.reload()}
        categories={categories}
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or brand..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Department:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Selling Price</th>
                <th className="px-4 py-3.5">MRP</th>
                <th className="px-4 py-3.5">Stock Level</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 flex-shrink-0">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate max-w-[200px]">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {prod.brand || "GFA"} • {prod.unit}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-slate-400">
                    {prod.category?.name || "General"}
                  </td>

                  <td className="px-4 py-3.5 font-bold text-white">
                    ₹{prod.price}
                  </td>

                  <td className="px-4 py-3.5 text-slate-500 line-through">
                    ₹{prod.mrp}
                  </td>

                  <td className="px-4 py-3.5 font-semibold">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                        prod.stock <= 0
                          ? "bg-rose-950 text-rose-300 border border-rose-800"
                          : prod.stock <= 15
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {prod.stock} units
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    {prod.isFeatured ? (
                      <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Regular</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingProduct ? "Edit Product Details" : "Add Supermarket Product"}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Fill in the grocery details to list item in Naugarh supermarket
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Maggi 2-Minute Noodles Special Masala"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Category / Department *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Nestlé, Amul, Tata, Aashirvaad"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Unit / Size *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. 1 kg, 500g, 750ml, Pack of 4"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Image Selection with Presets & Live Preview */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <label className="block text-slate-300 font-bold">Product Image</label>
                
                <div className="flex gap-4 items-center">
                  <div className="relative w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {formData.imageUrl ? (
                      <Image
                        src={formData.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-[11px] text-slate-400">Quick Packaging Artwork Preset:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, imageUrl: e.target.value });
                          }
                        }}
                        value={formData.imageUrl}
                        className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                      >
                        <option value="">-- Choose packaging graphic --</option>
                        {PRODUCT_IMAGE_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="Or custom URL / path e.g. /images/products/maggi_noodles.svg"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details, ingredients, freshness notes..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="accent-brand-600 rounded w-4 h-4"
                  />
                  <span className="text-slate-300 font-semibold">Featured on Homepage Deals</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVegetarian}
                    onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                    className="accent-emerald-600 rounded w-4 h-4"
                  />
                  <span className="text-slate-300 font-semibold">100% Vegetarian</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center gap-2 shadow hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

