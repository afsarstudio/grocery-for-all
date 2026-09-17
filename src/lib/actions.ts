"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

// --- CATEGORIES ---
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
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
  try {
    const where: any = {};

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.categorySlug) {
      where.category = { slug: params.categorySlug };
    }

    if (params?.featured !== undefined) {
      where.isFeatured = params.featured;
    }

    if (params?.inStockOnly) {
      where.stock = { gt: 0 };
    }

    if (params?.query) {
      where.OR = [
        { name: { contains: params.query } },
        { description: { contains: params.query } },
        { brand: { contains: params.query } },
      ];
    }

    if (params?.minPrice !== undefined || params?.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) where.price.gte = params.minPrice;
      if (params.maxPrice !== undefined) where.price.lte = params.maxPrice;
    }

    let orderBy: any = { createdAt: "desc" };
    if (params?.sortBy === "price_asc") orderBy = { price: "asc" };
    if (params?.sortBy === "price_desc") orderBy = { price: "desc" };
    if (params?.sortBy === "name") orderBy = { name: "asc" };
    if (params?.sortBy === "newest") orderBy = { createdAt: "desc" };

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
    });

    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    return product;
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

export async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: { category: true },
      take: 8,
    });
    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
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
    // 1. Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discount = 0;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
        discount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
      }
    }

    const deliveryFee = subtotal >= 499 ? 0 : 40;
    const total = Math.max(0, subtotal - discount + deliveryFee);

    // 2. Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone: data.customerPhone },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail || null,
          address: data.customerAddress,
        },
      });
    }

    // 3. Validate product IDs to avoid Foreign Key constraint violations if products were re-seeded
    const validatedItems = await Promise.all(
      data.items.map(async (item) => {
        let validProductId: string | null = null;

        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          if (product) {
            validProductId = product.id;
          }
        }

        // Fallback: match by name if previous ID was outdated
        if (!validProductId && item.productName) {
          const productByName = await prisma.product.findFirst({
            where: { name: item.productName },
          });
          if (productByName) {
            validProductId = productByName.id;
          }
        }

        return {
          ...item,
          productId: validProductId,
        };
      })
    );

    // 4. Generate human-readable Order Number (e.g. GFA-8045)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `GFA-${randomSuffix}`;

    // 5. Create Order and OrderItems in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
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
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productImage: item.productImage,
              price: item.price,
              quantity: item.quantity,
              unit: item.unit,
            })),
          },
        },
        include: { items: true },
      });

      // Update product stocks
      for (const item of validatedItems) {
        if (item.productId) {
          await tx.product
            .update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            })
            .catch((err) =>
              console.warn("Could not decrement stock for", item.productId, err)
            );
        }
      }

      // Award loyalty points (1 point per ₹10 spent)
      const pointsEarned = Math.max(5, Math.floor(total / 10));
      await tx.customer
        .update({
          where: { id: customer.id },
          data: {
            points: { increment: pointsEarned },
            address: data.customerAddress || customer.address,
          },
        })
        .catch((err) => console.warn("Could not award loyalty points", err));

      return newOrder;
    });

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/customers");
    safeRevalidate("/account");
    safeRevalidate("/orders");

    return { success: true, order };
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return { success: false, error: error?.message || "Failed to place order" };
  }
}

