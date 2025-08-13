// Fetch and analyze the products CSV file
async function fetchProductsData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/products_full-7UVCcHNWodLGmH19bE5VZDkBEAwmzs.csv",
    )
    const csvText = await response.text()

    // Parse CSV
    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

    console.log("Headers:", headers)
    console.log("Total rows:", lines.length - 1)

    const products = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "") continue

      // Parse CSV line (handling quoted values)
      const values = []
      let current = ""
      let inQuotes = false

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Add the last value

      if (values.length >= headers.length) {
        const product = {}
        headers.forEach((header, index) => {
          product[header] = values[index] || ""
        })
        products.push(product)
      }
    }

    console.log("Sample products:")
    console.log(products.slice(0, 3))

    console.log("\nCategories found:")
    const categories = [...new Set(products.map((p) => p.category))].filter(Boolean)
    console.log(categories)

    console.log("\nSubcategories found:")
    const subcategories = [...new Set(products.map((p) => p.subcategory))].filter(Boolean)
    console.log(subcategories.slice(0, 10))

    return products
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

// Execute the function
fetchProductsData()
