"use client"

import { useState, useEffect, useRef } from "react"
import { HelpCircle, ChevronDown, MapPin, Building2, Calendar } from "lucide-react"
import { COUNTRIES, STATIC_STATES, PHONE_CODES } from "@/lib/countries"

interface ContactInformationProps {
  onContinue: (data: ContactData) => void
  defaultCountryCode?: string
}

export interface ContactData {
  investorType: string
  address: string
  city: string
  countryCode: string
  countryName: string
  state: string
  dateOfBirth: string
}

interface ApiCountry {
  id: number
  name: string
  code: string
  states: { id: number; name: string; code: string }[]
}

const investorTypes = [
  "Individual",
  "Joint Tenants",
  "Trust",
  "Entity (LLC, Corporation, etc.)",
  "IRA / Self-Directed IRA",
]

// Static fallback shape (no states)
const STATIC_COUNTRIES: ApiCountry[] = COUNTRIES.map((c) => ({
  id: 0,
  name: c.name,
  code: c.code,
  states: [],
}))

export function ContactInformation({ onContinue, defaultCountryCode }: ContactInformationProps) {
  const [countries, setCountries] = useState<ApiCountry[]>(STATIC_COUNTRIES)
  const [loadingCountries, setLoadingCountries] = useState(true)

  const defaultCountry =
    STATIC_COUNTRIES.find((c) => c.code === defaultCountryCode) ?? STATIC_COUNTRIES[0]

  const [investorType, setInvestorType] = useState("")
  const [investorTypeOpen, setInvestorTypeOpen] = useState(false)
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<ApiCountry>(defaultCountry)
  const [countryOpen, setCountryOpen] = useState(false)
  const [state, setState] = useState("")
  const [stateOpen, setStateOpen] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState("")

  const [touched, setTouched] = useState({
    investorType: false,
    address: false,
    city: false,
    state: false,
    dateOfBirth: false,
  })

  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const countryListRef = useRef<HTMLDivElement>(null)
  const stateDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch live countries from DealMaker
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("/api/dealmaker/countries")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.countries) && data.countries.length > 0) {
            setCountries(data.countries)
            const live = data.countries.find(
              (c: ApiCountry) => c.code === defaultCountryCode
            )
            if (live) setSelectedCountry(live)
          }
        }
      } catch {
        // Silently fall back to static list already set
      } finally {
        setLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [defaultCountryCode])

  // Same country set as the phone prefix dropdown (only countries with a known dial code)
  const displayCountries = countries.filter((c) => !!PHONE_CODES[c.code])

  // Reset state when country changes
  useEffect(() => {
    setState("")
  }, [selectedCountry.code])

  // Typeahead: pressing a letter jumps to the first country starting with it
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

  // Prefer DealMaker states; fall back to static list for known countries
  const countryStates: { id?: number; name: string; code: string }[] =
    selectedCountry.states?.length
      ? selectedCountry.states
      : (STATIC_STATES[selectedCountry.code] ?? [])

  const hasStates = countryStates.length > 0

  const isFormComplete =
    !!investorType &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    dateOfBirth.length === 10

  const handleContinue = () => {
    setTouched({ investorType: true, address: true, city: true, state: true, dateOfBirth: true })
    if (!isFormComplete) return
    // Convert DD/MM/YYYY → YYYY-MM-DD (ISO) for the API
    const [dd, mm, yyyy] = dateOfBirth.split("/")
    const isoDob = `${yyyy}-${mm}-${dd}`

    onContinue({
      investorType,
      address,
      city,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      state,
      dateOfBirth: isoDob,
    })
  }

  return (
    <div className="space-y-4 py-2">
      {/* Investor Type */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-400 text-sm">Who is making the investment?</span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="relative">
          <button
            onClick={() => setInvestorTypeOpen(!investorTypeOpen)}
            className={`w-full bg-[#1a1f35] border rounded-lg py-4 px-4 text-left flex items-center justify-between transition-colors ${
              touched.investorType && !investorType
                ? "border-red-500"
                : "border-gray-600 hover:border-gray-400"
            }`}
          >
            <span className={investorType ? "text-white" : "text-gray-500"}>
              {investorType || "Select an investor type"}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${investorTypeOpen ? "rotate-180" : ""}`}
            />
          </button>
          {investorTypeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f35] border border-gray-600 rounded-lg overflow-hidden z-20">
              {investorTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => { setInvestorType(type); setInvestorTypeOpen(false) }}
                  className={`w-full py-3 px-4 text-left transition-colors ${
                    investorType === type ? "bg-white/10 text-white" : "text-gray-300 hover:bg-[#252a42]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
        {touched.investorType && !investorType && (
          <p className="text-red-400 text-xs mt-1 ml-1">Please select an investor type</p>
        )}
      </div>

      {/* Street Address */}
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Street Address"
          value={address}
          autoComplete="address-line1"
          onBlur={() => setTouched((t) => ({ ...t, address: true }))}
          onChange={(e) => setAddress(e.target.value)}
          className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors ${
            touched.address && !address.trim() ? "border-red-500" : "border-gray-600"
          }`}
        />
        {touched.address && !address.trim() && (
          <p className="text-red-400 text-xs mt-1 ml-1">Address is required</p>
        )}
      </div>

      {/* City */}
      <div className="relative">
        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="City"
          value={city}
          autoComplete="address-level2"
          onBlur={() => setTouched((t) => ({ ...t, city: true }))}
          onChange={(e) => setCity(e.target.value)}
          className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors ${
            touched.city && !city.trim() ? "border-red-500" : "border-gray-600"
          }`}
        />
        {touched.city && !city.trim() && (
          <p className="text-red-400 text-xs mt-1 ml-1">City is required</p>
        )}
      </div>

      {/* Country + State row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Country Dropdown */}
        <div className="relative" ref={countryDropdownRef}>
          <button
            type="button"
            onClick={() => setCountryOpen(!countryOpen)}
            className="w-full bg-transparent border border-gray-600 hover:border-gray-400 rounded-lg py-4 px-4 text-left flex items-center justify-between transition-colors focus:outline-none"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">
                Country{loadingCountries && <span className="ml-1 opacity-50">…</span>}
              </span>
              <span className="text-gray-300 text-sm truncate">{selectedCountry.name}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${countryOpen ? "rotate-180" : ""}`}
            />
          </button>

          {countryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2744] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-30">
              <div ref={countryListRef} className="max-h-52 overflow-y-auto custom-scrollbar">
                {displayCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(c)
                      setCountryOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      c.code === selectedCountry.code
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

        {/* State / Province — dropdown list when states exist, plain text input otherwise */}
        <div className="relative" ref={stateDropdownRef}>
          {hasStates ? (
            <>
              <button
                type="button"
                onClick={() => setStateOpen(!stateOpen)}
                className={`w-full bg-transparent border rounded-lg py-4 px-4 text-left flex items-center justify-between transition-colors focus:outline-none ${
                  touched.state && !state ? "border-red-500" : "border-gray-600 hover:border-gray-400"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">
                    State / Province
                  </span>
                  <span className={`text-sm truncate ${state ? "text-gray-300" : "text-gray-500"}`}>
                    {state || "Select state"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${stateOpen ? "rotate-180" : ""}`}
                />
              </button>

              {stateOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2744] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-30">
                  <div className="max-h-52 overflow-y-auto custom-scrollbar">
                    {countryStates.map((s) => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => { setState(s.name); setStateOpen(false) }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          state === s.name ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
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
              value={state}
              autoComplete="address-level1"
              onBlur={() => setTouched((t) => ({ ...t, state: true }))}
              onChange={(e) => setState(e.target.value)}
              className={`w-full bg-transparent border rounded-lg py-4 px-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors ${
                touched.state && !state.trim() ? "border-red-500" : "border-gray-600"
              }`}
            />
          )}

          {touched.state && !state.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Required</p>
          )}
        </div>
      </div>

      {/* Date of Birth */}
      <div className="relative">
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Date of Birth (DD/MM/YYYY)"
          value={dateOfBirth}
          autoComplete="bday"
          onBlur={() => setTouched((t) => ({ ...t, dateOfBirth: true }))}
          onChange={(e) => {
            // Allow only digits and slashes, auto-insert slashes at positions 2 and 5
            let v = e.target.value.replace(/[^0-9/]/g, "")
            // Remove slashes to re-format cleanly
            const digits = v.replace(/\//g, "")
            if (digits.length <= 2) {
              v = digits
            } else if (digits.length <= 4) {
              v = `${digits.slice(0, 2)}/${digits.slice(2)}`
            } else {
              v = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`
            }
            setDateOfBirth(v)
          }}
          maxLength={10}
          className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors ${
            touched.dateOfBirth && (!dateOfBirth || (dateOfBirth.length > 0 && dateOfBirth.length < 10))
              ? "border-red-500"
              : "border-gray-600"
          }`}
        />
        {touched.dateOfBirth && !dateOfBirth && (
          <p className="text-red-400 text-xs mt-1 ml-1">Date of birth is required</p>
        )}
        {touched.dateOfBirth && dateOfBirth.length > 0 && dateOfBirth.length < 10 && (
          <p className="text-red-400 text-xs mt-1 ml-1">Enter a complete date (DD/MM/YYYY)</p>
        )}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={!isFormComplete}
        className={`w-full mt-2 font-medium py-4 rounded-full transition-colors ${
          isFormComplete
            ? "bg-[#e91e8c] hover:bg-[#d11a7d] text-white"
            : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
        }`}
      >
        Continue
      </button>
    </div>
  )
}
