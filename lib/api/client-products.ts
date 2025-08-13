import { supabase } from "../supabase"
import type { Product } from "../supabase"

// Get products specifically for a client (only assigned products)
export async function getClientProducts(
  clientId: string,
  filters?: {
    search?: string
    category?: string
    subcategory?: string
  },
): Promise<Product[]> {
  try {
    // First get assigned product IDs
    const { data: assignedProducts, error: assignmentError } = await supabase
      .from("client_products")
      .select("product_id")
      .eq("client_id", clientId)

    if (assignmentError) {
      console.error("Error fetching product assignments:", assignmentError)
      throw assignmentError
    }

    if (!assignedProducts || assignedProducts.length === 0) {
      return []
    }

    const productIds = assignedProducts.map((ap) => ap.product_id)

    // Now get the actual products
    let query = supabase.from("products").select("*").in("id", productIds).eq("status", "available") // Only show available products to clients

    if (filters?.search) {
      query = query.or(
        `sku.ilike.%${filters.search}%,name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
      )
    }

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (filters?.subcategory && filters.subcategory !== "all") {
      query = query.eq("subcategory", filters.subcategory)
    }

    query = query.order("name")

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error("Error fetching products:", productsError)
      throw productsError
    }

    return products || []
  } catch (error) {
    console.error("Error in getClientProducts:", error)
    return []
  }
}

// Get product assignments for a specific product
export async function getProductAssignments(productId: string) {
  try {
    const { data, error } = await supabase
      .from("client_products")
      .select(`
        client_id,
        product_id,
        clients!inner(
          id,
          name
        )
      `)
      .eq("product_id", productId)

    if (error) {
      console.error("Error fetching product assignments:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getProductAssignments:", error)
    return []
  }
}

// Assign a product to a client (with duplicate handling)
export async function assignProductToClient(clientId: string, productId: string) {
  try {
    // First check if assignment already exists
    const { data: existing, error: checkError } = await supabase
      .from("client_products")
      .select("id")
      .eq("client_id", clientId)
      .eq("product_id", productId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError
    }

    // If assignment already exists, return success
    if (existing) {
      return { success: true, message: "Assignment already exists" }
    }

    // Create new assignment
    const { data, error } = await supabase
      .from("client_products")
      .insert({
        client_id: clientId,
        product_id: productId,
      })
      .select()

    if (error) {
      // Handle duplicate key constraint violation
      if (error.code === "23505") {
        return { success: true, message: "Assignment already exists" }
      }
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error assigning product to client:", error)
    throw error
  }
}

// Remove a product assignment from a client
export async function removeProductFromClient(clientId: string, productId: string) {
  try {
    const { error } = await supabase
      .from("client_products")
      .delete()
      .eq("client_id", clientId)
      .eq("product_id", productId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error removing product from client:", error)
    throw error
  }
}

// Get all products for admin/owner (no filtering by assignment) - using pagination to get ALL products
export async function getAllProducts(filters?: {
  search?: string
  category?: string
  subcategory?: string
}): Promise<Product[]> {
  try {
    console.log("getAllProducts: Starting to fetch ALL products with filters:", filters)

    // First, get the total count
    const { count: totalCount, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error getting product count:", countError)
    } else {
      console.log(`getAllProducts: Total products in database: ${totalCount}`)
    }

    let allProducts: any[] = []
    let from = 0
    const pageSize = 1000 // Fetch in chunks of 1000
    let hasMore = true

    while (hasMore) {
      console.log(
        `getAllProducts: Fetching batch ${Math.floor(from / pageSize) + 1}, from ${from} to ${from + pageSize - 1}`,
      )

      let query = supabase
        .from("products")
        .select(
          `
          *,
          client_products (id),
          order_items (id)
        `,
          { count: "exact" },
        )
        .range(from, from + pageSize - 1) // Use range instead of limit

      if (filters?.search) {
        query = query.or(
          `sku.ilike.%${filters.search}%,name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        )
      }

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category)
      }

      if (filters?.subcategory && filters.subcategory !== "all") {
        query = query.eq("subcategory", filters.subcategory)
      }

      query = query.order("created_at", { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error("Error fetching products batch:", error)
        throw error
      }

      if (data && data.length > 0) {
        allProducts = allProducts.concat(data)
        console.log(
          `getAllProducts: Batch ${Math.floor(from / pageSize) + 1} returned ${data.length} products. Total so far: ${allProducts.length}`,
        )

        // Check if we got fewer results than requested, meaning we've reached the end
        if (data.length < pageSize) {
          hasMore = false
        } else {
          from += pageSize
        }
      } else {
        hasMore = false
      }

      // Safety check to prevent infinite loops
      if (from > 50000) {
        console.warn("getAllProducts: Safety limit reached, stopping pagination")
        hasMore = false
      }
    }

    console.log(`getAllProducts: Successfully fetched ${allProducts.length} total products`)

    // Transform the data to include counts
    return allProducts.map((product) => ({
      ...product,
      assigned_clients_count: product.client_products?.length || 0,
      orders_count: product.order_items?.length || 0,
    }))
  } catch (error) {
    console.error("Error in getAllProducts:", error)
    return []
  }
}
