"use client"

import { useState, useEffect, useRef } from "react"
import { HelpCircle, ChevronDown } from "lucide-react"
import { COUNTRIES, PHONE_CODES, STATIC_PHONE_LIST, buildPhoneList, type CountryWithPhone } from "@/lib/countries"
import {
  type ApiCountry,
  type InvestorTypeKey,
  type PersonFields,
  type PersonTouched,
  type AddressFields,
  type AddressTouched,
  INVESTOR_TYPES,
  emptyPerson,
  emptyPersonTouched,
  emptyAddress,
  emptyAddressTouched,
  emptyCorporation,
  emptyCorporationTouched,
  emptyTrust,
  emptyTrustTouched,
  emptyIRA,
  emptyIRATouched,
  emptyOfficerTouched,
  dateToISO,
} from "@/lib/investor-types"
import type {
  CorporationFields,
  TrustFields,
  IRAFields,
  CorporationTouched as CorporationTouchedType,
  TrustTouched as TrustTouchedType,
  IRATouched as IRATouchedType,
} from "@/lib/investor-types"

import { IndividualForm } from "@/components/investor-forms/individual-form"
import { JointForm } from "@/components/investor-forms/joint-form"
import { CorporationForm } from "@/components/investor-forms/corporation-form"
import { TrustForm } from "@/components/investor-forms/trust-form"
import { IRAForm } from "@/components/investor-forms/ira-form"

// ─── Exported data shape ────────────────────────────────────────────────────

