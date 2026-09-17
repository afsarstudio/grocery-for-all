"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  BookOpen,
  Printer,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Clock,
  User,
  Phone,
  ArrowRight,
  X,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Receipt,
  Keyboard,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Percent,
  Check,
  Zap,
  Lock,
  MessageCircle,
  Copy,
  CheckCheck,
  UserPlus,
  UserCheck,
  Award,
  Share2,
  ExternalLink,
  Send,
} from "lucide-react";
import { Product, Category } from "@/types";
import { createPOSBill, searchPOSCustomers } from "@/lib/actions";
import { clearPortalAuthentication } from "@/lib/portalAuth";
import confetti from "canvas-confetti";

interface BillItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  mrp: number;
  quantity: number;
  unit: string;
  stock: number;
}

interface SuspendedBill {
  id: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  discount: number;
  createdAt: string;
}

interface StaffPOSClientProps {
  initialProducts: Product[];
  categories: Category[];
  initialStats: {
    totalBills: number;
    totalSales: number;
    cashSales: number;
    upiSales: number;
    cardSales: number;
    itemsSold: number;
  };
}

export default function StaffPOSClient({
  initialProducts,
  categories,
  initialStats,
}: StaffPOSClientProps) {
  // Products & Filtering (Stateful so stock can decrement live in POS interface)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync if initialProducts prop changes
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Active Billing Ticket
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("9876543210");
  const [cashierName, setCashierName] = useState("Staff Cashier");
  const [discountType, setDiscountType] = useState<"FLAT" | "PERCENT">("FLAT");
  const [discountVal, setDiscountVal] = useState<number>(0);

  // Customer Autocomplete & Loyalty Status
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<any | null>(null);

  // WhatsApp Billing State
  const [sendWhatsAppOnSettle, setSendWhatsAppOnSettle] = useState(true);
  const [receiptWhatsAppPhone, setReceiptWhatsAppPhone] = useState("");
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  // Direct Inline Payment
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "KHATA">("CASH");
  const [tenderedAmount, setTenderedAmount] = useState<string>("");

  // Suspended (Hold & Recall) Bills with LocalStorage sync
  const [suspendedBills, setSuspendedBills] = useState<SuspendedBill[]>([]);
  const [isHeldInitialized, setIsHeldInitialized] = useState(false);

  // Modals & States
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBillData, setCurrentBillData] = useState<any | null>(null);

  const [currentTime, setCurrentTime] = useState<string>("");
  const [stats, setStats] = useState(initialStats);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Customer Search by Phone or Name
  useEffect(() => {
    const raw = customerPhone.replace(/[^0-9]/g, "");
    if (raw.length >= 3 && raw !== "9876543210") {
      setIsSearchingCustomer(true);
      const timer = setTimeout(async () => {
        try {
          const results = await searchPOSCustomers(raw);
          setCustomerSearchResults(results);
          setIsCustomerDropdownOpen(results.length > 0);

          const exact = results.find(
            (c: any) => c.phone.replace(/[^0-9]/g, "") === raw || c.phone.endsWith(raw)
          );
          if (exact) {
            setMatchedCustomer(exact);
            if (customerName === "Walk-in Customer" || !customerName) {
              setCustomerName(exact.name);
            }
          } else {
            setMatchedCustomer(null);
          }
        } catch (e) {
          console.error("Customer search error:", e);
        } finally {
          setIsSearchingCustomer(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setCustomerSearchResults([]);
      setIsCustomerDropdownOpen(false);
      if (raw === "9876543210" || raw === "") {
        setMatchedCustomer(null);
      }
    }
  }, [customerPhone]);

  // Formatted WhatsApp Invoice Message Generator
  const generateWhatsAppMessage = (data: any) => {
    if (!data || !data.items) return "";

    const storeName = "GROCERY FOR ALL";
    const storeAddress = "Tetari Bazar, Naugarh, Siddharthnagar, UP - 272207";
    const storeHelpline = "+91 98765 43210";

    const formattedDate = new Date(data.date || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = new Date(data.date || Date.now()).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const itemsList = data.items
      .map(
        (item: any, idx: number) =>
          `${idx + 1}. *${item.productName}*\n   └ ${item.quantity} ${item.unit || "unit"} × ₹${item.price} = *₹${item.price * item.quantity}*`
      )
      .join("\n");

    const totalQty = data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    return `🛍️ *${storeName} - DIGITAL INVOICE*
━━━━━━━━━━━━━━━━━━━━━
🧾 *Bill No:* \`${data.billNumber}\`
📅 *Date:* ${formattedDate} ${formattedTime}
👤 *Customer:* ${data.customerName || "Walk-in Customer"}
📱 *Mobile:* ${data.customerPhone || "N/A"}
🧑‍💼 *Billed By:* ${data.cashierName || "Staff Counter #01"}
━━━━━━━━━━━━━━━━━━━━━
🛒 *ITEMS PURCHASED (${totalQty} Items):*
${itemsList}
━━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ₹${data.subtotal}
${data.discount > 0 ? `🎁 *Discount Applied:* -₹${data.discount}\n` : ""}💰 *NET AMOUNT PAID:* *₹${data.total}*
💳 *Payment Mode:* ${data.paymentMethod || "CASH"}
${data.paymentMethod === "CASH" && data.changeReturn > 0 ? `🪙 *Change Return:* ₹${data.changeReturn}\n` : ""}${data.isNewCustomer ? `🎉 *Welcome Bonus:* +50 Welcome Points Added!\n` : ""}${data.pointsEarned ? `⭐ *Loyalty Points Earned:* +${data.pointsEarned} pts\n` : ""}${data.totalCustomerPoints ? `👑 *Total Points Balance:* ${data.totalCustomerPoints} pts\n` : ""}━━━━━━━━━━━━━━━━━━━━━
📍 *Store Location:*
${storeAddress}
📞 *Helpline / WhatsApp Order:* ${storeHelpline}
🚚 *Fast Home Delivery Available in Naugarh (30 Mins)*
🙏 *Thank you for shopping with us! Visit again.*`;
  };

  // Open WhatsApp Web / App
  const handleSendWhatsAppBill = (targetPhone: string, data: any) => {
    const raw = (targetPhone || "").replace(/[^0-9]/g, "");
    const cleanDigits = raw.length >= 10 ? raw.slice(-10) : raw;
    const msg = generateWhatsAppMessage(data);
    const encoded = encodeURIComponent(msg);
    const targetUrl =
      cleanDigits && cleanDigits.length >= 10
        ? `https://wa.me/91${cleanDigits}?text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(targetUrl, "_blank");
  };

  // Copy WhatsApp Text to Clipboard
  const handleCopyWhatsAppText = async (data: any) => {
    try {
      const msg = generateWhatsAppMessage(data);
      await navigator.clipboard.writeText(msg);
      setIsCopiedWhatsApp(true);
      setTimeout(() => setIsCopiedWhatsApp(false), 2500);
    } catch (e) {
      console.error("Failed to copy bill:", e);
    }
  };

  // Load held bills from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gfa_pos_held_bills");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSuspendedBills(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load held bills from storage", e);
    } finally {
      setIsHeldInitialized(true);
    }
  }, []);

  // Save held bills to localStorage
  useEffect(() => {
    if (!isHeldInitialized) return;
    try {
      localStorage.setItem("gfa_pos_held_bills", JSON.stringify(suspendedBills));
    } catch (e) {
      console.error("Failed to save held bills", e);
    }
  }, [suspendedBills, isHeldInitialized]);

  // Live Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchUnit = p.unit.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        return matchName || matchBrand || matchUnit || matchSlug;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Barcode / Fast-Scanner Keypress on Enter in Search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        addItemToBill(filteredProducts[0]);
        setSearchQuery("");
      }
    }
  };

  // Add Item to Bill (Strict stock checking)
  const addItemToBill = (product: Product) => {
    const currentProd = products.find((p) => p.id === product.id) || product;
    if (currentProd.stock <= 0) {
      alert(`"${currentProd.name}" stock is 0 (Out of stock)!`);
      return;
    }

    setBillItems((prev) => {
      const existing = prev.find((item) => item.productId === currentProd.id);
      if (existing) {
        if (existing.quantity >= currentProd.stock) {
          alert(`Cannot add more. Only ${currentProd.stock} units available in stock!`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === currentProd.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: currentProd.id,
          productName: currentProd.name,
          productImage: currentProd.imageUrl,
          price: currentProd.price,
          mrp: currentProd.mrp,
          quantity: 1,
          unit: currentProd.unit,
          stock: currentProd.stock,
        },
      ];
    });
  };

  // Update Bill Item Quantity (Stock limit checking)
  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    const currentProduct = products.find((p) => p.id === productId);
    const maxStock = currentProduct ? currentProduct.stock : 9999;
    if (qty > maxStock) {
      alert(`Only ${maxStock} units available in stock!`);
      return;
    }
    setBillItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setBillItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleClearBill = () => {
    if (billItems.length === 0) return;
    if (window.confirm("Clear all items from current billing ticket?")) {
      setBillItems([]);
      setDiscountVal(0);
      setTenderedAmount("");
      setCustomerName("Walk-in Customer");
      setCustomerPhone("9876543210");
    }
  };

  // Hold / Suspend Bill
  const handleHoldBill = () => {
    if (billItems.length === 0) {
      alert("Cannot hold an empty bill. Add products first!");
      return;
    }
    const suspended: SuspendedBill = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim() || "9876543210",
      items: [...billItems],
      discount: discountVal,
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setSuspendedBills((prev) => [suspended, ...prev]);
    setBillItems([]);
    setDiscountVal(0);
    setTenderedAmount("");
    setCustomerName("Walk-in Customer");
    setCustomerPhone("9876543210");
  };

  // Recall Bill (Swap or auto-hold active bill safely)
  const handleRecallBill = (bill: SuspendedBill) => {
    if (billItems.length > 0) {
      // Auto-hold current bill so cashier doesn't lose anything
      const currentHold: SuspendedBill = {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim() || "9876543210",
        items: [...billItems],
        discount: discountVal,
        createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setSuspendedBills((prev) => [currentHold, ...prev.filter((b) => b.id !== bill.id)]);
    } else {
      setSuspendedBills((prev) => prev.filter((b) => b.id !== bill.id));
    }

    setBillItems(bill.items);
    setCustomerName(bill.customerName);
    setCustomerPhone(bill.customerPhone);
    setDiscountVal(bill.discount);
    setIsHeldModalOpen(false);
  };

  // Delete / Discard a held bill
  const handleDeleteHeldBill = (billId: string) => {
    setSuspendedBills((prev) => prev.filter((b) => b.id !== billId));
  };

  // Computations
  const subtotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [billItems]
  );
  const mrpTotal = useMemo(
    () => billItems.reduce((sum, item) => sum + item.mrp * item.quantity, 0),
    [billItems]
  );
  const totalItemCount = useMemo(
    () => billItems.reduce((sum, item) => sum + item.quantity, 0),
    [billItems]
  );

  const calculatedDiscount = useMemo(() => {
    if (discountType === "PERCENT") {
      return (subtotal * Math.min(100, Math.max(0, discountVal))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountVal));
  }, [subtotal, discountType, discountVal]);

  const grandTotal = Math.max(0, Math.round(subtotal - calculatedDiscount));
  const totalSavings = Math.max(0, mrpTotal - subtotal + calculatedDiscount);

  // Cash Change calculation
  const tenderedNum = Number(tenderedAmount) || grandTotal;
  const changeReturn = Math.max(0, tenderedNum - grandTotal);

  // Settle & Print Bill directly
  const handleSettlePayment = async () => {
    if (billItems.length === 0) {
      alert("Please add at least one product to the bill!");
      return;
    }
    setIsProcessing(true);

    try {
      const res = await createPOSBill({
        cashierName,
        customerName,
        customerPhone,
        customerAddress: "Naugarh Store Counter",
        paymentMethod,
        items: billItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          price: item.price,
          mrp: item.mrp,
          quantity: item.quantity,
          unit: item.unit,
        })),
        subtotal,
        discount: calculatedDiscount,
        total: grandTotal,
        tenderedAmount: paymentMethod === "CASH" ? tenderedNum : grandTotal,
        changeReturn: paymentMethod === "CASH" ? changeReturn : 0,
        notes: `Direct Counter Sale (${paymentMethod})`,
      });

      if (res.success && res.billData) {
        // 1. Immediately decrement stock from POS products state so staff UI updates in real-time!
        setProducts((prev) =>
          prev.map((p) => {
            const soldItem = billItems.find((bi) => bi.productId === p.id);
            if (soldItem) {
              return {
                ...p,
                stock: Math.max(0, p.stock - soldItem.quantity),
              };
            }
            return p;
          })
        );

        // 2. Update stats
        setStats((prev) => ({
          ...prev,
          totalBills: prev.totalBills + 1,
          totalSales: prev.totalSales + grandTotal,
          cashSales: paymentMethod === "CASH" ? prev.cashSales + grandTotal : prev.cashSales,
          upiSales: paymentMethod === "UPI" ? prev.upiSales + grandTotal : prev.upiSales,
          cardSales: paymentMethod === "CARD" ? prev.cardSales + grandTotal : prev.cardSales,
          itemsSold: prev.itemsSold + totalItemCount,
        }));

        setCurrentBillData(res.billData);
        setReceiptWhatsAppPhone(res.billData.customerPhone || customerPhone);
        setIsReceiptOpen(true);

        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });

        // 3. Auto-send WhatsApp bill if enabled and valid phone is provided
        const rawPhoneDigits = (customerPhone || "").replace(/[^0-9]/g, "");
        if (
          sendWhatsAppOnSettle &&
          rawPhoneDigits.length >= 10 &&
          rawPhoneDigits !== "9876543210" &&
          rawPhoneDigits !== "9999999999"
        ) {
          handleSendWhatsAppBill(customerPhone, res.billData);
        }

        // 4. Reset current ticket
        setBillItems([]);
        setDiscountVal(0);
        setTenderedAmount("");
        setCustomerName("Walk-in Customer");
        setCustomerPhone("9876543210");
        setMatchedCustomer(null);
        setCustomerSearchResults([]);
        setIsCustomerDropdownOpen(false);
      } else {
        alert(res.error || "Failed to process bill");
      }
    } catch (err: any) {
      console.error("POS Checkout error:", err);
      alert(err?.message || "Payment settlement error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard Shortcuts (F2: Search, F4: Clear, F7: Hold, F9: Settle, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "F4") {
        e.preventDefault();
        handleClearBill();
      } else if (e.key === "F7") {
        e.preventDefault();
        handleHoldBill();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (billItems.length > 0) {
          handleSettlePayment();
        }
      } else if (e.key === "Escape") {
        setIsReceiptOpen(false);
        setIsStatsOpen(false);
        setIsShortcutsOpen(false);
        setIsHeldModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [billItems, grandTotal, paymentMethod, tenderedNum, changeReturn]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* 1. Supermarket POS Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors"
            title="Open Admin Dashboard in New Tab"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>

          {/* Store Branding */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-brand-600 to-amber-500 text-white w-7 h-7 rounded-lg font-extrabold flex items-center justify-center text-xs shadow">
              G
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-xs sm:text-sm text-white tracking-tight">
                  GROCERY FOR ALL
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  POS BILLING
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Tetari Bazar, Naugarh (Counter #01)</span>
            </div>
          </div>
        </div>

        {/* Live Clock & Counter Stats */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-3 py-1 rounded-xl text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-white text-[11px]">{currentTime}</span>
          </div>

          <button
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-1.5 bg-brand-950 border border-brand-800/80 text-brand-300 hover:bg-brand-900/80 px-3 py-1 rounded-xl font-bold transition-colors text-xs"
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
            <span>Today: ₹{stats.totalSales.toLocaleString()}</span>
            <span className="text-[10px] bg-brand-800 text-white px-1.5 py-0.2 rounded-full">
              {stats.totalBills}
            </span>
          </button>

          {/* Suspended / Held bills indicator button */}
          {suspendedBills.length > 0 && (
            <div className="relative">
              <span className="animate-ping absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
              <button
                onClick={() => setIsHeldModalOpen(true)}
                className="flex items-center gap-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-600 text-amber-300 px-2.5 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow"
                title="View & Recall Held Tickets"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{suspendedBills.length} Held</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              clearPortalAuthentication("staff");
              window.location.reload();
            }}
            className="p-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-900 rounded-lg transition-colors cursor-pointer"
            title="Lock POS Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main POS Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANEL: Product Catalog, Barcode Scanner & Category Pills (60% width) */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col border-r border-slate-800 bg-slate-950 overflow-hidden">
          {/* Top Barcode / Search Input Header */}
          <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Scan barcode or type item / brand / atta / oil... (Press F2 or Enter)"
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border-2 border-brand-500/60 focus:border-brand-400 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none shadow-inner"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="bg-slate-800 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-amber-300 border border-slate-700 hidden sm:flex items-center gap-1">
                <span>[Enter] = Add</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs font-semibold">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                  selectedCategory === ""
                    ? "bg-brand-600 text-white font-bold shadow"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                All ({products.length})
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? "bg-brand-600 text-white font-bold shadow"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid (content-start and auto-rows-max prevent cards from stretching vertically when few items are shown) */}
          <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 content-start auto-rows-max">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-slate-400">No supermarket items found</p>
                <p className="text-[11px]">Try another search term or reset category</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const inCurrentBill = billItems.find((i) => i.productId === prod.id);

                return (
                  <button
                    key={prod.id}
                    onClick={() => addItemToBill(prod)}
                    className={`group relative text-left bg-slate-900/90 hover:bg-slate-850 border rounded-2xl p-2.5 flex flex-col justify-between transition-all duration-150 active:scale-95 shadow-sm min-h-[115px] ${
                      inCurrentBill
                        ? "border-brand-500 ring-2 ring-brand-500/40 bg-brand-950/25"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-bold text-slate-400 truncate max-w-[85px]">
                        {prod.brand || "GFA"}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          prod.stock <= 0
                            ? "bg-rose-950/90 text-rose-300 border border-rose-800/80"
                            : prod.stock <= 10
                            ? "bg-amber-950/90 text-amber-300 border border-amber-800/80"
                            : "bg-emerald-950/90 text-emerald-400 border border-emerald-800/80"
                        }`}
                      >
                        {prod.stock <= 0 ? "0 left (Out)" : `${prod.stock} left`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <div className="relative w-10 h-10 rounded-xl bg-slate-950 overflow-hidden flex-shrink-0 border border-slate-800">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-white line-clamp-2 leading-tight">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {prod.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full pt-1.5 border-t border-slate-800/80 mt-auto">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-white">₹{prod.price}</span>
                        {prod.mrp > prod.price && (
                          <span className="text-[10px] text-slate-500 line-through ml-1">
                            ₹{prod.mrp}
                          </span>
                        )}
                      </div>

                      {inCurrentBill ? (
                        <span className="bg-brand-600 text-white font-black text-xs px-2 py-0.5 rounded-md shadow-sm">
                          × {inCurrentBill.quantity}
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                          prod.stock <= 0
                            ? "text-slate-500 bg-slate-900 border border-slate-800 cursor-not-allowed"
                            : "text-brand-400 bg-brand-950/60 border border-brand-800/50 group-hover:bg-brand-600 group-hover:text-white"
                        }`}>
                          {prod.stock <= 0 ? "OUT" : "+ ADD"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: All-In-One Unified POS Ticket & Direct Payment Panel (40% width) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col bg-slate-900 border-l border-slate-800 h-full overflow-hidden">
          {/* 1. Ticket Header & Customer Details */}
          <div className="p-2.5 bg-slate-900 border-b border-slate-800 space-y-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Receipt className="w-3.5 h-3.5 text-brand-400" />
                <span>Active Counter Ticket</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                  {totalItemCount} {totalItemCount === 1 ? "unit" : "units"}
                </span>
                {billItems.length > 0 && (
                  <button
                    onClick={handleClearBill}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold px-1.5 py-0.5 rounded hover:bg-slate-800"
                    title="Clear (F4)"
                  >
                    Clear (F4)
                  </button>
                )}
              </div>
            </div>

            {/* Customer Inputs & Auto-Detection Status */}
            <div className="space-y-1.5 relative">
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <div className="relative">
                  <User className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (matchedCustomer && e.target.value !== matchedCustomer.name) {
                        setMatchedCustomer(null);
                      }
                    }}
                    placeholder="Customer Name"
                    className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="relative">
                  <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    onFocus={() => {
                      if (customerSearchResults.length > 0) setIsCustomerDropdownOpen(true);
                    }}
                    placeholder="WhatsApp / Mobile"
                    className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium text-xs focus:outline-none focus:border-brand-500"
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>

              {/* Customer Search Autocomplete Suggestions Dropdown */}
              {isCustomerDropdownOpen && customerSearchResults.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 max-h-48 overflow-y-auto">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 flex items-center justify-between">
                    <span>Registered Customers Found:</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {customerSearchResults.map((cust) => (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        setCustomerName(cust.name);
                        setCustomerPhone(cust.phone);
                        setMatchedCustomer(cust);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="w-full text-left p-1.5 hover:bg-slate-800 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-white text-xs block group-hover:text-brand-300">
                            {cust.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {cust.phone}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-0.5 font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                        <Award className="w-2.5 h-2.5 text-amber-400" />
                        {cust.points} pts
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Customer Status & Loyalty Indicator Banner */}
              <div className="flex items-center justify-between gap-1 text-[10px] pt-0.5">
                {matchedCustomer ? (
                  <div className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md truncate">
                    <UserCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">
                      Member: {matchedCustomer.name} ({matchedCustomer.points} pts)
                    </span>
                  </div>
                ) : customerPhone.replace(/[^0-9]/g, "").length >= 10 && customerPhone !== "9876543210" ? (
                  <div className="flex items-center gap-1 text-teal-300 font-bold bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded-md truncate">
                    <UserPlus className="w-3 h-3 text-teal-400 flex-shrink-0" />
                    <span className="truncate">
                      New Customer (Auto-saved + 50 Welcome Pts)
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-[10px]">
                    Enter mobile to send WhatsApp bill & auto-register
                  </span>
                )}

                {(customerName !== "Walk-in Customer" || customerPhone !== "9876543210") && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerName("Walk-in Customer");
                      setCustomerPhone("9876543210");
                      setMatchedCustomer(null);
                      setCustomerSearchResults([]);
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white font-semibold underline whitespace-nowrap flex-shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Suspended Bills Quick Bar if any */}
            {suspendedBills.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setIsHeldModalOpen(true)}
                  className="text-[10px] text-amber-400 font-bold hover:underline flex items-center gap-0.5 whitespace-nowrap"
                >
                  <PauseCircle className="w-3 h-3" />
                  <span>Held ({suspendedBills.length}):</span>
                </button>
                {suspendedBills.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleRecallBill(b)}
                    className="px-2 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 rounded text-[10px] font-bold flex items-center gap-1 whitespace-nowrap transition-colors"
                    title={`Click to recall ${b.customerName}'s ticket (${b.items.length} items)`}
                  >
                    <PlayCircle className="w-2.5 h-2.5 text-amber-400" />
                    <span>{b.customerName} ({b.items.length})</span>
                  </button>
                ))}
                {suspendedBills.length > 3 && (
                  <button
                    onClick={() => setIsHeldModalOpen(true)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                  >
                    +{suspendedBills.length - 3} more
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Scrollable Line Items List */}
          <div className="flex-1 overflow-y-auto px-2.5 py-1 divide-y divide-slate-800/60 min-h-[100px]">
            {billItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-6">
                <ShoppingBag className="w-8 h-8 opacity-30 mb-1" />
                <h4 className="text-xs font-bold text-slate-400">Ready for Next Customer</h4>
                <p className="text-[10px] text-slate-500">
                  Scan barcode or tap product from catalog to begin billing.
                </p>
              </div>
            ) : (
              billItems.map((item) => (
                <div key={item.productId} className="py-1.5 flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-lg bg-slate-950 overflow-hidden border border-slate-800 flex-shrink-0">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white truncate">
                      {item.productName}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ₹{item.price} × {item.quantity} ={" "}
                      <strong className="text-emerald-400 font-bold">
                        ₹{item.price * item.quantity}
                      </strong>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateItemQty(item.productId, item.quantity - 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1.5 font-mono font-bold text-xs min-w-[16px] text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItemQty(item.productId, item.quantity + 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 3. DIRECT INLINE PAYMENT & SETTLEMENT PANEL */}
          <div className="p-3 bg-slate-950 border-t-2 border-slate-800 space-y-2.5 flex-shrink-0">
            {/* Grand Total & Discount Bar */}
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Net Amount Payable
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 leading-none mt-0.5">
                  ₹{grandTotal.toLocaleString()}
                </div>
              </div>

              {/* Quick Discount Input */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400 font-semibold">Disc:</span>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-1.5 py-0.5 text-[10px]"
                >
                  <option value="FLAT">₹</option>
                  <option value="PERCENT">%</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={discountVal || ""}
                  onChange={(e) => setDiscountVal(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-12 px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-white font-bold text-right text-[11px] focus:outline-none"
                />
              </div>
            </div>

            {/* Direct Payment Mode Tabs */}
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              {[
                { id: "CASH", label: "Cash", icon: Banknote },
                { id: "UPI", label: "UPI QR", icon: QrCode },
                { id: "CARD", label: "Card", icon: CreditCard },
                { id: "KHATA", label: "Khata", icon: BookOpen },
              ].map((m) => {
                const Icon = m.icon;
                const active = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-xs ${
                      active
                        ? "bg-brand-600 text-white border-brand-400 shadow-md font-extrabold"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Payment Details Container */}
            {paymentMethod === "CASH" && (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold whitespace-nowrap text-[11px]">
                    Cash Recd:
                  </span>
                  <input
                    type="number"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(e.target.value)}
                    placeholder={grandTotal.toString()}
                    className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black text-white focus:outline-none focus:border-brand-500"
                  />
                  {/* Quick cash pills */}
                  {[grandTotal, 100, 200, 500, 1000, 2000]
                    .filter((val, idx, arr) => arr.indexOf(val) === idx && val >= grandTotal)
                    .slice(0, 3)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTenderedAmount(val.toString())}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-[11px]"
                      >
                        ₹{val}
                      </button>
                    ))}
                </div>

                {/* Change Return Display */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="font-bold text-slate-400">Change Return:</span>
                  <span
                    className={`font-black text-xs sm:text-sm ${
                      changeReturn > 0 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    ₹{changeReturn.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === "UPI" && (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">Scan & Pay ₹{grandTotal}</div>
                    <div className="text-[10px] text-amber-400 font-mono">groceryforall@upi</div>
                    <div className="text-[9px] text-slate-400">GPay, PhonePe, Paytm accepted</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800">
                  Active QR
                </span>
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                <CreditCard className="w-5 h-5 text-brand-400" />
                <div className="text-[11px] text-slate-300">
                  Swipe / Tap card on machine for <strong className="text-emerald-400">₹{grandTotal}</strong>.
                </div>
              </div>
            )}

            {paymentMethod === "KHATA" && (
              <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center gap-2 text-xs">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <div className="text-[11px] text-slate-300">
                  Bill of <strong className="text-white">₹{grandTotal}</strong> will be logged under <strong className="text-amber-300">{customerName}</strong>.
                </div>
              </div>
            )}

            {/* WhatsApp Auto-Send Switch & Status */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
              <label className="flex items-center gap-2 text-slate-300 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendWhatsAppOnSettle}
                  onChange={(e) => setSendWhatsAppOnSettle(e.target.checked)}
                  className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Bill</span>
                </span>
              </label>

              {customerPhone && customerPhone.replace(/[^0-9]/g, "").length >= 10 && customerPhone !== "9876543210" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                  <Check className="w-2.5 h-2.5" />
                  +91 {customerPhone.replace(/[^0-9]/g, "").slice(-10)}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">
                  {sendWhatsAppOnSettle ? "Add customer mobile" : "Off"}
                </span>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-12 gap-1.5 pt-1">
              <button
                onClick={handleHoldBill}
                disabled={billItems.length === 0}
                className="col-span-3 py-2 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 disabled:opacity-40 text-amber-300 rounded-xl font-bold text-[11px] transition-colors cursor-pointer"
                title="Hold Bill (F7)"
              >
                Hold (F7)
              </button>

              {/* Main Big Settle & Print Bill Button */}
              <button
                disabled={billItems.length === 0 || isProcessing}
                onClick={handleSettlePayment}
                className="col-span-9 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 hover:scale-[1.01] active:scale-98 transition-all cursor-pointer"
              >
                {sendWhatsAppOnSettle ? (
                  <MessageCircle className="w-4 h-4 fill-white" />
                ) : (
                  <Zap className="w-4 h-4 fill-white" />
                )}
                <span>
                  {isProcessing
                    ? "Generating Bill..."
                    : sendWhatsAppOnSettle
                    ? `Settle & WhatsApp Bill (₹${grandTotal.toLocaleString()}) [F9]`
                    : `Settle & Print Bill (₹${grandTotal.toLocaleString()}) [F9]`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Thermal Receipt / Printable Invoice Modal with WhatsApp Sharing */}
      {isReceiptOpen && currentBillData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-[410px] p-4 sm:p-5 shadow-2xl space-y-2.5 my-auto font-mono text-[11px] border border-slate-100">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 non-printable">
              <span className="font-sans font-bold text-[11px] text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bill Paid &amp; Fulfilled</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-sans font-bold text-[11px] rounded-lg flex items-center gap-1 shadow cursor-pointer transition-colors"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsReceiptOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer Registration / Loyalty Points Notification Banner */}
            {currentBillData.isNewCustomer ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 text-left font-sans text-[11px] flex items-center gap-2 non-printable">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-emerald-900 text-[11px] flex items-center gap-1">
                    <span>New Customer Added!</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                      +50 Bonus Pts
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium truncate">
                    {currentBillData.customerName} ({currentBillData.customerPhone})
                  </p>
                </div>
              </div>
            ) : currentBillData.pointsEarned ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-left font-sans text-[11px] flex items-center justify-between gap-2 non-printable">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-amber-900 text-[11px]">
                      +{currentBillData.pointsEarned} Loyalty Points Credited!
                    </span>
                    <span className="text-[9px] text-amber-700 block">
                      Total Points Balance: {currentBillData.totalCustomerPoints || 0} pts
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  Member Rewards
                </span>
              </div>
            ) : null}

            {/* WhatsApp Digital Bill Sharing Card (Non-Printable) */}
            <div className="bg-slate-950 text-white p-2.5 rounded-xl border border-slate-800 space-y-1.5 font-sans non-printable shadow-md text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Digital Invoice</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
                  className="text-[9px] text-slate-400 hover:text-white underline font-medium cursor-pointer"
                >
                  {showWhatsAppPreview ? "Hide Preview" : "View Message Text"}
                </button>
              </div>

              {/* Phone input and Action Buttons */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Phone className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={receiptWhatsAppPhone}
                    onChange={(e) => setReceiptWhatsAppPhone(e.target.value)}
                    placeholder="Mobile (10 digits)"
                    className="w-full pl-6 pr-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSendWhatsAppBill(
                      receiptWhatsAppPhone || currentBillData.customerPhone,
                      currentBillData
                    )
                  }
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  title="Open WhatsApp with bill"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyWhatsAppText(currentBillData)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors border cursor-pointer ${
                    isCopiedWhatsApp
                      ? "bg-emerald-950 text-emerald-400 border-emerald-700"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                  title="Copy formatted WhatsApp text"
                >
                  {isCopiedWhatsApp ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedWhatsApp ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Collapsible WhatsApp Text Preview */}
              {showWhatsAppPreview && (
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto select-all">
                  {generateWhatsAppMessage(currentBillData)}
                </div>
              )}
            </div>

            {/* Printable Thermal Receipt Container */}
            <div id="thermal-receipt" className="space-y-1.5 text-center text-[10.5px] leading-tight">
              {/* Header */}
              <div className="space-y-0.5">
                <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 font-sans">
                  GROCERY FOR ALL
                </h2>
                <p className="text-[10px] text-slate-600 font-semibold">Super Market • Tetari Bazar</p>
                <p className="text-[9px] text-slate-500 leading-none">
                  Rahul Nagar, Naugarh, Siddharthnagar, UP - 272207
                </p>
                <p className="text-[9px] text-slate-500 leading-none">Phone: +91 98765 43210</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-1 text-left text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill No: {currentBillData.billNumber}</span>
                  <span>{new Date(currentBillData.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date: {new Date(currentBillData.date).toLocaleDateString("en-IN")}</span>
                  <span>Cashier: {currentBillData.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {currentBillData.customerName}</span>
                  <span>{currentBillData.customerPhone}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600">
                    <th className="py-0.5">Item</th>
                    <th className="py-0.5 text-center">Qty</th>
                    <th className="py-0.5 text-right">Rate</th>
                    <th className="py-0.5 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBillData.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-0.5 font-bold text-slate-800 truncate max-w-[140px]">
                        {item.productName}
                      </td>
                      <td className="py-0.5 text-center">{item.quantity}</td>
                      <td className="py-0.5 text-right">₹{item.price}</td>
                      <td className="py-0.5 text-right font-bold">
                        ₹{item.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 pt-1 text-right text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Total Items ({currentBillData.items.reduce((s: any, i: any) => s + i.quantity, 0)} pcs):</span>
                  <span>₹{currentBillData.subtotal}</span>
                </div>
                {currentBillData.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span>-₹{currentBillData.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs sm:text-sm font-black border-t border-slate-300 pt-0.5 text-slate-900">
                  <span>NET PAYABLE:</span>
                  <span>₹{currentBillData.total}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{currentBillData.paymentMethod}</span>
                </div>
                {currentBillData.paymentMethod === "CASH" && (
                  <>
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>Cash Tendered:</span>
                      <span>₹{currentBillData.tenderedAmount || currentBillData.total}</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                      <span>Change Given:</span>
                      <span>₹{currentBillData.changeReturn || 0}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Thank you note */}
              <div className="pt-1 border-t border-dashed border-slate-300 text-[9px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-700 font-sans">
                  Thank You for Shopping at Grocery for All!
                </p>
                <p>Express Home Delivery in Naugarh: 30 Mins</p>
                <p>Visit again • GST Verified Store</p>
              </div>
            </div>

            {/* Next Customer Button */}
            <div className="pt-1 non-printable">
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-sans font-black text-xs rounded-xl shadow transition-colors cursor-pointer"
              >
                Start Next Customer Bill (F2)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Held / Suspended Tickets Management Modal */}
      {isHeldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">
                  Held / Suspended Tickets ({suspendedBills.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {suspendedBills.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Discard all held tickets?")) {
                        setSuspendedBills([]);
                        setIsHeldModalOpen(false);
                      }
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded bg-slate-950 hover:bg-rose-950/50 border border-slate-800"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsHeldModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {suspendedBills.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <PauseCircle className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                  <p className="text-slate-400 font-bold">No tickets currently on hold</p>
                  <p className="text-[11px]">When a customer needs time, click &quot;Hold (F7)&quot; to pause their ticket.</p>
                </div>
              ) : (
                suspendedBills.map((bill, index) => {
                  const billTotal = bill.items.reduce((s, i) => s + i.price * i.quantity, 0);
                  const itemsCount = bill.items.reduce((s, i) => s + i.quantity, 0);

                  return (
                    <div
                      key={bill.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 hover:border-amber-600/50 rounded-2xl space-y-2 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                            #{index + 1} {bill.id}
                          </span>
                          <span className="font-bold text-white text-xs sm:text-sm">
                            {bill.customerName}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            ({bill.customerPhone})
                          </span>
                        </div>
                        <span className="text-slate-500 text-[10px] font-mono">
                          {bill.createdAt}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="bg-slate-900/90 rounded-xl p-2 text-[11px] space-y-1">
                        <div className="text-slate-400 font-semibold flex justify-between">
                          <span>{itemsCount} items:</span>
                          <span className="text-emerald-400 font-bold">Total: ₹{billTotal}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {bill.items.map((it, i) => (
                            <span
                              key={i}
                              className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800 text-[10px]"
                            >
                              {it.productName} × {it.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => handleDeleteHeldBill(bill.id)}
                          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[11px] font-bold p-1 rounded hover:bg-slate-900"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Discard</span>
                        </button>

                        <button
                          onClick={() => handleRecallBill(bill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Recall & Resume Ticket</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex-shrink-0">
              <button
                onClick={() => setIsHeldModalOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
              >
                Close Held List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Daily Counter Stats Modal */}
      {isStatsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Today&apos;s POS Counter Register</h3>
              </div>
              <button
                onClick={() => setIsStatsOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Counter Sales</span>
                <div className="text-xl font-black text-emerald-400">
                  ₹{stats.totalSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Bills Generated</span>
                <div className="text-xl font-black text-white">{stats.totalBills}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cash Collected</span>
                <div className="text-lg font-black text-amber-300">
                  ₹{stats.cashSales.toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase">UPI QR Collection</span>
                <div className="text-lg font-black text-cyan-300">
                  ₹{stats.upiSales.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsStatsOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
            >
              Close Register Stats
            </button>
          </div>
        </div>
      )}

      {/* 6. Keyboard Shortcuts Cheatsheet Modal */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white">
                <Keyboard className="w-4 h-4 text-brand-400" />
                <span>POS Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl">
                <span>Focus Barcode / Search</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">F2</kbd>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl">
                <span>Clear Active Bill</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">F4</kbd>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl">
                <span>Hold / Suspend Bill</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">F7</kbd>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl">
                <span>Settle & Print Bill</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">F9</kbd>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl">
                <span>Close Dialog</span>
                <kbd className="px-2 py-0.5 bg-slate-800 rounded font-mono font-bold text-amber-300">Esc</kbd>
              </div>
            </div>

            <button
              onClick={() => setIsShortcutsOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
