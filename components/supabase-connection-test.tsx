"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { testSupabaseConnection, checkTablesExist } from "@/lib/supabase"
import { CheckCircle, XCircle, Loader2, Database, Play, AlertTriangle, Settings } from "lucide-react"

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [testResults, setTestResults] = useState<any>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  const handleTestConnection = async () => {
    setConnectionStatus("testing")
    setErrorMessage("")
    setTestResults(null)
    setNeedsSetup(false)

    try {
      // Test basic connection
      const result = await testSupabaseConnection()

      if (result.success) {
        setConnectionStatus("success")
        setTestResults(result)
        if (result.needsSetup) {
          setNeedsSetup(true)
        }
      } else {
        setConnectionStatus("error")
        setErrorMessage(result.error || "Connection failed")
      }
    } catch (error) {
      setConnectionStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
    }
  }

  const checkDatabaseTables = async () => {
    setConnectionStatus("testing")
    setErrorMessage("")

    try {
      const results = await checkTablesExist()
      setTestResults(results)

      const allTablesExist = results.every((r) => r.exists)
      setConnectionStatus(allTablesExist ? "success" : "error")

      if (!allTablesExist) {
        setNeedsSetup(true)
        setErrorMessage("Some database tables are missing. Please run the setup scripts.")
      }
    } catch (error) {
      setConnectionStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Database check failed")
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Connection & Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          {connectionStatus === "idle" && <Badge variant="secondary">Not tested</Badge>}
          {connectionStatus === "testing" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Testing...
            </Badge>
          )}
          {connectionStatus === "success" && (
            <Badge variant="default" className="flex items-center gap-1 bg-green-500">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          )}
          {connectionStatus === "error" && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          )}
        </div>

        {/* Environment Variables */}
        <div className="space-y-2">
          <h4 className="font-medium">Environment Variables:</h4>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span>SUPABASE_URL:</span>
              <Badge variant="outline">{process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>SUPABASE_ANON_KEY:</span>
              <Badge variant="outline">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}</Badge>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleTestConnection}
            disabled={connectionStatus === "testing"}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Test Connection
          </Button>

          <Button
            onClick={checkDatabaseTables}
            disabled={connectionStatus === "testing"}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Database className="h-4 w-4" />
            Check Tables
          </Button>
        </div>

        {/* Setup Warning */}
        {needsSetup && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Database Setup Required</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Your Supabase connection is working, but the database tables need to be created.
                </p>
                <div className="mt-2 text-sm text-yellow-700">
                  <p className="font-medium">Next steps:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to your Supabase dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>
                      Run the scripts in the /scripts folder in order:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>01-create-tables.sql</li>
                        <li>02-seed-data.sql</li>
                        <li>03-create-order-tables.sql</li>
                        <li>04-seed-orders.sql</li>
                        <li>05-create-categories-tables.sql</li>
                        <li>06-seed-categories-data.sql</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && !needsSetup && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Test Results */}
        {testResults && Array.isArray(testResults) && (
          <div className="space-y-2">
            <h4 className="font-medium">Database Tables:</h4>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium capitalize">{result.table}</span>
                  <div className="flex items-center gap-2">
                    {result.exists ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Exists
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </div>
                  {result.error && <p className="text-xs text-red-600 mt-1">{result.error}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {connectionStatus === "success" && !Array.isArray(testResults) && !needsSetup && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">✅ Successfully connected to Supabase!</p>
            {testResults?.message && <p className="text-green-600 text-xs mt-1">{testResults.message}</p>}
          </div>
        )}

        {/* Quick Setup Instructions */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Quick Setup:</p>
              <p className="text-blue-700 mt-1">
                1. Visit your{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Supabase Dashboard
                </a>
              </p>
              <p className="text-blue-700">2. Go to SQL Editor and run the scripts from the /scripts folder</p>
              <p className="text-blue-700">3. Come back and click "Check Tables" to verify setup</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
