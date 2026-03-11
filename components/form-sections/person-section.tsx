"use client"

import { User, Shield } from "lucide-react"
import { TextField, DateField, PhoneField } from "@/components/form-fields"
import { AddressSection } from "./address-section"
import type { PersonFields, PersonTouched, ApiCountry } from "@/lib/investor-types"
import type { CountryWithPhone } from "@/lib/countries"

interface PersonSectionProps {
  title?: string
  fields: PersonFields
  onChange: (fields: PersonFields) => void
  touched: PersonTouched
  onBlur: (field: keyof PersonTouched) => void
  showPhone?: boolean
  showDob?: boolean
  showSsn?: boolean
  countries: ApiCountry[]
  loadingCountries?: boolean
  phoneList: CountryWithPhone[]
}

export function PersonSection({
  title,
  fields,
  onChange,
  touched,
  onBlur,
  showPhone = true,
  showDob = true,
  showSsn = true,
  countries,
  loadingCountries,
  phoneList,
}: PersonSectionProps) {
  function updateField<K extends keyof PersonFields>(key: K, value: PersonFields[K]) {
    onChange({ ...fields, [key]: value })
  }

  function formatSSN(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 9)
    if (digits.length <= 3) return digits
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }

  const ssnDigits = fields.taxpayerId.replace(/\D/g, "")
  const isUS = fields.countryCode === "US"

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-gray-300 text-sm font-medium pt-2">{title}</h3>
      )}

      {/* First Name */}
      <TextField
        placeholder="First Name"
        value={fields.firstName}
        onChange={(v) => updateField("firstName", v)}
        touched={touched.firstName}
        onBlur={() => onBlur("firstName")}
        error={!fields.firstName.trim() ? "First name is required" : undefined}
        icon={User}
        autoComplete="given-name"
      />

      {/* Last Name */}
      <TextField
        placeholder="Last Name"
        value={fields.lastName}
        onChange={(v) => updateField("lastName", v)}
        touched={touched.lastName}
        onBlur={() => onBlur("lastName")}
        error={!fields.lastName.trim() ? "Last name is required" : undefined}
        icon={User}
        autoComplete="family-name"
      />

      {/* Address (street, unit, city, zip, country, state) */}
      <AddressSection
        fields={fields}
        onChange={(addr) => onChange({ ...fields, ...addr })}
        touched={touched}
        onBlur={onBlur}
        countries={countries}
        loadingCountries={loadingCountries}
      />

      {/* Phone */}
      {showPhone && (
        <PhoneField
          value={fields.phone}
          countryCode={fields.phoneCountryCode}
          onChange={(phone, code) => onChange({ ...fields, phone, phoneCountryCode: code })}
          touched={touched.phone}
          onBlur={() => onBlur("phone")}
          error={fields.phone.trim().length < 7 ? "Please enter a valid phone number" : undefined}
          phoneList={phoneList}
        />
      )}

      {/* Date of Birth */}
      {showDob && (
        <DateField
          value={fields.dateOfBirth}
          onChange={(v) => updateField("dateOfBirth", v)}
          touched={touched.dateOfBirth}
          onBlur={() => onBlur("dateOfBirth")}
          placeholder="Date of Birth (MM/DD/YYYY)"
          requiredError="Date of birth is required"
          minAge={18}
        />
      )}

      {/* SSN (US only) */}
      {showSsn && isUS && (
        <TextField
          placeholder="Social Security Number (XXX-XX-XXXX) — Required"
          value={fields.taxpayerId}
          onChange={(v) => updateField("taxpayerId", formatSSN(v))}
          touched={touched.taxpayerId}
          onBlur={() => onBlur("taxpayerId")}
          error={
            ssnDigits.length === 0 ? "Social Security Number is required" :
            ssnDigits.length < 9 ? "SSN must be 9 digits" :
            undefined
          }
          icon={Shield}
          autoComplete="off"
          maxLength={11}
        />
      )}
    </div>
  )
}
