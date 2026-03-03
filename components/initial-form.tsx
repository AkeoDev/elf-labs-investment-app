"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Mail, User, Phone, ChevronDown } from "lucide-react"
import { STATIC_PHONE_LIST, buildPhoneList, type CountryWithPhone } from "@/lib/countries"

interface InitialFormProps {
  onSubmit: (data: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode: string
  }) => void
}

export function InitialForm({ onSubmit }: InitialFormProps) {
  const [phoneList, setPhoneList] = useState<CountryWithPhone[]>(STATIC_PHONE_LIST)
  const [selectedCountry, setSelectedCountry] = useState<CountryWithPhone>(STATIC_PHONE_LIST[0])

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [touched, setTouched] = useState({
    email: false,
    firstName: false,
    lastName: false,
    phone: false,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch live countries from DealMaker and build phone list
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("/api/dealmaker/countries")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.countries) && data.countries.length > 0) {
            const list = buildPhoneList(data.countries)
            if (list.length > 0) {
              setPhoneList(list)
              // Keep current selection if still present, otherwise default to first
              setSelectedCountry((prev) => list.find((c) => c.isoCode === prev.isoCode) ?? list[0])
            }
          }
        }
      } catch {
        // Silently keep the static fallback already set
      }
    }
    fetchCountries()
  }, [])

  // Close dropdown on outside click
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
      phone: `${selectedCountry.phoneCode}${formData.phone}`,
      countryCode: selectedCountry.isoCode,
    })
  }

  return (
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-4 sm:p-8 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onBlur={() => setTouched({ ...touched, email: true })}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.email && (!formData.email.trim() || !isValidEmail)
                ? "border-red-500"
                : "border-gray-600"
            }`}
          />
          {touched.email && !formData.email.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Email is required</p>
          )}
          {touched.email && formData.email.trim() && !isValidEmail && (
            <p className="text-red-400 text-xs mt-1 ml-1">Please enter a valid email</p>
          )}
        </div>

        {/* First Name */}
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

        {/* Last Name */}
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

        {/* Phone + Country Code */}
        <div className="relative" ref={dropdownRef}>
          <div
            className={`flex border rounded-lg overflow-hidden ${
              touched.phone && formData.phone.trim().length < 7
                ? "border-red-500"
                : "border-gray-600"
            }`}
          >
            {/* Country code selector */}
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-1.5 px-3 py-4 border-r border-gray-600 hover:bg-white/5 transition-colors"
            >
              <span className="text-gray-300 text-sm font-medium">{selectedCountry.name}</span>
              <span className="text-gray-300 text-sm">{selectedCountry.phoneCode}</span>
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

          {/* Country dropdown menu */}
          {showCountryDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-[#1a2744] border border-gray-600 rounded-lg shadow-lg overflow-hidden">
              <div ref={listRef} className="max-h-52 overflow-y-auto custom-scrollbar">
                {phoneList.map((c) => (
                  <button
                    key={`${c.isoCode}-${c.phoneCode}`}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c)
                      setShowCountryDropdown(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                      c.isoCode === selectedCountry.isoCode ? "bg-white/5 text-white" : "text-gray-300"
                    }`}
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm text-gray-400">{c.phoneCode}</span>
                  </button>
                ))}
              </div>
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
        By beginning the investment process, you consent to receive communications via email or SMS
        regarding updates to this offer, and may unsubscribe from non-transactional emails at any
        time.
      </p>
    </div>
  )
}
