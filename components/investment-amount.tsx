"use client"

import { useState } from "react"

interface InvestmentAmountProps {
  onContinue: (amount: number, shares: number, bonusShares: number) => void
}

const SHARE_PRICE = 2.25
const MIN_INVESTMENT = 974.25

const pricingTiers = [
  { amount: 2500, bonusPercent: 5 },
  { amount: 5000, bonusPercent: 10 },
  { amount: 10000, bonusPercent: 15 },
  { amount: 25000, bonusPercent: 20 },
  { amount: 100000, bonusPercent: 20 },
]

export function InvestmentAmount({ onContinue }: InvestmentAmountProps) {
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")

  const getActiveAmount = () => {
    if (selectedTier !== null) {
      return pricingTiers[selectedTier].amount
    }
    return Number.parseFloat(customAmount) || 0
  }

  const getActiveBonusPercent = () => {
    if (selectedTier !== null) {
      return pricingTiers[selectedTier].bonusPercent
    }
    const amount = Number.parseFloat(customAmount) || 0
    if (amount >= 100000) return 20
    if (amount >= 25000) return 20
    if (amount >= 10000) return 15
    if (amount >= 5000) return 10
    if (amount >= 2500) return 5
    return 0
  }

  const activeAmount = getActiveAmount()
  const bonusPercent = getActiveBonusPercent()
  const baseShares = Math.floor(activeAmount / SHARE_PRICE)
  const bonusShares = Math.floor(baseShares * (bonusPercent / 100))

  const calculateShares = (amount: number) => Math.floor(amount / SHARE_PRICE)
  const calculateBonusShares = (amount: number, percent: number) =>
    Math.floor(calculateShares(amount) * (percent / 100))

  const handleTierSelect = (index: number) => {
    setSelectedTier(index)
    setCustomAmount("")
  }

  const canContinue = activeAmount >= MIN_INVESTMENT

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm mb-2 gap-2">
        <span className="text-gray-400">
          Min. investment <span className="text-white font-semibold">${MIN_INVESTMENT.toFixed(2)}</span>
        </span>
        <span className="text-gray-400">
          Share price <span className="text-white font-semibold">${SHARE_PRICE.toFixed(2)}</span>
        </span>
      </div>

      <div className="bg-[#1a2744] rounded-lg py-6 px-4 mb-4">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-white text-4xl font-bold">{baseShares.toLocaleString()}</p>
            <p className="text-gray-400 text-base">Shares of Elf</p>
          </div>
          <span className="text-gray-400 text-3xl font-light">+</span>
          <div className="text-center">
            <p className="text-[#e91e8c] text-4xl font-bold">{bonusShares.toLocaleString()}</p>
            <p className="text-[#e91e8c]/70 text-base">Bonus Shares</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {pricingTiers.map((tier, index) => {
          const tierShares = calculateShares(tier.amount)
          const tierBonusShares = calculateBonusShares(tier.amount, tier.bonusPercent)
          const isSelected = selectedTier === index

          return (
            <button
              key={index}
              onClick={() => handleTierSelect(index)}
              className={`w-full py-4 px-4 rounded-lg flex items-center justify-between transition-all ${
                isSelected ? "bg-[#1a2744]" : "bg-[#0f1629]"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Radio circle */}
                <div
                  className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-[#e91e8c]" : "border-gray-500"
                  }`}
                >
                  {isSelected && <div className="w-3 h-3 rounded-full bg-[#e91e8c]" />}
                </div>

                {/* Amount and shares */}
                <div className="text-left">
                  <p className={`font-bold text-lg ${isSelected ? "text-white" : "text-gray-200"}`}>
                    Invest ${tier.amount.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-base">{tierShares.toLocaleString()} Shares</p>
                </div>
              </div>

              {/* Badges */}
              {tier.bonusPercent > 0 && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="bg-[#c9a227] text-[#1a1f35] rounded-full px-2 sm:px-3 py-0.5 sm:py-1.5 text-center">
                    <span className="font-bold text-[10px] sm:text-sm block leading-snug">+{tierBonusShares.toLocaleString()}</span>
                    <span className="text-[8px] sm:text-xs font-medium block leading-snug">Bonus Shares</span>
                  </div>
                  <div className="bg-[#c9a227] text-[#1a1f35] rounded-full px-2 sm:px-3 py-0.5 sm:py-1.5 text-center">
                    <span className="font-bold text-[10px] sm:text-sm block leading-snug">{tier.bonusPercent}%</span>
                    <span className="text-[8px] sm:text-xs font-medium block leading-snug">Bonus</span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Custom amount input */}
      <div className="mt-4">
        <div className="bg-[#1a2744] rounded-lg px-4 py-3 flex items-center">
          <label className="text-gray-500 text-sm">Amount: $</label>
          <input
            type="text"
            placeholder="Enter custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value)
              setSelectedTier(null)
            }}
            className="bg-transparent text-white text-base outline-none ml-2 flex-1 min-w-0"
          />
        </div>
      </div>

      {/* Total shares row */}
      <div className="flex justify-between items-center py-3 border-t border-gray-700 mt-4">
        <span className="text-gray-300 text-lg">Total Shares</span>
        <span className="text-white font-bold text-2xl">{(baseShares + bonusShares).toLocaleString()}</span>
      </div>

      {/* Continue button */}
      <button
        onClick={() => onContinue(activeAmount, baseShares, bonusShares)}
        disabled={!canContinue}
        className={`w-full py-4 rounded-full font-medium flex items-center justify-center gap-2 transition-colors ${
          canContinue ? "bg-[#e91e8c] hover:bg-[#d11a7d] text-white" : "bg-gray-600 text-gray-400 cursor-not-allowed"
        }`}
      >
        Continue
        <span className="text-lg">→</span>
      </button>
    </div>
  )
}
