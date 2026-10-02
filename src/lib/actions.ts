"use server";

import { revalidatePath } from "next/cache";
import { mockDb, Product, Category, Customer, Order, OrderItem } from "./mockStore";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

// --- CATEGORIES ---
export async function getCategories() {
  const categoriesWithCount = mockDb.categories.map((cat) => {
    const count = mockDb.products.filter((p) => p.categoryId === cat.id).length;
    return {
      ...cat,
      _count: {
        products: count,
      },
    };
  });
  return categoriesWithCount;
}

// --- PRODUCTS ---
export async function getProducts(params?: {
  categoryId?: string;
  categorySlug?: string;
  query?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price_asc" | "price_desc" | "name" | "newest" | "discount";
  inStockOnly?: boolean;
}) {
  let list = [...mockDb.products];

  if (params?.categoryId) {
    list = list.filter((p) => p.categoryId === params.categoryId);
  }

  if (params?.categorySlug) {
    const cat = mockDb.categories.find((c) => c.slug === params.categorySlug);
    if (cat) {
      list = list.filter((p) => p.categoryId === cat.id);
    } else {
      list = [];
    }
  }

  if (params?.featured !== undefined) {
    list = list.filter((p) => p.isFeatured === params.featured);
  }

  if (params?.inStockOnly) {
    list = list.filter((p) => p.stock > 0);
  }

  if (params?.query) {
    const q = params.query.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  if (params?.minPrice !== undefined) {
    list = list.filter((p) => p.price >= params.minPrice!);
  }

  if (params?.maxPrice !== undefined) {
    list = list.filter((p) => p.price <= params.maxPrice!);
  }

  if (params?.sortBy === "price_asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (params?.sortBy === "price_desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (params?.sortBy === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (params?.sortBy === "discount") {
    list.sort((a, b) => (b.mrp - b.price) - (a.mrp - a.price));
  } else {
    // Default: newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list.map((p) => ({
    ...p,
    category: mockDb.categories.find((c) => c.id === p.categoryId),
  }));
}

export async function getProductBySlug(slug: string) {
  const product = mockDb.products.find((p) => p.slug === slug);
  if (!product) return null;
  return {
    ...product,
    category: mockDb.categories.find((c) => c.id === product.categoryId),
  };
}

export async function getFeaturedProducts() {
  const featured = mockDb.products.filter((p) => p.isFeatured).slice(0, 8);
  return featured.map((p) => ({
    ...p,
    category: mockDb.categories.find((c) => c.id === p.categoryId),
  }));
}

// --- ORDERS ---
export async function createOrder(data: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerEmail?: string;
  deliverySlot: string;
  paymentMethod: string;
  notes?: string;
  items: {
    productId?: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
    unit: string;
  }[];
  couponCode?: string;
}) {
  try {
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    if (data.couponCode) {
      const coupon = mockDb.coupons.find(
        (c) => c.code === data.couponCode?.toUpperCase() && c.isActive
      );
      if (coupon && subtotal >= coupon.minOrderAmount) {
        discount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
      }
    }

    const deliveryFee = subtotal >= 499 ? 0 : 40;
    const total = Math.max(0, subtotal - discount + deliveryFee);
    const cleanPhone = data.customerPhone.trim().replace(/[^0-9]/g, "").slice(-10);

    // Find or create customer
    let customer = mockDb.customers.find((c) => c.phone === cleanPhone);
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        name: data.customerName,
        phone: cleanPhone || data.customerPhone,
        email: data.customerEmail || null,
        address: data.customerAddress,
        city: "Naugarh",
        pincode: "272207",
        points: 50,
        createdAt: new Date(),
      };
      mockDb.customers.push(customer);
    }

    // Award loyalty points
    const pointsEarned = Math.max(5, Math.floor(total / 10));
    customer.points = (customer.points || 0) + pointsEarned;
    customer.address = data.customerAddress || customer.address;

    const orderId = `order-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GFA-${randomSuffix}`;

    const newOrderItems: OrderItem[] = data.items.map((item, idx) => {
      // Decrement stock
      if (item.productId) {
        const prod = mockDb.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
      }
      return {
        id: `item-${Date.now()}-${idx}`,
        orderId,
        productId: item.productId || null,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price,
        quantity: item.quantity,
        unit: item.unit,
      };
    });

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: customer.id,
      customerName: data.customerName,
      customerPhone: cleanPhone || data.customerPhone,
      customerAddress: data.customerAddress,
      status: "CONFIRMED",
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "COD" ? "PENDING" : "PAID",
      subtotal,
      deliveryFee,
      discount,
      total,
      deliverySlot: data.deliverySlot,
      notes: data.notes || null,
      items: newOrderItems,
      customer,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDb.orders.unshift(newOrder);

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/customers");
    safeRevalidate("/account");
    safeRevalidate("/orders");

    return { success: true, order: newOrder };
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return { success: false, error: error?.message || "Failed to place order" };
  }
}

