"use client"

import { PersonSection } from "@/components/form-sections"
import type { PersonFields, PersonTouched, ApiCountry } from "@/lib/investor-types"
import type { CountryWithPhone } from "@/lib/countries"

export interface IndividualData {
  person: PersonFields
}

export interface IndividualTouched {
  person: PersonTouched
}

interface IndividualFormProps {
  data: IndividualData
  onChange: (data: IndividualData) => void
  touched: IndividualTouched
  onBlur: (section: "person", field: keyof PersonTouched) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
  phoneList: CountryWithPhone[]
}

export function IndividualForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
  phoneList,
}: IndividualFormProps) {
  return (
    <PersonSection
      fields={data.person}
      onChange={(person) => onChange({ ...data, person })}
      touched={touched.person}
      onBlur={(field) => onBlur("person", field)}
      countries={countries}
      loadingCountries={loadingCountries}
      phoneList={phoneList}
    />
  )
}
