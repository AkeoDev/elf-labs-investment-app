import { type NextRequest, NextResponse } from "next/server"
import {
  createInvestor,
  updateInvestor,
  listInvestors,
  getProfileIdsByEmail,
  getInvestorProfile,
  createIndividualProfile,
  createJointProfile,
  createCorporationProfile,
  createTrustProfile,
  calculateInvestment,
  validateInvestment,
  getInvestorAccessLink,
} from "@/lib/dealmaker"
import type { DealMakerInvestorProfile } from "@/lib/dealmaker"
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
    const firstName = searchParams.get("firstName") || ""
    const lastName = searchParams.get("lastName") || ""

    if (!email) {
      return NextResponse.json(
        { error: "Missing required query parameter: email" },
        { status: 400 }
      )
    }

    // Run both lookups in parallel for speed
    const [investorsResult, profileIdsResult] = await Promise.allSettled([
      listInvestors(undefined, { q: email, per_page: 50 }),
      getProfileIdsByEmail(email),
    ])

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

    if (investorsResult.status === "fulfilled") {
      const investors = investorsResult.value
      // Exact email match, filter out inactive, verify name if provided
      const matches = investors
        .filter((inv) => inv.email.toLowerCase() === email.toLowerCase())
        .filter((inv) => inv.state !== "inactive")
        .filter((inv) => {
          if (!firstName && !lastName) return true
          const fnMatch = !firstName || inv.first_name.toLowerCase() === firstName.toLowerCase()
          const lnMatch = !lastName || inv.last_name.toLowerCase() === lastName.toLowerCase()
          return fnMatch && lnMatch
        })
        .sort((a, b) => b.id - a.id) // most recent first

      if (matches.length > 0) {
        const inv = matches[0]
        investorMatch = {
          id: inv.id,
          email: inv.email,
          firstName: inv.first_name,
          lastName: inv.last_name,
          phoneNumber: inv.phone_number,
          investmentAmount: inv.investment_amount,
          state: inv.state,
          fundingState: inv.funding_state,
          accessLink: inv.access_link,
        }
      }
    }

    // Process profile data (for address, DOB, investor type, entity details)
    let profile: DealMakerInvestorProfile | null = null

    if (profileIdsResult.status === "fulfilled" && profileIdsResult.value.length > 0) {
      // Get the most recent profile (last ID)
      const profileIds = profileIdsResult.value
      const latestProfileId = profileIds[profileIds.length - 1]

      try {
        profile = await getInvestorProfile(latestProfileId)
      } catch (profileError) {
        console.warn("[DealMaker] Failed to fetch investor profile:", profileError)
      }
    }

    if (!investorMatch && !profile) {
      return NextResponse.json({ found: false, investor: null, profile: null })
    }

    return NextResponse.json({
      found: true,
      investor: investorMatch,
      profile: profile
        ? {
            id: profile.id,
            type: profile.type,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            phoneNumber: profile.phone_number,
            dateOfBirth: profile.date_of_birth,
            // Address
            streetAddress: profile.street_address,
            unit: profile.unit2,
            city: profile.city,
            region: profile.region,
            postalCode: profile.postal_code,
            country: profile.country,
            // Entity / Trust
            entityName: profile.name,
            // Corporation signing officer
            signingOfficerFirstName: profile.signing_officer_first_name,
            signingOfficerLastName: profile.signing_officer_last_name,
            signingOfficerDateOfBirth: profile.signing_officer_date_of_birth,
            // Joint holder
            jointHolderFirstName: profile.joint_holder_first_name,
            jointHolderLastName: profile.joint_holder_last_name,
            jointHolderDateOfBirth: profile.joint_holder_date_of_birth,
            jointHolderStreetAddress: profile.joint_holder_street_address,
            jointHolderUnit: profile.joint_holder_unit2,
            jointHolderCity: profile.joint_holder_city,
            jointHolderRegion: profile.joint_holder_region,
            jointHolderPostalCode: profile.joint_holder_postal_code,
            jointHolderCountry: profile.joint_holder_country,
            // Trust trustees
            trustees: profile.trustees,
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
      // Also support the key-based values from the new form
      "individual": "individual",
      "joint": "joint",
      "trust": "trust",
      "corporation": "corporation",
      "ira": "individual",
    }
    const profileType = profileTypeMap[investorType] || "individual"

    // ─── Create investor profile (type-specific) ──────────────────────

    let profileId: number | undefined
    try {
      profileId = await createProfileByType({
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
    } catch (profileError) {
      // Profile creation is non-critical, continue without it
      console.warn("[DealMaker] Profile creation failed:", profileError)
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
    if (investorType) {
      investorPayload.tags = [profileType, investorType]
    }
    if (profileId) {
      investorPayload.investor_profile_id = profileId
    }
    if (dateOfBirth) investorPayload.date_of_birth = dateOfBirth
    if (address) investorPayload.address = address
    if (city) investorPayload.city = city

    let investor
    if (existingInvestorId) {
      console.log("[DealMaker] Updating existing investor:", existingInvestorId, "with payload:", JSON.stringify(investorPayload, null, 2))
      investor = await updateInvestor(
        existingInvestorId,
        investorPayload as Parameters<typeof updateInvestor>[1]
      )
      console.log("[DealMaker] Investor updated:", JSON.stringify(investor, null, 2))
    } else {
      console.log("[DealMaker] Creating investor with payload:", JSON.stringify(investorPayload, null, 2))
      investor = await createInvestor(
        investorPayload as Parameters<typeof createInvestor>[0]
      )
      console.log("[DealMaker] Investor created:", JSON.stringify(investor, null, 2))
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
        email: investor.email,
        name: investor.full_name || `${firstName} ${lastName}`,
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