export async function getOrders(filterStatus?: string) {
  let list = [...mockDb.orders];
  if (filterStatus && filterStatus !== "ALL") {
    list = list.filter((o) => o.status === filterStatus);
  }
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function getOrderById(id: string) {
  const order = mockDb.orders.find((o) => o.id === id || o.orderNumber === id);
  if (!order) return null;
  const customer = mockDb.customers.find((c) => c.id === order.customerId);
  return {
    ...order,
    customer,
  };
}

export async function updateOrderStatus(orderId: string, status: string, paymentStatus?: string) {
  const order = mockDb.orders.find((o) => o.id === orderId);
  if (!order) return { success: false, error: "Order not found" };

  order.status = status;
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  } else if (status === "DELIVERED") {
    order.paymentStatus = "PAID";
  }
  order.updatedAt = new Date();

  safeRevalidate("/admin/orders");
  safeRevalidate("/admin/sales");
  safeRevalidate("/admin/customers");
  safeRevalidate(`/orders/${orderId}`);
  safeRevalidate(`/orders/${order.orderNumber}`);
  safeRevalidate("/orders");
  safeRevalidate("/account");

  return { success: true, order };
}

// --- ADMIN / PRODUCT CRUD ---
export async function createProduct(formData: {
  name: string;
  description?: string;
  price: number;
  mrp: number;
  stock: number;
  unit: string;
  imageUrl: string;
  badge?: string;
  isFeatured: boolean;
  isVegetarian: boolean;
  brand?: string;
  categoryId: string;
}) {
  try {
    let catId = formData.categoryId;
    if (!catId || !mockDb.categories.find((c) => c.id === catId)) {
      catId = mockDb.categories[0]?.id || "cat-1";
    }

    const cleanBase = (formData.name || "grocery-item")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${cleanBase || "item"}-${Math.random().toString(36).substring(2, 7)}`;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description?.trim() || null,
      price: Number(formData.price) || 0,
      mrp: Number(formData.mrp) || Number(formData.price) || 0,
      stock: Number(formData.stock) >= 0 ? Number(formData.stock) : 50,
      unit: formData.unit?.trim() || "1 unit",
      imageUrl: formData.imageUrl?.trim() || "/images/products/maggi_noodles.svg",
      badge: formData.badge?.trim() || null,
      isFeatured: Boolean(formData.isFeatured),
      isVegetarian: Boolean(formData.isVegetarian),
      brand: formData.brand?.trim() || "Grocery for All",
      categoryId: catId,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    newProd.category = mockDb.categories.find((c) => c.id === catId);
    mockDb.products.unshift(newProd);

    mockDb.inventoryLogs.unshift({
      id: `log-${Date.now()}`,
      productId: newProd.id,
      productName: newProd.name,
      changeAmount: newProd.stock,
      type: "RESTOCK",
      reason: "Initial Product Creation",
      createdAt: new Date(),
    });

    safeRevalidate("/admin/products");
    safeRevalidate("/admin/stock");
    safeRevalidate("/products");
    safeRevalidate("/");

    return { success: true, product: newProd };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return { success: false, error: error?.message || "Failed to create product" };
  }
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    mrp: number;
    stock: number;
    unit: string;
    imageUrl: string;
    badge: string;
    isFeatured: boolean;
    isVegetarian: boolean;
    brand: string;
    categoryId: string;
  }>
) {
  const prod = mockDb.products.find((p) => p.id === id);
  if (!prod) return { success: false, error: "Product not found" };

  if (data.name !== undefined) prod.name = data.name.trim();
  if (data.description !== undefined) prod.description = data.description?.trim() || null;
  if (data.price !== undefined) prod.price = Number(data.price) || 0;
  if (data.mrp !== undefined) prod.mrp = Number(data.mrp) || 0;
  if (data.stock !== undefined) prod.stock = Number(data.stock) >= 0 ? Number(data.stock) : 0;
  if (data.unit !== undefined) prod.unit = data.unit.trim();
  if (data.imageUrl !== undefined) prod.imageUrl = data.imageUrl.trim();
  if (data.badge !== undefined) prod.badge = data.badge?.trim() || null;
  if (data.isFeatured !== undefined) prod.isFeatured = Boolean(data.isFeatured);
  if (data.isVegetarian !== undefined) prod.isVegetarian = Boolean(data.isVegetarian);
  if (data.brand !== undefined) prod.brand = data.brand?.trim() || null;
  if (data.categoryId !== undefined) {
    prod.categoryId = data.categoryId;
    prod.category = mockDb.categories.find((c) => c.id === data.categoryId);
  }
  prod.updatedAt = new Date();

  safeRevalidate("/admin/products");
  safeRevalidate("/admin/stock");
  safeRevalidate("/products");
  safeRevalidate("/");

  return { success: true, product: prod };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  const idx = mockDb.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    mockDb.products.splice(idx, 1);
  }
  safeRevalidate("/admin/products");
  safeRevalidate("/admin/stock");
  safeRevalidate("/products");
  return { success: true };
}

export async function restockProduct(id: string, quantityToAdd: number, reason = "Manual Restock") {
  const prod = mockDb.products.find((p) => p.id === id);
  if (!prod) return { success: false, error: "Product not found" };

  prod.stock += quantityToAdd;
  prod.updatedAt = new Date();

  mockDb.inventoryLogs.unshift({
    id: `log-${Date.now()}`,
    productId: prod.id,
    productName: prod.name,
    changeAmount: quantityToAdd,
    type: quantityToAdd >= 0 ? "RESTOCK" : "CORRECTION",
    reason,
    createdAt: new Date(),
  });

  safeRevalidate("/admin/stock");
  safeRevalidate("/admin/products");
  safeRevalidate("/manager/inventory");
  safeRevalidate("/manager");
  safeRevalidate("/products");

  return { success: true, product: prod };
}

export async function setProductExactStock(
  id: string,
  exactStock: number,
  reason = "Physical Audit / Stock Adjustment"
) {
  const prod = mockDb.products.find((p) => p.id === id);
  if (!prod) return { success: false, error: "Product not found" };

  const targetStock = Math.max(0, exactStock);
  const changeAmount = targetStock - prod.stock;
  prod.stock = targetStock;
  prod.updatedAt = new Date();

  mockDb.inventoryLogs.unshift({
    id: `log-${Date.now()}`,
    productId: prod.id,
    productName: prod.name,
    changeAmount,
    type: changeAmount >= 0 ? "RESTOCK" : "CORRECTION",
    reason,
    createdAt: new Date(),
  });

  safeRevalidate("/admin/stock");
  safeRevalidate("/admin/products");
  safeRevalidate("/manager/inventory");
  safeRevalidate("/manager");
  safeRevalidate("/products");

  return { success: true, product: prod };
}

export async function bulkRestockProducts(
  items: { productId: string; quantityToAdd: number; reason?: string }[]
) {
  if (!items || items.length === 0) {
    return { success: false, error: "No items provided for restocking" };
  }

  const updatedProducts: Product[] = [];

  for (const item of items) {
    if (!item.productId || item.quantityToAdd <= 0) continue;
    const prod = mockDb.products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stock += item.quantityToAdd;
      prod.updatedAt = new Date();
      updatedProducts.push(prod);

      mockDb.inventoryLogs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        changeAmount: item.quantityToAdd,
        type: "RESTOCK",
        reason: item.reason || "AI Visual Batch Restock",
        createdAt: new Date(),
      });
    }
  }

  safeRevalidate("/admin/stock");
  safeRevalidate("/admin/products");
  safeRevalidate("/products");

  return { success: true, count: updatedProducts.length, products: updatedProducts };
}

// --- ADMIN & MANAGER ANALYTICS & KPIS ---
export async function getAdminKPIs() {
  const totalProducts = mockDb.products.length;
  const totalOrders = mockDb.orders.length;
  const customersCount = mockDb.customers.length;
  const lowStockProducts = mockDb.products.filter((p) => p.stock <= 15).length;
  const totalRevenue = mockDb.orders.reduce(
    (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
    0
  );
  const pendingOrdersCount = mockDb.orders.filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKING"
  ).length;

  return {
    totalProducts,
    totalOrders,
    customersCount,
    lowStockProducts,
    totalRevenue,
    pendingOrdersCount,
  };
}

export async function getManagerOverviewData() {
  const totalProducts = mockDb.products.length;
  const totalOrders = mockDb.orders.length;
  const customersCount = mockDb.customers.length;
  const lowStockCount = mockDb.products.filter((p) => p.stock <= 15).length;

  const totalRevenue = mockDb.orders.reduce(
    (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
    0
  );
  const pendingOrdersCount = mockDb.orders.filter(
    (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKING"
  ).length;

  const cashTotal = mockDb.orders
    .filter((o) => (o.paymentMethod === "COD" || o.paymentMethod === "CASH") && o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  const upiTotal = mockDb.orders
    .filter((o) => (o.paymentMethod === "UPI" || o.paymentMethod === "ONLINE") && o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = [...mockDb.orders].slice(0, 30);
  const urgentLowStock = mockDb.products
    .filter((p) => p.stock <= 15)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      unit: p.unit,
      price: p.price,
      mrp: p.mrp,
      imageUrl: p.imageUrl,
      category: mockDb.categories.find((c) => c.id === p.categoryId)
        ? {
            id: p.categoryId,
            name: mockDb.categories.find((c) => c.id === p.categoryId)!.name,
            slug: mockDb.categories.find((c) => c.id === p.categoryId)!.slug,
          }
        : null,
    }));

  return {
    kpis: {
      totalProducts,
      totalOrders,
      customersCount,
      lowStockProducts: lowStockCount,
      totalRevenue,
      pendingOrdersCount,
    },
    orders: recentOrders,
    urgentLowStock,
    cashTotal,
    upiTotal,
  };
}

export async function getCustomers() {
  return mockDb.customers.map((c) => ({
    ...c,
    orders: mockDb.orders
      .filter((o) => o.customerId === c.id || o.customerPhone === c.phone)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
  }));
}

// --- STAFF POS BILLING ACTIONS ---
export async function searchPOSCustomers(query: string) {
  const q = (query || "").trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const found = mockDb.customers.filter(
    (c) => c.phone.includes(q) || c.name.toLowerCase().includes(q)
  );

  return found.slice(0, 8).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    points: c.points || 0,
    address: c.address || "",
    orderCount: mockDb.orders.filter((o) => o.customerId === c.id || o.customerPhone === c.phone).length,
  }));
}

export async function createPOSBill(data: {
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  paymentMethod: "CASH" | "UPI" | "CARD" | "KHATA";
  items: {
    productId?: string;
    productName: string;
    productImage: string;
    price: number;
    mrp?: number;
    quantity: number;
    unit: string;
  }[];
  subtotal: number;
  discount?: number;
  total: number;
  tenderedAmount?: number;
  changeReturn?: number;
  notes?: string;
}) {
  try {
    const billNumber = `POS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const rawPhone = (data.customerPhone || "9999999999").trim().replace(/[^0-9]/g, "");
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone || "9999999999";
    const custName = (data.customerName || "Walk-in Customer").trim();
    const address = (data.customerAddress || "Naugarh Store Counter").trim();
    const pointsEarned = Math.max(5, Math.floor((data.total || 0) / 100) * 5);

    let isNewCustomer = false;
    let customer = mockDb.customers.find((c) => c.phone === phone);

    if (!customer) {
      isNewCustomer = true;
      customer = {
        id: `cust-${Date.now()}`,
        name: custName,
        phone,
        password: "123456",
        email: null,
        address,
        city: "Naugarh",
        pincode: "272207",
        points: 50 + pointsEarned,
        createdAt: new Date(),
      };
      mockDb.customers.push(customer);
    } else {
      if ((customer.name === "Walk-in Customer" || !customer.name) && custName !== "Walk-in Customer") {
        customer.name = custName;
      }
      customer.points = (customer.points || 0) + pointsEarned;
    }

    const orderId = `pos-order-${Date.now()}`;
    const orderItems: OrderItem[] = data.items.map((item, idx) => {
      if (item.productId) {
        const prod = mockDb.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          mockDb.inventoryLogs.unshift({
            id: `log-${Date.now()}-${idx}`,
            productId: prod.id,
            productName: item.productName,
            changeAmount: -item.quantity,
            type: "SALE",
            reason: `POS Counter Bill #${billNumber}`,
            createdAt: new Date(),
          });
        }
      }
      return {
        id: `item-${Date.now()}-${idx}`,
        orderId,
        productId: item.productId || null,
        productName: item.productName,
        productImage: item.productImage || "/images/products/maggi_noodles.svg",
        price: item.price,
        quantity: item.quantity,
        unit: item.unit || "1 unit",
      };
    });

    const newOrder: Order = {
      id: orderId,
      orderNumber: billNumber,
      customerId: customer.id,
      customerName: custName,
      customerPhone: phone,
      customerAddress: address,
      status: "DELIVERED",
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === "KHATA" ? "PENDING" : "PAID",
      subtotal: data.subtotal,
      deliveryFee: 0,
      discount: data.discount || 0,
      total: data.total,
      deliverySlot: "Store Counter Pickup",
      notes: data.notes || `Billed by ${data.cashierName || "Staff Cashier"} (Tendered: ₹${data.tenderedAmount || data.total}, Change: ₹${data.changeReturn || 0})`,
      items: orderItems,
      customer,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDb.orders.unshift(newOrder);

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/customers");
    safeRevalidate("/manager/customers");
    safeRevalidate("/products");

    return {
      success: true,
      orderNumber: billNumber,
      order: newOrder,
      billData: {
        billNumber,
        customerName: custName,
        customerPhone: phone,
        cashierName: data.cashierName || "Staff Cashier",
        date: new Date().toISOString(),
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        total: data.total,
        paymentMethod: data.paymentMethod,
        tenderedAmount: data.tenderedAmount,
        changeReturn: data.changeReturn,
        isNewCustomer,
        pointsEarned,
        totalCustomerPoints: customer.points,
      },
    };
  } catch (error: any) {
    console.error("Error creating POS bill:", error);
    return { success: false, error: error?.message || "Failed to generate POS bill" };
  }
}

