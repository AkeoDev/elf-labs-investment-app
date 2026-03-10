"use client"

import { Shield } from "lucide-react"
import { TextField } from "@/components/form-fields"
import { AddressSection, PersonSection } from "@/components/form-sections"
import type {
  TrustFields,
  TrustTouched,
  PersonTouched,
  ApiCountry,
} from "@/lib/investor-types"
import type { CountryWithPhone } from "@/lib/countries"

interface TrustFormProps {
  data: TrustFields
  onChange: (data: TrustFields) => void
  touched: TrustTouched
  onBlur: (path: string) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
  phoneList: CountryWithPhone[]
}

export function TrustForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
  phoneList,
}: TrustFormProps) {
  return (
    <div className="space-y-4">
      {/* Trust Name */}
      <TextField
        placeholder="Trust Name"
        value={data.trustName}
        onChange={(v) => onChange({ ...data, trustName: v })}
        touched={touched.trustName}
        onBlur={() => onBlur("trustName")}
        error={!data.trustName.trim() ? "Trust name is required" : undefined}
        icon={Shield}
      />

      {/* Trust Address */}
      <h3 className="text-gray-300 text-sm font-medium pt-2">Trust Address</h3>
      <AddressSection
        fields={data.address}
        onChange={(address) => onChange({ ...data, address })}
        touched={touched.address}
        onBlur={(field) => onBlur(`address.${field}`)}
        countries={countries}
        loadingCountries={loadingCountries}
      />

      {/* Trustee — full person fields */}
      <PersonSection
        title="Trustee"
        fields={data.trustee}
        onChange={(trustee) => onChange({ ...data, trustee })}
        touched={touched.trustee}
        onBlur={(field) => onBlur(`trustee.${field}`)}
        countries={countries}
        loadingCountries={loadingCountries}
        phoneList={phoneList}
      />
    </div>
  )
}
