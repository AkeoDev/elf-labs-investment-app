"use client"

import { useState } from "react"
import { InvestmentAmount } from "@/components/investment-amount"
import { ContactInformation } from "@/components/contact-information"
import { AccordionSection } from "@/components/accordion-section"

export function InvestmentFlow() {
  const [activeSection, setActiveSection] = useState(1)
  const [investmentData, setInvestmentData] = useState<{
    amount: number
    shares: number
    bonusShares: number
  } | null>(null)
  const [completedSections, setCompletedSections] = useState<number[]>([])

  const handleInvestmentComplete = (amount: number, shares: number, bonusShares: number) => {
    setInvestmentData({ amount, shares, bonusShares })
    setCompletedSections([...completedSections, 1])
    setActiveSection(2)
  }

  const handleContactComplete = () => {
    setCompletedSections([...completedSections, 2])
    setActiveSection(3)
  }

  return (
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-3 h-3 rounded-sm bg-[#e91e8c]" />
        <h2 className="text-white font-medium">Begin your Investment</h2>
      </div>

      {/* Section 1: Investment Amount */}
      <AccordionSection
        number={1}
        title="Investment Amount"
        isActive={activeSection === 1}
        isCompleted={completedSections.includes(1)}
        onToggle={() => setActiveSection(activeSection === 1 ? 0 : 1)}
        summary={
          investmentData && (
            <div className="flex justify-between text-sm mt-2">
              <div>
                <span className="text-gray-500">Amount</span>
                <span className="text-white ml-4">
                  ${investmentData.amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total Shares</span>
                <span className="text-white ml-4">
                  {(investmentData.shares + investmentData.bonusShares).toLocaleString()}
                </span>
              </div>
            </div>
          )
        }
      >
        <InvestmentAmount onContinue={handleInvestmentComplete} />
      </AccordionSection>

      {/* Section 2: Contact Information */}
      <AccordionSection
        number={2}
        title="Contact Information"
        isActive={activeSection === 2}
        isCompleted={completedSections.includes(2)}
        onToggle={() => setActiveSection(activeSection === 2 ? 0 : 2)}
      >
        <ContactInformation onContinue={handleContactComplete} />
      </AccordionSection>

      {/* Section 3: Investor Confirmation */}
      <AccordionSection
        number={3}
        title="Investor Confirmation"
        isActive={activeSection === 3}
        isCompleted={completedSections.includes(3)}
        onToggle={() => setActiveSection(activeSection === 3 ? 0 : 3)}
      >
        <div className="py-4">
          <p className="text-gray-400">Investor confirmation content goes here...</p>
          <button
            onClick={() => {
              setCompletedSections([...completedSections, 3])
              setActiveSection(4)
            }}
            className="w-full mt-4 bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-4 rounded-full transition-colors"
          >
            Continue
          </button>
        </div>
      </AccordionSection>

      {/* Section 4: Payment */}
      <AccordionSection
        number={4}
        title="Payment"
        isActive={activeSection === 4}
        isCompleted={completedSections.includes(4)}
        onToggle={() => setActiveSection(activeSection === 4 ? 0 : 4)}
        isLast
      >
        <div className="py-4">
          <p className="text-gray-400">Payment options go here...</p>
          <button
            onClick={() => setCompletedSections([...completedSections, 4])}
            className="w-full mt-4 bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-4 rounded-full transition-colors"
          >
            Complete Payment
          </button>
        </div>
      </AccordionSection>

      {/* Footer Links */}
      <div className="flex justify-center gap-2 mt-8 text-sm">
        <a href="#" className="text-[#e91e8c] hover:underline">
          Download Contract
        </a>
        <span className="text-[#e91e8c]">•</span>
        <a href="#" className="text-[#e91e8c] hover:underline">
          Additional documents
        </a>
      </div>
    </div>
  )
}
