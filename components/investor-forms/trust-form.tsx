"use client"

import { Shield } from "lucide-react"
import { TextField, DateField } from "@/components/form-fields"
import { AddressSection } from "@/components/form-sections"
import { User } from "lucide-react"
import type {
  AddressFields,
  AddressTouched,
  ApiCountry,
} from "@/lib/investor-types"

export interface TrustData {
  trustName: string
  address: AddressFields
  trustee: {
    firstName: string
    lastName: string
    dateOfBirth: string
  }
}

export interface TrustTouched {
  trustName: boolean
  address: AddressTouched
  trustee: {
    firstName: boolean
    lastName: boolean
    dateOfBirth: boolean
  }
}

interface TrustFormProps {
  data: TrustData
  onChange: (data: TrustData) => void
  touched: TrustTouched
  onBlur: (path: string) => void
  countries: ApiCountry[]
  loadingCountries?: boolean
}

export function TrustForm({
  data,
  onChange,
  touched,
  onBlur,
  countries,
  loadingCountries,
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

      {/* Trustee */}
      <h3 className="text-gray-300 text-sm font-medium pt-2">Trustee</h3>

      <TextField
        placeholder="First Name"
        value={data.trustee.firstName}
        onChange={(v) =>
          onChange({ ...data, trustee: { ...data.trustee, firstName: v } })
        }
        touched={touched.trustee.firstName}
        onBlur={() => onBlur("trustee.firstName")}
        error={!data.trustee.firstName.trim() ? "First name is required" : undefined}
        icon={User}
        autoComplete="given-name"
      />

      <TextField
        placeholder="Last Name"
        value={data.trustee.lastName}
        onChange={(v) =>
          onChange({ ...data, trustee: { ...data.trustee, lastName: v } })
        }
        touched={touched.trustee.lastName}
        onBlur={() => onBlur("trustee.lastName")}
        error={!data.trustee.lastName.trim() ? "Last name is required" : undefined}
        icon={User}
        autoComplete="family-name"
      />

      <DateField
        value={data.trustee.dateOfBirth}
        onChange={(v) =>
          onChange({ ...data, trustee: { ...data.trustee, dateOfBirth: v } })
        }
        touched={touched.trustee.dateOfBirth}
        onBlur={() => onBlur("trustee.dateOfBirth")}
        placeholder="Date of Birth (MM/DD/YYYY)"
        requiredError="Date of birth is required"
      />
    </div>
  )
}