export async function getOrders(filterStatus?: string) {
  try {
    const where: any = {};
    if (filterStatus && filterStatus !== "ALL") {
      where.status = filterStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        customer: true,
      },
    });
    return order;
  } catch (error) {
    console.error("Error fetching order by id:", error);
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: string, paymentStatus?: string) {
  try {
    const data: any = { status };
    if (paymentStatus) {
      data.paymentStatus = paymentStatus;
    } else if (status === "DELIVERED") {
      data.paymentStatus = "PAID";
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true },
    });

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/sales");
    safeRevalidate("/admin/customers");
    safeRevalidate(`/orders/${orderId}`);
    safeRevalidate(`/orders/${updated.orderNumber}`);
    safeRevalidate("/orders");
    safeRevalidate("/account");
    return { success: true, order: updated };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { success: false, error: error?.message || "Failed to update order" };
  }
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
    // 1. Ensure valid Category
    let catId = formData.categoryId;
    if (!catId) {
      const firstCat = await prisma.category.findFirst();
      if (firstCat) {
        catId = firstCat.id;
      } else {
        const newCat = await prisma.category.create({
          data: {
            name: "Grocery & Staples",
            slug: "grocery-staples",
            icon: "🌾",
            description: "Daily supermarket staples",
          },
        });
        catId = newCat.id;
      }
    } else {
      const catExists = await prisma.category.findUnique({ where: { id: catId } });
      if (!catExists) {
        const firstCat = await prisma.category.findFirst();
        if (firstCat) catId = firstCat.id;
      }
    }

    // 2. Safe slug generation
    let cleanBase = (formData.name || "grocery-item")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!cleanBase || cleanBase.length < 2) {
      cleanBase = "item-" + Date.now().toString(36);
    }
    const slug = `${cleanBase}-${Math.random().toString(36).substring(2, 7)}`;

    const price = Number(formData.price) || 0;
    const mrp = Number(formData.mrp) || price;
    const stock = Number(formData.stock) >= 0 ? Number(formData.stock) : 50;
    const unit = formData.unit?.trim() || "1 unit";
    const imageUrl = formData.imageUrl?.trim() || "/images/products/maggi_noodles.svg";

    const product = await prisma.product.create({
      data: {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price,
        mrp,
        stock,
        unit,
        imageUrl,
        badge: formData.badge?.trim() || null,
        isFeatured: Boolean(formData.isFeatured),
        isVegetarian: Boolean(formData.isVegetarian),
        brand: formData.brand?.trim() || "Grocery for All",
        categoryId: catId,
        slug,
      },
      include: {
        category: true,
      },
    });

    try {
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          productName: product.name,
          changeAmount: product.stock,
          type: "RESTOCK",
          reason: "Initial Product Creation",
        },
      });
    } catch (logErr) {
      console.warn("Failed to create inventory log:", logErr);
    }

    safeRevalidate("/admin/products");
    safeRevalidate("/admin/stock");
    safeRevalidate("/products");
    safeRevalidate("/");
    return { success: true, product };
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
  try {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.price !== undefined) updateData.price = Number(data.price) || 0;
    if (data.mrp !== undefined) updateData.mrp = Number(data.mrp) || 0;
    if (data.stock !== undefined) updateData.stock = Number(data.stock) >= 0 ? Number(data.stock) : 0;
    if (data.unit !== undefined) updateData.unit = data.unit.trim();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl.trim();
    if (data.badge !== undefined) updateData.badge = data.badge?.trim() || null;
    if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);
    if (data.isVegetarian !== undefined) updateData.isVegetarian = Boolean(data.isVegetarian);
    if (data.brand !== undefined) updateData.brand = data.brand?.trim() || null;
    if (data.categoryId !== undefined && data.categoryId) updateData.categoryId = data.categoryId;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    safeRevalidate("/admin/products");
    safeRevalidate("/admin/stock");
    safeRevalidate("/products");
    safeRevalidate("/");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { success: false, error: error?.message || "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/stock");
    safeRevalidate("/products");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return { success: false, error: error?.message || "Failed to delete product" };
  }
}

export async function restockProduct(id: string, quantityToAdd: number, reason = "Manual Restock") {
  try {
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Product not found" };

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: { increment: quantityToAdd },
      },
    });

    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        productName: product.name,
        changeAmount: quantityToAdd,
        type: quantityToAdd >= 0 ? "RESTOCK" : "CORRECTION",
        reason,
      },
    });

    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/products");
    safeRevalidate("/manager/inventory");
    safeRevalidate("/manager");
    safeRevalidate("/products");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error restocking product:", error);
    return { success: false, error: error?.message || "Failed to restock" };
  }
}

export async function setProductExactStock(id: string, exactStock: number, reason = "Physical Audit / Stock Adjustment") {
  try {
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Product not found" };

    const targetStock = Math.max(0, exactStock);
    const changeAmount = targetStock - current.stock;

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: targetStock,
      },
    });

    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        productName: product.name,
        changeAmount,
        type: changeAmount >= 0 ? "RESTOCK" : "CORRECTION",
        reason,
      },
    });

    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/products");
    safeRevalidate("/manager/inventory");
    safeRevalidate("/manager");
    safeRevalidate("/products");
    return { success: true, product };
  } catch (error: any) {
    console.error("Error setting exact stock:", error);
    return { success: false, error: error?.message || "Failed to adjust stock" };
  }
}

