"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, Download, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface Product {
  item_id: string
  product_code: string
  description: string
  case_qty: string
  price: string
  green: string
  relamp: string
  disabled: string
  category: string
  subcategory: string
}

export default function ImportPage() {
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [results, setResults] = useState<{
    productsImported: number
    clientsUpdated: number
    totalAssignments: number
    errors: string[]
  } | null>(null)

  const fetchAndImportProducts = async () => {
    try {
      setImporting(true)
      setProgress(0)
      setStatus("Fetching products from CSV...")

      // Fetch the CSV file
      const response = await fetch(
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/products_full-7UVCcHNWodLGmH19bE5VZDkBEAwmzs.csv",
      )
      const csvText = await response.text()

      setProgress(10)
      setStatus("Parsing CSV data...")

      // Parse CSV
      const lines = csvText.split("\n")
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

      const products: Product[] = []

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue

        const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim())

        if (values.length >= headers.length) {
          const product: any = {}
          headers.forEach((header, index) => {
            product[header] = values[index] || ""
          })
          products.push(product)
        }
      }

      setProgress(20)
      setStatus(`Parsed ${products.length} products. Removing duplicates...`)

      // Remove duplicates by SKU (keep the first occurrence)
      const uniqueProducts = []
      const seenSkus = new Set()

      for (const product of products) {
        if (!seenSkus.has(product.product_code) && product.product_code.trim()) {
          seenSkus.add(product.product_code)
          uniqueProducts.push(product)
        }
      }

      console.log(`Removed ${products.length - uniqueProducts.length} duplicate products`)
      setStatus(
        `Removed ${products.length - uniqueProducts.length} duplicates. ${uniqueProducts.length} unique products to import...`,
      )

      setProgress(25)
      setStatus("Clearing existing data...")

      // Clear existing products and assignments
      await supabase.from("client_products").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000")

      setProgress(30)
      setStatus("Importing products in batches...")

      // Import products in batches of 100
      const batchSize = 100
      let importedCount = 0
      const errors: string[] = []

      for (let i = 0; i < uniqueProducts.length; i += batchSize) {
        const batch = uniqueProducts.slice(i, i + batchSize)

        const productData = batch.map((product) => ({
          sku: product.product_code.trim(),
          name: product.description.substring(0, 255),
          description: product.description,
          category: product.category || "GENERAL",
          subcategory: product.subcategory || "GENERAL",
          type: product.category || "GENERAL",
          specifications: {
            green: product.green === "True",
            relamp: product.relamp === "True",
            disabled: product.disabled === "True",
            item_id: product.item_id,
          },
          unit_price: Number.parseFloat(product.price) || 0,
          unit_type: "unit",
          units_per_case: Number.parseInt(product.case_qty) || 1,
          case_price: (Number.parseFloat(product.price) || 0) * (Number.parseInt(product.case_qty) || 1),
          image_url: `/placeholder.svg?height=60&width=60&text=${encodeURIComponent(product.category || "Product")}`,
          status: product.disabled === "True" ? "disabled" : "available",
        }))

        try {
          const { error } = await supabase.from("products").insert(productData)

          if (error) {
            console.error("Batch import error:", error)
            errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)

            // Try inserting products one by one to identify problematic records
            for (const singleProduct of productData) {
              try {
                await supabase.from("products").insert([singleProduct])
                importedCount += 1
              } catch (singleError) {
                console.error("Single product error:", singleError, "SKU:", singleProduct.sku)
                errors.push(`SKU ${singleProduct.sku}: ${singleError.message}`)
              }
            }
          } else {
            importedCount += batch.length
          }
        } catch (batchError) {
          console.error("Batch processing error:", batchError)
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message}`)
        }

        const progressPercent = 30 + ((i + batchSize) / uniqueProducts.length) * 50
        setProgress(Math.min(progressPercent, 80))
        setStatus(`Imported ${importedCount} of ${uniqueProducts.length} products...`)
      }

      setProgress(85)
      setStatus("Getting clients and products for assignment...")

      // Get all clients and products for assignment
      const { data: clients } = await supabase.from("clients").select("id").eq("visible", true)
      const { data: allProducts } = await supabase.from("products").select("id")

      if (clients && allProducts) {
        setStatus(`Assigning ${allProducts.length} products to ${clients.length} clients...`)

        // Create assignments (all products to all clients)
        const assignments = []
        for (const client of clients) {
          for (const product of allProducts) {
            assignments.push({
              client_id: client.id,
              product_id: product.id,
            })
          }
        }

        setProgress(90)
        setStatus(`Creating ${assignments.length} product assignments in batches...`)

        // Insert assignments in batches of 1000
        const assignmentBatchSize = 1000
        let assignmentCount = 0

        for (let i = 0; i < assignments.length; i += assignmentBatchSize) {
          const batch = assignments.slice(i, i + assignmentBatchSize)

          try {
            const { error } = await supabase.from("client_products").insert(batch)

            if (error) {
              console.error("Assignment error:", error)
              errors.push(`Assignment batch ${Math.floor(i / assignmentBatchSize) + 1}: ${error.message}`)
            } else {
              assignmentCount += batch.length
            }
          } catch (assignmentError) {
            console.error("Assignment batch error:", assignmentError)
            errors.push(`Assignment batch ${Math.floor(i / assignmentBatchSize) + 1}: ${assignmentError.message}`)
          }

          // Update progress for assignments
          const assignmentProgress = 90 + ((i + assignmentBatchSize) / assignments.length) * 10
          setProgress(Math.min(assignmentProgress, 100))
          setStatus(`Created ${assignmentCount} of ${assignments.length} product assignments...`)
        }

        setProgress(100)
        setStatus("Import completed!")

        setResults({
          productsImported: importedCount,
          clientsUpdated: clients.length,
          totalAssignments: assignmentCount,
          errors,
        })
      }
    } catch (error) {
      console.error("Import failed:", error)
      setStatus(`Import failed: ${error.message}`)
      setResults({
        productsImported: 0,
        clientsUpdated: 0,
        totalAssignments: 0,
        errors: [error.message],
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Products</h1>
        <p className="text-gray-600 mt-2">Import all products from CSV and assign to all clients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Product Import
          </CardTitle>
          <CardDescription>
            This will import all products from the CSV file and assign them to all visible clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!importing && !results && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Ready to import products from the CSV file. This process will:</p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-1">
                <li>• Clear existing products and assignments</li>
                <li>• Import all products from the CSV (removing duplicates)</li>
                <li>• Assign all products to all visible clients</li>
                <li>• Create a comprehensive product catalog</li>
              </ul>
              <Button onClick={fetchAndImportProducts} size="lg">
                <Download className="h-4 w-4 mr-2" />
                Start Import
              </Button>
            </div>
          )}

          {importing && (
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600">{status}</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Import Completed</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{results.productsImported}</div>
                  <div className="text-sm text-blue-600">Products Imported</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{results.clientsUpdated}</div>
                  <div className="text-sm text-green-600">Clients Updated</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{results.totalAssignments}</div>
                  <div className="text-sm text-purple-600">Total Assignments</div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-600 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Errors Encountered ({results.errors.length})</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-600 space-y-1">
                      {results.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {results.errors.length > 10 && (
                        <li className="text-red-500">... and {results.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setResults(null)
                  setProgress(0)
                  setStatus("")
                }}
                variant="outline"
              >
                Import Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
