"use client"

import { useState } from "react"
import { InvestmentAmount } from "@/components/investment-amount"
import { ContactInformation } from "@/components/contact-information"
import { AccordionSection } from "@/components/accordion-section"
import { useDealMaker } from "@/hooks/use-dealmaker"
import { Loader2, AlertCircle, ExternalLink } from "lucide-react"

interface InvestmentFlowProps {
  userData: {
    email: string
    firstName: string
    lastName: string
    phone: string
  }
}

export function InvestmentFlow({ userData }: InvestmentFlowProps) {
  const [activeSection, setActiveSection] = useState(1)
  const [investmentData, setInvestmentData] = useState<{
    amount: number
    shares: number
    bonusShares: number
  } | null>(null)
  const [investorType, setInvestorType] = useState<string | null>(null)
  const [completedSections, setCompletedSections] = useState<number[]>([])
  const [accessLink, setAccessLink] = useState<string | null>(null)

  const { createInvestor, isLoading, error } = useDealMaker()

  const handleInvestmentComplete = (amount: number, shares: number, bonusShares: number) => {
    setInvestmentData({ amount, shares, bonusShares })
    setCompletedSections([...completedSections, 1])
    setActiveSection(2)
  }

  const handleContactComplete = (type: string) => {
    setInvestorType(type)
    setCompletedSections([...completedSections, 2])
    setActiveSection(3)
  }

  const handleConfirmation = () => {
    setCompletedSections([...completedSections, 3])
    setActiveSection(4)
  }

  const handleCompletePayment = async () => {
    if (!investmentData) return

    const result = await createInvestor({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      investmentAmount: investmentData.amount,
    })

    if (result?.investor.accessLink) {
      setAccessLink(result.investor.accessLink)
      setCompletedSections([...completedSections, 4])
      // Redirect to DealMaker to complete the investment
      window.location.href = result.investor.accessLink
    } else if (result?.success) {
      // Investor was created but no access link was returned
      setCompletedSections([...completedSections, 4])
    }
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
        summary={
          investorType && (
            <div className="text-sm mt-2">
              <span className="text-gray-500">Investor Type</span>
              <span className="text-white ml-4">{investorType}</span>
            </div>
          )
        }
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
        <div className="py-4 space-y-4">
          <div className="bg-[#1a2744] rounded-lg p-4 space-y-3">
            <h3 className="text-white font-medium text-sm">Review Your Investment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-white">{userData.firstName} {userData.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{userData.email}</span>
              </div>
              {userData.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white">{userData.phone}</span>
                </div>
              )}
              {investorType && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Investor Type</span>
                  <span className="text-white">{investorType}</span>
                </div>
              )}
              {investmentData && (
                <>
                  <div className="border-t border-gray-600 my-2" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Investment Amount</span>
                    <span className="text-white font-semibold">
                      ${investmentData.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Shares</span>
                    <span className="text-white">{investmentData.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bonus Shares</span>
                    <span className="text-[#e91e8c]">+{investmentData.bonusShares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-300">Total Shares</span>
                    <span className="text-white">
                      {(investmentData.shares + investmentData.bonusShares).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleConfirmation}
            className="w-full bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-4 rounded-full transition-colors"
          >
            Confirm & Continue
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
        <div className="py-4 space-y-4">
          {investmentData && (
            <div className="bg-[#1a2744] rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Due</span>
                <span className="text-white text-2xl font-bold">
                  ${investmentData.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <p className="text-gray-400 text-sm leading-relaxed">
            Clicking "Complete Payment" will submit your investment to DealMaker and redirect you to complete the payment process securely.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {accessLink && (
            <div className="flex items-start gap-2 bg-green-900/30 border border-green-500/30 rounded-lg p-3">
              <ExternalLink className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 text-sm">Investment submitted. Redirecting to DealMaker...</p>
                <a
                  href={accessLink}
                  className="text-green-400 text-sm underline hover:text-green-300"
                >
                  Click here if you are not redirected
                </a>
              </div>
            </div>
          )}

          <button
            onClick={handleCompletePayment}
            disabled={isLoading || completedSections.includes(4)}
            className={`w-full py-4 rounded-full font-medium flex items-center justify-center gap-2 transition-colors ${
              isLoading || completedSections.includes(4)
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-[#e91e8c] hover:bg-[#d11a7d] text-white"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting Investment...
              </>
            ) : completedSections.includes(4) ? (
              "Investment Submitted"
            ) : (
              "Complete Payment"
            )}
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
