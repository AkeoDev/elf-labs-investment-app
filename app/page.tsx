"use client"

import { useState } from "react"
import { InitialForm } from "@/components/initial-form"
import { InvestmentFlow } from "@/components/investment-flow"
import { InvestorPerks } from "@/components/investor-perks"
import { AdditionalInfo } from "@/components/additional-info"
import { Youtube, Twitter, Linkedin, Instagram, Facebook } from "lucide-react"

export default function InvestmentPage() {
  const [step, setStep] = useState<"initial" | "flow">("initial") // Default to initial for demo
  const [userData, setUserData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "",
  })

  const handleInitialSubmit = (data: typeof userData) => {
    setUserData(data)
    setStep("flow")
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="md:px-8">

        {step === "initial" ? (
          <InitialForm onSubmit={handleInitialSubmit} />
        ) : (
          <>
            <div className="max-w-6xl mx-auto">
              {/* Header Stats Bar - Desktop only */}
              <div className="hidden md:flex justify-end gap-6 mb-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-400">Share price</p>
                  <p className="text-white font-semibold">$2.25 USD</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Min Investment:</p>
                  <p className="text-white font-semibold">$998.61* USD</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Offering Type:</p>
                  <p className="text-white font-semibold">Common Stock</p>
                </div>
              </div>


              <div className="grid md:grid-cols-[1fr,400px] gap-6">
                {/* Left: Investment Flow */}
                <InvestmentFlow userData={userData} />

                {/* Right: Investor Perks & Additional Info - Desktop only */}
                <div className="hidden md:flex flex-col gap-6">
                  <InvestorPerks />
                  <AdditionalInfo />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </main>
  )
}
