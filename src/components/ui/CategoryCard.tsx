import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group relative flex flex-col items-center bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-brand-400 hover:shadow-card-hover transition-all duration-300 text-center"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform duration-300 shadow-sm">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-50 text-brand-600 font-bold text-lg">
            {category.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-2">
        {category.name}
      </h3>

      {category._count && (
        <span className="text-[11px] text-slate-400 mt-1 font-medium">
          {category._count.products} Products
        </span>
      )}
    </Link>
  );
}
