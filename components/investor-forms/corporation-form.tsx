"use client"

import { Building } from "lucide-react"
import { TextField } from "@/components/form-fields"
import { AddressSection, PersonSection } from "@/components/form-sections"
import type {
  CorporationFields,
  CorporationTouched,
  PersonTouched,
  ApiCountry,
} from "@/lib/investor-types"
import type { CountryWithPhone } from "@/lib/countries"

interface CorporationFormProps {
  data: CorporationFields
  onChange: (data: CorporationFields) => void
  touched: CorporationTouched
  onBlur: (path: string) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
  phoneList: CountryWithPhone[]
}

export function CorporationForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
  phoneList,
}: CorporationFormProps) {
  return (
    <div className="space-y-4">
      {/* Entity Name */}
      <TextField
        placeholder="Corporation / LLC Name"
        value={data.entityName}
        onChange={(v) => onChange({ ...data, entityName: v })}
        touched={touched.entityName}
        onBlur={() => onBlur("entityName")}
        error={!data.entityName.trim() ? "Entity name is required" : undefined}
        icon={Building}
      />

      {/* Entity Address */}
      <h3 className="text-gray-300 text-sm font-medium pt-2">Entity Address</h3>
      <AddressSection
        fields={data.address}
        onChange={(address) => onChange({ ...data, address })}
        touched={touched.address}
        onBlur={(field) => onBlur(`address.${field}`)}
        countries={countries}
        loadingCountries={loadingCountries}
      />

      {/* Signing Officer — full person fields */}
      <PersonSection
        title="Signing Officer"
        fields={data.signingOfficer}
        onChange={(signingOfficer) => onChange({ ...data, signingOfficer })}
        touched={touched.signingOfficer}
        onBlur={(field) => onBlur(`signingOfficer.${field}`)}
        countries={countries}
        loadingCountries={loadingCountries}
        phoneList={phoneList}
      />

      {/* Beneficial Owner — full person fields, no phone */}
      <PersonSection
        title="Beneficial Owner"
        fields={data.beneficialOwner}
        onChange={(beneficialOwner) => onChange({ ...data, beneficialOwner })}
        touched={touched.beneficialOwner}
        onBlur={(field) => onBlur(`beneficialOwner.${field}`)}
        showPhone={false}
        countries={countries}
        loadingCountries={loadingCountries}
        phoneList={phoneList}
      />
    </div>
  )
}
