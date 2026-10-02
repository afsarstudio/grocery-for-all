import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/mockStore";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const subtotalStr = searchParams.get("subtotal");
  const subtotal = subtotalStr ? parseFloat(subtotalStr) : 0;

  if (!code) {
    return NextResponse.json({ valid: false, message: "Coupon code is required" }, { status: 400 });
  }

  try {
    const coupon = mockDb.coupons.find((c) => c.code === code);

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ valid: false, message: "Invalid or expired coupon code" }, { status: 404 });
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order amount for ${coupon.code} is ₹${coupon.minOrderAmount}. Add ₹${(coupon.minOrderAmount - subtotal).toFixed(0)} more.`,
        },
        { status: 400 }
      );
    }

    const calculatedDiscount = Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);

    return NextResponse.json({
      valid: true,
      coupon,
      discount: calculatedDiscount,
      message: `Coupon ${coupon.code} applied successfully! You saved ₹${calculatedDiscount.toFixed(0)}.`,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ valid: false, message: "Failed to validate coupon" }, { status: 500 });
  }
}
