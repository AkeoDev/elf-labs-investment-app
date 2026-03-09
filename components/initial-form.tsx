"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { STATIC_PHONE_LIST, buildPhoneList, type CountryWithPhone } from "@/lib/countries"

interface InitialFormProps {
  onSubmit: (data: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode: string
  }) => void
  isLoading?: boolean
  error?: string
  onErrorClear?: () => void
}

/** Convert ISO 3166-1 alpha-2 code to flag emoji (e.g. "US" → "🇺🇸") */
function isoToFlag(iso: string): string {
  return [...iso.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("")
}

export function InitialForm({ onSubmit, isLoading, error, onErrorClear }: InitialFormProps) {
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

  // Typeahead: pressing a letter jumps to the first country starting with it
  useEffect(() => {
    if (!showCountryDropdown) return
    function handleKeyDown(e: KeyboardEvent) {
      if (!/^[a-zA-Z]$/.test(e.key)) return
      const letter = e.key.toLowerCase()
      const idx = phoneList.findIndex((c) => c.name.toLowerCase().startsWith(letter))
      if (idx === -1) return
      const buttons = listRef.current?.querySelectorAll("button")
      buttons?.[idx]?.scrollIntoView({ block: "nearest" })
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [showCountryDropdown, phoneList])

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
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-4 sm:p-6 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">
      <div className="relative">
  <input
    type="email"
    placeholder="Email"
    value={formData.email}
    onBlur={() => setTouched({ ...touched, email: true })}
    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); onErrorClear?.() }}
    className={`w-full bg-transparent border rounded-lg py-4 px-4
    text-white placeholder-white
    focus:outline-none focus:border-white
    ${
      touched.email && (!formData.email.trim() || !isValidEmail)
        ? "border-red-500"
        : "border-[#F6248833]"
    }`}
  />

  {touched.email && !formData.email.trim() && (
    <p className="text-red-400 text-xs mt-1 ml-1">Email is required</p>
  )}

  {touched.email && formData.email.trim() && !isValidEmail && (
    <p className="text-red-400 text-xs mt-1 ml-1">
      Please enter a valid email
    </p>
  )}
</div>

        {/* First Name */}
        <div className="relative">
  <input
    type="text"
    placeholder="First Name"
    value={formData.firstName}
    onBlur={() => setTouched({ ...touched, firstName: true })}
    onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); onErrorClear?.() }}
    className={`w-full bg-transparent border rounded-lg py-4 px-4
    text-white placeholder-white
    focus:outline-none focus:border-white
    ${
      touched.firstName && !formData.firstName.trim()
        ? "border-red-500"
        : "border-[#F6248833]"
    }`}
  />

  {touched.firstName && !formData.firstName.trim() && (
    <p className="text-red-400 text-xs mt-1 ml-1">
      First name is required
    </p>
  )}
</div>

      <div className="relative">
  <input
    type="text"
    placeholder="Last Name"
    value={formData.lastName}
    onBlur={() => setTouched({ ...touched, lastName: true })}
    onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); onErrorClear?.() }}
    className={`w-full bg-transparent border rounded-lg py-4 px-4
    text-white placeholder-white
    focus:outline-none focus:border-white
    ${
      touched.lastName && !formData.lastName.trim()
        ? "border-red-500"
        : "border-[#F6248833]"
    }`}
  />
  {touched.lastName && !formData.lastName.trim() && (
    <p className="text-red-400 text-xs mt-1 ml-1">Last name is required</p>
  )}
</div>

        <div className="relative" ref={dropdownRef}>
          <div className={`flex border rounded-lg overflow-hidden ${
            touched.phone && formData.phone.trim().length < 7 ? "border-red-500" : "border-[#F6248833]"
          }`}>
            {/* Country code dropdown */}
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-1.5 px-3 py-4 border-r border-[#F6248833] hover:bg-white/5 transition-colors"
            >
              <span className="text-lg leading-none">{isoToFlag(selectedCountry.isoCode)}</span>
              <span className="text-white text-sm">{selectedCountry.phoneCode}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

    <div className="relative flex-1">
      <input
        type="tel"
        placeholder="Phone number"
        value={formData.phone}
        onBlur={() => setTouched({ ...touched, phone: true })}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, "")
          setFormData({ ...formData, phone: value })
          onErrorClear?.()
        }}
        className="w-full bg-transparent py-4 px-4 text-white placeholder-white focus:outline-none"
      />
    </div>
  </div>

  {showCountryDropdown && (
    <div className="absolute z-50 mt-1 w-full bg-[#1a2744] border border-[#F6248833] rounded-lg shadow-lg overflow-hidden">
      <div ref={listRef} className="max-h-52 overflow-y-auto custom-scrollbar">
        {phoneList.map((cc) => (
          <button
            key={`${cc.isoCode}-${cc.phoneCode}`}
            type="button"
            onClick={() => {
              setSelectedCountry(cc)
              setShowCountryDropdown(false)
            }}
            className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors ${
              cc.isoCode === selectedCountry.isoCode
                ? "bg-white/5 text-white"
                : "text-gray-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{isoToFlag(cc.isoCode)}</span>
              <span className="text-sm font-medium">{cc.name}</span>
            </span>
            <span className="text-sm text-gray-400">{cc.phoneCode}</span>
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
          disabled={!isFormComplete || isLoading}
          className={`w-full mt-6 font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            isFormComplete && !isLoading
              ? "bg-[#e91e8c] hover:bg-[#d11a7d] text-white cursor-pointer shadow-lg shadow-[#e91e8c]/20"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-60"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
              Checking...
            </>
          ) : (
            <>
              Continue
              <span className="text-xl">{"→"}</span>
            </>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center mt-3">{error}</p>
        )}
      </form>

      <p className="text-[#F8F8F8]/80 text-sm text-center mt-6 leading-relaxed">
        By beginning the investment process, you consent to receive communications via email or SMS regarding updates to
        this offer, and may unsubscribe from non-transactional emails at any time.
      </p>
    </div>
  )
}