export async function bulkRestockProducts(
  items: { productId: string; quantityToAdd: number; reason?: string }[]
) {
  try {
    if (!items || items.length === 0) {
      return { success: false, error: "No items provided for restocking" };
    }

    const updatedProducts: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (!item.productId || item.quantityToAdd <= 0) continue;

        const updated = await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantityToAdd },
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: updated.id,
            productName: updated.name,
            changeAmount: item.quantityToAdd,
            type: "RESTOCK",
            reason: item.reason || "AI Visual Batch Restock",
          },
        });

        updatedProducts.push(updated);
      }
    });

    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true, count: updatedProducts.length, products: updatedProducts };
  } catch (error: any) {
    console.error("Error bulk restocking products:", error);
    return { success: false, error: error?.message || "Failed to bulk restock" };
  }
}


// --- ADMIN & MANAGER ANALYTICS & KPIS ---
export async function getAdminKPIs() {
  try {
    const [totalProducts, totalOrders, customersCount, lowStockProducts, orders] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.product.count({ where: { stock: { lte: 15 } } }),
      prisma.order.findMany({ select: { total: true, status: true, createdAt: true } }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum), 0);
    const pendingOrdersCount = orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKING").length;

    return {
      totalProducts,
      totalOrders,
      customersCount,
      lowStockProducts,
      totalRevenue,
      pendingOrdersCount,
    };
  } catch (error) {
    console.error("Error fetching admin KPIs:", error);
    return {
      totalProducts: 0,
      totalOrders: 0,
      customersCount: 0,
      lowStockProducts: 0,
      totalRevenue: 0,
      pendingOrdersCount: 0,
    };
  }
}

export async function getManagerOverviewData() {
  try {
    const [
      totalProducts,
      totalOrders,
      customersCount,
      lowStockCount,
      ordersSummary,
      recentOrders,
      urgentLowStock,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.customer.count(),
      prisma.product.count({ where: { stock: { lte: 15 } } }),
      prisma.order.findMany({ select: { total: true, status: true, paymentMethod: true } }),
      prisma.order.findMany({
        take: 30,
        include: { items: true, customer: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 15 } },
        take: 10,
        select: {
          id: true,
          name: true,
          stock: true,
          unit: true,
          price: true,
          mrp: true,
          imageUrl: true,
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { stock: "asc" },
      }),
    ]);

    const totalRevenue = ordersSummary.reduce(
      (sum, o) => (o.status !== "CANCELLED" ? sum + o.total : sum),
      0
    );
    const pendingOrdersCount = ordersSummary.filter(
      (o) => o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PACKING"
    ).length;

    const cashTotal = ordersSummary
      .filter((o) => (o.paymentMethod === "COD" || o.paymentMethod === "CASH") && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0);

    const upiTotal = ordersSummary
      .filter((o) => (o.paymentMethod === "UPI" || o.paymentMethod === "ONLINE") && o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0);

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
  } catch (error) {
    console.error("Error fetching manager overview data:", error);
    return null;
  }
}

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

