import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rtypjzseuptkqvqbkizs.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0eXBqenNldXB0a3F2cWJraXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMjMwMzEsImV4cCI6MjA2Njg5OTAzMX0.xKWHt6u0wQUdknefPXLsHNe2dLFs6giOiTA1gd95Acs"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test basic connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("companies").select("count").limit(1)
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, message: "Connected to Supabase successfully!" }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Check if all required tables exist
export async function checkTablesExist() {
  const requiredTables = [
    "users",
    "companies",
    "buildings",
    "floors",
    "products",
    "product_assignments",
    "orders",
    "order_items",
    "categories",
    "subcategories",
  ]

  const results = []

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1)
      results.push({ table, exists: !error })
    } catch (error) {
      results.push({ table, exists: false })
    }
  }

  return results
}

// Database types
export interface User {
  id: string
  email: string
  name: string
  role: "OWNER" | "SUPERCUSTOMER" | "CUSTOMER" | "TENANT"
  phone?: string
  company_id?: string
  building_id?: string
  floor_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  logo_url?: string
  type: "SUPERCUSTOMER" | "CUSTOMER"
  is_visible: boolean
  admin_user_id?: string
  notes?: string
  created_at: string
  updated_at: string
  admin_user?: User
  buildings?: Building[]
  orders?: Order[]
  product_assignments?: ProductAssignment[]
  _count?: {
    buildings: number
    orders: number
    product_assignments: number
  }
}

export interface Building {
  id: string
  name: string
  address?: string
  company_id: string
  created_at: string
  updated_at: string
  company?: Company
  floors?: Floor[]
}

export interface Floor {
  id: string
  name: string
  floor_number?: number
  building_id: string
  tenant_company_id?: string
  created_at: string
  updated_at: string
  building?: Building
  tenant_company?: Company
}

