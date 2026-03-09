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
  const [profileId, setProfileId] = useState<number | null>(null)
  const [earlyCreateError, setEarlyCreateError] = useState("")

  const handleInitialSubmit = async (data: typeof userData) => {
    setUserData(data)
    setIsCheckingInvestor(true)
    setEarlyCreateError("")

    try {
      // Step 1: Check for existing investor
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
          setStep("flow")
          return
        }
      }

      // Step 2: No existing investor found — create profile in DealMaker
      // (catches phone validation errors early, before the full flow)
      const earlyRes = await fetch("/api/dealmaker/investors/early-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          countryCode: data.countryCode,
          // No investmentAmount → Phase 1: profile-only
        }),
      })

      const earlyData = await earlyRes.json()

      if (earlyRes.ok && earlyData.success) {
        setProfileId(earlyData.profileId)
        setStep("flow")
      } else {
        // Show DealMaker error on the initial form
        setEarlyCreateError(earlyData.error || "Something went wrong. Please try again.")
      }
    } catch {
      // Network error — still proceed (DealMaker creation will happen at final step)
      setStep("flow")
    } finally {
      setIsCheckingInvestor(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="md:px-8">

        {step === "initial" ? (
          <InitialForm
            onSubmit={handleInitialSubmit}
            isLoading={isCheckingInvestor}
            error={earlyCreateError}
            onErrorClear={() => setEarlyCreateError("")}
          />
        ) : (
          <InvestmentFlow
            userData={userData}
            existingInvestor={existingInvestor}
            onDismissExisting={() => setExistingInvestor(null)}
            onBack={() => setStep("initial")}
            profileId={profileId}
          />
        )}
      </div>

    </main>
  )
}
