"use client"

import { useState, useEffect, useRef } from "react"
import { Phone, ChevronDown } from "lucide-react"
import type { CountryWithPhone } from "@/lib/countries"

interface PhoneFieldProps {
  value: string
  countryCode: string
  onChange: (phone: string, countryCode: string) => void
  touched?: boolean
  onBlur?: () => void
  error?: string
  phoneList: CountryWithPhone[]
}

export function PhoneField({
  value,
  countryCode,
  onChange,
  touched,
  onBlur,
  error,
  phoneList,
}: PhoneFieldProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedCountry = phoneList.find((c) => c.isoCode === countryCode) ?? phoneList[0]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Typeahead: pressing a letter jumps to the first matching country
  useEffect(() => {
    if (!showDropdown) return
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
  }, [showDropdown, phoneList])

  const hasError = touched && !!error

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`flex border rounded-lg overflow-hidden ${
          hasError ? "border-red-500" : "border-[#F6248833]"
        }`}
      >
        {/* Country code selector */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 px-3 py-4 border-r border-[#F6248833] hover:bg-white/5 transition-colors"
        >
          <span className="text-gray-300 text-sm font-medium">{selectedCountry?.name}</span>
          <span className="text-gray-300 text-sm">{selectedCountry?.phoneCode}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        </button>

        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="tel"
            placeholder="Phone number"
            value={value}
            onBlur={onBlur}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, "")
              onChange(digits, countryCode)
            }}
            className="w-full bg-transparent py-4 pl-10 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Country dropdown menu */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-[#1a2744] border border-[#F6248833] rounded-lg shadow-lg overflow-hidden">
          <div ref={listRef} className="max-h-52 overflow-y-auto custom-scrollbar">
            {phoneList.map((c) => (
              <button
                key={`${c.isoCode}-${c.phoneCode}`}
                type="button"
                onClick={() => {
                  onChange(value, c.isoCode)
                  setShowDropdown(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                  c.isoCode === countryCode ? "bg-white/5 text-white" : "text-gray-300"
                }`}
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-sm text-gray-400">{c.phoneCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasError && (
        <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  )
}
