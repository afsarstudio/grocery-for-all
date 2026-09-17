export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  description?: string | null;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  mrp: number;
  stock: number;
  unit: string;
  imageUrl: string;
  badge?: string | null;
  isFeatured: boolean;
  isVegetarian: boolean;
  brand?: string | null;
  categoryId: string;
  category?: Category;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CartItem {
  id: string; // product id
  name: string;
  slug: string;
  price: number;
  mrp: number;
  imageUrl: string;
  unit: string;
  quantity: number;
  stock: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscount: number;
  description?: string | null;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: "PENDING" | "CONFIRMED" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | string;
  paymentMethod: "COD" | "UPI" | "CARD" | string;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  deliverySlot: string;
  notes?: string | null;
  items: OrderItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  password?: string | null;
  address?: string | null;
  city: string;
  pincode: string;
  points: number;
  orders?: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string | Date;
  }> | Order[];
  _count?: {
    orders: number;
  };
  createdAt: string | Date;
}
