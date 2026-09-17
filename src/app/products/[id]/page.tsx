import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Sparkles,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  CheckCircle2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/actions";
import ProductDetailActions from "./ProductDetailActions";
import ProductCard from "@/components/ui/ProductCard";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) {
    notFound();
  }

  // Related products from same category
  const related = await getProducts({
    categoryId: product.categoryId,
    limit: 4,
  } as any);
  const filteredRelated = related.filter((p) => p.id !== product.id).slice(0, 4);

  const discountPercent =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-12">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-brand-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-600 transition-colors">
          Products
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-brand-600 transition-colors"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-800 font-bold truncate max-w-[200px]">
          {product.name}
        </span>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-card">
        {/* Left: Product Image */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover"
            />
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-brand-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow">
                {discountPercent}% OFF
              </div>
            )}
            {product.isVegetarian && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="flex items-center justify-center w-5 h-5 rounded-md border border-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Category tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-brand-50 text-brand-700 font-bold px-3 py-1 rounded-lg">
                {product.brand || "Grocery for All"}
              </span>
              {product.category && (
                <span className="bg-slate-100 text-slate-700 font-semibold px-3 py-1 rounded-lg">
                  {product.category.name}
                </span>
              )}
              <span className="bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-lg">
                Unit: {product.unit}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Pricing Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  ₹{product.price}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through">
                      MRP ₹{product.mrp}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Save ₹{product.mrp - product.price} ({discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                (Inclusive of all local supermarket taxes)
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-sm text-slate-600 leading-relaxed pt-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-1.5">
                  About This Item
                </h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Delivery Promise */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>Express 30-45 Mins Supermarket Delivery</span>
              </div>
              <p className="text-emerald-800 text-[11px]">
                Delivered direct from Grocery for All, Rahul Nagar, Tetari Bazar, Naugarh 272207.
              </p>
            </div>
          </div>

          {/* Client Action Component (Add to Cart, Quantity) */}
          <ProductDetailActions product={product} />
        </div>
      </div>

      {/* Related Products */}
      {filteredRelated.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Related Items You May Like
            </h2>
            <Link
              href={`/products?category=${product.category?.slug}`}
              className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700"
            >
              View More
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {filteredRelated.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
