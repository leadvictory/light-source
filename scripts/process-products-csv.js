import fs from "fs"

async function processProductsCSV() {
  try {
    console.log("Fetching products CSV...")
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/products_full-7UVCcHNWodLGmH19bE5VZDkBEAwmzs.csv",
    )
    const csvText = await response.text()

    // Parse CSV properly
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    console.log("Headers found:", headers)
    console.log("Processing", lines.length - 1, "products...")

    const products = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue

      // Simple CSV parsing (assuming no commas in quoted fields for now)
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())

      if (values.length >= headers.length) {
        const product = {}
        headers.forEach((header, index) => {
          product[header] = values[index] || ""
        })

        // Clean up the data
        product.price = Number.parseFloat(product.price) || 0
        product.case_qty = Number.parseInt(product.case_qty) || 1
        product.green = product.green === "True"
        product.relamp = product.relamp === "True"
        product.disabled = product.disabled === "True"

        products.push(product)
      }
    }

    console.log("Parsed", products.length, "products successfully")

    // Generate SQL INSERT statements
    let sql = `-- Clear existing products and assignments
DELETE FROM client_products;
DELETE FROM order_items;
DELETE FROM products;

-- Insert all products from CSV
INSERT INTO products (
    sku, 
    name, 
    description, 
    category, 
    subcategory, 
    type,
    specifications,
    unit_price, 
    unit_type, 
    units_per_case, 
    case_price, 
    image_url, 
    status,
    created_at,
    updated_at
) VALUES\n`

    const sqlValues = []

    products.forEach((product, index) => {
      const specifications = JSON.stringify({
        green: product.green,
        relamp: product.relamp,
        disabled: product.disabled,
        item_id: product.item_id,
      })

      const escapedDescription = product.description.replace(/'/g, "''")
      const escapedSku = product.product_code.replace(/'/g, "''")

      const sqlValue = `('${escapedSku}', '${escapedDescription}', '${escapedDescription}', '${product.category}', '${product.subcategory}', '${product.category}', '${specifications}', ${product.price}, 'unit', ${product.case_qty}, ${product.price * product.case_qty}, '/placeholder.svg?height=60&width=60&text=${encodeURIComponent(product.category)}', 'available', NOW(), NOW())`

      sqlValues.push(sqlValue)
    })

    sql += sqlValues.join(",\n")
    sql += ";\n\n"

    // Add assignment query
    sql += `-- Assign ALL products to ALL clients
INSERT INTO client_products (client_id, product_id, assigned_at)
SELECT c.id, p.id, NOW()
FROM clients c
CROSS JOIN products p
WHERE c.visible = true;

-- Verify the assignments
SELECT 
    c.name as client_name,
    COUNT(cp.product_id) as assigned_products
FROM clients c
LEFT JOIN client_products cp ON c.id = cp.client_id
GROUP BY c.id, c.name
ORDER BY c.name;`

    // Write to file
    fs.writeFileSync("scripts/03-import-all-products-generated.sql", sql)

    console.log("Generated SQL file: scripts/03-import-all-products-generated.sql")
    console.log("Products to import:", products.length)

    // Show some statistics
    const categories = [...new Set(products.map((p) => p.category))].filter(Boolean)
    const subcategories = [...new Set(products.map((p) => p.subcategory))].filter(Boolean)

    console.log("\nCategories found:", categories.length)
    console.log(categories)

    console.log("\nSubcategories found:", subcategories.length)
    console.log(subcategories.slice(0, 20))

    console.log(
      "\nPrice range:",
      Math.min(...products.map((p) => p.price)),
      "to",
      Math.max(...products.map((p) => p.price)),
    )

    return products
  } catch (error) {
    console.error("Error processing CSV:", error)
    return []
  }
}

// Execute
processProductsCSV()
