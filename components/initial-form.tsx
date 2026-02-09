"use client"

import type React from "react"

import { useState } from "react"
import { Mail, User } from "lucide-react"

interface InitialFormProps {
  onSubmit: (data: {
    email: string
    firstName: string
    lastName: string
    phone: string
  }) => void
}

export function InitialForm({ onSubmit }: InitialFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-4 sm:p-8 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-transparent border border-gray-600 rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full bg-transparent border border-gray-600 rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full bg-transparent border border-gray-600 rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="relative flex border border-gray-600 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-4 border-r border-gray-600">
            <span className="text-lg">🇺🇸</span>
            <span className="text-gray-400">+1</span>
            <span className="text-gray-500">▼</span>
          </div>
          <input
            type="tel"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="flex-1 bg-transparent py-4 px-4 text-gray-300 placeholder-gray-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-[#a0a0a0] hover:bg-[#b0b0b0] text-white font-medium py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          Continue
          <span className="text-xl">→</span>
        </button>
      </form>

      <p className="text-gray-500 text-sm text-center mt-6 leading-relaxed">
        By beginning the investment process, you consent to receive communications via email or SMS regarding updates to
        this offer, and may unsubscribe from non-transactional emails at any time.
      </p>
    </div>
  )
}
