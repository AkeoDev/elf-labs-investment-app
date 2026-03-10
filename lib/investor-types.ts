/** Shared types for investor form data structures */

export interface ApiCountry {
  id: number
  name: string
  code: string
  states: { id: number; name: string; code: string }[]
}

export interface AddressFields {
  address: string
  unit: string
  city: string
  zip: string
  countryCode: string
  countryName: string
  state: string
}

export interface PersonFields extends AddressFields {
  firstName: string
  lastName: string
  phone: string
  phoneCountryCode: string
  dateOfBirth: string // MM/DD/YYYY for display; convert to ISO on submit
  taxpayerId: string  // SSN for US investors (XXX-XX-XXXX)
}

export function emptyAddress(): AddressFields {
  return {
    address: "",
    unit: "",
    city: "",
    zip: "",
    countryCode: "US",
    countryName: "United States",
    state: "",
  }
}

export function emptyPerson(): PersonFields {
  return {
    ...emptyAddress(),
    firstName: "",
    lastName: "",
    phone: "",
    phoneCountryCode: "US",
    dateOfBirth: "",
    taxpayerId: "",
  }
}

/** Convert MM/DD/YYYY display date to YYYY-MM-DD ISO */
export function dateToISO(display: string): string {
  const [mm, dd, yyyy] = display.split("/")
  return `${yyyy}-${mm}-${dd}`
}

/** Touched state tracking for address fields */
export interface AddressTouched {
  address: boolean
  city: boolean
  zip: boolean
  state: boolean
}

export function emptyAddressTouched(): AddressTouched {
  return { address: false, city: false, zip: false, state: false }
}

/** Touched state tracking for person fields */
export interface PersonTouched extends AddressTouched {
  firstName: boolean
  lastName: boolean
  phone: boolean
  dateOfBirth: boolean
  taxpayerId: boolean
}

export function emptyPersonTouched(): PersonTouched {
  return {
    ...emptyAddressTouched(),
    firstName: false,
    lastName: false,
    phone: false,
    dateOfBirth: false,
    taxpayerId: false,
  }
}

/** Mark all fields in a touched object as true */
export function touchAll<T extends Record<string, boolean>>(touched: T): T {
  const result = { ...touched }
  for (const key of Object.keys(result)) {
    (result as Record<string, boolean>)[key] = true
  }
  return result
}

// ─── Investor type constants ────────────────────────────────────────────────

export const INVESTOR_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "joint", label: "Joint Tenants" },
  { value: "corporation", label: "Entity (LLC, Corporation, etc.)" },
  { value: "trust", label: "Trust" },
  { value: "ira", label: "IRA / Self-Directed IRA" },
] as const

export type InvestorTypeKey = (typeof INVESTOR_TYPES)[number]["value"]

// ─── Per-type empty data factories ──────────────────────────────────────────

export interface CorporationFields {
  entityName: string
  address: AddressFields
  signingOfficer: PersonFields
  beneficialOwner: PersonFields
}

export interface TrustFields {
  trustName: string
  address: AddressFields
  trustee: PersonFields
}

export interface IRAFields {
  custodianName: string
  custodianAddress: AddressFields
  holder: PersonFields
}

export function emptyCorporation(): CorporationFields {
  return {
    entityName: "",
    address: emptyAddress(),
    signingOfficer: emptyPerson(),
    beneficialOwner: emptyPerson(),
  }
}

export function emptyTrust(): TrustFields {
  return {
    trustName: "",
    address: emptyAddress(),
    trustee: emptyPerson(),
  }
}

export function emptyIRA(): IRAFields {
  return {
    custodianName: "",
    custodianAddress: emptyAddress(),
    holder: emptyPerson(),
  }
}

// ─── Per-type empty touched factories ───────────────────────────────────────

export interface CorporationTouched {
  entityName: boolean
  address: AddressTouched
  signingOfficer: PersonTouched
  beneficialOwner: PersonTouched
}

export function emptyCorporationTouched(): CorporationTouched {
  return {
    entityName: false,
    address: emptyAddressTouched(),
    signingOfficer: emptyPersonTouched(),
    beneficialOwner: emptyPersonTouched(),
  }
}

export interface TrustTouched {
  trustName: boolean
  address: AddressTouched
  trustee: PersonTouched
}

export function emptyTrustTouched(): TrustTouched {
  return {
    trustName: false,
    address: emptyAddressTouched(),
    trustee: emptyPersonTouched(),
  }
}

export interface IRATouched {
  custodianName: boolean
  custodianAddress: AddressTouched
  holder: PersonTouched
}

export function emptyIRATouched(): IRATouched {
  return {
    custodianName: false,
    custodianAddress: emptyAddressTouched(),
    holder: emptyPersonTouched(),
  }
}