export async function getPOSCounterStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = mockDb.orders.filter(
    (o) => new Date(o.createdAt) >= today && o.status !== "CANCELLED"
  );

  const totalBills = todayOrders.length;
  const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const cashSales = todayOrders
    .filter((o) => o.paymentMethod === "CASH" || o.paymentMethod === "COD")
    .reduce((sum, o) => sum + o.total, 0);
  const upiSales = todayOrders
    .filter((o) => o.paymentMethod === "UPI" || o.paymentMethod === "ONLINE")
    .reduce((sum, o) => sum + o.total, 0);
  const cardSales = todayOrders
    .filter((o) => o.paymentMethod === "CARD")
    .reduce((sum, o) => sum + o.total, 0);
  const itemsSold = todayOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  return {
    totalBills,
    totalSales,
    cashSales,
    upiSales,
    cardSales,
    itemsSold,
  };
}

// --- CUSTOMER AUTH, PROFILE & LOYALTY POINTS ---
export async function customerSignup(data: {
  name: string;
  phone: string;
  password?: string;
  address?: string;
  email?: string;
}) {
  try {
    const cleanPhone = data.phone.trim().replace(/[^0-9]/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }
    if (!data.name.trim()) {
      return { success: false, error: "Please enter your full name." };
    }

    const trimmedPassword = data.password?.trim() || "123456";

    if (trimmedPassword === cleanPhone) {
      return {
        success: false,
        error: "Security Alert: Mobile number and password cannot be identical! Please choose a different password/PIN.",
      };
    }

    // Check existing
    const existing = mockDb.customers.find((c) => c.phone === cleanPhone);
    if (existing) {
      return {
        success: false,
        error: `This mobile number (+91 ${cleanPhone}) is already registered! Please Sign In.`,
      };
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name.trim(),
      phone: cleanPhone,
      password: trimmedPassword,
      address: data.address?.trim() || "Naugarh, Tetari Bazar, UP",
      email: data.email?.trim() || null,
      city: "Naugarh",
      pincode: "272207",
      points: 50,
      createdAt: new Date(),
    };

    mockDb.customers.unshift(newCustomer);

    safeRevalidate("/admin/customers");
    safeRevalidate("/account");

    return {
      success: true,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        city: newCustomer.city,
        pincode: newCustomer.pincode,
        points: newCustomer.points,
        ordersCount: 0,
        recentOrders: [],
        createdAt: newCustomer.createdAt,
      },
      message: "Account created successfully! 50 Welcome Reward Points (₹50 discount) have been added to your wallet 🎉",
    };
  } catch (error: any) {
    console.error("Customer signup error:", error);
    return { success: false, error: error?.message || "Failed to create account" };
  }
}

