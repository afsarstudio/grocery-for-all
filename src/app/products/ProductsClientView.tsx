"use client";

import React, { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Search,
} from "lucide-react";
import { Product, Category } from "@/types";
import ProductCard from "@/components/ui/ProductCard";

interface ProductsClientViewProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function ProductsClientView({
  initialProducts,
  categories,
}: ProductsClientViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedCategorySlug = searchParams.get("category") || "";
  const initialQuery = searchParams.get("query") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>(selectedCategorySlug);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory && product.category?.slug !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description?.toLowerCase().includes(q);
        const matchBrand = product.brand?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchBrand) return false;
      }

      // In-stock filter
      if (inStockOnly && product.stock <= 0) {
        return false;
      }

      // Price filter
      if (product.price > maxPrice) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "discount") {
        const discA = a.mrp > a.price ? (a.mrp - a.price) / a.mrp : 0;
        const discB = b.mrp > b.price ? (b.mrp - b.price) / b.mrp : 0;
        return discB - discA;
      }
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [initialProducts, selectedCategory, searchQuery, inStockOnly, maxPrice, sortBy]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set("category", slug);
    } else {
      params.delete("category");
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setInStockOnly(false);
    setMaxPrice(1000);
    setSortBy("featured");
    router.push("/products");
  };

  const activeCategoryName =
    categories.find((c) => c.slug === selectedCategory)?.name || "All Supermarket Products";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct from Grocery for All Aisles</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {activeCategoryName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredProducts.length} items available in Naugarh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-600" />
            <span>Filters</span>
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 border border-slate-200">
            <span className="text-slate-500 font-normal">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured / Best Deals</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar Filters */}
        <aside
          className={`md:col-span-3 space-y-6 ${
            showMobileFilters ? "block" : "hidden md:block"
          }`}
        >
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-600" />
                <span>Filters</span>
              </h3>
              {(selectedCategory || searchQuery || inStockOnly || maxPrice < 1000) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* In-stock Only */}
            <div className="flex items-center justify-between">
              <label htmlFor="inStock" className="text-xs font-semibold text-slate-700 cursor-pointer">
                In-Stock Only
              </label>
              <input
                type="checkbox"
                id="inStock"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
              />
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Categories
              </h4>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                <button
                  onClick={() => handleCategorySelect("")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    selectedCategory === ""
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {initialProducts.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {cat._count && (
                        <span className="text-[11px] text-slate-400 font-normal ml-2">
                          {cat._count.products}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider">
                  Max Price
                </span>
                <span className="font-bold text-brand-600">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="30"
                max="1000"
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹30</span>
                <span>₹1000</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="md:col-span-9 space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No matching grocery items found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                Try loosening your filters, changing price range, or searching for staples like &quot;atta&quot;, &quot;dal&quot;, or &quot;oil&quot;.
              </p>
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow hover:bg-brand-700 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