// --- STAFF POS BILLING ACTIONS ---
export async function searchPOSCustomers(query: string) {
  try {
    const q = (query || "").trim();
    if (!q || q.length < 2) return [];

    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: q } },
          { name: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        points: true,
        address: true,
        _count: {
          select: { orders: true },
        },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      points: c.points || 0,
      address: c.address || "",
      orderCount: c._count.orders,
    }));
  } catch (error) {
    console.error("Error searching POS customers:", error);
    return [];
  }
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
    const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : (rawPhone || "9999999999");
    const custName = (data.customerName || "Walk-in Customer").trim();
    const address = (data.customerAddress || "Naugarh Store Counter").trim();
    const pointsEarned = Math.max(5, Math.floor((data.total || 0) / 100) * 5); // 5 pts per ₹100 spent

    // 1. Find or create customer
    let isNewCustomer = false;
    let customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      isNewCustomer = true;
      customer = await prisma.customer.create({
        data: {
          name: custName,
          phone,
          address,
          city: "Naugarh",
          pincode: "272207",
          points: 50 + pointsEarned, // 50 Welcome Points + Points earned on first bill
        },
      });
    } else {
      // Update customer if they previously had Walk-in Customer name or add points
      const shouldUpdateName = (customer.name === "Walk-in Customer" || !customer.name) && custName !== "Walk-in Customer";
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          ...(shouldUpdateName ? { name: custName } : {}),
          points: { increment: pointsEarned },
        },
      });
    }

    // 2. Validate product references & create order with stock deduction in transaction
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: billNumber,
          customerId: customer.id,
          customerName: custName,
          customerPhone: phone,
          customerAddress: address,
          status: "DELIVERED", // Counter sale is immediately fulfilled
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentMethod === "KHATA" ? "PENDING" : "PAID",
          subtotal: data.subtotal,
          deliveryFee: 0,
          discount: data.discount || 0,
          total: data.total,
          deliverySlot: "Store Counter Pickup",
          notes: data.notes || `Billed by ${data.cashierName || "Staff Cashier"} (Tendered: ₹${data.tenderedAmount || data.total}, Change: ₹${data.changeReturn || 0})`,
        },
      });

      for (const item of data.items) {
        let validProductId: string | null = null;
        if (item.productId) {
          const exists = await tx.product.findUnique({ where: { id: item.productId } });
          if (exists) validProductId = exists.id;
        }

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: validProductId,
            productName: item.productName,
            productImage: item.productImage || "/images/products/maggi_noodles.svg",
            price: item.price,
            quantity: item.quantity,
            unit: item.unit || "1 unit",
          },
        });

        // Decrement stock & log sale
        if (validProductId) {
          await tx.product.update({
            where: { id: validProductId },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: validProductId,
              productName: item.productName,
              changeAmount: -item.quantity,
              type: "SALE",
              reason: `POS Counter Bill #${billNumber}`,
            },
          });
        }
      }

      return order;
    });

    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/stock");
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/customers");
    safeRevalidate("/manager/customers");
    safeRevalidate("/products");

    return {
      success: true,
      orderNumber: billNumber,
      order: createdOrder,
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
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: today },
        status: { not: "CANCELLED" },
      },
      include: { items: true },
    });

    const totalBills = todayOrders.length;
    const totalSales = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const cashSales = todayOrders.filter((o) => o.paymentMethod === "CASH").reduce((sum, o) => sum + o.total, 0);
    const upiSales = todayOrders.filter((o) => o.paymentMethod === "UPI").reduce((sum, o) => sum + o.total, 0);
    const cardSales = todayOrders.filter((o) => o.paymentMethod === "CARD").reduce((sum, o) => sum + o.total, 0);
    const itemsSold = todayOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    return {
      totalBills,
      totalSales,
      cashSales,
      upiSales,
      cardSales,
      itemsSold,
    };
  } catch (error) {
    console.error("Error fetching POS stats:", error);
    return {
      totalBills: 0,
      totalSales: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      itemsSold: 0,
    };
  }
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

    // Prevent password being identical to mobile number
    if (trimmedPassword === cleanPhone) {
      return {
        success: false,
        error: "Security Alert: Mobile number and password cannot be identical! Please choose a different password/PIN.",
      };
    }

    // Check if customer already exists
    const existing = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: { contains: cleanPhone } },
          { phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` },
          { phone: `+91${cleanPhone}` },
          { phone: `+91 ${cleanPhone}` },
        ],
      },
    });

    if (existing) {
      return {
        success: false,
        error: `This mobile number (+91 ${cleanPhone}) is already registered! Please Sign In.`,
      };
    }

    // Create new customer with 50 Welcome Points
    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: cleanPhone,
        password: trimmedPassword,
        address: data.address?.trim() || "Naugarh, Tetari Bazar, UP",
        email: data.email?.trim() || null,
        city: "Naugarh",
        pincode: "272207",
        points: 50, // 50 Welcome Reward Points
      },
      include: {
        _count: { select: { orders: true } },
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    safeRevalidate("/admin/customers");
    safeRevalidate("/account");

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
        points: customer.points,
        ordersCount: customer._count.orders,
        recentOrders: customer.orders,
        createdAt: customer.createdAt,
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

    // Security check: phone and password identical
    if (userPass === cleanPhone) {
      return {
        success: false,
        error: "Security Alert: Mobile number and password cannot be identical! Please enter your valid password.",
      };
    }

    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: { contains: cleanPhone } },
          { phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` },
          { phone: `+91${cleanPhone}` },
          { phone: `+91 ${cleanPhone}` },
        ],
      },
      include: {
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    // Auto-create demo customer if 9838012345 doesn't exist
    if (!customer && cleanPhone === "9838012345") {
      customer = await prisma.customer.create({
        data: {
          name: "Rajesh Verma (Demo)",
          phone: "9838012345",
          password: "123456",
          email: "rajesh.verma@example.com",
          address: "House 42, Tetari Bazar Main Road, Naugarh",
          city: "Naugarh",
          pincode: "272207",
          points: 50,
        },
        include: {
          _count: { select: { orders: true } },
          orders: {
            orderBy: { createdAt: "desc" },
            include: { items: true },
          },
        },
      });
    }

    if (!customer) {
      return {
        success: false,
        error: `This mobile number (+91 ${cleanPhone}) is not registered! Please create a New Account first.`,
      };
    }

    const customerPass = customer.password || "123456";
    
    if (customerPass !== userPass) {
      return {
        success: false,
        error: "Incorrect Password/PIN! Please enter the correct password (Default PIN: 123456).",
      };
    }

    // If customer had non-normalized phone, update it
    if (customer.phone !== cleanPhone) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone: cleanPhone },
      });
    }

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
        ordersCount: customer._count.orders,
        recentOrders: customer.orders.slice(0, 5),
        createdAt: customer.createdAt,
      },
    };
  } catch (error: any) {
    console.error("Customer login error:", error);
    return { success: false, error: error?.message || "Failed to log in" };
  }
}