export async function customerLogin(data: { phone: string; password?: string }) {
  try {
    const cleanPhone = data.phone.trim().replace(/[^0-9]/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }

    const userPass = data.password?.trim() || "123456";

    if (userPass === cleanPhone) {
      return {
        success: false,
        error: "Security Alert: Mobile number and password cannot be identical! Please enter your valid password.",
      };
    }

    let customer = mockDb.customers.find((c) => c.phone === cleanPhone);

    // Auto-create demo customer if 9838012345 or not found
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        name: cleanPhone === "9838012345" ? "Rajesh Verma" : "Customer (+91 " + cleanPhone + ")",
        phone: cleanPhone,
        password: userPass,
        email: null,
        address: "Tetari Bazar, Naugarh",
        city: "Naugarh",
        pincode: "272207",
        points: 50,
        createdAt: new Date(),
      };
      mockDb.customers.push(customer);
    }

    const customerPass = customer.password || "123456";
    if (customerPass !== userPass) {
      return {
        success: false,
        error: "Incorrect Password/PIN! Please enter the correct password (Default PIN: 123456).",
      };
    }

    const customerOrders = mockDb.orders.filter(
      (o) => o.customerId === customer!.id || o.customerPhone === customer!.phone
    );

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        pincode: customer.pincode,
        points: customer.points || 0,
        ordersCount: customerOrders.length,
        recentOrders: customerOrders.slice(0, 5),
        createdAt: customer.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Customer login error:", error);
    return { success: false, error: error?.message || "Failed to log in" };
  }
}

