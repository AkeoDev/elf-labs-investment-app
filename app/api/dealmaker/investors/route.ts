import { type NextRequest, NextResponse } from "next/server"
import {
  createInvestor,
  updateInvestor,
  listInvestors,
  createIndividualProfile,
  createJointProfile,
  createCorporationProfile,
  createTrustProfile,
  calculateInvestment,
  validateInvestment,
  getInvestorAccessLink,
} from "@/lib/dealmaker"
import type { DealMakerInvestor } from "@/lib/dealmaker"
import { dateToISO } from "@/lib/investor-types"
import type {
  PersonFields,
  AddressFields,
  CorporationFields,
  TrustFields,
  IRAFields,
} from "@/lib/investor-types"

/**
 * GET /api/dealmaker/investors?email=...&firstName=...&lastName=...
 *
 * Look up an existing investor by email (with optional name verification).
 * Returns investor record (investment amount, ID) and profile data (address, DOB, type).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const phone = searchParams.get("phone") || ""
    const firstName = searchParams.get("firstName") || ""
    const lastName = searchParams.get("lastName") || ""

    if (!email) {
      return NextResponse.json(
        { error: "Missing required query parameter: email" },
        { status: 400 }
      )
    }

    // Run lookups in parallel: search by email and optionally by phone
    const searches: Promise<unknown>[] = [
      listInvestors(undefined, { q: email, per_page: 50 }),
    ]
    // Also search by phone if provided (catches returning investors with different email)
    if (phone) {
      searches.push(listInvestors(undefined, { q: phone, per_page: 50 }))
    }

    const [investorsResult, phoneResult] = await Promise.allSettled(searches)

    // Merge investor results from email and phone searches, deduplicate by ID
    // listInvestors now returns a proper array after unwrapping { items: [...] }
    const allInvestors: DealMakerInvestor[] = []
    const seenIds = new Set<number>()

    for (const result of [investorsResult, phoneResult]) {
      if (result?.status === "fulfilled" && Array.isArray(result.value)) {
        for (const inv of result.value as DealMakerInvestor[]) {
          if (!seenIds.has(inv.id)) {
            seenIds.add(inv.id)
            allInvestors.push(inv)
          }
        }
      }
    }

    // Helper: split "First Last" into parts
    const splitName = (fullName: string) => {
      const parts = (fullName || "").trim().split(/\s+/)
      return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      }
    }

    // Process investor records (for investment amount + investor ID)
    let investorMatch: {
      id: number
      email: string
      firstName: string
      lastName: string
      phoneNumber?: string
      investmentAmount: number
      state: string
      fundingState: string
      accessLink?: string
    } | null = null

    // Match by email OR phone, filter out inactive, use name as tiebreaker
    const fullName = `${firstName} ${lastName}`.toLowerCase().trim()
    const matches = allInvestors
      .filter((inv) => inv.state !== "inactive")
      .filter((inv) => {
        const invEmail = inv.user?.email || ""
        const emailMatch = invEmail.toLowerCase() === email.toLowerCase()
        const phoneMatch = phone && inv.phone_number?.includes(phone.replace(/^\+/, ""))
        return emailMatch || phoneMatch
      })
      .sort((a, b) => {
        // Prefer exact email + name match, then email match, then phone match
        const aEmail = (a.user?.email || "").toLowerCase() === email.toLowerCase() ? 1 : 0
        const bEmail = (b.user?.email || "").toLowerCase() === email.toLowerCase() ? 1 : 0
        const aName = (a.name || "").toLowerCase() === fullName ? 1 : 0
        const bName = (b.name || "").toLowerCase() === fullName ? 1 : 0
        // Sort by: email+name > email > phone > most recent
        const aScore = aEmail * 2 + aName
        const bScore = bEmail * 2 + bName
        if (bScore !== aScore) return bScore - aScore
        return b.id - a.id // most recent first
      })

    if (matches.length > 0) {
      const inv = matches[0]
      const nameParts = splitName(inv.name)
      investorMatch = {
        id: inv.id,
        email: inv.user?.email || "",
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        phoneNumber: inv.phone_number,
        investmentAmount: inv.investment_value,
        state: inv.state,
        fundingState: inv.funding_state,
        accessLink: inv.access_link,
      }
    }

    // Process profile data (for address, DOB, investor type, entity details)
    // Extract from embedded investor_profile in the investor response
    // Prefer a completed profile; check all matches for one
    let embeddedProfile: DealMakerInvestor["investor_profile"] = null

    // First try the primary match, then check all matches for a completed profile
    if (matches.length > 0) {
      // Look for the best profile: prefer complete, then any with data
      const withCompleteProfile = matches.find(
        (inv) => inv.investor_profile?.profile?.complete
      )
      const withAnyProfile = matches.find(
        (inv) => inv.investor_profile?.profile?.account_holder?.first_name
      )
      embeddedProfile = (withCompleteProfile || withAnyProfile || matches[0])?.investor_profile ?? null
    }

    if (!investorMatch && !embeddedProfile) {
      return NextResponse.json({ found: false, investor: null, profile: null })
    }

    // Map embedded profile to our normalized format
    const ep = embeddedProfile?.profile
    const holder = ep?.account_holder
    const addr = holder?.address
    const joint = ep?.joint_holder

    return NextResponse.json({
      found: true,
      investor: investorMatch,
      profile: ep
        ? {
            id: investorMatch?.id, // Use investor ID as reference
            type: ep.type,
            email: ep.email,
            firstName: holder?.first_name || null,
            lastName: holder?.last_name || null,
            phoneNumber: holder?.phone_number || null,
            dateOfBirth: holder?.date_of_birth || null,
            // Address
            streetAddress: addr?.street_address || null,
            unit: addr?.unit2 || null,
            city: addr?.city || null,
            region: addr?.region || null,
            postalCode: addr?.postal_code || null,
            country: addr?.country || null,
            // Entity / Trust
            entityName: ep.name || null,
            // Corporation signing officer
            signingOfficerFirstName: ep.signing_officer_first_name || null,
            signingOfficerLastName: ep.signing_officer_last_name || null,
            signingOfficerDateOfBirth: ep.signing_officer_date_of_birth || null,
            // Joint holder
            jointHolderFirstName: joint?.first_name || null,
            jointHolderLastName: joint?.last_name || null,
            jointHolderDateOfBirth: joint?.date_of_birth || null,
            jointHolderStreetAddress: joint?.street_address || null,
            jointHolderUnit: joint?.unit2 || null,
            jointHolderCity: joint?.city || null,
            jointHolderRegion: joint?.region || null,
            jointHolderPostalCode: joint?.postal_code || null,
            jointHolderCountry: joint?.country || null,
            // Trust trustees
            trustees: ep.trustees,
          }
        : null,
    })
  } catch (error) {
    console.error("[DealMaker API] Error searching investors:", error)
    // Return not found rather than error — lookup failure should not block the flow
    return NextResponse.json({ found: false, investor: null, profile: null })
  }
}

/**
 * POST /api/dealmaker/investors
 *
 * Create a new investor in DealMaker from your custom checkout flow.
 * Supports all 5 investor types with type-specific profile creation.
 * If existingInvestorId is provided, updates the existing investor instead.
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
      entityName,
      formData,
      existingInvestorId,
      existingProfileId,
      utmParams,
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !investmentAmount) {
      return NextResponse.json(
        { error: "Missing required fields: email, firstName, lastName, investmentAmount" },
        { status: 400 }
      )
    }

    // Format phone to E.164 (e.g. +16135550119)
    let formattedPhone = phone ? String(phone).replace(/[^0-9+]/g, "") : ""
    if (formattedPhone && !formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`
    }
    formattedPhone = formattedPhone.replace(/(?!^)\+/g, "")

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
      // Also support the key-based values from the new form
      "individual": "individual",
      "joint": "joint",
      "trust": "trust",
      "corporation": "corporation",
      "ira": "individual",
    }
    const profileType = profileTypeMap[investorType] || "individual"

    // ─── Create investor profile with full form data ─────────────────
    // Always create a fresh full profile (address, DOB, SSN) using the form data.
    // If creation fails (e.g. duplicate email), fall back to existingProfileId.

    let profileId: number | undefined = existingProfileId || undefined
    try {
      const newProfileId = await createProfileByType({
        profileType,
        investorType,
        email,
        firstName,
        lastName,
        phone: formattedPhone,
        countryCode,
        address,
        city,
        state,
        dateOfBirth,
        formData,
      })
      if (newProfileId) profileId = newProfileId
    } catch (profileError) {
      console.warn("[DealMaker] Profile creation failed, using existing:", profileError)
      // profileId stays as existingProfileId (may be undefined)
    }

    // ─── Create the investor in DealMaker ─────────────────────────────

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
    const utms = (utmParams && typeof utmParams === "object") ? utmParams as Record<string, string> : {}
    const utmTags: string[] = Object.entries(utms).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`)
    investorPayload.tags = [
      ...(investorType ? [profileType, investorType] : []),
      ...utmTags,
    ]
    const utmHeaders = buildUtmHeaders(utms)
    if (profileId) {
      investorPayload.investor_profile_id = profileId
    }
    if (dateOfBirth) investorPayload.date_of_birth = dateOfBirth
    if (address) investorPayload.address = address
    if (city) investorPayload.city = city

    let investor
    if (existingInvestorId) {
      investor = await updateInvestor(
        existingInvestorId,
        investorPayload as Parameters<typeof updateInvestor>[1],
        undefined,
        utmHeaders
      )
    } else {
      investor = await createInvestor(
        investorPayload as Parameters<typeof createInvestor>[0],
        undefined,
        utmHeaders
      )
    }

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
        email: investor.user?.email || email,
        name: investor.name || `${firstName} ${lastName}`,
        state: investor.state,
        investmentAmount: investor.investment_value,
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

    const message = error instanceof Error ? error.message : ""
    let userError = "Failed to create investor. Please try again."

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

// ─── Helper: build DealMaker UTM headers from utmParams object ───────────────

function buildUtmHeaders(utmParams: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(utmParams)) {
    if (v && k.startsWith("utm_")) {
      // utm_source → X-DEALMAKER-UTM-SOURCE
      const suffix = k.replace(/^utm_/, "").toUpperCase()
      headers[`X-DEALMAKER-UTM-${suffix}`] = v
    }
  }
  return headers
}

// ─── Helper: format phone with prefix ───────────────────────────────────────

function formatPhone(phone: string, phoneCountryCode: string): string {
  if (!phone) return ""
  // The phone field from the form is digits only; the phoneCountryCode
  // is an ISO code like "US". We need the dial code. For now, just prefix
  // with + if it looks like it already has the dial code baked in, or
  // pass through as-is since the parent already formats it.
  const cleaned = phone.replace(/[^0-9+]/g, "")
  if (cleaned.startsWith("+")) return cleaned
  return `+${cleaned}`
}

// ─── Helper: convert MM/DD/YYYY display date to ISO ─────────────────────────

function toISO(displayDate: string): string {
  if (!displayDate) return ""
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) return displayDate
  // MM/DD/YYYY
  if (displayDate.includes("/")) return dateToISO(displayDate)
  return displayDate
}

// ─── Type-specific profile creation ─────────────────────────────────────────

interface ProfileCreationArgs {
  profileType: "individual" | "joint" | "corporation" | "trust"
  investorType: string
  email: string
  firstName: string
  lastName: string
  phone: string
  countryCode?: string
  address?: string
  city?: string
  state?: string
  dateOfBirth?: string
  formData?: unknown
}

async function createProfileByType(args: ProfileCreationArgs): Promise<number | undefined> {
  const { profileType, email, firstName, lastName, phone, countryCode, address, city, state, dateOfBirth, formData } = args

  switch (profileType) {
    case "individual": {
      // For Individual and IRA, create an individual profile
      // If formData is available, extract richer data
      const fd = formData as { person?: PersonFields; holder?: PersonFields } | undefined
      const person = fd?.person ?? fd?.holder // IRA uses "holder"

      const profile = await createIndividualProfile({
        email,
        first_name: person?.firstName ?? firstName,
        last_name: person?.lastName ?? lastName,
        phone_number: phone,
        date_of_birth: person ? toISO(person.dateOfBirth) : (dateOfBirth || ""),
        street_address: person?.address ?? address ?? "",
        unit2: person?.unit || undefined,
        city: person?.city ?? city ?? "",
        region: person?.state ?? state ?? "",
        postal_code: person?.zip ?? "",
        country: person?.countryCode ?? countryCode ?? "",
        taxpayer_id: person?.taxpayerId || undefined,
      })
      return profile.id
    }

    case "joint": {
      const fd = formData as { jointType?: string; primary?: PersonFields; joint?: PersonFields } | undefined
      if (!fd?.primary || !fd?.joint) {
        // Fallback: create as individual if joint data missing
        const profile = await createIndividualProfile({
          email, first_name: firstName, last_name: lastName,
          phone_number: phone, date_of_birth: dateOfBirth || "",
          street_address: address || "", city: city || "",
          region: state || "", country: countryCode || "",
        })
        return profile.id
      }

      const result = await createJointProfile({
        email,
        joint_type: (fd.jointType as "joint_tenant" | "tenants_in_common" | "community_property") || "joint_tenant",
        // Primary holder
        first_name: fd.primary.firstName,
        last_name: fd.primary.lastName,
        country: fd.primary.countryCode,
        street_address: fd.primary.address,
        unit2: fd.primary.unit || undefined,
        city: fd.primary.city,
        region: fd.primary.state,
        postal_code: fd.primary.zip || "",
        date_of_birth: toISO(fd.primary.dateOfBirth),
        taxpayer_id: fd.primary.taxpayerId || undefined,
        phone_number: phone,
        // Joint holder
        joint_holder_first_name: fd.joint.firstName,
        joint_holder_last_name: fd.joint.lastName,
        joint_holder_country: fd.joint.countryCode,
        joint_holder_street_address: fd.joint.address,
        joint_holder_unit2: fd.joint.unit || undefined,
        joint_holder_city: fd.joint.city,
        joint_holder_region: fd.joint.state,
        joint_holder_postal_code: fd.joint.zip || "",
        joint_holder_date_of_birth: toISO(fd.joint.dateOfBirth),
        joint_holder_taxpayer_id: fd.joint.taxpayerId || undefined,
      })
      return result.id
    }

    case "corporation": {
      const fd = formData as CorporationFields | undefined
      if (!fd) {
        const profile = await createIndividualProfile({
          email, first_name: firstName, last_name: lastName,
          phone_number: phone, date_of_birth: dateOfBirth || "",
          street_address: address || "", city: city || "",
          region: state || "", country: countryCode || "",
        })
        return profile.id
      }

      const result = await createCorporationProfile({
        email,
        name: fd.entityName,
        country: fd.address.countryCode,
        street_address: fd.address.address,
        unit2: fd.address.unit || undefined,
        city: fd.address.city,
        region: fd.address.state,
        postal_code: fd.address.zip || "",
        // Signing officer — full person fields
        signing_officer_first_name: fd.signingOfficer.firstName,
        signing_officer_last_name: fd.signingOfficer.lastName,
        signing_officer_date_of_birth: toISO(fd.signingOfficer.dateOfBirth),
        signing_officer_taxpayer_id: fd.signingOfficer.taxpayerId || undefined,
        signing_officer_country: fd.signingOfficer.countryCode || fd.address.countryCode,
        signing_officer_street_address: fd.signingOfficer.address || undefined,
        signing_officer_unit2: fd.signingOfficer.unit || undefined,
        signing_officer_city: fd.signingOfficer.city || undefined,
        signing_officer_region: fd.signingOfficer.state || undefined,
        signing_officer_postal_code: fd.signingOfficer.zip || undefined,
        signing_officer_phone_number: fd.signingOfficer.phone
          ? formatPhone(fd.signingOfficer.phone, fd.signingOfficer.phoneCountryCode)
          : undefined,
        // Note: Beneficial owner data (fd.beneficialOwner) is collected in the UI
        // but DealMaker does not currently have dedicated beneficial owner fields.
      })
      return result.id
    }

    case "trust": {
      const fd = formData as TrustFields | undefined
      if (!fd) {
        const profile = await createIndividualProfile({
          email, first_name: firstName, last_name: lastName,
          phone_number: phone, date_of_birth: dateOfBirth || "",
          street_address: address || "", city: city || "",
          region: state || "", country: countryCode || "",
        })
        return profile.id
      }

      const result = await createTrustProfile({
        email,
        name: fd.trustName,
        country: fd.address.countryCode,
        street_address: fd.address.address,
        unit2: fd.address.unit || undefined,
        city: fd.address.city,
        region: fd.address.state,
        postal_code: fd.address.zip || "",
        // Note: DealMaker trustees API supports address fields but not phone or taxpayer_id
        trustees: [
          {
            first_name: fd.trustee.firstName,
            last_name: fd.trustee.lastName,
            date_of_birth: toISO(fd.trustee.dateOfBirth),
            country: fd.trustee.countryCode || undefined,
            street_address: fd.trustee.address || undefined,
            unit2: fd.trustee.unit || undefined,
            city: fd.trustee.city || undefined,
            region: fd.trustee.state || undefined,
            postal_code: fd.trustee.zip || undefined,
          },
        ],
      })
      return result.id
    }

    default:
      return undefined
  }
}
