"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"
import { STATIC_PHONE_LIST, buildPhoneList, PHONE_CODES, type CountryWithPhone } from "@/lib/countries"
import { ProgressStepper } from "@/components/progress-stepper"

interface InitialFormProps {
  onSubmit: (data: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode: string
    investmentAmount: number
    shares: number
    bonusShares: number
  }) => void
  isLoading?: boolean
  error?: string
  onErrorClear?: () => void
  defaultAmount?: number
  defaultUserData?: { email: string; firstName: string; lastName: string; phone: string; countryCode: string }
  currentStep?: number
  onStepClick?: (step: number) => void
}

/** Convert ISO 3166-1 alpha-2 code to flag emoji (e.g. "US" → "🇺🇸") */
function isoToFlag(iso: string): string {
  return [...iso.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("")
}

/** Animated count-up hook */
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    let raf: number
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// Static fallbacks for deal config
const DEFAULT_SHARE_PRICE = 2.25
const DEFAULT_MIN_INVESTMENT = 974.25
const DEFAULT_TIERS = [
  { minAmount: 2500, bonusPercent: 5 },
  { minAmount: 5000, bonusPercent: 10 },
  { minAmount: 10000, bonusPercent: 15 },
  { minAmount: 25000, bonusPercent: 20 },
  { minAmount: 100000, bonusPercent: 20 },
]

interface DealConfig {
  sharePrice: number
  minInvestment: number
  bonusTiers: { minAmount: number; bonusPercent: number }[]
  source: "static" | "api"
}

/** Strip dial-code prefix from an E.164 phone using the ISO country code */
function stripPhonePrefix(e164Phone: string, isoCode: string): string {
  const prefix = PHONE_CODES[isoCode]
  if (prefix && e164Phone.startsWith(prefix)) {
    return e164Phone.slice(prefix.length)
  }
  return e164Phone.replace(/^\+\d{1,4}/, "")
}

export function InitialForm({ onSubmit, isLoading, error, onErrorClear, defaultAmount, defaultUserData, currentStep, onStepClick }: InitialFormProps) {
  // ─── Phone / country state ────────────────────────────────────────────
  const [phoneList, setPhoneList] = useState<CountryWithPhone[]>(STATIC_PHONE_LIST)
  const [selectedCountry, setSelectedCountry] = useState<CountryWithPhone>(() => {
    if (defaultUserData?.countryCode) {
      const match = STATIC_PHONE_LIST.find((c) => c.isoCode === defaultUserData.countryCode)
      if (match) return match
    }
    return STATIC_PHONE_LIST[0]
  })

  const [formData, setFormData] = useState(() => {
    if (defaultUserData?.email) {
      return {
        email: defaultUserData.email,
        firstName: defaultUserData.firstName,
        lastName: defaultUserData.lastName,
        phone: defaultUserData.phone
          ? stripPhonePrefix(defaultUserData.phone, defaultUserData.countryCode)
          : "",
      }
    }
    return { email: "", firstName: "", lastName: "", phone: "" }
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

  // ─── Deal config / investment state ───────────────────────────────────
  const [loadingDeal, setLoadingDeal] = useState(true)
  const [dealConfig, setDealConfig] = useState<DealConfig>({
    sharePrice: DEFAULT_SHARE_PRICE,
    minInvestment: DEFAULT_MIN_INVESTMENT,
    bonusTiers: DEFAULT_TIERS,
    source: "static",
  })
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")

  // ─── Fetch countries ──────────────────────────────────────────────────
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
              setSelectedCountry((prev) => list.find((c) => c.isoCode === prev.isoCode) ?? list[0])
            }
          }
        }
      } catch {
        // Silently keep the static fallback
      }
    }
    fetchCountries()
  }, [])

  // ─── Fetch deal info ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDealInfo() {
      try {
        const res = await fetch("/api/dealmaker/deal-info")
        if (res.ok) {
          const data = await res.json()
          setDealConfig({
            sharePrice: data.sharePrice ?? DEFAULT_SHARE_PRICE,
            minInvestment: data.minInvestment ?? DEFAULT_MIN_INVESTMENT,
            bonusTiers: data.bonusTiers?.length ? data.bonusTiers : DEFAULT_TIERS,
            source: data.source ?? "static",
          })
        }
      } catch {
        // Silently fall back to static values
      } finally {
        setLoadingDeal(false)
      }
    }
    fetchDealInfo()
  }, [])

  // ─── Pre-fill investment from defaultAmount (back navigation) ─────────
  const [defaultApplied, setDefaultApplied] = useState(false)
  useEffect(() => {
    if (!loadingDeal && defaultAmount && defaultAmount > 0 && !defaultApplied) {
      setDefaultApplied(true)
      const tierIndex = dealConfig.bonusTiers.findIndex((t) => t.minAmount === defaultAmount)
      if (tierIndex !== -1) {
        setSelectedTier(tierIndex)
        setCustomAmount("")
      } else {
        setSelectedTier(null)
        setCustomAmount(defaultAmount.toString())
      }
    }
  }, [loadingDeal, defaultAmount, defaultApplied, dealConfig.bonusTiers])

  // ─── Close dropdown on outside click ──────────────────────────────────
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

  // ─── Investment calculations ──────────────────────────────────────────
  const { sharePrice, minInvestment, bonusTiers } = dealConfig

  const getActiveAmount = () => {
    if (selectedTier !== null) return bonusTiers[selectedTier].minAmount
    return Number.parseFloat(customAmount) || 0
  }

  const getActiveBonusPercent = () => {
    if (selectedTier !== null) return bonusTiers[selectedTier].bonusPercent
    const amount = Number.parseFloat(customAmount) || 0
    let percent = 0
    for (const tier of bonusTiers) {
      if (amount >= tier.minAmount) percent = tier.bonusPercent
    }
    return percent
  }

  const activeAmount = getActiveAmount()
  const bonusPercent = getActiveBonusPercent()
  const baseShares = Math.floor(activeAmount / sharePrice)
  const bonusShares = Math.floor(baseShares * (bonusPercent / 100))
  const animatedBase = useCountUp(baseShares)
  const animatedBonus = useCountUp(bonusShares)

  const calculateShares = (amount: number) => Math.floor(amount / sharePrice)
  const calculateBonusShares = (amount: number, percent: number) =>
    Math.floor(calculateShares(amount) * (percent / 100))

  const handleTierSelect = (index: number) => {
    setSelectedTier(index)
    setCustomAmount("")
    onErrorClear?.()
  }

  // ─── Validation ───────────────────────────────────────────────────────
  const isValidEmail = formData.email.includes("@") && formData.email.includes(".")
  const isFormComplete =
    formData.email.trim() !== "" &&
    isValidEmail &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.phone.trim().length >= 7 &&
    activeAmount >= minInvestment

  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, firstName: true, lastName: true, phone: true })
    if (!isFormComplete) return
    onSubmit({
      ...formData,
      phone: `${selectedCountry.phoneCode}${formData.phone}`,
      countryCode: selectedCountry.isoCode,
      investmentAmount: activeAmount,
      shares: baseShares,
      bonusShares,
    })
  }

  return (
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0D1425] p-4 sm:p-6 max-w-xl mx-auto">
      {currentStep !== undefined && (
        <ProgressStepper currentStep={currentStep} onStepClick={onStepClick} />
      )}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10">

      {/* ─── Contact Fields ─────────────────────────────────────────── */}

      <div className="relative">
  <input
    type="email"
    placeholder="Email"
    value={formData.email}
    onBlur={() => setTouched({ ...touched, email: true })}
    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); onErrorClear?.() }}
    className={`w-full bg-[#0E031EBF] border rounded-lg py-4 px-4
    text-[#F8F8F8] placeholder-[#F8F8F899]
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
    className={`w-full bg-[#0E031EBF] border rounded-lg py-4 px-4
    text-[#F8F8F8] placeholder-[#F8F8F899]
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
    className={`w-full bg-[#0E031EBF] border rounded-lg py-4 px-4
    text-[#F8F8F8] placeholder-[#F8F8F899]
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
          <div className={`flex border rounded-lg overflow-hidden bg-[#0E031EBF] ${
            touched.phone && formData.phone.trim().length < 7 ? "border-red-500" : "border-[#F6248833]"
          }`}>
            {/* Country code dropdown */}
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-1.5 px-3 py-4 border-r border-[#F6248833] hover:bg-white/5 transition-colors"
            >
              <span className="text-lg leading-none">{isoToFlag(selectedCountry.isoCode)}</span>
              <span className="text-[#F8F8F8] text-sm">{selectedCountry.phoneCode}</span>
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
        className="w-full bg-transparent py-4 px-4 text-[#F8F8F8] placeholder-[#F8F8F899] focus:outline-none"
      />
    </div>
  </div>

  {showCountryDropdown && (
    <div className="absolute z-50 mt-1 w-full bg-[#0E031EBF] border border-[#F6248833] rounded-lg shadow-lg overflow-hidden">
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

        {/* ─── Investment Amount Section ────────────────────────────── */}

        <div className="space-y-4 pt-2">
          <h3 className="text-white text-xl font-semibold text-center">How much would you like to invest?</h3>

          {loadingDeal ? (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex justify-between text-sm mb-2 gap-2">
              <span className="text-gray-400">
                Min. investment <span className="text-white font-semibold">${minInvestment.toFixed(2)}</span>
              </span>
              <span className="text-gray-400">
                Share price <span className="text-white font-semibold">${sharePrice.toFixed(2)}</span>
              </span>
            </div>
          )}

          <div className="bg-[#F6248829] rounded-lg py-6 px-4 mb-4">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-white text-4xl font-bold">{animatedBase.toLocaleString("en-US")}</p>
                <p className="text-gray-400 text-base">Shares of Elf</p>
              </div>
              <span className="text-gray-400 text-3xl font-light">+</span>
              <div className="text-center">
                <p className="text-[#e91e8c] text-4xl font-bold">{animatedBonus.toLocaleString("en-US")}</p>
                <p className="text-[#e91e8c]/70 text-base">Free Bonus Shares</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {bonusTiers.map((tier, index) => {
              const tierShares = calculateShares(tier.minAmount)
              const tierBonusShares = calculateBonusShares(tier.minAmount, tier.bonusPercent)
              const isSelected = selectedTier === index

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTierSelect(index)}
                  className="w-full py-4 px-4 rounded-lg grid grid-cols-3 items-center gap-1 transition-all bg-transparent"
                >
                  {/* Column 1: Radio + Amount */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-[#e91e8c]" : "border-2 border-gray-500"
                      }`}
                    />
                    <div className="text-left">
                      <p className={`font-bold text-sm ${isSelected ? "text-white" : "text-gray-200"}`}>
                        Invest ${tier.minAmount.toLocaleString("en-US")}
                      </p>
                      <p className="text-gray-400 text-xs">{tierShares.toLocaleString("en-US")} Shares</p>
                    </div>
                  </div>

                  {/* Column 2: Free Shares badge */}
                  {tier.bonusPercent > 0 ? (
                    <div style={{ backgroundColor: isSelected ? '#e91e8c' : 'rgba(233, 30, 140, 0.6)' }} className="text-white rounded-lg px-3 py-2 text-center">
                      <span className="font-bold text-sm block leading-snug">+{tierBonusShares.toLocaleString("en-US")}</span>
                      <span className="text-xs font-medium block leading-snug">Free Shares</span>
                    </div>
                  ) : <div />}

                  {/* Column 3: Bonus badge */}
                  {tier.bonusPercent > 0 ? (
                    <div style={{ backgroundColor: isSelected ? '#e91e8c' : 'rgba(233, 30, 140, 0.6)' }} className="text-white rounded-lg px-3 py-2 text-center">
                      <span className="font-bold text-sm block leading-snug">{tier.bonusPercent.toFixed(2)}%</span>
                      <span className="text-xs font-medium block leading-snug">Bonus</span>
                    </div>
                  ) : <div />}
                </button>
              )
            })}
          </div>

          {/* Custom amount input */}
          <div className="mt-4">
            <div className={`rounded-lg px-4 py-3 flex items-center transition-colors ${
              selectedTier === null && customAmount ? "bg-[#0E031EBF] ring-1 ring-[#e91e8c]/40" : "bg-[#0E031EBF]"
            }`}>
              <label className="text-gray-400 text-sm whitespace-nowrap">Amount: $</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "")
                  if (val.split(".").length > 2) return
                  setCustomAmount(val)
                  setSelectedTier(null)
                  onErrorClear?.()
                }}
                className="bg-transparent text-[#F8F8F8] text-base outline-none ml-2 flex-1 min-w-0 placeholder-[#F8F8F899]"
              />
            </div>
            {selectedTier === null && customAmount && activeAmount < minInvestment && (
              <p className="text-red-400 text-xs mt-1.5 ml-1">
                Minimum investment is ${minInvestment.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* ─── Continue Button ──────────────────────────────────────── */}

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
              Processing...
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
