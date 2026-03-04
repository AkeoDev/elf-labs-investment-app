"use client"

import { User } from "lucide-react"
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
  countries,
  loadingCountries,
  phoneList,
}: PersonSectionProps) {
  function updateField<K extends keyof PersonFields>(key: K, value: PersonFields[K]) {
    onChange({ ...fields, [key]: value })
  }

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
        />
      )}
    </div>
  )
}
