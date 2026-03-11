import { type NextRequest, NextResponse } from "next/server"
import {
  createInvestor,
  updateInvestor,
  createIndividualProfile,
  calculateInvestment,
  DEALMAKER_CONFIG,
  type CreateInvestorPayload,
} from "@/lib/dealmaker"

/**
 * POST /api/dealmaker/investors/early-create
 *
 * Two-phase early creation to catch DealMaker validation errors before
 * the user fills out the entire multi-step form.
 *
 * Phase 1 — After initial form (no investmentAmount in body):
 *   Creates a minimal individual profile (name, email, phone).
 *   Returns { success, profileId }.
 *
 * Phase 2 — After amount selection (investmentAmount + profileId in body):
 *   Creates the investor with the real amount and attached profile.
 *   Returns { success, investorId }.
 *   If existingInvestorId is provided (back-navigation), updates instead.
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
      investmentAmount,
      profileId: existingProfileId,
      existingInvestorId,
      utmParams,
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, lastName" },
        { status: 400 }
      )
    }

    // Format phone to E.164 (same logic as the main investors route)
    let formattedPhone = phone ? String(phone).replace(/[^0-9+]/g, "") : ""
    if (formattedPhone && !formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`
    }
    formattedPhone = formattedPhone.replace(/(?!^)\+/g, "")

    // ─── Phase 1: Create profile only (no investmentAmount provided) ──

    if (!investmentAmount) {
      const profile = await createIndividualProfile({
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: formattedPhone,
        country: countryCode,
      })

      return NextResponse.json({
        success: true,
        profileId: profile.id,
      })
    }

    // ─── Phase 2: Create investor (investmentAmount provided) ─────────

    const calculation = calculateInvestment(investmentAmount)

    const utms = (utmParams && typeof utmParams === "object") ? utmParams as Record<string, string> : {}
    const utmTags: string[] = Object.entries(utms).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`)

    const payload: CreateInvestorPayload = {
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
      payload.country_code = countryCode
    }
    if (existingProfileId) {
      payload.investor_profile_id = existingProfileId
    }
    if (utmTags.length > 0) {
      payload.tags = utmTags
    }

    let investor
    if (existingInvestorId) {
      investor = await updateInvestor(existingInvestorId, payload)
    } else {
      investor = await createInvestor(payload)
    }

    return NextResponse.json({
      success: true,
      investorId: investor.id,
    })
  } catch (error) {
    console.error("[Early Create] Error:", error)

    const message = error instanceof Error ? error.message : ""
    let userError = "Failed to process request. Please try again."

    if (message.includes("Invalid phone number")) {
      userError = "Invalid phone number. Please use a full number with country code (e.g. +16135550119)."
    } else if (message.includes("400")) {
      const match = message.match(/"error":"([^"]+)"/)
      if (match) userError = match[1]
    }

    return NextResponse.json(
      { error: userError },
      { status: 500 }
    )
  }
}
