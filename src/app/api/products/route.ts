import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/actions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() || undefined;
  const categorySlug = searchParams.get("category") || undefined;

  try {
    const products = await getProducts({
      query,
      categorySlug,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
