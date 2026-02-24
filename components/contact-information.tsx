"use client"

import { useState } from "react"
import { HelpCircle, ChevronDown } from "lucide-react"

interface ContactInformationProps {
  onContinue: (investorType: string) => void
}

const investorTypes = [
  "Individual",
  "Joint Tenants",
  "Trust",
  "Entity (LLC, Corporation, etc.)",
  "IRA / Self-Directed IRA",
]

export function ContactInformation({ onContinue }: ContactInformationProps) {
  const [investorType, setInvestorType] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-300">Who is making the investment?</span>
        <HelpCircle className="w-4 h-4 text-gray-500" />
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-[#1a1f35] border border-gray-600 rounded-lg py-4 px-4 text-left flex items-center justify-between"
        >
          <span className={investorType ? "text-white" : "text-gray-500"}>
            {investorType || "Select an investor type"}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f35] border border-gray-600 rounded-lg overflow-hidden z-10">
            {investorTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setInvestorType(type)
                  setIsOpen(false)
                }}
                className="w-full py-3 px-4 text-left text-gray-300 hover:bg-[#252a42] transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {investorType && (
        <button
          onClick={() => onContinue(investorType)}
          className="w-full mt-4 bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-4 rounded-full transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  )
}