export interface Category {
  id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  subcategories?: Subcategory[]
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface Product {
  id: string
  item_number: string
  name: string
  description?: string
  manufacturer?: string
  category?: string // Legacy field - will be deprecated
  sub_category?: string // Legacy field - will be deprecated
  subcategory_id?: string // New field referencing subcategories table
  info_type?: string
  info_details?: string
  unit_type?: string
  base_unit_price?: number
  base_units_per_case?: number
  status: "AVAILABLE" | "ASSIGNED" | "DISCONTINUED"
  tag?: string
  image_url?: string
  created_at: string
  updated_at: string
  product_assignments?: ProductAssignment[]
  subcategory?: Subcategory
}

export interface ProductAssignment {
  id: string
  product_id: string
  assigned_to_company_id: string
  assigned_by_user_id: string
  client_unit_price?: number
  client_case_price?: number
  client_units_per_case?: number
  is_active: boolean
  created_at: string
  updated_at: string
  product?: Product
  assigned_to_company?: Company
  assigned_by_user?: User
}

export interface Order {
  id: string
  order_number: string
  user_id: string
  company_id: string
  building_id?: string
  floor_id?: string
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED"
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  user?: User
  company?: Company
  building?: Building
  floor?: Floor
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
}

// Mock categories data
export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Ballast",
    description: "Electronic and magnetic ballasts for fluorescent lighting",
    sort_order: 1,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategories: [
      {
        id: "1-1",
        category_id: "1",
        name: "2 x 2 Lensed",
        sort_order: 1,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-2",
        category_id: "1",
        name: "2 x 2 Parabolic",
        sort_order: 2,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-3",
        category_id: "1",
        name: "2 x 4 Lensed",
        sort_order: 3,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-4",
        category_id: "1",
        name: "2 x 4 Parabolic",
        sort_order: 4,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-5",
        category_id: "1",
        name: "Fluorescent Clip",
        sort_order: 5,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-6",
        category_id: "1",
        name: "Products",
        sort_order: 6,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-7",
        category_id: "1",
        name: "Re-Lamp Pricing",
        sort_order: 7,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-8",
        category_id: "1",
        name: "T12",
        sort_order: 8,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-9",
        category_id: "1",
        name: "T12 UBENT",
        sort_order: 9,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-10",
        category_id: "1",
        name: "T5",
        sort_order: 10,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-11",
        category_id: "1",
        name: "T8",
        sort_order: 11,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-12",
        category_id: "1",
        name: "T8 UBENT",
        sort_order: 12,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "1-13",
        category_id: "1",
        name: "Wall Bracket",
        sort_order: 13,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "2",
    name: "LED",
    description: "LED bulbs, fixtures, and drivers",
    sort_order: 9,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategories: [
      {
        id: "2-1",
        category_id: "2",
        name: "A-Type",
        sort_order: 1,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2-2",
        category_id: "2",
        name: "Candelabra",
        sort_order: 2,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2-3",
        category_id: "2",
        name: "Downlight",
        sort_order: 3,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2-4",
        category_id: "2",
        name: "Flood",
        sort_order: 4,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2-5",
        category_id: "2",
        name: "Globe",
        sort_order: 5,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2-6",
        category_id: "2",
        name: "PAR",
        sort_order: 6,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2-7",
        category_id: "2",
        name: "Tube",
        sort_order: 7,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "3",
    name: "Fixture",
    description: "Light fixtures and housings",
    sort_order: 5,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategories: [
      {
        id: "3-1",
        category_id: "3",
        name: "Ceiling Mount",
        sort_order: 1,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "3-2",
        category_id: "3",
        name: "Pendant",
        sort_order: 2,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "3-3",
        category_id: "3",
        name: "Recessed",
        sort_order: 3,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "3-4",
        category_id: "3",
        name: "Track",
        sort_order: 4,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "3-5",
        category_id: "3",
        name: "Under Cabinet",
        sort_order: 5,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "3-6",
        category_id: "3",
        name: "Wall Mount",
        sort_order: 6,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "4",
    name: "Switch",
    description: "Light switches and controls",
    sort_order: 20,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategories: [
      {
        id: "4-1",
        category_id: "4",
        name: "Dimmer",
        sort_order: 1,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "4-2",
        category_id: "4",
        name: "Single Pole",
        sort_order: 2,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "4-3",
        category_id: "4",
        name: "3-Way",
        sort_order: 3,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "4-4",
        category_id: "4",
        name: "4-Way",
        sort_order: 4,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "4-5",
        category_id: "4",
        name: "Timer",
        sort_order: 5,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
]

// Mock companies data
export const mockCompanies: Company[] = [
  {
    id: "1",
    name: "Paramount Group Inc",
    type: "SUPERCUSTOMER",
    is_visible: true,
    admin_user_id: "1",
    created_at: "2025-04-05T00:00:00Z",
    updated_at: "2025-04-05T00:00:00Z",
    admin_user: {
      id: "1",
      email: "steve@paramount.com",
      name: "Steve Jackson",
      role: "SUPERCUSTOMER",
      phone: "818-555-9789",
      is_active: true,
      created_at: "2025-04-05T00:00:00Z",
      updated_at: "2025-04-05T00:00:00Z",
    },
    _count: {
      buildings: 3,
      orders: 27,
      product_assignments: 199,
    },
  },
  {
    id: "4",
    name: "8th Floor- 50 Beale St",
    type: "CUSTOMER",
    is_visible: true,
    admin_user_id: "4",
    created_at: "2025-03-29T00:00:00Z",
    updated_at: "2025-03-29T00:00:00Z",
    admin_user: {
      id: "4",
      email: "steve@beale.com",
      name: "Steve Jackson",
      role: "CUSTOMER",
      phone: "818-555-9789",
      is_active: true,
      created_at: "2025-03-29T00:00:00Z",
      updated_at: "2025-03-29T00:00:00Z",
    },
    _count: {
      buildings: 1,
      orders: 6,
      product_assignments: 34,
    },
  },
  {
    id: "5",
    name: "PixelNet",
    type: "CUSTOMER",
    is_visible: true,
    admin_user_id: "5",
    created_at: "2025-02-05T00:00:00Z",
    updated_at: "2025-02-05T00:00:00Z",
    admin_user: {
      id: "5",
      email: "suzy@pixelnet.com",
      name: "Suzy",
      role: "CUSTOMER",
      phone: "818-555-9789",
      is_active: true,
      created_at: "2025-02-05T00:00:00Z",
      updated_at: "2025-02-05T00:00:00Z",
    },
    _count: {
      buildings: 1,
      orders: 1,
      product_assignments: 5,
    },
  },
  {
    id: "6",
    name: "Amazon Services",
    type: "SUPERCUSTOMER",
    is_visible: true,
    admin_user_id: "6",
    created_at: "2025-01-17T00:00:00Z",
    updated_at: "2025-01-17T00:00:00Z",
    admin_user: {
      id: "6",
      email: "steve@amazon.com",
      name: "Admin Desk",
      role: "SUPERCUSTOMER",
      phone: "818-555-9789",
      is_active: true,
      created_at: "2025-01-17T00:00:00Z",
      updated_at: "2025-01-17T00:00:00Z",
    },
    _count: {
      buildings: 8,
      orders: 198,
      product_assignments: 198,
    },
  },
  {
    id: "7",
    name: "PixelNet Enterprise",
    type: "SUPERCUSTOMER",
    is_visible: true,
    admin_user_id: "7",
    created_at: "2024-10-05T00:00:00Z",
    updated_at: "2024-10-05T00:00:00Z",
    admin_user: {
      id: "7",
      email: "bbb@pixelnet.com",
      name: "Bo Bo Baggins",
      role: "SUPERCUSTOMER",
      phone: "818-555-9789",
      is_active: true,
      created_at: "2024-10-05T00:00:00Z",
      updated_at: "2024-10-05T00:00:00Z",
    },
    _count: {
      buildings: 5,
      orders: 27,
      product_assignments: 177,
    },
  },
]

// Mock product assignments data
export const mockProductAssignments: ProductAssignment[] = [
  {
    id: "1",
    product_id: "1",
    assigned_to_company_id: "1",
    assigned_by_user_id: "owner",
    client_unit_price: 250.0,
    client_case_price: 6000.0,
    client_units_per_case: 24,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "2",
    product_id: "1",
    assigned_to_company_id: "4",
    assigned_by_user_id: "owner",
    client_unit_price: 280.0,
    client_case_price: 6720.0,
    client_units_per_case: 24,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "3",
    product_id: "2",
    assigned_to_company_id: "1",
    assigned_by_user_id: "owner",
    client_unit_price: 850.0,
    client_case_price: 850.0,
    client_units_per_case: 1,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "4",
    product_id: "4",
    assigned_to_company_id: "5",
    assigned_by_user_id: "owner",
    client_unit_price: 95.0,
    client_case_price: 4560.0,
    client_units_per_case: 48,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "5",
    product_id: "4",
    assigned_to_company_id: "6",
    assigned_by_user_id: "owner",
    client_unit_price: 89.0,
    client_case_price: 4272.0,
    client_units_per_case: 48,
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
]

// Mock orders data
export const mockOrders: Order[] = [
  {
    id: "1",
    order_number: "ORD-2025-001",
    user_id: "1",
    company_id: "1",
    building_id: "1",
    floor_id: "1",
    status: "PENDING",
    total_amount: 1250.0,
    notes: "Urgent order for building maintenance",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
  },
  {
    id: "2",
    order_number: "ORD-2025-002",
    user_id: "4",
    company_id: "4",
    building_id: "2",
    status: "PROCESSING",
    total_amount: 850.0,
    notes: "Standard monthly order",
    created_at: "2025-01-14T14:20:00Z",
    updated_at: "2025-01-14T16:45:00Z",
  },
  {
    id: "3",
    order_number: "ORD-2025-003",
    user_id: "5",
    company_id: "5",
    building_id: "3",
    status: "COMPLETED",
    total_amount: 4560.0,
    notes: "LED replacement project",
    created_at: "2025-01-13T09:15:00Z",
    updated_at: "2025-01-13T17:30:00Z",
  },
  {
    id: "4",
    order_number: "ORD-2025-004",
    user_id: "6",
    company_id: "6",
    building_id: "4",
    status: "COMPLETED",
    total_amount: 4272.0,
    notes: "Bulk LED order for warehouse",
    created_at: "2025-01-12T11:00:00Z",
    updated_at: "2025-01-12T18:00:00Z",
  },
]

// Mock order items data
export const mockOrderItems: OrderItem[] = [
  {
    id: "1",
    order_id: "1",
    product_id: "1",
    quantity: 5,
    unit_price: 250.0,
    total_price: 1250.0,
    created_at: "2025-01-15T10:30:00Z",
  },
  {
    id: "2",
    order_id: "2",
    product_id: "2",
    quantity: 1,
    unit_price: 850.0,
    total_price: 850.0,
    created_at: "2025-01-14T14:20:00Z",
  },
  {
    id: "3",
    order_id: "3",
    product_id: "4",
    quantity: 48,
    unit_price: 95.0,
    total_price: 4560.0,
    created_at: "2025-01-13T09:15:00Z",
  },
  {
    id: "4",
    order_id: "4",
    product_id: "4",
    quantity: 48,
    unit_price: 89.0,
    total_price: 4272.0,
    created_at: "2025-01-12T11:00:00Z",
  },
]

// Updated mock products with subcategory references
export const mockProducts: (Product & { assignments: ProductAssignment[] })[] = [
  {
    id: "1",
    item_number: "JHBL 24000LM GL WD MVOLT GZ10 50K 80CRI HC3P DWH",
    name: "INTERMATIC Spring Wound Timer",
    description:
      "INTERMATIC Spring Wound Timer, Timing Range 1 Hour, Contact Form SPST, Power Rating @ 125 VAC 1 HP, Power Rating @ 250 VAC 2 HP, Load Capacity @ 125 VAC 20/7 Amps, Load Capacity @ 250 VAC 10 Amps, Load Capacity @ 277 VAC 10 Amps, Hold Feature No, 2 x 4 In",
    manufacturer: "INTERMATIC",
    category: "Ballast", // Legacy field
    sub_category: "T8", // Legacy field
    subcategory_id: "1-11", // New field - references T8 subcategory
    info_type: "Ballast",
    info_details: "2 x 2 parabolic",
    unit_type: "cases",
    base_unit_price: 270.0,
    base_units_per_case: 24,
    status: "AVAILABLE",
    tag: "RELAMP",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategory: mockCategories[0].subcategories?.find((s) => s.id === "1-11"),
    assignments: [
      {
        id: "1",
        product_id: "1",
        assigned_to_company_id: "1",
        assigned_by_user_id: "owner",
        client_unit_price: 250.0,
        client_case_price: 6000.0,
        client_units_per_case: 24,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        product_id: "1",
        assigned_to_company_id: "4",
        assigned_by_user_id: "owner",
        client_unit_price: 280.0,
        client_case_price: 6720.0,
        client_units_per_case: 24,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "2",
    item_number: "DVF-103P-WH",
    name: "Lutron Preset Dimmer",
    description:
      "Lutron Preset Dimmer with Nightlight for Fluorescent Dimming with Hi-Lume ECC-10 electronic ballasts Single Pole or 3-Way",
    manufacturer: "Lutron",
    category: "Switch", // Legacy field
    sub_category: "Dimmer", // Legacy field
    subcategory_id: "4-1", // New field - references Dimmer subcategory
    info_type: "Dimmer",
    info_details: "Single Pole or 3-Way",
    unit_type: "units",
    base_unit_price: 897.0,
    base_units_per_case: 1,
    status: "ASSIGNED",
    tag: "RELAMP",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategory: mockCategories[3].subcategories?.find((s) => s.id === "4-1"),
    assignments: [
      {
        id: "3",
        product_id: "2",
        assigned_to_company_id: "1",
        assigned_by_user_id: "owner",
        client_unit_price: 850.0,
        client_case_price: 850.0,
        client_units_per_case: 1,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "3",
    item_number: "B94C",
    name: "GE LED Recessed Downlight",
    description: 'Commercial Electric 6" LED Recessed Downlight',
    manufacturer: "GE",
    category: "Fixture", // Legacy field
    sub_category: "Recessed", // Legacy field
    subcategory_id: "3-3", // New field - references Recessed subcategory
    info_type: "Fixture",
    info_details: "24 bulbs",
    unit_type: "units",
    base_unit_price: 220.0,
    base_units_per_case: 1,
    status: "AVAILABLE",
    tag: "RELAMP",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategory: mockCategories[2].subcategories?.find((s) => s.id === "3-3"),
    assignments: [],
  },
  {
    id: "4",
    item_number: "B95D",
    name: "GE LED Replacement Bulbs",
    description: "Replacement LED bulbs",
    manufacturer: "GE",
    category: "LED", // Legacy field
    sub_category: "Tube", // Legacy field
    subcategory_id: "2-7", // New field - references Tube subcategory
    info_type: "Bulbs",
    info_details: "LED",
    unit_type: "cases",
    base_unit_price: 99.0,
    base_units_per_case: 48,
    status: "ASSIGNED",
    tag: "RELAMP",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    subcategory: mockCategories[1].subcategories?.find((s) => s.id === "2-7"),
    assignments: [
      {
        id: "4",
        product_id: "4",
        assigned_to_company_id: "5",
        assigned_by_user_id: "owner",
        client_unit_price: 95.0,
        client_case_price: 4560.0,
        client_units_per_case: 48,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
      {
        id: "5",
        product_id: "4",
        assigned_to_company_id: "6",
        assigned_by_user_id: "owner",
        client_unit_price: 89.0,
        client_case_price: 4272.0,
        client_units_per_case: 48,
        is_active: true,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      },
    ],
  },
]

// Database query functions
export async function getProducts() {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data || []
}

export async function getCompanies() {
  const { data, error } = await supabase.from("companies").select("*").eq("is_visible", true).order("name")

  if (error) {
    console.error("Error fetching companies:", error)
    return []
  }

  return data || []
}

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users(name, email),
      companies(name),
      buildings(name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching orders:", error)
    return []
  }

  return data || []
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      users(name, email),
      companies(name),
      buildings(name),
      order_items(
        *,
        products(name, item_number, unit_price)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching order:", error)
    return null
  }

  return data
}
