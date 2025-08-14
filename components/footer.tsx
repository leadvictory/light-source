import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
            <div className="p-6 border-t border-gray-200 text-center">
              <div className="text-blue-600 text-lg font-medium mb-2">Thank you for your order.</div>
              <div className="text-gray-600 mb-4">We appreciate your business.</div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Light Source</div>
                <div>30690 Hill Street</div>
                <div>Thousand Palms, CA 92276</div>
                <div>(800) 624-0860 toll free</div>
                <div>(760) 343-4700 phone</div>
                <div>(760) 343-4720 fax</div>
              </div>
            </div>
  )
}