// Profile data from an existing DealMaker investor profile (for autofill)
export interface ProfileDefaultData {
  id: number
  type?: string
  email?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  dateOfBirth?: string
  streetAddress?: string
  unit?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  entityName?: string
  signingOfficerFirstName?: string
  signingOfficerLastName?: string
  signingOfficerDateOfBirth?: string
  jointHolderFirstName?: string
  jointHolderLastName?: string
  jointHolderDateOfBirth?: string
  jointHolderStreetAddress?: string
  jointHolderUnit?: string
  jointHolderCity?: string
  jointHolderRegion?: string
  jointHolderPostalCode?: string
  jointHolderCountry?: string
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

interface ContactInformationProps {
  onContinue: (data: ContactData) => void
  defaultCountryCode?: string
  defaultProfileData?: ProfileDefaultData
}

export interface ContactData {
  investorType: string
  investorTypeLabel: string
  // Primary address (for summary display)
  address: string
  city: string
  countryCode: string
  countryName: string
  state: string
  dateOfBirth: string // ISO YYYY-MM-DD
  // Entity / trust name (if applicable)
  entityName?: string
  // Full type-specific form data for API submission
  formData: unknown
}

// ─── Static fallback countries ──────────────────────────────────────────────

const STATIC_COUNTRIES: ApiCountry[] = COUNTRIES.map((c) => ({
  id: 0,
  name: c.name,
  code: c.code,
  states: [],
}))

// ─── Validation helpers ─────────────────────────────────────────────────────

function isPersonComplete(p: PersonFields, requirePhone: boolean): boolean {
  const nameOk = p.firstName.trim().length > 0 && p.lastName.trim().length > 0
  const addrOk = isAddressComplete(p)
  const phoneOk = !requirePhone || p.phone.trim().length >= 7
  const dobOk = p.dateOfBirth.length === 10
  return nameOk && addrOk && phoneOk && dobOk
}

function isAddressComplete(a: AddressFields): boolean {
  return (
    a.address.trim().length > 0 &&
    a.city.trim().length > 0 &&
    a.state.trim().length > 0
  )
}

function isOfficerComplete(o: { firstName: string; lastName: string; dateOfBirth: string }): boolean {
  return (
    o.firstName.trim().length > 0 &&
    o.lastName.trim().length > 0 &&
    o.dateOfBirth.length === 10
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

/** Convert ISO date (YYYY-MM-DD) to display format (DD/MM/YYYY) */
function isoToDisplay(iso: string): string {
  if (!iso) return ""
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return iso
  return `${match[2]}/${match[3]}/${match[1]}`
}

export function ContactInformation({ onContinue, defaultCountryCode, defaultProfileData }: ContactInformationProps) {
  // Shared data
  const [countries, setCountries] = useState<ApiCountry[]>(STATIC_COUNTRIES)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [phoneList, setPhoneList] = useState<CountryWithPhone[]>(STATIC_PHONE_LIST)

  // Investor type selection
  const [investorType, setInvestorType] = useState<InvestorTypeKey | "">("")
  const [investorTypeOpen, setInvestorTypeOpen] = useState(false)
  const [investorTypeTouched, setInvestorTypeTouched] = useState(false)
  const investorTypeRef = useRef<HTMLDivElement>(null)

  // Per-type form data state
  const [individualData, setIndividualData] = useState({ person: emptyPerson() })
  const [individualTouched, setIndividualTouched] = useState({ person: emptyPersonTouched() })

  const [jointData, setJointData] = useState({ primary: emptyPerson(), joint: emptyPerson() })
  const [jointTouched, setJointTouched] = useState({ primary: emptyPersonTouched(), joint: emptyPersonTouched() })

  const [corpData, setCorpData] = useState(emptyCorporation())
  const [corpTouched, setCorpTouched] = useState(emptyCorporationTouched())

  const [trustData, setTrustData] = useState(emptyTrust())
  const [trustTouched, setTrustTouched] = useState(emptyTrustTouched())

  const [iraData, setIraData] = useState(emptyIRA())
  const [iraTouched, setIraTouched] = useState(emptyIRATouched())

  // ─── Apply default profile data (existing investor autofill) ────────

  useEffect(() => {
    if (!defaultProfileData) return

    const p = defaultProfileData

    // Helper: build address fields from profile data
    const buildAddress = (
      street?: string,
      unit?: string,
      city?: string,
      region?: string,
      postalCode?: string,
      country?: string
    ): Partial<AddressFields> => ({
      ...(street ? { address: street } : {}),
      ...(unit ? { unit } : {}),
      ...(city ? { city } : {}),
      ...(region ? { state: region } : {}),
      ...(postalCode ? { zip: postalCode } : {}),
      ...(country ? { countryCode: country } : {}),
    })

    // Map DealMaker profile type to our investor type keys
    const typeMap: Record<string, InvestorTypeKey> = {
      individual: "individual",
      joint: "joint",
      corporation: "corporation",
      trust: "trust",
    }

    const mappedType = p.type ? typeMap[p.type] : undefined
    if (mappedType) {
      setInvestorType(mappedType)
    }

    // Build primary address from profile
    const primaryAddr = buildAddress(
      p.streetAddress,
      p.unit,
      p.city,
      p.region,
      p.postalCode,
      p.country
    )

    const primaryDob = p.dateOfBirth ? isoToDisplay(p.dateOfBirth) : ""

    switch (mappedType) {
      case "individual": {
        setIndividualData({
          person: {
            ...emptyPerson(),
            ...(p.firstName ? { firstName: p.firstName } : {}),
            ...(p.lastName ? { lastName: p.lastName } : {}),
            ...(p.phoneNumber ? { phone: p.phoneNumber.replace(/^\+\d+/, "") } : {}),
            ...(primaryDob ? { dateOfBirth: primaryDob } : {}),
            ...primaryAddr,
          },
        })
        break
      }

      case "joint": {
        const jointAddr = buildAddress(
          p.jointHolderStreetAddress,
          p.jointHolderUnit,
          p.jointHolderCity,
          p.jointHolderRegion,
          p.jointHolderPostalCode,
          p.jointHolderCountry
        )
        const jointDob = p.jointHolderDateOfBirth ? isoToDisplay(p.jointHolderDateOfBirth) : ""
        setJointData({
          primary: {
            ...emptyPerson(),
            ...(p.firstName ? { firstName: p.firstName } : {}),
            ...(p.lastName ? { lastName: p.lastName } : {}),
            ...(p.phoneNumber ? { phone: p.phoneNumber.replace(/^\+\d+/, "") } : {}),
            ...(primaryDob ? { dateOfBirth: primaryDob } : {}),
            ...primaryAddr,
          },
          joint: {
            ...emptyPerson(),
            ...(p.jointHolderFirstName ? { firstName: p.jointHolderFirstName } : {}),
            ...(p.jointHolderLastName ? { lastName: p.jointHolderLastName } : {}),
            ...(jointDob ? { dateOfBirth: jointDob } : {}),
            ...jointAddr,
          },
        })
        break
      }

      case "corporation": {
        const officerDob = p.signingOfficerDateOfBirth ? isoToDisplay(p.signingOfficerDateOfBirth) : ""
        setCorpData({
          entityName: p.entityName || "",
          address: { ...emptyAddress(), ...primaryAddr },
          signingOfficer: {
            firstName: p.signingOfficerFirstName || "",
            lastName: p.signingOfficerLastName || "",
            dateOfBirth: officerDob,
          },
        })
        break
      }

      case "trust": {
        const trustee = p.trustees?.[0]
        const trusteeDob = trustee?.date_of_birth ? isoToDisplay(trustee.date_of_birth) : ""
        setTrustData({
          trustName: p.entityName || "",
          address: { ...emptyAddress(), ...primaryAddr },
          trustee: {
            firstName: trustee?.first_name || "",
            lastName: trustee?.last_name || "",
            dateOfBirth: trusteeDob,
          },
        })
        break
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultProfileData])

  // ─── Fetch countries ────────────────────────────────────────────────

  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("/api/dealmaker/countries")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.countries) && data.countries.length > 0) {
            setCountries(data.countries)
            const list = buildPhoneList(data.countries)
            if (list.length > 0) setPhoneList(list)
          }
        }
      } catch {
        // keep static fallback
      } finally {
        setLoadingCountries(false)
      }
    }
    fetchCountries()
  }, [])

  // Close investor type dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (investorTypeRef.current && !investorTypeRef.current.contains(event.target as Node)) {
        setInvestorTypeOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ─── Form completeness ─────────────────────────────────────────────

  const isFormComplete = (() => {
    if (!investorType) return false
    switch (investorType) {
      case "individual":
        return isPersonComplete(individualData.person, true)
      case "joint":
        return (
          isPersonComplete(jointData.primary, true) &&
          isPersonComplete(jointData.joint, false) // no phone for joint holder
        )
      case "corporation":
        return (
          corpData.entityName.trim().length > 0 &&
          isAddressComplete(corpData.address) &&
          isOfficerComplete(corpData.signingOfficer)
        )
      case "trust":
        return (
          trustData.trustName.trim().length > 0 &&
          isAddressComplete(trustData.address) &&
          isOfficerComplete(trustData.trustee)
        )
      case "ira":
        return (
          iraData.custodianName.trim().length > 0 &&
          isAddressComplete(iraData.custodianAddress) &&
          isPersonComplete(iraData.holder, true)
        )
      default:
        return false
    }
  })()

  // ─── Touch-all helpers (for showing errors on submit) ──────────────

  function touchAllPerson(t: PersonTouched): PersonTouched {
    return {
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      address: true,
      city: true,
      zip: true,
      state: true,
    }
  }

  function touchAllAddress(t: AddressTouched): AddressTouched {
    return { address: true, city: true, zip: true, state: true }
  }

  function touchAllOnSubmit() {
    setInvestorTypeTouched(true)
    switch (investorType) {
      case "individual":
        setIndividualTouched({ person: touchAllPerson(individualTouched.person) })
        break
      case "joint":
        setJointTouched({
          primary: touchAllPerson(jointTouched.primary),
          joint: touchAllPerson(jointTouched.joint),
        })
        break
      case "corporation":
        setCorpTouched({
          entityName: true,
          address: touchAllAddress(corpTouched.address),
          signingOfficer: { firstName: true, lastName: true, dateOfBirth: true },
        })
        break
      case "trust":
        setTrustTouched({
          trustName: true,
          address: touchAllAddress(trustTouched.address),
          trustee: { firstName: true, lastName: true, dateOfBirth: true },
        })
        break
      case "ira":
        setIraTouched({
          custodianName: true,
          custodianAddress: touchAllAddress(iraTouched.custodianAddress),
          holder: touchAllPerson(iraTouched.holder),
        })
        break
    }
  }

  // ─── Submit ─────────────────────────────────────────────────────────

  const handleContinue = () => {
    touchAllOnSubmit()
    if (!isFormComplete || !investorType) return

    const typeEntry = INVESTOR_TYPES.find((t) => t.value === investorType)!

    // Build a ContactData with primary address for summary + full formData
    let primaryAddress: AddressFields
    let primaryDob: string
    let entityName: string | undefined
    let formData: unknown

    switch (investorType) {
      case "individual":
        primaryAddress = individualData.person
        primaryDob = individualData.person.dateOfBirth
        formData = individualData
        break
      case "joint":
        primaryAddress = jointData.primary
        primaryDob = jointData.primary.dateOfBirth
        formData = jointData
        break
      case "corporation":
        primaryAddress = corpData.address
        primaryDob = corpData.signingOfficer.dateOfBirth
        entityName = corpData.entityName
        formData = corpData
        break
      case "trust":
        primaryAddress = trustData.address
        primaryDob = trustData.trustee.dateOfBirth
        entityName = trustData.trustName
        formData = trustData
        break
      case "ira":
        primaryAddress = iraData.custodianAddress
        primaryDob = iraData.holder.dateOfBirth
        entityName = iraData.custodianName
        formData = iraData
        break
      default:
        return
    }

    onContinue({
      investorType: typeEntry.value,
      investorTypeLabel: typeEntry.label,
      address: primaryAddress.address,
      city: primaryAddress.city,
      countryCode: primaryAddress.countryCode,
      countryName: primaryAddress.countryName,
      state: primaryAddress.state,
      dateOfBirth: dateToISO(primaryDob),
      entityName,
      formData,
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────

  const typeLabel = INVESTOR_TYPES.find((t) => t.value === investorType)?.label

  return (
    <div className="space-y-4 py-2">
      {/* Investor Type Selector */}
      <div ref={investorTypeRef}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-400 text-sm">Who is making the investment?</span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="relative">
          <button
            onClick={() => setInvestorTypeOpen(!investorTypeOpen)}
            className={`w-full bg-[#0D1425] border rounded-lg py-4 px-4 text-left flex items-center justify-between transition-colors ${
              investorTypeTouched && !investorType
                ? "border-red-500"
                : "border-[#F6248833] hover:border-[#F6248866]"
            }`}
          >
            <span className={typeLabel ? "text-white" : "text-gray-500"}>
              {typeLabel || "Select an investor type"}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${investorTypeOpen ? "rotate-180" : ""}`}
            />
          </button>
          {investorTypeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D1425] border border-[#F6248833] rounded-lg overflow-hidden z-20">
              {INVESTOR_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setInvestorType(type.value)
                    setInvestorTypeOpen(false)
                  }}
                  className={`w-full py-4 px-5 text-left transition-colors ${
                    investorType === type.value
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {investorTypeTouched && !investorType && (
          <p className="text-red-400 text-xs mt-1 ml-1">Please select an investor type</p>
        )}
      </div>

      {/* Dynamic form based on investor type */}
      {investorType === "individual" && (
        <IndividualForm
          data={individualData}
          onChange={setIndividualData}
          touched={individualTouched}
          onBlur={(_section, field) =>
            setIndividualTouched((prev) => ({
              person: { ...prev.person, [field]: true },
            }))
          }
          countries={countries}
          loadingCountries={loadingCountries}
          phoneList={phoneList}
        />
      )}

      {investorType === "joint" && (
        <JointForm
          data={jointData}
          onChange={setJointData}
          touched={jointTouched}
          onBlur={(section, field) =>
            setJointTouched((prev) => ({
              ...prev,
              [section]: { ...prev[section], [field]: true },
            }))
          }
          countries={countries}
          loadingCountries={loadingCountries}
          phoneList={phoneList}
        />
      )}

      {investorType === "corporation" && (
        <CorporationForm
          data={corpData}
          onChange={setCorpData}
          touched={corpTouched}
          onBlur={(path) => {
            const parts = path.split(".")
            if (parts.length === 1) {
              setCorpTouched((prev) => ({ ...prev, [parts[0]]: true }))
            } else if (parts[0] === "address") {
              setCorpTouched((prev) => ({
                ...prev,
                address: { ...prev.address, [parts[1]]: true },
              }))
            } else if (parts[0] === "signingOfficer") {
              setCorpTouched((prev) => ({
                ...prev,
                signingOfficer: { ...prev.signingOfficer, [parts[1]]: true },
              }))
            }
          }}
          countries={countries}
          loadingCountries={loadingCountries}
        />
      )}

      {investorType === "trust" && (
        <TrustForm
          data={trustData}
          onChange={setTrustData}
          touched={trustTouched}
          onBlur={(path) => {
            const parts = path.split(".")
            if (parts.length === 1) {
              setTrustTouched((prev) => ({ ...prev, [parts[0]]: true }))
            } else if (parts[0] === "address") {
              setTrustTouched((prev) => ({
                ...prev,
                address: { ...prev.address, [parts[1]]: true },
              }))
            } else if (parts[0] === "trustee") {
              setTrustTouched((prev) => ({
                ...prev,
                trustee: { ...prev.trustee, [parts[1]]: true },
              }))
            }
          }}
          countries={countries}
          loadingCountries={loadingCountries}
        />
      )}

      {investorType === "ira" && (
        <IRAForm
          data={iraData}
          onChange={setIraData}
          touched={iraTouched}
          onBlur={(path) => {
            const parts = path.split(".")
            if (parts.length === 1) {
              setIraTouched((prev) => ({ ...prev, [parts[0]]: true }))
            } else if (parts[0] === "custodianAddress") {
              setIraTouched((prev) => ({
                ...prev,
                custodianAddress: { ...prev.custodianAddress, [parts[1]]: true },
              }))
            } else if (parts[0] === "holder") {
              setIraTouched((prev) => ({
                ...prev,
                holder: { ...prev.holder, [parts[1]]: true },
              }))
            }
          }}
          countries={countries}
          loadingCountries={loadingCountries}
          phoneList={phoneList}
        />
      )}

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={!isFormComplete}
        className={`w-full mt-2 font-medium py-4 rounded-full transition-colors ${
          isFormComplete
            ? "bg-[#e91e8c] hover:bg-[#d11a7d] text-white"
            : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
        }`}
      >
        Continue
      </button>
    </div>
  )
}
