import { type NextRequest, NextResponse } from "next/server"
import {
  createInvestor,
  createIndividualProfile,
  calculateInvestment,
  validateInvestment,
  getInvestorAccessLink,
} from "@/lib/dealmaker"

/**
 * POST /api/dealmaker/investors
 * 
 * Create a new investor in DealMaker from your custom checkout flow.
 * This connects your UI to DealMaker's investment processing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      email,
      firstName,
      lastName,
      phone,
      countryCode,
      investorType,
      investmentAmount,
      address,
      city,
      state,
      dateOfBirth,
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !investmentAmount) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, lastName, investmentAmount" },
        { status: 400 }
      )
    }

    // Format phone to E.164 (e.g. +16135550119)
    console.log("[v0] Raw phone value received:", JSON.stringify(phone))
    let formattedPhone = phone ? String(phone).replace(/[^0-9+]/g, "") : ""
    if (formattedPhone && !formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`
    }
    // Ensure only the first + is kept
    formattedPhone = formattedPhone.replace(/(?!^)\+/g, "")
    console.log("[v0] Formatted phone:", JSON.stringify(formattedPhone))
    
    // Validate investment amount
    const validation = validateInvestment(investmentAmount)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Calculate shares
    const calculation = calculateInvestment(investmentAmount)
    
    // Map UI investor type to DealMaker profile type
    const profileTypeMap: Record<string, "individual" | "joint" | "corporation" | "trust"> = {
      "Individual": "individual",
      "Joint Tenants": "joint",
      "Trust": "trust",
      "Entity (LLC, Corporation, etc.)": "corporation",
      "IRA / Self-Directed IRA": "individual",
    }
    const profileType = profileTypeMap[investorType] || "individual"

    // Create investor profile first (optional - if this fails we still proceed)
    let profileId: number | undefined
    try {
      const profile = await createIndividualProfile({
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: formattedPhone,
        date_of_birth: dateOfBirth,
        address,
        city,
        state,
        country: countryCode,
      })
      profileId = profile.id
    } catch (profileError) {
      // Profile creation is non-critical, continue without it
    }

    // Create the investor in DealMaker
    const investorPayload: Record<string, unknown> = {
      email,
      first_name: firstName,
      last_name: lastName,
      phone_number: formattedPhone,
      investment_amount: investmentAmount,
      allocated_amount: investmentAmount,
      number_of_securities: calculation.totalShares,
      allocation_unit: "amount",
    }
    if (countryCode) {
      investorPayload.country_code = countryCode
    }
    if (investorType) {
      investorPayload.tags = [profileType, investorType]
    }
    if (profileId) {
      investorPayload.investor_profile_id = profileId
    }
    if (dateOfBirth) investorPayload.date_of_birth = dateOfBirth
    if (address) investorPayload.address = address
    if (city) investorPayload.city = city
    if (state) investorPayload.state = state
    
    console.log("[DealMaker] Creating investor with payload:", JSON.stringify(investorPayload, null, 2))
    const investor = await createInvestor(
      investorPayload as Parameters<typeof createInvestor>[0]
    )
    console.log("[DealMaker] Investor created:", JSON.stringify(investor, null, 2))

    // Get the access link for the investor to continue
    let accessLink: string | undefined
    try {
      const linkResponse = await getInvestorAccessLink(investor.id)
      accessLink = linkResponse.access_link
    } catch (linkError) {
      // Access link retrieval is non-critical
    }
    
    return NextResponse.json({
      success: true,
      investor: {
        id: investor.id,
        email: investor.email,
        name: investor.full_name,
        state: investor.state,
        investmentAmount: investor.investment_amount,
        numberOfSecurities: investor.number_of_securities,
        accessLink,
      },
      calculation: {
        baseShares: calculation.baseShares,
        bonusShares: calculation.bonusShares,
        bonusPercent: calculation.bonusPercent,
        totalShares: calculation.totalShares,
      },
    })
  } catch (error) {
    console.error("[DealMaker API] Error creating investor:", error)

    // Extract the actual error message from DealMaker if available
    const message = error instanceof Error ? error.message : ""
    let userError = "Failed to create investor. Please try again."

    if (message.includes("Invalid phone number")) {
      userError = "Invalid phone number. Please use a full number with country code (e.g. +16135550119)."
    } else if (message.includes("400")) {
      // Pass through other 400 validation errors from DealMaker
      const match = message.match(/"error":"([^"]+)"/)
      if (match) userError = match[1]
    }

    return NextResponse.json(
      { error: userError },
      { status: 500 }
    )
  }
}
