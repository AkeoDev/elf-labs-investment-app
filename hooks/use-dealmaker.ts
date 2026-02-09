"use client"

import { useState } from "react"
import { DEALMAKER_CONFIG, calculateInvestment, validateInvestment } from "@/lib/dealmaker"

interface InvestorData {
  email: string
  firstName: string
  lastName: string
  phone?: string
  investmentAmount: number
}

interface CreateInvestorResponse {
  success: boolean
  investor: {
    id: number
    email: string
    name: string
    state: string
    investmentAmount: number
    numberOfSecurities: number
    accessLink?: string
  }
  calculation: {
    baseShares: number
    bonusShares: number
    bonusPercent: number
    totalShares: number
  }
}

/**
 * React hook for DealMaker integration
 * 
 * Usage:
 * ```tsx
 * const { createInvestor, isLoading, error, config, calculate } = useDealMaker()
 * 
 * // Calculate shares for display
 * const { baseShares, bonusShares, totalShares } = calculate(5000)
 * 
 * // Create investor when form is submitted
 * const result = await createInvestor({
 *   email: "investor@example.com",
 *   firstName: "John",
 *   lastName: "Doe",
 *   phone: "+1234567890",
 *   investmentAmount: 5000
 * })
 * 
 * // Redirect to DealMaker to complete investment
 * if (result?.investor.accessLink) {
 *   window.location.href = result.investor.accessLink
 * }
 * ```
 */
export function useDealMaker() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Create an investor in DealMaker
   */
  const createInvestor = async (
    data: InvestorData
  ): Promise<CreateInvestorResponse | null> => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate locally first
      const validation = validateInvestment(data.investmentAmount)
      if (!validation.valid) {
        setError(validation.error || "Invalid investment amount")
        return null
      }

      const response = await fetch("/api/dealmaker/investors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create investor")
        return null
      }

      return result as CreateInvestorResponse
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred"
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Calculate shares and bonus for a given amount (client-side only)
   */
  const calculate = (amount: number) => {
    return calculateInvestment(amount)
  }

  /**
   * Validate an investment amount (client-side only)
   */
  const validate = (amount: number) => {
    return validateInvestment(amount)
  }

  return {
    createInvestor,
    isLoading,
    error,
    calculate,
    validate,
    config: {
      sharePrice: DEALMAKER_CONFIG.sharePrice,
      minInvestment: DEALMAKER_CONFIG.minInvestment,
      currency: DEALMAKER_CONFIG.currency,
      bonusTiers: DEALMAKER_CONFIG.bonusTiers,
    },
  }
}