export async function getCustomerProfile(phoneOrId: string) {
  try {
    const clean = phoneOrId.trim().replace(/[^0-9]/g, "").slice(-10);

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [{ id: phoneOrId }, { phone: clean }, { phone: phoneOrId }],
      },
      include: {
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!customer) return null;

    const totalSpent = customer.orders.reduce(
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
      ordersCount: customer._count.orders,
      totalSpent,
      orders: customer.orders,
      createdAt: customer.createdAt,
    };
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return null;
  }
}

export async function getCustomerOrders(phoneOrId: string) {
  try {
    const clean = phoneOrId.trim().replace(/[^0-9]/g, "").slice(-10);

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { customerId: phoneOrId },
          { customerPhone: clean },
          { customerPhone: phoneOrId },
          { customer: { phone: clean } },
        ],
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}

export async function updateCustomerProfile(
  id: string,
  data: { name?: string; address?: string; email?: string }
) {
  try {
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        address: data.address?.trim(),
        email: data.email?.trim() || null,
      },
    });

    safeRevalidate("/account");
    safeRevalidate("/admin/customers");
    return { success: true, customer: updated };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error?.message || "Failed to update profile" };
  }
}

export async function updateProductPrice(productId: string, price: number, mrp: number) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        price: Math.max(0, price),
        mrp: Math.max(price, mrp),
      },
    });

    safeRevalidate("/products");
    safeRevalidate("/manager/inventory");
    safeRevalidate("/admin/products");
    return { success: true, product: updated };
  } catch (error: any) {
    console.error("Error updating product price:", error);
    return { success: false, error: error?.message || "Failed to update price" };
  }
}

export async function assignOrderRider(orderId: string, riderName: string, riderPhone?: string) {
  try {
    const current = await prisma.order.findUnique({ where: { id: orderId } });
    if (!current) return { success: false, error: "Order not found" };

    const riderTag = `[Rider: ${riderName}${riderPhone ? ` (${riderPhone})` : ""}]`;
    let newNotes = current.notes ? `${current.notes} | ${riderTag}` : riderTag;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        notes: newNotes,
        status: current.status === "PENDING" || current.status === "CONFIRMED" || current.status === "PACKING" ? "OUT_FOR_DELIVERY" : current.status,
      },
      include: { items: true, customer: true },
    });

    safeRevalidate("/manager/orders");
    safeRevalidate("/manager/dispatch");
    safeRevalidate("/orders");
    return { success: true, order: updated };
  } catch (error: any) {
    console.error("Error assigning rider:", error);
    return { success: false, error: error?.message || "Failed to assign rider" };
  }
}


