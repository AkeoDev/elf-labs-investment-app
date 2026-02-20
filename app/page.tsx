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
  })

  const handleInitialSubmit = (data: typeof userData) => {
    setUserData(data)
    setStep("flow")
  }

  return (
    <main className="min-h-screen bg-[#0a0b14] flex flex-col">
      <header className="p-4 md:p-6">
        <div className="flex items-center gap-2">
          <span className="text-[#e91e8c] text-2xl">🔴</span>
          <span className="text-white font-medium">
            <span className="text-[#e91e8c]">elf</span> labs
          </span>
        </div>
      </header>

      <div className="flex-1 px-4 md:px-8 pb-8">
        <h1 className="text-2xl md:text-3xl font-light text-white text-center mb-6">Elf Labs Investment Opportunity</h1>

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
                <InvestmentFlow />

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

      <footer className="p-4 md:p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#e91e8c] text-xl">🔴</span>
          <span className="text-white font-medium">
            <span className="text-[#e91e8c]">elf</span> labs
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <Youtube className="w-5 h-5 hover:text-white cursor-pointer" />
          <Twitter className="w-5 h-5 hover:text-white cursor-pointer" />
          <Linkedin className="w-5 h-5 hover:text-white cursor-pointer" />
          <Instagram className="w-5 h-5 hover:text-white cursor-pointer" />
          <Facebook className="w-5 h-5 hover:text-white cursor-pointer" />
        </div>
      </footer>
    </main>
  )
}
