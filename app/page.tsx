"use client"

import { useState } from "react"
import { InitialForm } from "@/components/initial-form"
import { InvestmentFlow } from "@/components/investment-flow"

export interface ExistingInvestorData {
  found: boolean
  investor: {
    id: number
    email: string
    firstName: string
    lastName: string
    phoneNumber?: string
    investmentAmount: number
    state: string
    fundingState: string
    accessLink?: string
  } | null
  profile: {
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
    // Corporation signing officer
    signingOfficerFirstName?: string
    signingOfficerLastName?: string
    signingOfficerDateOfBirth?: string
    // Joint holder
    jointHolderFirstName?: string
    jointHolderLastName?: string
    jointHolderDateOfBirth?: string
    jointHolderStreetAddress?: string
    jointHolderUnit?: string
    jointHolderCity?: string
    jointHolderRegion?: string
    jointHolderPostalCode?: string
    jointHolderCountry?: string
    // Trust trustees
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
  } | null
}

export default function InvestmentPage() {
  const [step, setStep] = useState<"initial" | "flow">("initial")
  const [userData, setUserData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "",
  })
  const [existingInvestor, setExistingInvestor] = useState<ExistingInvestorData | null>(null)
  const [isCheckingInvestor, setIsCheckingInvestor] = useState(false)

  const handleInitialSubmit = async (data: typeof userData) => {
    setUserData(data)
    setIsCheckingInvestor(true)

    try {
      const params = new URLSearchParams({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      })
      const res = await fetch(`/api/dealmaker/investors?${params}`)
      if (res.ok) {
        const result: ExistingInvestorData = await res.json()
        if (result.found) {
          setExistingInvestor(result)
        }
      }
    } catch {
      // Silently proceed as new investor
    } finally {
      setIsCheckingInvestor(false)
      setStep("flow")
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="md:px-8">

        {step === "initial" ? (
          <InitialForm onSubmit={handleInitialSubmit} isLoading={isCheckingInvestor} />
        ) : (
          <InvestmentFlow
            userData={userData}
            existingInvestor={existingInvestor}
            onDismissExisting={() => setExistingInvestor(null)}
          />
        )}
      </div>

    </main>
  )
}
