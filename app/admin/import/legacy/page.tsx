"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Database, Upload, FileText, Users, Package, X, File, Clock, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ImportStats {
  clients: number
  products: number
  orders: number
  orderItems: number
  assignments: number
  errors: string[]
}

interface UploadedFile {
  name: string
  size: number
  content: string
}

export default function LegacyImportPage() {
  const [sqlDump, setSqlDump] = useState("")
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [results, setResults] = useState<ImportStats | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const sqlFile = files.find(
      (file) =>
        file.name.endsWith(".sql") ||
        file.name.endsWith(".dump") ||
        file.type === "application/sql" ||
        file.type === "text/plain",
    )

    if (sqlFile) {
      handleFileUpload(sqlFile)
    } else {
      alert("Please drop a SQL file (.sql, .dump)")
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }, [])

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setUploadedFile({
        name: file.name,
        size: file.size,
        content: content,
      })
      setSqlDump(content)
      setActiveTab("preview")
    }
    reader.onerror = () => {
      alert("Error reading file")
    }
    reader.readAsText(file)
  }, [])

  const removeFile = useCallback(() => {
    setUploadedFile(null)
    setSqlDump("")
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const createImportBatch = async (fileName: string, fileSize: number) => {
    const batchName = `Import ${new Date().toISOString().slice(0, 19).replace("T", " ")}`

    const { data, error } = await supabase.rpc("create_import_batch", {
      p_batch_name: batchName,
      p_import_type: "legacy_sql",
      p_file_name: fileName,
      p_file_size: fileSize,
      p_created_by: "admin",
    })

    if (error) throw error
    return data
  }

  const updateBatchProgress = async (batchId: string, updates: any) => {
    const { error } = await supabase.rpc("update_batch_progress", {
      p_batch_id: batchId,
      ...updates,
    })
    if (error) throw error
  }

  const parseSqlDump = (sqlContent: string) => {
    const tables = {
      clients: [] as any[],
      products: [] as any[],
      orders: [] as any[],
      orderItems: [] as any[],
    }

    try {
      const statements = sqlContent.split(";").filter((stmt) => stmt.trim())

      for (const statement of statements) {
        const trimmed = statement.trim()

        if (trimmed.toUpperCase().startsWith("INSERT INTO")) {
          try {
            const tableMatch = trimmed.match(/INSERT INTO\s+`?(\w+)`?\s*(?:$$[^)]+$$)?\s*VALUES/i)
            if (!tableMatch) continue

            const tableName = tableMatch[1].toLowerCase()
            const valuesMatch = trimmed.match(/VALUES\s*(.+)$/is)
            if (!valuesMatch) continue

            const valuesSection = valuesMatch[1]
            const valueRows = []
            let depth = 0
            let current = ""
            let inString = false
            let stringChar = ""

            for (let i = 0; i < valuesSection.length; i++) {
              const char = valuesSection[i]
              const prevChar = i > 0 ? valuesSection[i - 1] : ""

              if (!inString && (char === "'" || char === '"')) {
                inString = true
                stringChar = char
              } else if (inString && char === stringChar && prevChar !== "\\") {
                inString = false
                stringChar = ""
              }

              if (!inString) {
                if (char === "(") depth++
                else if (char === ")") depth--
              }

              current += char

              if (!inString && depth === 0 && char === ")" && current.trim().startsWith("(")) {
                valueRows.push(current.trim())
                current = ""
              }
            }

            for (const row of valueRows) {
              if (!row.startsWith("(") || !row.endsWith(")")) continue

              const valueString = row.slice(1, -1)
              const values = parseValueString(valueString)

              if (tableName.includes("client") || tableName.includes("customer") || tableName.includes("company")) {
                tables.clients.push(values)
              } else if (
                tableName.includes("product") ||
                tableName.includes("item") ||
                tableName.includes("inventory")
              ) {
                tables.products.push(values)
              } else if (tableName.includes("order") && !tableName.includes("item") && !tableName.includes("detail")) {
                tables.orders.push(values)
              } else if (
                tableName.includes("order_item") ||
                tableName.includes("order_detail") ||
                tableName.includes("line_item")
              ) {
                tables.orderItems.push(values)
              }
            }
          } catch (error) {
            console.error("Error parsing statement:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error parsing SQL dump:", error)
    }

    return tables
  }

  const parseValueString = (valueString: string): any[] => {
    const values = []
    let current = ""
    let inString = false
    let stringChar = ""
    let depth = 0

    for (let i = 0; i < valueString.length; i++) {
      const char = valueString[i]
      const prevChar = i > 0 ? valueString[i - 1] : ""

      if (!inString && (char === "'" || char === '"')) {
        inString = true
        stringChar = char
        continue
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false
        stringChar = ""
        continue
      }

      if (!inString) {
        if (char === "(") depth++
        else if (char === ")") depth--
        else if (char === "," && depth === 0) {
          values.push(parseValue(current.trim()))
          current = ""
          continue
        }
      }

      current += char
    }

    if (current.trim()) {
      values.push(parseValue(current.trim()))
    }

    return values
  }

  const parseValue = (value: string): any => {
    const trimmed = value.trim()

    if (trimmed === "NULL" || trimmed === "null") {
      return null
    }

    if (trimmed === "TRUE" || trimmed === "true") {
      return true
    }

    if (trimmed === "FALSE" || trimmed === "false") {
      return false
    }

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number.parseFloat(trimmed)
    }

    return trimmed
  }

  const insertIntoStagingTables = async (batchId: string, tables: any) => {
    const stats = { clients: 0, products: 0, orders: 0, orderItems: 0, errors: [] as string[] }

    try {
      if (tables.clients.length > 0) {
        const clientsData = tables.clients.map((row: any[], index: number) => ({
          import_batch_id: batchId,
          legacy_id: row[0]?.toString() || index.toString(),
          raw_data: row,
          name: row[1] || row[0] || `Client ${index + 1}`,
          company_name: row[1] || null,
          email: row[2] || null,
          phone: row[3] || null,
          offices: Number.parseInt(row[4]) || Number.parseInt(row[3]) || 1,
        }))

        const { error } = await supabase.from("legacy_clients_staging").insert(clientsData)
        if (error) {
          stats.errors.push(`Clients staging error: ${error.message}`)
        } else {
          stats.clients = clientsData.length
        }
      }

      if (tables.products.length > 0) {
        const productsData = tables.products.map((row: any[], index: number) => {
          const unitPrice = Number.parseFloat(row[6]) || Number.parseFloat(row[5]) || Number.parseFloat(row[4]) || 0
          const unitsPerCase = Number.parseInt(row[7]) || Number.parseInt(row[6]) || 1

          return {
            import_batch_id: batchId,
            legacy_id: row[0]?.toString() || index.toString(),
            raw_data: row,
            sku: row[1] || row[0] || `SKU-${index + 1}`,
            name: row[2] || row[1] || `Product ${index + 1}`,
            description: row[3] || row[2] || "",
            category: row[4] || "GENERAL",
            subcategory: row[5] || "GENERAL",
            type: row[4] || "GENERAL",
            unit_price: unitPrice,
            unit_type: "unit",
            units_per_case: unitsPerCase,
            case_price: unitPrice * unitsPerCase,
            image_url: `/placeholder.svg?height=60&width=60&text=Product`,
          }
        })

        const batchSize = 100
        for (let i = 0; i < productsData.length; i += batchSize) {
          const batch = productsData.slice(i, i + batchSize)
          const { error } = await supabase.from("legacy_products_staging").insert(batch)
          if (error) {
            stats.errors.push(`Products staging batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
          } else {
            stats.products += batch.length
          }
        }
      }

      if (tables.orders.length > 0) {
        const ordersData = tables.orders.map((row: any[], index: number) => ({
          import_batch_id: batchId,
          legacy_id: row[0]?.toString() || index.toString(),
          legacy_client_id: row[1]?.toString() || null,
          raw_data: row,
          order_number: row[2] || `ORDER-${index + 1}`,
          customer_name: row[3] || "Legacy Import",
          customer_email: row[4] || null,
          total_amount: Number.parseFloat(row[5]) || 0,
          order_status: row[6] || "completed",
          notes: "Imported from legacy system",
        }))

        const { error } = await supabase.from("legacy_orders_staging").insert(ordersData)
        if (error) {
          stats.errors.push(`Orders staging error: ${error.message}`)
        } else {
          stats.orders = ordersData.length
        }
      }

      if (tables.orderItems.length > 0) {
        const orderItemsData = tables.orderItems.map((row: any[]) => ({
          import_batch_id: batchId,
          legacy_order_id: row[1]?.toString(),
          legacy_product_id: row[2]?.toString(),
          raw_data: row,
          product_sku: row[3] || null,
          quantity: Number.parseInt(row[4]) || 1,
          unit_price: Number.parseFloat(row[5]) || 0,
          line_total: Number.parseFloat(row[6]) || (Number.parseInt(row[4]) || 1) * (Number.parseFloat(row[5]) || 0),
        }))

        const { error } = await supabase.from("legacy_order_items_staging").insert(orderItemsData)
        if (error) {
          stats.errors.push(`Order items staging error: ${error.message}`)
        } else {
          stats.orderItems = orderItemsData.length
        }
      }
    } catch (error: any) {
      stats.errors.push(`Staging error: ${error.message}`)
    }

    return stats
  }

  const processStageToMain = async (batchId: string) => {
    const stats = { clients: 0, products: 0, assignments: 0, errors: [] as string[] }

    try {
      setStatus("Processing clients from staging...")
      const { data: clientResults, error: clientError } = await supabase.rpc("process_staged_clients", {
        p_batch_id: batchId,
      })

      if (clientError) {
        stats.errors.push(`Client processing error: ${clientError.message}`)
      } else if (clientResults && clientResults.length > 0) {
        const result = clientResults[0]
        stats.clients = result.success_count
        if (result.errors && result.errors.length > 0) {
          stats.errors.push(...result.errors)
        }
      }

      setStatus("Processing products from staging...")
      const { data: productResults, error: productError } = await supabase.rpc("process_staged_products", {
        p_batch_id: batchId,
      })

      if (productError) {
        stats.errors.push(`Product processing error: ${productError.message}`)
      } else if (productResults && productResults.length > 0) {
        const result = productResults[0]
        stats.products = result.success_count
        if (result.errors && result.errors.length > 0) {
          stats.errors.push(...result.errors)
        }
      }

      setStatus("Creating product assignments...")
      const { data: clients } = await supabase.from("clients").select("id")
      const { data: products } = await supabase.from("products").select("id")

      if (clients && products && clients.length > 0 && products.length > 0) {
        const assignments = []
        for (const client of clients) {
          for (const product of products) {
            assignments.push({
              client_id: client.id,
              product_id: product.id,
            })
          }
        }

        const batchSize = 1000
        for (let i = 0; i < assignments.length; i += batchSize) {
          const batch = assignments.slice(i, i + batchSize)
          const { error } = await supabase.from("client_products").upsert(batch, {
            onConflict: "client_id,product_id",
            ignoreDuplicates: true,
          })
          if (error) {
            stats.errors.push(`Assignment batch error: ${error.message}`)
          } else {
            stats.assignments += batch.length
          }
        }
      }
    } catch (error: any) {
      stats.errors.push(`Processing error: ${error.message}`)
    }

    return stats
  }

  const importLegacyData = async () => {
    if (!sqlDump.trim()) {
      alert("Please upload or paste your SQL dump first")
      return
    }

    setImporting(true)
    setProgress(0)
    setStatus("Starting import process...")

    try {
      setProgress(5)
      setStatus("Creating import batch...")
      const batchId = await createImportBatch(
        uploadedFile?.name || "Manual Input",
        uploadedFile?.size || sqlDump.length,
      )

      setProgress(15)
      setStatus("Parsing SQL dump...")
      const tables = parseSqlDump(sqlDump)

      const totalRecords =
        tables.clients.length + tables.products.length + tables.orders.length + tables.orderItems.length

      await updateBatchProgress(batchId, {
        p_total_records: totalRecords,
        p_status: "processing",
      })

      setStatus(
        `Found ${tables.clients.length} clients, ${tables.products.length} products, ${tables.orders.length} orders`,
      )
      setProgress(25)

      setStatus("Inserting data into staging tables...")
      setProgress(35)
      const stagingStats = await insertIntoStagingTables(batchId, tables)

      setProgress(55)
      await updateBatchProgress(batchId, {
        p_processed_records:
          stagingStats.clients + stagingStats.products + stagingStats.orders + stagingStats.orderItems,
      })

      setStatus("Processing staged data to main tables...")
      setProgress(70)
      const processStats = await processStageToMain(batchId)

      setProgress(95)
      await updateBatchProgress(batchId, {
        p_successful_records: processStats.clients + processStats.products,
        p_failed_records: stagingStats.errors.length + processStats.errors.length,
        p_status: "completed",
      })

      setProgress(100)
      setStatus("Import completed!")

      const finalStats: ImportStats = {
        clients: processStats.clients,
        products: processStats.products,
        orders: 0,
        orderItems: 0,
        assignments: processStats.assignments,
        errors: [...stagingStats.errors, ...processStats.errors],
      }

      setResults(finalStats)
      setActiveTab("results")
    } catch (error: any) {
      console.error("Import failed:", error)
      setStatus(`Import failed: ${error.message}`)
      setResults({
        clients: 0,
        products: 0,
        orders: 0,
        orderItems: 0,
        assignments: 0,
        errors: [error.message],
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Legacy Database Import</h1>
        <p className="text-gray-600 mt-2">
          Import your legacy database dump with 20,000+ products, clients, and orders using staging tables
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">New Staging Table Process:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Data is first imported into staging tables for validation</li>
            <li>2. Staging data is then processed and moved to main tables</li>
            <li>3. This prevents corruption of your main database</li>
            <li>4. Failed records are logged for review</li>
          </ol>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload SQL Dump</TabsTrigger>
          <TabsTrigger value="preview">Preview & Options</TabsTrigger>
          <TabsTrigger value="results">Import Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                SQL Database Dump
              </CardTitle>
              <CardDescription>
                Upload your SQL dump file or paste the content below. Data will be processed through staging tables for
                safety.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-8 w-8 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium text-green-900">{uploadedFile.name}</div>
                        <div className="text-sm text-green-600">{formatFileSize(uploadedFile.size)}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      File uploaded successfully. Ready for staging table import.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <div className="text-lg font-medium text-gray-900">
                        Drop your SQL file here, or click to browse
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Supports .sql, .dump files up to 100MB</div>
                    </div>
                    <input
                      type="file"
                      accept=".sql,.dump,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Browse Files
                      </label>
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sql-dump">Or paste SQL content manually</Label>
                <Textarea
                  id="sql-dump"
                  placeholder="Paste your SQL dump here (INSERT statements, CREATE TABLE statements, etc.)..."
                  value={sqlDump}
                  onChange={(e) => setSqlDump(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Safe Import Process:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Data imported to staging tables first</li>
                  <li>• Validation and error checking</li>
                  <li>• Only clean data moved to main tables</li>
                  <li>• Full audit trail and error reporting</li>
                </ul>
              </div>

              {(sqlDump.trim() || uploadedFile) && (
                <Button onClick={() => setActiveTab("preview")} size="lg" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Preview Data & Configure Import
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Data Preview & Import Options
              </CardTitle>
              <CardDescription>Preview your data and configure staging table import settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sqlDump && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      SQL dump contains {sqlDump.split("\n").length} lines
                      {uploadedFile && ` (${formatFileSize(uploadedFile.size)})`}
                    </div>
                    {uploadedFile && (
                      <div className="text-sm text-green-600 font-medium">File: {uploadedFile.name}</div>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto max-h-96">
                      {sqlDump.substring(0, 2000)}
                      {sqlDump.length > 2000 && "\n\n... (truncated for preview)"}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setActiveTab("upload")} variant="outline">
                  Back to Upload
                </Button>
                {!importing && sqlDump && (
                  <Button onClick={importLegacyData}>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Staging Import
                  </Button>
                )}
              </div>

              {importing && (
                <div className="space-y-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {status}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {results ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{results.clients}</div>
                  <div className="text-sm text-gray-600">Processed to main tables</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-600" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{results.products}</div>
                  <div className="text-sm text-gray-600">Processed to main tables</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-orange-600" />
                    Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{results.assignments}</div>
                  <div className="text-sm text-gray-600">Product assignments created</div>
                </CardContent>
              </Card>

              {results.errors.length > 0 && (
                <Card className="md:col-span-3">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      Processing Errors ({results.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {results.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                      {results.errors.length > 10 && (
                        <div className="text-sm text-red-500">... and {results.errors.length - 10} more errors</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="md:col-span-3">
                <CardContent className="pt-6">
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={() => setActiveTab("upload")} variant="outline">
                      Import Another File
                    </Button>
                    <Button onClick={() => (window.location.href = "/admin/products")}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      View Products
                    </Button>
                    <Button onClick={() => (window.location.href = "/admin/clients")} variant="outline">
                      View Clients
                    </Button>
                    <Button onClick={() => (window.location.href = "/admin")} variant="outline">
                      Admin Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500">Import results will appear here after processing through staging tables</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
