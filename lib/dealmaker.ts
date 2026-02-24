/**
 * DealMaker API Integration
 * 
 * This file provides the integration layer between your custom investment UI
 * and DealMaker's API. Configure your credentials and deal ID to connect.
 * 
 * Documentation: https://docs.dealmaker.tech/
 */

// Configuration - Set these values from your DealMaker dashboard
export const DEALMAKER_CONFIG = {
  // OAuth credentials from DealMaker Integrations page
  clientId: (process.env.DEALMAKER_CLIENT_ID || "").trim(),
  clientSecret: (process.env.DEALMAKER_CLIENT_SECRET || "").trim(),
  
  // Your deal ID (found in the URL of your deal dashboard)
  dealId: (process.env.DEALMAKER_DEAL_ID || "").trim(),
  
  // API endpoints
  baseUrl: "https://api.dealmaker.tech",
  tokenUrl: "https://app.dealmaker.tech/oauth/token",
  
  // Deal-specific settings (match your DealMaker deal configuration)
  sharePrice: 2.25,
  minInvestment: 974.25,
  currency: "USD",
  securityType: "Common Stock",
  
  // Bonus tiers (configure to match your deal's incentive plan)
  bonusTiers: [
    { minAmount: 2500, bonusPercent: 5 },
    { minAmount: 5000, bonusPercent: 10 },
    { minAmount: 10000, bonusPercent: 15 },
    { minAmount: 25000, bonusPercent: 20 },
    { minAmount: 100000, bonusPercent: 20 },
  ],
}

// Types
export interface DealMakerTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  created_at: number
}

export interface InvestorProfile {
  id?: number
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  type: "individual" | "joint" | "corporation" | "trust"
}

export interface CreateInvestorPayload {
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  investment_amount: number
  allocation_unit?: "securities" | "amount"
  investor_profile_id?: number
}

export interface DealMakerInvestor {
  id: number
  full_name: string
  first_name: string
  last_name: string
  email: string
  state: "draft" | "invited" | "signed" | "waiting" | "accepted" | "inactive"
  investment_amount: number
  allocated_amount: number
  number_of_securities: number
  funding_state: "unfunded" | "funded" | "overfunded"
  created_at: string
  updated_at: string
  phone_number?: string
  access_link?: string
}

export interface Deal {
  id: number
  title: string
  state: string
  currency: string
  security_type: string
  price_per_security: number
  minimum_investment: number
  maximum_investment: number
}

// Token management
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get an OAuth access token from DealMaker
 * Scopes: deals.read, deals.write, deals.investors.read, deals.investors.write
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  // Validate credentials are present
  if (!DEALMAKER_CONFIG.clientId || !DEALMAKER_CONFIG.clientSecret) {
    throw new Error(
      "Missing DealMaker credentials. Set DEALMAKER_CLIENT_ID and DEALMAKER_CLIENT_SECRET environment variables."
    )
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: DEALMAKER_CONFIG.clientId,
    client_secret: DEALMAKER_CONFIG.clientSecret,
    scope: "deals.read deals.write deals.investors.read deals.investors.write",
  })

  const response = await fetch(DEALMAKER_CONFIG.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Failed to get access token: ${response.status} ${response.statusText} - ${errorBody}`
    )
  }

  const data: DealMakerTokenResponse = await response.json()
  
  // Cache the token (expire 5 minutes early to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}

/**
 * Make an authenticated request to DealMaker API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()
  
  const response = await fetch(`${DEALMAKER_CONFIG.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.dealmaker-v1+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DealMaker API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Get deal information
 */
export async function getDeal(dealId?: string): Promise<Deal> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  return apiRequest<Deal>(`/deals/${id}`)
}

/**
 * Create a new investor for the deal
 */
export async function createInvestor(
  investorData: CreateInvestorPayload,
  dealId?: string
): Promise<DealMakerInvestor> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  
  return apiRequest<DealMakerInvestor>(`/deals/${id}/investors`, {
    method: "POST",
    body: JSON.stringify(investorData),
  })
}

/**
 * Get an investor by ID
 */
export async function getInvestor(
  investorId: number,
  dealId?: string
): Promise<DealMakerInvestor> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  return apiRequest<DealMakerInvestor>(`/deals/${id}/investors/${investorId}`)
}

/**
 * Update an investor
 */
export async function updateInvestor(
  investorId: number,
  data: Partial<CreateInvestorPayload>,
  dealId?: string
): Promise<DealMakerInvestor> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  
  return apiRequest<DealMakerInvestor>(`/deals/${id}/investors/${investorId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

/**
 * List all investors for a deal
 */
export async function listInvestors(
  dealId?: string,
  options: { page?: number; per_page?: number; q?: string } = {}
): Promise<DealMakerInvestor[]> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  const params = new URLSearchParams()
  
  if (options.page) params.set("page", options.page.toString())
  if (options.per_page) params.set("per_page", options.per_page.toString())
  if (options.q) params.set("q", options.q)
  
  const queryString = params.toString()
  const endpoint = `/deals/${id}/investors${queryString ? `?${queryString}` : ""}`
  
  return apiRequest<DealMakerInvestor[]>(endpoint)
}

/**
 * Get OTP access link for an investor (allows them to continue their investment)
 */
export async function getInvestorAccessLink(
  investorId: number,
  dealId?: string
): Promise<{ access_link: string }> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  return apiRequest<{ access_link: string }>(
    `/deals/${id}/investors/${investorId}/otp_access_link`
  )
}

/**
 * Get incentive tiers for a deal
 */
export async function getIncentiveTiers(
  dealId?: string
): Promise<{ tiers: { min_amount: number; bonus_percent: number }[] }> {
  const id = dealId || DEALMAKER_CONFIG.dealId
  return apiRequest<{ tiers: { min_amount: number; bonus_percent: number }[] }>(
    `/deals/${id}/incentive_tiers`
  )
}

/**
 * Create an individual investor profile
 */
export async function createIndividualProfile(
  profile: Omit<InvestorProfile, "type" | "id">
): Promise<InvestorProfile> {
  return apiRequest<InvestorProfile>("/investor_profiles/individuals", {
    method: "POST",
    body: JSON.stringify(profile),
  })
}

/**
 * Calculate shares and bonus for a given investment amount
 */
export function calculateInvestment(amount: number) {
  const { sharePrice, bonusTiers } = DEALMAKER_CONFIG
  
  const baseShares = Math.floor(amount / sharePrice)
  
  // Find applicable bonus tier
  let bonusPercent = 0
  for (const tier of bonusTiers) {
    if (amount >= tier.minAmount) {
      bonusPercent = tier.bonusPercent
    }
  }
  
  const bonusShares = Math.floor(baseShares * (bonusPercent / 100))
  const totalShares = baseShares + bonusShares
  
  return {
    amount,
    baseShares,
    bonusPercent,
    bonusShares,
    totalShares,
    sharePrice,
  }
}

/**
 * Validate investment amount
 */
export function validateInvestment(amount: number): { valid: boolean; error?: string } {
  if (amount < DEALMAKER_CONFIG.minInvestment) {
    return {
      valid: false,
      error: `Minimum investment is $${DEALMAKER_CONFIG.minInvestment.toFixed(2)}`,
    }
  }
  return { valid: true }
}
