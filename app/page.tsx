"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
  const [investorId, setInvestorId] = useState<number | null>(null)
  const [investmentData, setInvestmentData] = useState<{
    amount: number
    shares: number
    bonusShares: number
  } | null>(null)
  const [earlyCreateError, setEarlyCreateError] = useState("")
  const [currentStep, setCurrentStep] = useState(1)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})
  // Ref to tell InvestmentFlow to navigate to a specific section
  const flowGoToRef = useRef<((section: number) => void) | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const utms: Record<string, string> = {}
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const val = params.get(key)
      if (val) utms[key] = val
    }
    setUtmParams(utms)
  }, [])

  const handleInitialSubmit = async (data: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode: string
    investmentAmount: number
    shares: number
    bonusShares: number
  }) => {
    const { investmentAmount, shares, bonusShares, ...userFields } = data
    setUserData(userFields)
    setInvestmentData({ amount: investmentAmount, shares, bonusShares })
    setIsCheckingInvestor(true)
    setEarlyCreateError("")

    try {
      // Step 1: Check for existing investor (disabled — always create new)
      // const params = new URLSearchParams({
      //   email: data.email,
      //   phone: data.phone,
      //   firstName: data.firstName,
      //   lastName: data.lastName,
      // })
      // const res = await fetch(`/api/dealmaker/investors?${params}`)
      // if (res.ok) {
      //   const result: ExistingInvestorData = await res.json()
      //   if (result.found) {
      //     setExistingInvestor(result)
      //     if (result.investor?.id) setInvestorId(result.investor.id)
      //     setStep("flow")
      //     setCurrentStep(2)
      //     return
      //   }
      // }

      // Step 2: No existing investor found — create profile in DealMaker
      // Phase 1: profile-only (catches phone validation errors early)
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

      if (!earlyRes.ok || !earlyData.success) {
        setEarlyCreateError(earlyData.error || "Something went wrong. Please try again.")
        return
      }

      const newProfileId = earlyData.profileId
      setProfileId(newProfileId)

      // Step 3: Phase 2 — create investor with amount + profileId
      try {
        const phase2Res = await fetch("/api/dealmaker/investors/early-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            countryCode: data.countryCode,
            investmentAmount,
            profileId: newProfileId,
            utmParams,
          }),
        })
        const phase2Data = await phase2Res.json()
        if (phase2Res.ok && phase2Data.success && phase2Data.investorId) {
          setInvestorId(phase2Data.investorId)
        }
      } catch {
        // Phase 2 failure is non-critical — investor will be created at final step
      }

      setStep("flow")
      setCurrentStep(2)
    } catch {
      // Network error — still proceed (DealMaker creation will happen at final step)
      setStep("flow")
      setCurrentStep(2)
    } finally {
      setIsCheckingInvestor(false)
    }
  }

  const handleStepClick = useCallback((clickedStep: number) => {
    if (clickedStep >= currentStep) return // Can only go back
    if (clickedStep === 1) {
      setStep("initial")
      setCurrentStep(1)
    } else if (clickedStep === 2) {
      // Tell InvestmentFlow to go to section 1 (Contact Info)
      flowGoToRef.current?.(1)
      setCurrentStep(2)
    }
  }, [currentStep])

  return (
    <main className="flex flex-col">
      <div className="md:px-8">
        {step === "initial" ? (
          <InitialForm
            onSubmit={handleInitialSubmit}
            isLoading={isCheckingInvestor}
            error={earlyCreateError}
            onErrorClear={() => setEarlyCreateError("")}
            defaultAmount={investmentData?.amount}
            defaultUserData={userData.email ? userData : undefined}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        ) : (
          <InvestmentFlow
            userData={userData}
            existingInvestor={existingInvestor}
            onDismissExisting={() => setExistingInvestor(null)}
            profileId={profileId}
            investmentData={investmentData}
            initialInvestorId={investorId}
            onStepChange={setCurrentStep}
            goToRef={flowGoToRef}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            utmParams={utmParams}
          />
        )}
      </div>

    </main>
  )
}
