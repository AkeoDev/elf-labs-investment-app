"use client"

import { useState, useEffect } from "react"

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    let raf: number
    const step = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out for natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

interface InvestmentAmountProps {
  onContinue: (amount: number, shares: number, bonusShares: number) => void
  onBack?: () => void
  defaultAmount?: number
  isCreating?: boolean
  createError?: string
}

// Static fallbacks - used while loading or if API is unreachable
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

export function InvestmentAmount({ onContinue, onBack, defaultAmount, isCreating, createError }: InvestmentAmountProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [dealConfig, setDealConfig] = useState<DealConfig>({
    sharePrice: DEFAULT_SHARE_PRICE,
    minInvestment: DEFAULT_MIN_INVESTMENT,
    bonusTiers: DEFAULT_TIERS,
    source: "static",
  })

  // Fetch live deal info on mount
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
        setLoading(false)
      }
    }
    fetchDealInfo()
  }, [])

  // Pre-fill from existing investor's amount once deal config is loaded
  const [defaultApplied, setDefaultApplied] = useState(false)
  useEffect(() => {
    if (!loading && defaultAmount && defaultAmount > 0 && !defaultApplied) {
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
  }, [loading, defaultAmount, defaultApplied, dealConfig.bonusTiers])

  const { sharePrice, minInvestment, bonusTiers } = dealConfig

  const getActiveAmount = () => {
    if (selectedTier !== null) {
      return bonusTiers[selectedTier].minAmount
    }
    return Number.parseFloat(customAmount) || 0
  }

  const getActiveBonusPercent = () => {
    if (selectedTier !== null) {
      return bonusTiers[selectedTier].bonusPercent
    }
    const amount = Number.parseFloat(customAmount) || 0
    // Find the highest qualifying tier
    let percent = 0
    for (const tier of bonusTiers) {
      if (amount >= tier.minAmount) {
        percent = tier.bonusPercent
      }
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

  const [validationError, setValidationError] = useState("")

  const handleTierSelect = (index: number) => {
    setSelectedTier(index)
    setCustomAmount("")
    setValidationError("")
  }

  const canContinue = activeAmount >= minInvestment

  const handleContinue = () => {
    if (activeAmount <= 0) {
      setValidationError("Please select an investment amount or enter a custom amount")
      return
    }
    if (activeAmount < minInvestment) {
      setValidationError(`Minimum investment is $${minInvestment.toFixed(2)}`)
      return
    }
    setValidationError("")
    onContinue(activeAmount, baseShares, bonusShares)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white text-xl font-semibold text-center">How much would you like to invest?</h3>

      {loading ? (
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
            <p className="text-white text-4xl font-bold">{animatedBase.toLocaleString()}</p>
            <p className="text-gray-400 text-base">Shares of Elf</p>
          </div>
          <span className="text-gray-400 text-3xl font-light">+</span>
          <div className="text-center">
            <p className="text-[#e91e8c] text-4xl font-bold">{animatedBonus.toLocaleString()}</p>
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
              onClick={() => handleTierSelect(index)}
              className="w-full py-4 px-4 rounded-lg grid grid-cols-2 items-center gap-2 transition-all bg-transparent"
            >
              {/* Left column: Radio + Amount */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-[#e91e8c]" : "border-2 border-gray-500"
                  }`}
                />
                <div className="text-left">
                  <p className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-200"}`}>
                    Invest ${tier.minAmount.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-base">{tierShares.toLocaleString()} Shares</p>
                </div>
              </div>

              {/* Right column: Badges */}
              {tier.bonusPercent > 0 ? (
                <div className="flex items-center gap-2">
                  <div className={`${isSelected ? "bg-[#e91e8c]" : "bg-[#e91e8c]/20"} text-[#F8F8F8] rounded-lg px-3 py-2 text-center flex-1`}>
                    <span className="font-bold text-sm block leading-snug">+{tierBonusShares.toLocaleString()}</span>
                    <span className="text-xs font-medium block leading-snug">Free Shares</span>
                  </div>
                  <div className={`${isSelected ? "bg-[#e91e8c]" : "bg-[#e91e8c]/20"} text-[#F8F8F8] rounded-lg px-3 py-2 text-center flex-1`}>
                    <span className="font-bold text-sm block leading-snug">{tier.bonusPercent.toFixed(2)}%</span>
                    <span className="text-xs font-medium block leading-snug">Bonus</span>
                  </div>
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
              // Prevent multiple dots
              if (val.split(".").length > 2) return
              setCustomAmount(val)
              setSelectedTier(null)
              setValidationError("")
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

      {/* Validation / creation error */}
      {(validationError || createError) && (
        <p className="text-red-400 text-sm text-center">{validationError || createError}</p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            disabled={isCreating}
            className="py-4 px-6 rounded-full font-medium flex items-center justify-center gap-2 transition-colors border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">←</span>
            Back
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={isCreating}
          className="flex-1 py-4 rounded-full font-medium flex items-center justify-center gap-2 transition-colors bg-[#e91e8c] hover:bg-[#d11a7d] text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "Processing..." : (
            <>
              Continue
              <span className="text-lg">→</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
