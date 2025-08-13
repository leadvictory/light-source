import { supabase } from "../supabase"
import type { Order } from "../supabase"

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      client:clients (*),
      order_items (
        *,
        product:products (*)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    throw error
  }

  return data
}

export async function createOrder(orderData: Partial<Order>) {
  const { data, error } = await supabase.from("orders").insert([orderData]).select().single()

  if (error) {
    console.error("Error creating order:", error)
    throw error
  }

  return data
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  const { data, error } = await supabase.from("orders").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating order:", error)
    throw error
  }

  return data
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from("orders").delete().eq("id", id)

  if (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

export async function duplicateOrder(orderId: string) {
  // First get the original order with its items
  const { data: originalOrder, error: fetchError } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .eq("id", orderId)
    .single()

  if (fetchError) {
    console.error("Error fetching original order:", fetchError)
    throw fetchError
  }

  // Create new order
  const newOrderData = {
    order_number: `${originalOrder.order_number}_COPY_${Date.now()}`,
    client_id: originalOrder.client_id,
    ordered_by: originalOrder.ordered_by,
    ordered_by_email: originalOrder.ordered_by_email,
    status: "pending",
    total_amount: originalOrder.total_amount,
    notes: `Copy of ${originalOrder.order_number}`,
  }

  const { data: newOrder, error: createError } = await supabase.from("orders").insert([newOrderData]).select().single()

  if (createError) {
    console.error("Error creating duplicate order:", createError)
    throw createError
  }

  // Copy order items
  if (originalOrder.order_items && originalOrder.order_items.length > 0) {
    const newOrderItems = originalOrder.order_items.map((item: any) => ({
      order_id: newOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(newOrderItems)

    if (itemsError) {
      console.error("Error creating duplicate order items:", itemsError)
      throw itemsError
    }
  }

  return newOrder
}
