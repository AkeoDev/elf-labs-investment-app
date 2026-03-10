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
  date_of_birth?: string
  address?: string
  city?: string
  state?: string
  country?: string
}

export interface IndividualProfilePayload {
  email: string
  first_name: string
  last_name: string
  suffix?: string
  country?: string
  street_address?: string
  unit2?: string
  city?: string
  region?: string
  postal_code?: string
  date_of_birth?: string
  taxpayer_id?: string
  phone_number?: string
}

export interface CreateInvestorPayload {
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  investment_amount: number
  allocated_amount?: number
  number_of_securities?: number
  allocation_unit?: "securities" | "amount"
  investor_profile_id?: number
  country_code?: string
  tags?: string[]
  // Address & personal fields
  date_of_birth?: string
  address?: string
  city?: string
  postal_code?: string
}

export interface DealMakerInvestor {
  id: number
  name: string // Full name e.g. "Tine Grbec"
  user: {
    id: number
    email: string
    phone?: string
  }
  state: "draft" | "invited" | "signed" | "waiting" | "accepted" | "inactive"
  funding_state: "unfunded" | "funded" | "overfunded"
  investment_value: number
  allocated_amount: number
  number_of_securities: number
  phone_number?: string
  access_link?: string
  investor_profile_id?: number
  // Embedded profile data (included in list/get responses)
  investor_profile?: {
    profile: {
      user_id: number
      email: string
      type: string
      complete: boolean
      account_holder?: {
        first_name?: string | null
        last_name?: string | null
        suffix?: string | null
        date_of_birth?: string | null
        taxpayer_id?: string | null
        phone_number?: string | null
        address?: {
          street_address?: string | null
          unit2?: string | null
          city?: string | null
          region?: string | null
          country?: string | null
          postal_code?: string | null
        }
      }
      // Joint holder fields (for joint profiles)
      joint_holder?: {
        first_name?: string | null
        last_name?: string | null
        date_of_birth?: string | null
        street_address?: string | null
        unit2?: string | null
        city?: string | null
        region?: string | null
        country?: string | null
        postal_code?: string | null
      }
      // Trust/Corp fields
      name?: string | null // entity/trust name
      signing_officer_first_name?: string | null
      signing_officer_last_name?: string | null
      signing_officer_date_of_birth?: string | null
      trustees?: {
        first_name?: string
        last_name?: string
        date_of_birth?: string
        country?: string
        street_address?: string
        unit2?: string
        city?: string
        region?: string
        postal_code?: string
      }[]
    }
  } | null
  created_at: string
  updated_at: string
}

// Investor profile returned by GET /investor_profiles/{id}
// Fields based on what we send when creating profiles + common response fields
export interface DealMakerInvestorProfile {
  id: number
  email?: string
  type?: "individual" | "joint" | "corporation" | "trust" | "managed"
  // Individual / primary holder fields
  first_name?: string
  last_name?: string
  suffix?: string
  date_of_birth?: string
  phone_number?: string
  country?: string
  street_address?: string
  unit2?: string
  city?: string
  region?: string // state/province
  postal_code?: string
  taxpayer_id?: string
  income?: number
  net_worth?: number
  reg_cf_prior_offerings_amount?: number
  // Joint holder fields
  joint_type?: string
  joint_holder_first_name?: string
  joint_holder_last_name?: string
  joint_holder_suffix?: string
  joint_holder_date_of_birth?: string
  joint_holder_country?: string
  joint_holder_street_address?: string
  joint_holder_unit2?: string
  joint_holder_city?: string
  joint_holder_region?: string
  joint_holder_postal_code?: string
  joint_holder_taxpayer_id?: string
  // Corporation / Trust fields
  name?: string // entity or trust name
  business_number?: string
  date?: string // trust creation date
  // Signing officer (corporation)
  signing_officer_first_name?: string
  signing_officer_last_name?: string
  signing_officer_title?: string
  signing_officer_suffix?: string
  signing_officer_date_of_birth?: string
  signing_officer_country?: string
  signing_officer_street_address?: string
  signing_officer_unit2?: string
  signing_officer_city?: string
  signing_officer_region?: string
  signing_officer_postal_code?: string
  signing_officer_taxpayer_id?: string
  signing_officer_phone_number?: string
  // Trustees (trust)
  trustees?: {
    first_name?: string
    last_name?: string
    suffix?: string
    date_of_birth?: string
    country?: string
    street_address?: string
    unit2?: string
    city?: string
    region?: string
    postal_code?: string
  }[]
  // Timestamps
  created_at?: string
  updated_at?: string
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
  
