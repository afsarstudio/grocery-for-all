"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, ArrowRight } from "lucide-react";
import { Product } from "@/types";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data.slice(0, 5));
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/products?query=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search for atta, dal, spices, sprite, milk, soaps..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-brand-500 rounded-full text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 shadow-inner focus:shadow-glow"
        />
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Instant suggestions dropdown */}
      {isOpen && (suggestions.length > 0 || query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-slide-up">
          {suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching In-Store Items
              </div>
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectProduct(item.slug)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>{item.unit}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-900">₹{item.price}</span>
                      {item.mrp > item.price && (
                        <span className="line-through text-slate-400">₹{item.mrp}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </button>
              ))}

              <div className="px-3 pt-2 border-t border-slate-100">
                <button
                  onClick={handleSubmit}
                  className="w-full py-2 text-center text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
                >
                  View all results for &quot;{query}&quot;
                </button>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No products found matching &quot;{query}&quot;. Try searching for flour, rice, oil or dal.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
