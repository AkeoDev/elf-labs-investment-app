"use client"

import { Landmark } from "lucide-react"
import { TextField } from "@/components/form-fields"
import { AddressSection, PersonSection } from "@/components/form-sections"
import type {
  PersonFields,
  PersonTouched,
  AddressFields,
  AddressTouched,
  ApiCountry,
} from "@/lib/investor-types"
import type { CountryWithPhone } from "@/lib/countries"

export interface IRAData {
  custodianName: string
  custodianAddress: AddressFields
  holder: PersonFields
}

export interface IRATouched {
  custodianName: boolean
  custodianAddress: AddressTouched
  holder: PersonTouched
}

interface IRAFormProps {
  data: IRAData
  onChange: (data: IRAData) => void
  touched: IRATouched
  onBlur: (path: string) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
  phoneList: CountryWithPhone[]
}

export function IRAForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
  phoneList,
}: IRAFormProps) {
  return (
    <div className="space-y-4">
      {/* Custodian Name */}
      <TextField
        placeholder="IRA Custodian Name"
        value={data.custodianName}
        onChange={(v) => onChange({ ...data, custodianName: v })}
        touched={touched.custodianName}
        onBlur={() => onBlur("custodianName")}
        error={!data.custodianName.trim() ? "Custodian name is required" : undefined}
        icon={Landmark}
      />

      {/* Custodian Address */}
      <h3 className="text-gray-300 text-sm font-medium pt-2">Custodian Address</h3>
      <AddressSection
        fields={data.custodianAddress}
        onChange={(custodianAddress) => onChange({ ...data, custodianAddress })}
        touched={touched.custodianAddress}
        onBlur={(field) => onBlur(`custodianAddress.${field}`)}
        countries={countries}
        loadingCountries={loadingCountries}
      />

      {/* IRA Holder (full person with phone + DOB) */}
      <PersonSection
        title="IRA Account Holder"
        fields={data.holder}
        onChange={(holder) => onChange({ ...data, holder })}
        touched={touched.holder}
        onBlur={(field) => onBlur(`holder.${field}`)}
        countries={countries}
        loadingCountries={loadingCountries}
        phoneList={phoneList}
      />
    </div>
  )
}
