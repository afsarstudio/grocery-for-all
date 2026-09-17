import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowRight,
  Truck,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Tag,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/actions";
import ProductCard from "@/components/ui/ProductCard";
import CategoryCard from "@/components/ui/CategoryCard";

export const revalidate = 0; // Fresh on reload

export default async function HomePage() {
  const [categories, featuredProducts, allProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getProducts({ limit: 12 } as any),
  ]);

  // Specific aisle highlights
  const stapleProducts = allProducts.filter(
    (p) =>
      p.category?.slug === "atta-flours-sooji" ||
      p.category?.slug === "dals-pulses" ||
      p.category?.slug === "edible-oils-ghee"
  );

  const snacksAndDrinks = allProducts.filter(
    (p) =>
      p.category?.slug === "snacks-beverages" ||
      p.category?.slug === "dairy-breakfast"
  );

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-white pt-8 pb-12 sm:pb-16 px-4 sm:px-6">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-amber-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Naugarh&apos;s Premier Supermarket • Tetari Bazar</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Fresh Groceries &amp; Daily Essentials Delivered In{" "}
                <span className="text-amber-400 underline decoration-brand-500 decoration-wavy">
                  30 Minutes
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-200/90 max-w-xl leading-relaxed">
                Shop 100% genuine products including Pohsan Maida, Sooji, Aashirvaad Atta, Tata Sampann Dals, Bail Kolhu Mustard Oil, Amul Pure Ghee, and chilled Sprite at lowest supermarket rates.
              </p>

              {/* Promo code pill */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 px-3.5 py-1.5 rounded-xl text-xs text-amber-300 font-semibold">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Use coupon <strong className="text-white">WELCOME100</strong> for 15% OFF</span>
                </div>
                <span className="text-xs text-slate-300">
                  ⚡ Free delivery on orders over ₹499
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3.5 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-glow active:scale-95 transition-all duration-200 flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Shop All Products</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/categories"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 backdrop-blur-sm transition-colors"
                >
                  Browse Aisles
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div className="text-lg sm:text-xl font-bold text-amber-400">4.4 ★</div>
                  <div className="text-slate-300 text-[11px]">93 Google Reviews</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">100%</div>
                  <div className="text-slate-300 text-[11px]">Original Brand Packs</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold text-white">Closes 10 PM</div>
                  <div className="text-slate-300 text-[11px]">Open 7 Days a Week</div>
                </div>
              </div>
            </div>

            {/* Right Hero: Authentic Supermarket Featured Showcase */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-3.5 bg-white/10 border border-white/20 p-4 rounded-3xl backdrop-blur-md shadow-2xl">
                {/* 4 featured product pack preview cards */}
                <div className="bg-white rounded-2xl p-2.5 text-slate-900 flex flex-col items-center text-center shadow-md">
                  <div className="relative w-28 h-28 mb-1.5">
                    <Image
                      src="/images/products/pohsan_maida.jpg"
                      alt="Pohsan Maida 1kg"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate w-full">Pohsan Maida</div>
                  <div className="text-[11px] text-brand-600 font-extrabold">₹45 <span className="line-through text-slate-400 text-[10px]">₹52</span></div>
                </div>

                <div className="bg-white rounded-2xl p-2.5 text-slate-900 flex flex-col items-center text-center shadow-md">
                  <div className="relative w-28 h-28 mb-1.5">
                    <Image
                      src="/images/products/bail_kolhu_oil.jpg"
                      alt="Bail Kolhu Mustard Oil"
                      fill
                      priority
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate w-full">Bail Kolhu Oil</div>
                  <div className="text-[11px] text-brand-600 font-extrabold">₹148 <span className="line-through text-slate-400 text-[10px]">₹170</span></div>
                </div>

                <div className="bg-white rounded-2xl p-2.5 text-slate-900 flex flex-col items-center text-center shadow-md">
                  <div className="relative w-28 h-28 mb-1.5">
                    <Image
                      src="/images/products/aashirvaad_atta.jpg"
                      alt="Aashirvaad Chakki Atta 5kg"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate w-full">Aashirvaad Atta</div>
                  <div className="text-[11px] text-brand-600 font-extrabold">₹245 <span className="line-through text-slate-400 text-[10px]">₹275</span></div>
                </div>

                <div className="bg-white rounded-2xl p-2.5 text-slate-900 flex flex-col items-center text-center shadow-md">
                  <div className="relative w-28 h-28 mb-1.5">
                    <Image
                      src="/images/products/sprite_bottle.jpg"
                      alt="Sprite Cold Drink 750ml"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate w-full">Sprite 750ml</div>
                  <div className="text-[11px] text-brand-600 font-extrabold">₹40 <span className="line-through text-slate-400 text-[10px]">₹45</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Shop by Department
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Browse supermarket aisles stocked with genuine grocery items
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* 3. Featured Supermarket Bestsellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-rose-50/60 rounded-3xl p-5 sm:p-8 border border-brand-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black shadow-md">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Today&apos;s Super Saver Deals
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Best supermarket prices on customer favorites in Tetari Bazar
                </p>
              </div>
            </div>
            <Link
              href="/products"
              className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 hidden sm:flex items-center gap-1"
            >
              <span>Explore Deals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Kitchen Staples (Atta, Dals, Oils) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Atta, Dals, Basmati &amp; Mustard Oils
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pohsan Maida, Sooji, Aashirvaad Atta, Bail Kolhu Oil &amp; unpolished pulses
            </p>
          </div>
          <Link
            href="/products?category=atta-flours-sooji"
            className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>See More</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {stapleProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Store Location & Authentic Supermarket Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-brand-600/30 border border-brand-500/40 text-brand-300 text-xs font-bold px-3 py-1 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>Visit Our Tetari Bazar Supermarket</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Grocery for All Super Market, Naugarh
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Step into our air-conditioned supermarket at Rahul Nagar, Khajuriya, Tetari Bazar. Featuring wide shopping aisles, organized product sections, fresh daily arrivals, and instant billing counters.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Store Operating Hours</span>
                  </div>
                  <p className="text-slate-300">Open 8:00 AM to 10:00 PM (All 7 Days)</p>
                </div>

                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>Google Customer Rating</span>
                  </div>
                  <p className="text-slate-300">4.4 / 5.0 Stars (93 Verified Reviews)</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Order for Home Delivery
                </Link>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-400" />
                  <span>Get Store Directions</span>
                </a>
              </div>
            </div>

            {/* Storefront Feature Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-brand-600 to-amber-600 p-6 rounded-3xl text-white space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="bg-white text-brand-600 font-black p-2 rounded-xl text-sm shadow">
                  GFA
                </div>
                <div>
                  <h4 className="font-extrabold text-base leading-tight">GROCERY FOR ALL</h4>
                  <p className="text-[11px] text-amber-200">Super Market • Naugarh 272207</p>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-2xl border border-white/20 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>📍 Tetari Bazar Branch</span>
                  <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">Open Now</span>
                </div>
                <p className="text-slate-100 text-[11px]">
                  Rahul Nagar, Khajuriya, Tetari Bazar, Naugarh, Uttar Pradesh 272207
                </p>
                <p className="text-amber-200 text-[11px] font-semibold">
                  📞 Phone Orders: +91 98765 43210
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/15">
                  <span className="block font-black text-amber-300 text-base">30 Mins</span>
                  <span className="text-[10px] text-slate-200">Local Delivery</span>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/15">
                  <span className="block font-black text-amber-300 text-base">100%</span>
                  <span className="text-[10px] text-slate-200">Original Packs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Snacks, Sprite & Dairy */}
      {snacksAndDrinks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Chilled Sprite, Cold Drinks &amp; Snacks
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Refreshing sodas, Haldiram namkeens, Maggi noodles and dairy items
              </p>
            </div>
            <Link
              href="/products?category=snacks-beverages"
              className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>See More</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {snacksAndDrinks.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