export async function getCustomerProfile(phoneOrId: string) {
  const clean = phoneOrId.trim().replace(/[^0-9]/g, "").slice(-10);
  const customer = mockDb.customers.find(
    (c) => c.id === phoneOrId || c.phone === clean || c.phone === phoneOrId
  );
  if (!customer) return null;

  const orders = mockDb.orders.filter(
    (o) => o.customerId === customer.id || o.customerPhone === customer.phone
  );

  const totalSpent = orders.reduce(
    (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
    0
  );

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    city: customer.city,
    pincode: customer.pincode,
    points: customer.points || 0,
    ordersCount: orders.length,
    totalSpent,
    orders,
    createdAt: customer.createdAt,
  };
}

export async function getCustomerOrders(phoneOrId: string) {
  const clean = phoneOrId.trim().replace(/[^0-9]/g, "").slice(-10);
  return mockDb.orders.filter(
    (o) =>
      o.customerId === phoneOrId ||
      o.customerPhone === clean ||
      o.customerPhone === phoneOrId
  );
}

export async function updateCustomerProfile(
  id: string,
  data: { name?: string; address?: string; email?: string }
) {
  const customer = mockDb.customers.find((c) => c.id === id);
  if (!customer) return { success: false, error: "Customer not found" };

  if (data.name !== undefined) customer.name = data.name.trim();
  if (data.address !== undefined) customer.address = data.address.trim();
  if (data.email !== undefined) customer.email = data.email?.trim() || null;

  safeRevalidate("/account");
  safeRevalidate("/admin/customers");

  return { success: true, customer };
}

export async function updateProductPrice(productId: string, price: number, mrp: number) {
  const prod = mockDb.products.find((p) => p.id === productId);
  if (!prod) return { success: false, error: "Product not found" };

  prod.price = Math.max(0, price);
  prod.mrp = Math.max(price, mrp);
  prod.updatedAt = new Date();

  safeRevalidate("/products");
  safeRevalidate("/manager/inventory");
  safeRevalidate("/admin/products");

  return { success: true, product: prod };
}

export async function assignOrderRider(orderId: string, riderName: string, riderPhone?: string) {
  const order = mockDb.orders.find((o) => o.id === orderId);
  if (!order) return { success: false, error: "Order not found" };

  const riderTag = `[Rider: ${riderName}${riderPhone ? ` (${riderPhone})` : ""}]`;
  const newNotes = order.notes ? `${order.notes} | ${riderTag}` : riderTag;

  order.notes = newNotes;
  if (order.status === "PENDING" || order.status === "CONFIRMED" || order.status === "PACKING") {
    order.status = "OUT_FOR_DELIVERY";
  }
  order.updatedAt = new Date();

  safeRevalidate("/manager/orders");
  safeRevalidate("/manager/dispatch");
  safeRevalidate("/orders");

  return { success: true, order };
}
