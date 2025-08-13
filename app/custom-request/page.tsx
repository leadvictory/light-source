"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileText, CheckCircle } from "lucide-react"

export default function CustomRequestPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Request Submitted Successfully!</CardTitle>
            <CardDescription>
              Thank you for your custom lighting request. Our team will review your requirements and get back to you
              within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Reference ID: <span className="font-mono font-medium">CR-2024-001</span>
              </p>
              <Button onClick={() => setIsSubmitted(false)}>Submit Another Request</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Lighting Request</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Tell us about your unique lighting needs and we'll create a custom solution for you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Let us know how to reach you about this request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" required />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" />
              </div>
            </div>
            <div>
              <Label htmlFor="company">Company/Organization</Label>
              <Input id="company" />
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>Provide details about your lighting project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input id="projectName" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectType">Project Type *</Label>
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeline">Project Timeline</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asap">ASAP</SelectItem>
                    <SelectItem value="1-2weeks">1-2 weeks</SelectItem>
                    <SelectItem value="1month">1 month</SelectItem>
                    <SelectItem value="2-3months">2-3 months</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="location">Project Location</Label>
              <Input id="location" placeholder="City, State or full address" />
            </div>
          </CardContent>
        </Card>

        {/* Lighting Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Lighting Requirements</CardTitle>
            <CardDescription>Describe your specific lighting needs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your lighting needs, space dimensions, current setup, desired outcomes, etc."
                className="min-h-[120px]"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Estimated Quantity</Label>
                <Input id="quantity" placeholder="e.g., 50 fixtures" />
              </div>
              <div>
                <Label htmlFor="budget">Budget Range</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-1k">Under $1,000</SelectItem>
                    <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                    <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="over-50k">Over $50,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <Label className="text-base font-medium">Special Requirements</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="dimming" />
                  <Label htmlFor="dimming" className="text-sm font-normal">
                    Dimming capability
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="smart" />
                  <Label htmlFor="smart" className="text-sm font-normal">
                    Smart/IoT integration
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="emergency" />
                  <Label htmlFor="emergency" className="text-sm font-normal">
                    Emergency lighting
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="outdoor" />
                  <Label htmlFor="outdoor" className="text-sm font-normal">
                    Outdoor/weatherproof
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="energy" />
                  <Label htmlFor="energy" className="text-sm font-normal">
                    Energy efficiency certification
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Supporting Documents</CardTitle>
            <CardDescription>Upload any relevant files (floor plans, photos, specifications, etc.)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
              <p className="text-xs text-gray-500">Supported formats: PDF, JPG, PNG, DWG (Max 10MB per file)</p>
              <Button variant="outline" className="mt-4 bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-center">
          <Button type="submit" size="lg" className="px-12">
            Submit Custom Request
          </Button>
        </div>
      </form>
    </div>
  )
}
