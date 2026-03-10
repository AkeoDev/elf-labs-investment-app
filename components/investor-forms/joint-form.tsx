"use client"

import { PersonSection } from "@/components/form-sections"
import { DropdownField } from "@/components/form-fields"
import type { PersonFields, PersonTouched, ApiCountry } from "@/lib/investor-types"
import type { CountryWithPhone } from "@/lib/countries"

const JOINT_TYPE_OPTIONS = [
  { value: "joint_tenant", label: "Joint Tenant" },
  { value: "tenants_in_common", label: "Tenants-in-Common" },
  { value: "community_property", label: "Community Property" },
]

export interface JointData {
  jointType: string
  primary: PersonFields
  joint: PersonFields
}

export interface JointTouched {
  primary: PersonTouched
  joint: PersonTouched
}

interface JointFormProps {
  data: JointData
  onChange: (data: JointData) => void
  touched: JointTouched
  onBlur: (section: "primary" | "joint", field: keyof PersonTouched) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
  phoneList: CountryWithPhone[]
}

export function JointForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
  phoneList,
}: JointFormProps) {
  return (
    <div className="space-y-6">
      {/* Joint ownership type */}
      <DropdownField
        placeholder="Select joint type"
        value={data.jointType}
        options={JOINT_TYPE_OPTIONS}
        getLabel={(o) => o.label}
        getValue={(o) => o.value}
        onChange={(value) => onChange({ ...data, jointType: value })}
      />

      {/* Primary holder */}
      <PersonSection
        title="Primary Account Holder"
        fields={data.primary}
        onChange={(primary) => onChange({ ...data, primary })}
        touched={touched.primary}
        onBlur={(field) => onBlur("primary", field)}
        countries={countries}
        loadingCountries={loadingCountries}
        phoneList={phoneList}
      />

      {/* Joint holder - no phone */}
      <PersonSection
        title="Joint Account Holder"
        fields={data.joint}
        onChange={(joint) => onChange({ ...data, joint })}
        touched={touched.joint}
        onBlur={(field) => onBlur("joint", field)}
        showPhone={false}
        countries={countries}
        loadingCountries={loadingCountries}
        phoneList={phoneList}
      />
    </div>
  )
}
