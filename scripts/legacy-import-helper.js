// Helper functions for processing legacy database dumps
// This file contains utilities for parsing and transforming legacy data

export function detectDatabaseType(sqlContent) {
  const content = sqlContent.toLowerCase()

  if (content.includes("mysqldump") || content.includes("mysql")) {
    return "mysql"
  } else if (content.includes("postgresql") || content.includes("pg_dump")) {
    return "postgresql"
  } else if (content.includes("sqlite")) {
    return "sqlite"
  }

  return "unknown"
}

export function extractTableStructure(sqlContent) {
  const tables = {}
  const createTableRegex = /CREATE TABLE\s+`?(\w+)`?\s*$$([\s\S]*?)$$;/gi

  let match
  while ((match = createTableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].toLowerCase()
    const columnsSection = match[2]

    // Extract column definitions
    const columns = []
    const columnLines = columnsSection.split("\n")

    for (const line of columnLines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("PRIMARY KEY") && !trimmed.startsWith("KEY") && !trimmed.startsWith("INDEX")) {
        const columnMatch = trimmed.match(/`?(\w+)`?\s+(\w+)/)
        if (columnMatch) {
          columns.push({
            name: columnMatch[1],
            type: columnMatch[2],
            definition: trimmed,
          })
        }
      }
    }

    tables[tableName] = {
      name: tableName,
      columns: columns,
      rawDefinition: columnsSection,
    }
  }

  return tables
}

export function parseInsertStatements(sqlContent) {
  const insertData = {}

  // More robust regex for INSERT statements
  const insertRegex = /INSERT INTO\s+`?(\w+)`?\s*(?:$$[^)]+$$)?\s*VALUES\s*((?:$$[^)]*$$(?:\s*,\s*)?)+);/gi

  let match
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].toLowerCase()
    const valuesSection = match[2]

    if (!insertData[tableName]) {
      insertData[tableName] = []
    }

    // Parse individual value tuples
    const valueRegex = /$$([^)]*)$$/g
    let valueMatch

    while ((valueMatch = valueRegex.exec(valuesSection)) !== null) {
      const values = parseValueTuple(valueMatch[1])
      insertData[tableName].push(values)
    }
  }

  return insertData
}

function parseValueTuple(valueString) {
  const values = []
  let current = ""
  let inQuotes = false
  let quoteChar = null
  let escaped = false

  for (let i = 0; i < valueString.length; i++) {
    const char = valueString[i]

    if (escaped) {
      current += char
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      current += char
      continue
    }

    if (!inQuotes && (char === "'" || char === '"')) {
      inQuotes = true
      quoteChar = char
      continue
    }

    if (inQuotes && char === quoteChar) {
      inQuotes = false
      quoteChar = null
      continue
    }

    if (!inQuotes && char === ",") {
      values.push(parseValue(current.trim()))
      current = ""
      continue
    }

    current += char
  }

  // Add the last value
  if (current.trim()) {
    values.push(parseValue(current.trim()))
  }

  return values
}

function parseValue(value) {
  const trimmed = value.trim()

  if (trimmed === "NULL") {
    return null
  }

  if (trimmed === "TRUE" || trimmed === "true") {
    return true
  }

  if (trimmed === "FALSE" || trimmed === "false") {
    return false
  }

  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number.parseFloat(trimmed)
  }

  // Return as string (quotes already removed)
  return trimmed
}

export function mapLegacyToModern(legacyData, tableStructures) {
  const mapped = {
    clients: [],
    products: [],
    orders: [],
    order_items: [],
  }

  // Map clients from various possible table names
  const clientTables = ["clients", "customers", "companies", "accounts"]
  for (const tableName of clientTables) {
    if (legacyData[tableName]) {
      mapped.clients.push(...mapClients(legacyData[tableName], tableStructures[tableName]))
    }
  }

  // Map products from various possible table names
  const productTables = ["products", "items", "inventory", "catalog"]
  for (const tableName of productTables) {
    if (legacyData[tableName]) {
      mapped.products.push(...mapProducts(legacyData[tableName], tableStructures[tableName]))
    }
  }

  // Map orders
  const orderTables = ["orders", "sales", "transactions"]
  for (const tableName of orderTables) {
    if (legacyData[tableName]) {
      mapped.orders.push(...mapOrders(legacyData[tableName], tableStructures[tableName]))
    }
  }

  // Map order items
  const orderItemTables = ["order_items", "order_details", "line_items", "sales_items"]
  for (const tableName of orderItemTables) {
    if (legacyData[tableName]) {
      mapped.order_items.push(...mapOrderItems(legacyData[tableName], tableStructures[tableName]))
    }
  }

  return mapped
}

function mapClients(data, structure) {
  if (!structure || !data.length) return []

  const columns = structure.columns.map((col) => col.name.toLowerCase())

  return data.map((row, index) => {
    const client = {
      legacy_id: row[0]?.toString() || index.toString(),
      name: findValue(row, columns, ["name", "company_name", "client_name", "customer_name"]) || `Client ${index + 1}`,
      offices: Number.parseInt(findValue(row, columns, ["offices", "locations", "branches"])) || 1,
      visible: true,
    }

    // Try to find logo URL
    const logoUrl = findValue(row, columns, ["logo", "logo_url", "image"])
    if (logoUrl) {
      client.logo_url = logoUrl
    }

    return client
  })
}

