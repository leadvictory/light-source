import { supabase } from "../supabase"

export interface ClientPortalData {
  totalProducts: number
  totalOrders: number
  recentOrders: any[]
  productCategories: string[]
}

export async function getClientPortalData(clientId: string): Promise<ClientPortalData> {
  try {
    const results = await Promise.allSettled([
      // Get total products assigned to client
      supabase
        .from("client_products")
        .select("id", { count: "exact" })
        .eq("client_id", clientId),

      // Get total orders for client
      supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("client_id", clientId),

      // Get recent orders
      supabase
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          order_items(
            id,
            quantity,
            unit_price,
            case_price,
            product:products(name, sku)
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5),

      // Get product categories for assigned products
      supabase
        .from("client_products")
        .select(`
          product:products(category)
        `)
        .eq("client_id", clientId),
    ])

    // Handle results with fallbacks
    const totalProducts = results[0].status === "fulfilled" ? results[0].value.count || 0 : 0

    const totalOrders = results[1].status === "fulfilled" ? results[1].value.count || 0 : 0

    const recentOrders = results[2].status === "fulfilled" ? results[2].value.data || [] : []

    const categoryData = results[3].status === "fulfilled" ? results[3].value.data || [] : []
    const productCategories = [
      ...new Set(
        categoryData
          .map((item: any) => item.product?.category)
          .filter(Boolean)
          .sort(),
      ),
    ]

    return {
      totalProducts,
      totalOrders,
      recentOrders,
      productCategories,
    }
  } catch (error) {
    console.error("Error fetching client portal data:", error)
    return {
      totalProducts: 0,
      totalOrders: 0,
      recentOrders: [],
      productCategories: [],
    }
  }
}

export async function getClientProducts(clientId: string, filters?: { search?: string; category?: string }) {
  try {
    const query = supabase
      .from("client_products")
      .select(`
        id,
        product:products(
          id,
          sku,
          name,
          description,
          category,
          subcategory,
          unit_price,
          case_price,
          units_per_case,
          image_url,
          specifications
        )
      `)
      .eq("client_id", clientId)

    const { data, error } = await query

    if (error) {
      console.error("Error fetching client products:", error)
      return []
    }

    let products = (data || []).map((item) => item.product).filter(Boolean)

    // Apply filters
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      products = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower),
      )
    }

    if (filters?.category && filters.category !== "all") {
      products = products.filter((product) => product.category === filters.category)
    }

    return products
  } catch (error) {
    console.error("Error in getClientProducts:", error)
    return []
  }
}
