import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Grid } from "lucide-react";
import { getCategories } from "@/lib/actions";

export const revalidate = 0;

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-1 rounded-full border border-brand-200">
          <Grid className="w-3.5 h-3.5" />
          <span>All Supermarket Departments</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Grocery Aisles
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Find your favourite household staples, kitchen ingredients, fresh dairy and snacks
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group flex flex-col bg-white rounded-3xl p-5 border border-slate-200 hover:border-brand-400 hover:shadow-card-hover transition-all duration-300"
          >
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 mb-4">
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-brand-50 text-brand-600 font-bold text-xl">
                  {category.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="font-bold text-base text-slate-800 group-hover:text-brand-600 transition-colors mb-1">
              {category.name}
            </h2>

            {category.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                {category.description}
              </p>
            )}

            <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
              <span>{category._count?.products || 0} Products available</span>
              <div className="w-7 h-7 rounded-full bg-brand-50 group-hover:bg-brand-600 group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
