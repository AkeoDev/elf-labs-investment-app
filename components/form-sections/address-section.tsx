"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, Building2 } from "lucide-react"
import { TextField } from "@/components/form-fields"
import { STATIC_STATES } from "@/lib/countries"
import type { AddressFields, AddressTouched, ApiCountry } from "@/lib/investor-types"
import { ChevronDown } from "lucide-react"

interface AddressSectionProps {
  fields: AddressFields
  onChange: (fields: AddressFields) => void
  touched: AddressTouched
  onBlur: (field: keyof AddressTouched) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
}

export function AddressSection({
  fields,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
}: AddressSectionProps) {
  const [countryOpen, setCountryOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const countryListRef = useRef<HTMLDivElement>(null)
  const stateDropdownRef = useRef<HTMLDivElement>(null)

  // Show all countries from DealMaker (no phone-code filter)
  const displayCountries = countries

  const selectedCountry = displayCountries.find((c) => c.code === fields.countryCode) ??
    displayCountries[0]

  // Compute states: prefer DealMaker states, fall back to static
  const countryStates: { name: string; code: string }[] =
    selectedCountry?.states?.length
      ? selectedCountry.states
      : (STATIC_STATES[fields.countryCode] ?? [])
  const hasStates = countryStates.length > 0

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false)
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setStateOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Typeahead for country dropdown
  useEffect(() => {
    if (!countryOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (!/^[a-zA-Z]$/.test(e.key)) return
      const letter = e.key.toLowerCase()
      const idx = displayCountries.findIndex((c) => c.name.toLowerCase().startsWith(letter))
      if (idx === -1) return
      const buttons = countryListRef.current?.querySelectorAll("button")
      buttons?.[idx]?.scrollIntoView({ block: "nearest" })
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [countryOpen, displayCountries])

  function updateField<K extends keyof AddressFields>(key: K, value: AddressFields[K]) {
    onChange({ ...fields, [key]: value })
  }

  function selectCountry(c: ApiCountry) {
    onChange({
      ...fields,
      countryCode: c.code,
      countryName: c.name,
      state: "", // reset state when country changes
    })
    setCountryOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Street Address */}
      <TextField
        placeholder="Street Address"
        value={fields.address}
        onChange={(v) => updateField("address", v)}
        touched={touched.address}
        onBlur={() => onBlur("address")}
        error={!fields.address.trim() ? "Address is required" : undefined}
        icon={MapPin}
        autoComplete="address-line1"
      />

      {/* Unit / Suite */}
      <TextField
        placeholder="Unit / Apartment / Suite"
        value={fields.unit}
        onChange={(v) => updateField("unit", v)}
        autoComplete="address-line2"
      />

      {/* City */}
      <TextField
        placeholder="City"
        value={fields.city}
        onChange={(v) => updateField("city", v)}
        touched={touched.city}
        onBlur={() => onBlur("city")}
        error={!fields.city.trim() ? "City is required" : undefined}
        icon={Building2}
        autoComplete="address-level2"
      />

      {/* ZIP / Postal Code */}
      <TextField
        placeholder="ZIP / Postal Code"
        value={fields.zip}
        onChange={(v) => updateField("zip", v)}
        touched={touched.zip}
        onBlur={() => onBlur("zip")}
        error={!fields.zip.trim() ? "ZIP / Postal code is required" : undefined}
        autoComplete="postal-code"
      />

      {/* Country + State row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Country Dropdown */}
        <div className="relative" ref={countryDropdownRef}>
          <button
            type="button"
            onClick={() => setCountryOpen(!countryOpen)}
            className="w-full bg-[#0E031EBF] border border-[#F6248833] hover:border-[#F6248866] rounded-lg h-[52px] px-4 text-left flex items-center justify-between transition-colors focus:outline-none"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">
                Country{loadingCountries && <span className="ml-1 opacity-50">...</span>}
              </span>
              <span className="text-[#F8F8F8] text-sm truncate">
                {selectedCountry?.name ?? "Select"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${countryOpen ? "rotate-180" : ""}`}
            />
          </button>

          {countryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0E031EBF] border border-[#F6248833] rounded-lg shadow-xl overflow-hidden z-30">
              <div ref={countryListRef} className="max-h-52 overflow-y-auto custom-scrollbar">
                {displayCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      c.code === fields.countryCode
                        ? "bg-white/10 text-white"
                        : "text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* State / Province */}
        <div className="relative" ref={stateDropdownRef}>
          {hasStates ? (
            <>
              <button
                type="button"
                onClick={() => setStateOpen(!stateOpen)}
                className={`w-full bg-[#0E031EBF] border rounded-lg h-[52px] px-4 text-left flex items-center justify-between transition-colors focus:outline-none ${
                  touched.state && !fields.state ? "border-red-500" : "border-[#F6248833] hover:border-[#F6248866]"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">
                    State / Province
                  </span>
                  <span className={`text-sm truncate ${fields.state ? "text-[#F8F8F8]" : "text-[#F8F8F899]"}`}>
                    {(fields.state && countryStates.find((s) => s.code === fields.state)?.name) || fields.state || "Select state"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${stateOpen ? "rotate-180" : ""}`}
                />
              </button>

              {stateOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0E031EBF] border border-[#F6248833] rounded-lg shadow-xl overflow-hidden z-30">
                  <div className="max-h-52 overflow-y-auto custom-scrollbar">
                    {countryStates.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => {
                          updateField("state", s.code)
                          setStateOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          fields.state === s.code ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="text-gray-500 text-xs">{s.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <input
              type="text"
              placeholder="State / Province"
              value={fields.state}
              autoComplete="address-level1"
              onBlur={() => onBlur("state")}
              onChange={(e) => updateField("state", e.target.value)}
              className={`w-full bg-[#0E031EBF] border rounded-lg h-[52px] px-4 text-[#F8F8F8] placeholder-[#F8F8F899] focus:outline-none focus:border-gray-400 transition-colors ${
                touched.state && !fields.state.trim() ? "border-red-500" : "border-[#F6248833] hover:border-[#F6248866]"
              }`}
            />
          )}

          {touched.state && !fields.state.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Required</p>
          )}
        </div>
      </div>
    </div>
  )
}
