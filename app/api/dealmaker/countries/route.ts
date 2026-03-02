import { NextResponse } from "next/server"
import { getCountries } from "@/lib/dealmaker"
import { COUNTRIES } from "@/lib/countries"

/**
 * GET /api/dealmaker/countries
 *
 * Fetches the live countries + states list from DealMaker.
 * Falls back to the static ISO country list if the API is unavailable.
 */
export async function GET() {
  try {
    const countries = await getCountries()

    // Normalise: DealMaker may return varying shapes — be defensive
    if (!Array.isArray(countries) || countries.length === 0) {
      throw new Error("Empty or invalid response from DealMaker /countries")
    }

    return NextResponse.json({ countries, source: "api" })
  } catch {
    // Fall back to static list (no states available in this case)
    const fallback = COUNTRIES.map((c) => ({
      id: 0,
      name: c.name,
      code: c.code,
      states: [],
    }))
    return NextResponse.json({ countries: fallback, source: "static" })
  }
}
