"use client"

import { Building } from "lucide-react"
import { TextField, DateField } from "@/components/form-fields"
import { AddressSection } from "@/components/form-sections"
import { User } from "lucide-react"
import type {
  AddressFields,
  AddressTouched,
  ApiCountry,
} from "@/lib/investor-types"

export interface CorporationData {
  entityName: string
  address: AddressFields
  signingOfficer: {
    firstName: string
    lastName: string
    dateOfBirth: string
  }
}

export interface CorporationTouched {
  entityName: boolean
  address: AddressTouched
  signingOfficer: {
    firstName: boolean
    lastName: boolean
    dateOfBirth: boolean
  }
}

interface CorporationFormProps {
  data: CorporationData
  onChange: (data: CorporationData) => void
  touched: CorporationTouched
  onBlur: (path: string) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
}

export function CorporationForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
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

      {/* Signing Officer */}
      <h3 className="text-gray-300 text-sm font-medium pt-2">Signing Officer</h3>

      <TextField
        placeholder="First Name"
        value={data.signingOfficer.firstName}
        onChange={(v) =>
          onChange({ ...data, signingOfficer: { ...data.signingOfficer, firstName: v } })
        }
        touched={touched.signingOfficer.firstName}
        onBlur={() => onBlur("signingOfficer.firstName")}
        error={!data.signingOfficer.firstName.trim() ? "First name is required" : undefined}
        icon={User}
        autoComplete="given-name"
      />

      <TextField
        placeholder="Last Name"
        value={data.signingOfficer.lastName}
        onChange={(v) =>
          onChange({ ...data, signingOfficer: { ...data.signingOfficer, lastName: v } })
        }
        touched={touched.signingOfficer.lastName}
        onBlur={() => onBlur("signingOfficer.lastName")}
        error={!data.signingOfficer.lastName.trim() ? "Last name is required" : undefined}
        icon={User}
        autoComplete="family-name"
      />

      <DateField
        value={data.signingOfficer.dateOfBirth}
        onChange={(v) =>
          onChange({ ...data, signingOfficer: { ...data.signingOfficer, dateOfBirth: v } })
        }
        touched={touched.signingOfficer.dateOfBirth}
        onBlur={() => onBlur("signingOfficer.dateOfBirth")}
        placeholder="Date of Birth (MM/DD/YYYY)"
        requiredError="Date of birth is required"
      />
    </div>
  )
}
