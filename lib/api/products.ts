import { supabase } from "../supabase"

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  category?: string
  unit_price?: number
  case_price?: number
  case_quantity?: number
  manufacturer?: string
  created_at: string
  updated_at: string
}

export interface ProductAssignment {
  id: string
  client_id: string
  product_id: string
  assigned_at: string
  product: Product
}

export async function getProducts(
  page = 1,
  limit = 50,
  search?: string,
  category?: string,
): Promise<{ products: Product[]; total: number }> {
  try {
    let query = supabase.from("products").select("*", { count: "exact" }).order("name")

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1)

    if (error) {
      console.error("Error fetching products:", error)
      return { products: [], total: 0 }
    }

    return {
      products: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("Error in getProducts:", error)
    return { products: [], total: 0 }
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching product:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getProductById:", error)
    return null
  }
}

export async function getProductCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("products").select("category").not("category", "is", null)

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    const categories = [...new Set(data.map((item) => item.category).filter(Boolean))]
    return categories.sort()
  } catch (error) {
    console.error("Error in getProductCategories:", error)
    return []
  }
}

export async function getProductAssignments(productId?: string): Promise<ProductAssignment[]> {
  try {
    let query = supabase
      .from("client_products")
      .select(`
        id,
        client_id,
        product_id,
        assigned_at,
        product:products(*)
      `)
      .order("assigned_at", { ascending: false })

    if (productId) {
      query = query.eq("product_id", productId)
    }

    const { data, error } = await query

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

export async function assignProductToClient(productId: string, clientId: string): Promise<boolean> {
  try {
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from("client_products")
      .select("id")
      .eq("product_id", productId)
      .eq("client_id", clientId)
      .single()

    if (existing) {
      return true // Already assigned
    }

    const { error } = await supabase.from("client_products").insert({
      product_id: productId,
      client_id: clientId,
      assigned_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error assigning product:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in assignProductToClient:", error)
    return false
  }
}

export async function removeProductFromClient(productId: string, clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("client_products")
      .delete()
      .eq("product_id", productId)
      .eq("client_id", clientId)

    if (error) {
      console.error("Error removing product assignment:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in removeProductFromClient:", error)
    return false
  }
}

export async function bulkAssignProducts(productIds: string[], clientId: string): Promise<boolean> {
  try {
    // Get existing assignments to avoid duplicates
    const { data: existing } = await supabase
      .from("client_products")
      .select("product_id")
      .eq("client_id", clientId)
      .in("product_id", productIds)

    const existingProductIds = existing?.map((item) => item.product_id) || []
    const newProductIds = productIds.filter((id) => !existingProductIds.includes(id))

    if (newProductIds.length === 0) {
      return true // All already assigned
    }

    const assignments = newProductIds.map((productId) => ({
      product_id: productId,
      client_id: clientId,
      assigned_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from("client_products").insert(assignments)

    if (error) {
      console.error("Error bulk assigning products:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in bulkAssignProducts:", error)
    return false
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating product:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in updateProduct:", error)
    return null
  }
}
