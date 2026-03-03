"use client"

import { useState, useEffect, useRef } from "react"
import { HelpCircle, ChevronDown, MapPin, Building2, Calendar } from "lucide-react"
import { COUNTRIES } from "@/lib/countries"

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
  const [countrySearch, setCountrySearch] = useState("")
  const [state, setState] = useState("")
  const [stateOpen, setStateOpen] = useState(false)
  const [stateSearch, setStateSearch] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")

  const [touched, setTouched] = useState({
    investorType: false,
    address: false,
    city: false,
    state: false,
    dateOfBirth: false,
  })

  // Google Places autocomplete
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [predictionsOpen, setPredictionsOpen] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const stateDropdownRef = useRef<HTMLDivElement>(null)
  const addressDropdownRef = useRef<HTMLDivElement>(null)
  const countrySearchRef = useRef<HTMLInputElement>(null)
  const stateSearchRef = useRef<HTMLInputElement>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  // Holds a state name to restore after country change resets it
  const pendingStateRef = useRef<string | null>(null)

  // Fetch live countries from DealMaker
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("/api/dealmaker/countries")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.countries) && data.countries.length > 0) {
            setCountries(data.countries)
            // Re-select the default country from the live list
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

  // Load Google Maps Places script once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const init = () => {
      autocompleteService.current = new window.google.maps.places.AutocompleteService()
      placesService.current = new window.google.maps.places.PlacesService(
        document.createElement("div")
      )
      setMapsLoaded(true)
    }

    if (window.google?.maps?.places) {
      init()
      return
    }

    const callbackName = "__placesInit"
    ;(window as unknown as Record<string, unknown>)[callbackName] = init

    if (!document.querySelector("script[data-gmaps]")) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`
      script.async = true
      script.dataset.gmaps = "true"
      document.head.appendChild(script)
    }
  }, [])

  // Fetch address predictions with 300 ms debounce
  useEffect(() => {
    if (!mapsLoaded || !autocompleteService.current || address.length < 3) {
      setPredictions([])
      setPredictionsOpen(false)
      return
    }

    const timer = setTimeout(() => {
      autocompleteService.current!.getPlacePredictions(
        { input: address, types: ["address"] },
        (results, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            results &&
            results.length > 0
          ) {
            setPredictions(results)
            setPredictionsOpen(true)
          } else {
            setPredictions([])
            setPredictionsOpen(false)
          }
        }
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [address, mapsLoaded])

  // Reset state when country changes; restore pending state if set by place selection
  useEffect(() => {
    if (pendingStateRef.current !== null) {
      setState(pendingStateRef.current)
      pendingStateRef.current = null
    } else {
      setState("")
    }
  }, [selectedCountry.code])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryOpen(false)
        setCountrySearch("")
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setStateOpen(false)
        setStateSearch("")
      }
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
        setPredictionsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search when country dropdown opens
  useEffect(() => {
    if (countryOpen) setTimeout(() => countrySearchRef.current?.focus(), 50)
  }, [countryOpen])

  // Focus search / input when state dropdown opens
  useEffect(() => {
    if (stateOpen) setTimeout(() => stateSearchRef.current?.focus(), 50)
  }, [stateOpen])

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const hasStates = selectedCountry.states && selectedCountry.states.length > 0

  const filteredStates = (selectedCountry.states ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(stateSearch.toLowerCase())
  )

  // Max DOB = 18 years ago
  const maxDob = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().split("T")[0]
  })()

  const isFormComplete =
    !!investorType &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    dateOfBirth.length > 0

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    // Show the street portion only (not the full formatted address)
    setAddress(prediction.structured_formatting.main_text)
    setPredictionsOpen(false)
    setPredictions([])

    // Fetch full place details to auto-fill city, state, country
    placesService.current?.getDetails(
      { placeId: prediction.place_id, fields: ["address_components"] },
      (place, status) => {
        if (
          status !== window.google.maps.places.PlacesServiceStatus.OK ||
          !place?.address_components
        )
          return

        let cityVal = ""
        let stateVal = ""
        let countryCode = ""

        for (const component of place.address_components) {
          if (component.types.includes("locality")) cityVal = component.long_name
          if (component.types.includes("administrative_area_level_1")) stateVal = component.long_name
          if (component.types.includes("country")) countryCode = component.short_name
        }

        if (cityVal) setCity(cityVal)

        if (countryCode) {
          const matchedCountry = countries.find((c) => c.code === countryCode)
          if (matchedCountry) {
            // Find state by name in DealMaker list (if available), else use raw name
            const matchedState =
              matchedCountry.states?.find(
                (s) => s.name.toLowerCase() === stateVal.toLowerCase()
              )?.name ?? stateVal

            // pendingStateRef is read by the selectedCountry useEffect after reset
            pendingStateRef.current = matchedState || null
            setSelectedCountry(matchedCountry)
          }
        } else if (stateVal) {
          setState(stateVal)
        }
      }
    )
  }

  const handleContinue = () => {
    setTouched({ investorType: true, address: true, city: true, state: true, dateOfBirth: true })
    if (!isFormComplete) return
    onContinue({
      investorType,
      address,
      city,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      state,
      dateOfBirth,
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

      {/* Street Address — with Google Places autocomplete */}
      <div className="relative" ref={addressDropdownRef}>
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
        <input
          type="text"
          placeholder="Street Address"
          value={address}
          autoComplete="off"
          onBlur={() => setTouched((t) => ({ ...t, address: true }))}
          onChange={(e) => {
            setAddress(e.target.value)
            if (!e.target.value) setPredictionsOpen(false)
          }}
          className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors ${
            touched.address && !address.trim() ? "border-red-500" : "border-gray-600"
          }`}
        />
        {predictionsOpen && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2744] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-30">
            {predictions.map((p) => (
              <button
                key={p.place_id}
                type="button"
                // prevent input blur before click registers
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectPrediction(p)}
                className="w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <p className="text-gray-200 text-sm">{p.structured_formatting.main_text}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {p.structured_formatting.secondary_text}
                </p>
              </button>
            ))}
          </div>
        )}
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
              <div className="p-2 border-b border-gray-600">
                <input
                  ref={countrySearchRef}
                  type="text"
                  placeholder="Search country..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full bg-[#0f1629] border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No results</p>
                ) : (
                  filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c)
                        setCountryOpen(false)
                        setCountrySearch("")
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
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* State / Province — always a dropdown; searchable list when DealMaker provides states, free-text input otherwise */}
        <div className="relative" ref={stateDropdownRef}>
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
                {state || (hasStates ? "Select state" : "Enter state")}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${stateOpen ? "rotate-180" : ""}`}
            />
          </button>

          {stateOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2744] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-30">
              {hasStates ? (
                <>
                  <div className="p-2 border-b border-gray-600">
                    <input
                      ref={stateSearchRef}
                      type="text"
                      placeholder="Search state..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="w-full bg-[#0f1629] border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredStates.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">No results</p>
                    ) : (
                      filteredStates.map((s) => (
                        <button
                          key={s.code}
                          type="button"
                          onClick={() => { setState(s.name); setStateOpen(false); setStateSearch("") }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                            state === s.name ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{s.name}</span>
                          <span className="text-gray-500 text-xs">{s.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="p-2">
                  <input
                    ref={stateSearchRef}
                    type="text"
                    placeholder="Type state / province..."
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                    onKeyDown={(e) => { if (e.key === "Enter" && state.trim()) setStateOpen(false) }}
                    className="w-full bg-[#0f1629] border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
                  />
                  {state.trim() && (
                    <button
                      type="button"
                      onClick={() => setStateOpen(false)}
                      className="w-full mt-1 py-2 text-sm text-center text-[#e91e8c] hover:text-[#d11a7d] transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {touched.state && !state.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Required</p>
          )}
        </div>
      </div>

      {/* Date of Birth */}
      <div className="relative">
        <Calendar className="absolute left-4 top-[18px] w-4 h-4 text-gray-400 pointer-events-none" />
        <div
          className={`w-full bg-transparent border rounded-lg py-3 pl-12 pr-4 flex flex-col transition-colors ${
            touched.dateOfBirth && !dateOfBirth ? "border-red-500" : "border-gray-600"
          }`}
        >
          <span className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-1">
            Date of Birth
          </span>
          <input
            type="date"
            value={dateOfBirth}
            max={maxDob}
            onBlur={() => setTouched((t) => ({ ...t, dateOfBirth: true }))}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="bg-transparent text-gray-300 focus:outline-none [color-scheme:dark] text-sm w-full"
          />
        </div>
        {touched.dateOfBirth && !dateOfBirth && (
          <p className="text-red-400 text-xs mt-1 ml-1">Date of birth is required</p>
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