  const result = await apiRequest<DealMakerInvestor[] | { items: DealMakerInvestor[] }>(endpoint)
  // DealMaker wraps paginated results in { items: [...] }
  if (Array.isArray(result)) return result
  if (result && Array.isArray(result.items)) return result.items
  return []
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
 * Get investor profile IDs by email
 * Uses GET /investor_profiles/by_email
 */
export async function getProfileIdsByEmail(
  email: string
): Promise<number[]> {
  const params = new URLSearchParams({ email })
  const result = await apiRequest<number[] | { ids?: number[] }>(
    `/investor_profiles/by_email?${params}`
  )
  if (Array.isArray(result)) return result
  if (result && Array.isArray(result.ids)) return result.ids
  return []
}

/**
 * Get a full investor profile by ID
 * Uses GET /investor_profiles/{id}
 */
export async function getInvestorProfile(
  profileId: number
): Promise<DealMakerInvestorProfile> {
  return apiRequest<DealMakerInvestorProfile>(`/investor_profiles/${profileId}`)
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

// Types for countries endpoint
export interface DealMakerState {
  id: number
  name: string
  code: string
}

export interface DealMakerCountry {
  id: number
  name: string
  code: string
  states?: DealMakerState[]
}

/**
 * Get all valid countries (and their states) from DealMaker.
 * DealMaker may return a raw array OR wrap it in { countries: [...] }.
 */
export async function getCountries(): Promise<DealMakerCountry[]> {
  const res = await apiRequest<DealMakerCountry[] | { countries: DealMakerCountry[] }>("/countries")
  if (Array.isArray(res)) return res
  if (res && Array.isArray((res as { countries?: DealMakerCountry[] }).countries)) {
    return (res as { countries: DealMakerCountry[] }).countries
  }
  return []
}

/**
 * Create an individual investor profile
 */
export async function createIndividualProfile(
  profile: IndividualProfilePayload
): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/investor_profiles/individuals", {
    method: "POST",
    body: JSON.stringify(profile),
  })
}

// ─── Type-specific profile payloads ─────────────────────────────────────────

export interface JointProfilePayload {
  email: string
  joint_type?: "joint_tenant" | "tenants_in_common" | "community_property"
  // Primary holder
  first_name: string
  last_name: string
  suffix?: string
  country: string
  street_address: string
  unit2?: string
  city: string
  region: string
  postal_code: string
  date_of_birth: string
  taxpayer_id?: string
  phone_number?: string
  income?: number
  net_worth?: number
  reg_cf_prior_offerings_amount?: number
  // Joint holder
  joint_holder_first_name: string
  joint_holder_last_name: string
  joint_holder_suffix?: string
  joint_holder_country: string
  joint_holder_street_address: string
  joint_holder_unit2?: string
  joint_holder_city: string
  joint_holder_region: string
  joint_holder_postal_code: string
  joint_holder_date_of_birth: string
  joint_holder_taxpayer_id?: string
}

export interface CorporationProfilePayload {
  email: string
  // Entity info
  name: string
  country: string
  street_address: string
  unit2?: string
  city: string
  region: string
  postal_code: string
  business_number?: string
  phone_number?: string
  income?: number
  net_worth?: number
  reg_cf_prior_offerings_amount?: number
  // Signing officer
  signing_officer_first_name: string
  signing_officer_last_name: string
  signing_officer_title?: string
  signing_officer_suffix?: string
  signing_officer_country: string
  signing_officer_street_address?: string
  signing_officer_unit2?: string
  signing_officer_city?: string
  signing_officer_region?: string
  signing_officer_postal_code?: string
  signing_officer_date_of_birth: string
  signing_officer_taxpayer_id?: string
  signing_officer_phone_number?: string
}

export interface TrustProfilePayload {
  email: string
  name: string
  date?: string // trust creation date
  country: string
  street_address: string
  unit2?: string
  city: string
  region: string
  postal_code: string
  phone_number?: string
  income?: number
  net_worth?: number
  reg_cf_prior_offerings_amount?: number
  trustees?: {
    first_name: string
    last_name: string
    suffix?: string
    date_of_birth?: string
    country?: string
    street_address?: string
    unit2?: string
    city?: string
    region?: string
    postal_code?: string
  }[]
}

/**
 * Create a joint investor profile
 */
export async function createJointProfile(
  payload: JointProfilePayload
): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/investor_profiles/joints", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Create a corporation investor profile
 */
export async function createCorporationProfile(
  payload: CorporationProfilePayload
): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/investor_profiles/corporations", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

/**
 * Create a trust investor profile
 */
export async function createTrustProfile(
  payload: TrustProfilePayload
): Promise<{ id: number }> {
  return apiRequest<{ id: number }>("/investor_profiles/trusts", {
    method: "POST",
    body: JSON.stringify(payload),
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
