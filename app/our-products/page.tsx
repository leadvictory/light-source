import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import Image from "next/image"

// Sample product data
const products = [
  {
    id: 1,
    name: "LED Panel Light 2x4",
    sku: "LP-2x4-40W",
    price: "$89.99",
    category: "Panel Lights",
    wattage: "40W",
    lumens: "4000lm",
    image: "/placeholder.svg?height=200&width=200&text=LED+Panel",
  },
  {
    id: 2,
    name: "High Bay LED Fixture",
    sku: "HB-150W-UFO",
    price: "$159.99",
    category: "High Bay",
    wattage: "150W",
    lumens: "19500lm",
    image: "/placeholder.svg?height=200&width=200&text=High+Bay",
  },
  {
    id: 3,
    name: "LED Strip Light 5050",
    sku: "LS-5050-RGB",
    price: "$24.99",
    category: "Strip Lights",
    wattage: "14.4W/m",
    lumens: "1200lm/m",
    image: "/placeholder.svg?height=200&width=200&text=Strip+Light",
  },
  {
    id: 4,
    name: 'Recessed Downlight 6"',
    sku: "RD-6IN-15W",
    price: "$34.99",
    category: "Downlights",
    wattage: "15W",
    lumens: "1500lm",
    image: "/placeholder.svg?height=200&width=200&text=Downlight",
  },
  {
    id: 5,
    name: "Track Light Fixture",
    sku: "TL-30W-ADJ",
    price: "$79.99",
    category: "Track Lights",
    wattage: "30W",
    lumens: "3000lm",
    image: "/placeholder.svg?height=200&width=200&text=Track+Light",
  },
  {
    id: 6,
    name: "Emergency Exit Sign",
    sku: "ES-LED-DUAL",
    price: "$49.99",
    category: "Emergency",
    wattage: "3W",
    lumens: "N/A",
    image: "/placeholder.svg?height=200&width=200&text=Exit+Sign",
  },
]

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse our comprehensive catalog of professional lighting solutions
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search products..." className="pl-10" />
        </div>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                width={200}
                height={200}
                className="object-cover"
              />
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>SKU: {product.sku}</CardDescription>
                </div>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wattage:</span>
                  <span className="font-medium">{product.wattage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lumens:</span>
                  <span className="font-medium">{product.lumens}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-600">{product.price}</span>
                <Button>Add to Quote</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center bg-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Something Custom?</h2>
        <p className="text-gray-600 mb-6">
          Can't find what you're looking for? Submit a custom request and we'll help you find the perfect solution.
        </p>
        <Button size="lg">Submit Custom Request</Button>
      </div>
    </div>
  )
}
