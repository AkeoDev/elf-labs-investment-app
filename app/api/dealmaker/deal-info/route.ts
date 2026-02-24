import { NextResponse } from "next/server"
import { getDeal, getIncentiveTiers, DEALMAKER_CONFIG } from "@/lib/dealmaker"

/**
 * GET /api/dealmaker/deal-info
 * 
 * Fetches live deal configuration (share price, minimum investment, bonus tiers)
 * from DealMaker's API. Falls back to static config if the API is unreachable.
 */
export async function GET() {
  // Static fallbacks from config
  const fallback = {
    sharePrice: DEALMAKER_CONFIG.sharePrice,
    minInvestment: DEALMAKER_CONFIG.minInvestment,
    currency: DEALMAKER_CONFIG.currency,
    securityType: DEALMAKER_CONFIG.securityType,
    bonusTiers: DEALMAKER_CONFIG.bonusTiers,
    source: "static" as const,
  }

  try {
    // Fetch deal info and incentive tiers in parallel
    const [deal, incentiveTiersResponse] = await Promise.allSettled([
      getDeal(),
      getIncentiveTiers(),
    ])

    const result = { ...fallback }

    // Use live deal data if available
    if (deal.status === "fulfilled" && deal.value) {
      const d = deal.value
      if (d.price_per_security) {
        // price_per_security comes in dollars (e.g. 2.25)
        result.sharePrice = d.price_per_security
      }
      if (d.minimum_investment) {
        // minimum_investment comes in cents from DealMaker (e.g. 97425 = $974.25)
        result.minInvestment = d.minimum_investment / 100
      }
      if (d.currency) result.currency = d.currency
      if (d.security_type) result.securityType = d.security_type
      result.source = "api"
    }

    // Use live incentive tiers if available
    if (incentiveTiersResponse.status === "fulfilled" && incentiveTiersResponse.value?.tiers?.length) {
      result.bonusTiers = incentiveTiersResponse.value.tiers.map((t) => ({
        minAmount: t.min_amount,
        bonusPercent: t.bonus_percent,
      }))
    }

    return NextResponse.json(result)
  } catch {
    // If anything goes wrong, return the static fallback
    return NextResponse.json(fallback)
  }
}
