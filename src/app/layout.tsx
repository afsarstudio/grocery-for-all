import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cartContext";
import { CustomerAuthProvider } from "@/lib/customerAuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import CustomerAuthModal from "@/components/auth/CustomerAuthModal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Grocery for All - Super Market | Naugarh, UP",
  description:
    "Naugarh's premier grocery supermarket. Fresh flours, dals, rice, mustard oil, spices, dairy, cold drinks, and daily home essentials delivered in 30 minutes in Tetari Bazar.",
  keywords: [
    "Grocery for All",
    "Supermarket Naugarh",
    "Tetari Bazar Grocery",
    "Online Kirana Naugarh",
    "Atta Maida Sooji",
    "Bail Kolhu Mustard Oil",
    "Super Market Siddharthnagar"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900" suppressHydrationWarning>
        <CustomerAuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            <main className="flex-1">{children}</main>
            <Footer />
            <CustomerAuthModal />
          </CartProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}

