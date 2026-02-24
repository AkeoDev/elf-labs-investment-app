"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Mail, User, Phone, ChevronDown } from "lucide-react"

const COUNTRY_CODES = [
  { code: "+1", country: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+1", country: "CA", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "+44", country: "UK", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+61", country: "AU", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "+49", country: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+33", country: "FR", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "+81", country: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+91", country: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+86", country: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+55", country: "BR", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "+52", country: "MX", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "+34", country: "ES", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "+39", country: "IT", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "+82", country: "KR", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "+31", country: "NL", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "+46", country: "SE", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "+41", country: "CH", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "+65", country: "SG", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "+971", country: "AE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+972", country: "IL", flag: "\u{1F1EE}\u{1F1F1}" },
]

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
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [touched, setTouched] = useState({
    email: false,
    firstName: false,
    lastName: false,
    phone: false,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isValidEmail = formData.email.includes("@") && formData.email.includes(".")
  const isFormComplete =
    formData.email.trim() !== "" &&
    isValidEmail &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.phone.trim().length >= 7

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, firstName: true, lastName: true, phone: true })
    if (!isFormComplete) return
    onSubmit({
      ...formData,
      phone: `${countryCode.code}${formData.phone}`,
    })
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
            onBlur={() => setTouched({ ...touched, email: true })}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.email && (!formData.email.trim() || !isValidEmail) ? "border-red-500" : "border-gray-600"
            }`}
          />
          {touched.email && !formData.email.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Email is required</p>
          )}
          {touched.email && formData.email.trim() && !isValidEmail && (
            <p className="text-red-400 text-xs mt-1 ml-1">Please enter a valid email</p>
          )}
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onBlur={() => setTouched({ ...touched, firstName: true })}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.firstName && !formData.firstName.trim() ? "border-red-500" : "border-gray-600"
            }`}
          />
          {touched.firstName && !formData.firstName.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">First name is required</p>
          )}
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onBlur={() => setTouched({ ...touched, lastName: true })}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.lastName && !formData.lastName.trim() ? "border-red-500" : "border-gray-600"
            }`}
          />
          {touched.lastName && !formData.lastName.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Last name is required</p>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className={`flex border rounded-lg overflow-hidden ${
            touched.phone && formData.phone.trim().length < 7 ? "border-red-500" : "border-gray-600"
          }`}>
            {/* Country code dropdown */}
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-1.5 px-3 py-4 border-r border-gray-600 hover:bg-white/5 transition-colors"
            >
              <span className="text-lg">{countryCode.flag}</span>
              <span className="text-gray-300 text-sm">{countryCode.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onBlur={() => setTouched({ ...touched, phone: true })}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setFormData({ ...formData, phone: value })
                }}
                className="w-full bg-transparent py-4 pl-10 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Country code dropdown menu */}
          {showCountryDropdown && (
            <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-[#1a2744] border border-gray-600 rounded-lg shadow-lg">
              {COUNTRY_CODES.map((cc) => (
                <button
                  key={`${cc.country}-${cc.code}`}
                  type="button"
                  onClick={() => {
                    setCountryCode(cc)
                    setShowCountryDropdown(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                    cc.country === countryCode.country && cc.code === countryCode.code
                      ? "bg-white/5 text-white"
                      : "text-gray-300"
                  }`}
                >
                  <span className="text-lg">{cc.flag}</span>
                  <span className="text-sm font-medium">{cc.country}</span>
                  <span className="text-sm text-gray-400">{cc.code}</span>
                </button>
              ))}
            </div>
          )}
          {touched.phone && formData.phone.trim().length < 7 && (
            <p className="text-red-400 text-xs mt-1 ml-1">Please enter a valid phone number</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormComplete}
          className={`w-full mt-6 font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            isFormComplete
              ? "bg-[#e91e8c] hover:bg-[#d11a7d] text-white cursor-pointer shadow-lg shadow-[#e91e8c]/20"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-60"
          }`}
        >
          Continue
          <span className="text-xl">{"→"}</span>
        </button>
      </form>

      <p className="text-gray-500 text-sm text-center mt-6 leading-relaxed">
        By beginning the investment process, you consent to receive communications via email or SMS regarding updates to
        this offer, and may unsubscribe from non-transactional emails at any time.
      </p>
    </div>
  )
}