function mapProducts(data, structure) {
  if (!structure || !data.length) return []

  const columns = structure.columns.map((col) => col.name.toLowerCase())

  return data.map((row, index) => {
    const product = {
      legacy_id: row[0]?.toString() || index.toString(),
      sku: findValue(row, columns, ["sku", "code", "product_code", "item_code"]) || `SKU-${index + 1}`,
      name: findValue(row, columns, ["name", "title", "product_name", "description"]) || `Product ${index + 1}`,
      description: findValue(row, columns, ["description", "details", "notes"]),
      category: findValue(row, columns, ["category", "type", "group"]) || "GENERAL",
      subcategory: findValue(row, columns, ["subcategory", "subtype", "subgroup"]) || "GENERAL",
      type: findValue(row, columns, ["type", "category"]) || "GENERAL",
      unit_price: Number.parseFloat(findValue(row, columns, ["price", "unit_price", "cost", "amount"])) || 0,
      unit_type: "unit",
      units_per_case: Number.parseInt(findValue(row, columns, ["case_qty", "pack_size", "quantity"])) || 1,
      image_url:
        findValue(row, columns, ["image", "image_url", "photo"]) || `/placeholder.svg?height=60&width=60&text=Product`,
      status: "available",
      specifications: {},
    }

    // Calculate case price
    product.case_price = product.unit_price * product.units_per_case

    return product
  })
}

function mapOrders(data, structure) {
  if (!structure || !data.length) return []

  const columns = structure.columns.map((col) => col.name.toLowerCase())

  return data.map((row, index) => ({
    legacy_id: row[0]?.toString() || index.toString(),
    order_number:
      findValue(row, columns, ["order_number", "number", "order_id", "invoice_number"]) || `ORDER-${index + 1}`,
    ordered_by: findValue(row, columns, ["ordered_by", "customer", "client", "user"]) || "Legacy Import",
    ordered_by_email: findValue(row, columns, ["email", "customer_email", "contact_email"]),
    status: findValue(row, columns, ["status", "state"]) || "completed",
    total_amount: Number.parseFloat(findValue(row, columns, ["total", "amount", "total_amount", "grand_total"])) || 0,
    notes: "Imported from legacy system",
  }))
}

function mapOrderItems(data, structure) {
  if (!structure || !data.length) return []

  const columns = structure.columns.map((col) => col.name.toLowerCase())

  return data.map((row, index) => ({
    legacy_order_id: findValue(row, columns, ["order_id", "order_number"]),
    legacy_product_id: findValue(row, columns, ["product_id", "item_id", "sku"]),
    quantity: Number.parseInt(findValue(row, columns, ["quantity", "qty", "amount"])) || 1,
    unit_price: Number.parseFloat(findValue(row, columns, ["price", "unit_price", "cost"])) || 0,
    total_price: Number.parseFloat(findValue(row, columns, ["total", "line_total", "amount"])) || 0,
  }))
}

function findValue(row, columns, possibleNames) {
  for (const name of possibleNames) {
    const index = columns.indexOf(name)
    if (index !== -1 && row[index] != null) {
      return row[index]
    }
  }
  return null
}

export function generateImportReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      clients: results.clients?.length || 0,
      products: results.products?.length || 0,
      orders: results.orders?.length || 0,
      order_items: results.order_items?.length || 0,
    },
    details: results,
    recommendations: [],
  }

  // Add recommendations based on data
  if (report.summary.products > 10000) {
    report.recommendations.push("Consider implementing product search indexing for better performance")
  }

  if (report.summary.clients > 1000) {
    report.recommendations.push("Consider implementing client pagination and search")
  }

  if (report.summary.orders > 5000) {
    report.recommendations.push("Consider archiving old orders for better performance")
  }

  return report
}

// Validation functions
export function validateProductData(product) {
  const errors = []

  if (!product.sku || product.sku.trim() === "") {
    errors.push("SKU is required")
  }

  if (!product.name || product.name.trim() === "") {
    errors.push("Product name is required")
  }

  if (product.unit_price < 0) {
    errors.push("Unit price cannot be negative")
  }

  if (product.units_per_case <= 0) {
    errors.push("Units per case must be greater than 0")
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  }
}

export function validateClientData(client) {
  const errors = []

  if (!client.name || client.name.trim() === "") {
    errors.push("Client name is required")
  }

  if (client.offices <= 0) {
    errors.push("Number of offices must be greater than 0")
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  }
}

// Utility functions for data cleaning
export function cleanString(str) {
  if (!str) return ""
  return str.toString().trim().replace(/\s+/g, " ")
}

export function cleanNumber(num) {
  if (num === null || num === undefined || num === "") return 0
  const parsed = Number.parseFloat(num)
  return isNaN(parsed) ? 0 : parsed
}

export function cleanInteger(num) {
  if (num === null || num === undefined || num === "") return 0
  const parsed = Number.parseInt(num)
  return isNaN(parsed) ? 0 : parsed
}

// Export for use in Node.js scripts
export default {
  detectDatabaseType,
  extractTableStructure,
  parseInsertStatements,
  mapLegacyToModern,
  generateImportReport,
  validateProductData,
  validateClientData,
  cleanString,
  cleanNumber,
  cleanInteger,
}
