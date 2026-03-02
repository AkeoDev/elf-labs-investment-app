"use client"

import { useState } from "react"
import { InvestmentAmount } from "@/components/investment-amount"
import { ContactInformation } from "@/components/contact-information"
import { AccordionSection } from "@/components/accordion-section"
import { CheckCircle2, AlertCircle, User, Mail, Phone, DollarSign, BarChart3 } from "lucide-react"

interface UserData {
  email: string
  firstName: string
  lastName: string
  phone: string
  countryCode: string
}

export function InvestmentFlow({ userData }: { userData: UserData }) {
  const [activeSection, setActiveSection] = useState(1)
  const [investmentData, setInvestmentData] = useState<{
    amount: number
    shares: number
    bonusShares: number
  } | null>(null)
  const [investorType, setInvestorType] = useState("")
  const [completedSections, setCompletedSections] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [accessLink, setAccessLink] = useState("")

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

  const handleSubmitInvestment = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch("/api/dealmaker/investors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          countryCode: userData.countryCode,
          investorType,
          investmentAmount: investmentData?.amount || 0,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmitSuccess(true)
        setCompletedSections([...completedSections, 4])
        if (data.investor?.accessLink) {
          setAccessLink(data.investor.accessLink)
        }
      } else {
        setSubmitError(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setSubmitError("Unable to connect. Please check your internet connection and try again.")
    } finally {
      setIsSubmitting(false)
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
          <p className="text-gray-400 text-sm">Please review your details before proceeding.</p>

          {/* Investor details */}
          <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Name</p>
                <p className="text-white text-sm">{userData.firstName} {userData.lastName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Email</p>
                <p className="text-white text-sm">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Phone</p>
                <p className="text-white text-sm">{userData.phone}</p>
              </div>
            </div>
            {investorType && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Investor Type</p>
                  <p className="text-white text-sm">{investorType}</p>
                </div>
              </div>
            )}
          </div>

          {/* Investment details */}
          {investmentData && (
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Investment Amount</p>
                  <p className="text-white text-sm font-semibold">
                    ${investmentData.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Shares</p>
                  <p className="text-white text-sm">
                    {investmentData.shares.toLocaleString()} shares
                    {investmentData.bonusShares > 0 && (
                      <span className="text-[#e91e8c] ml-2">
                        + {investmentData.bonusShares.toLocaleString()} bonus
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3 flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-[#e91e8c] shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Total Shares</p>
                  <p className="text-white text-sm font-semibold">
                    {(investmentData.shares + investmentData.bonusShares).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setCompletedSections([...completedSections, 3])
              setActiveSection(4)
            }}
            className="w-full mt-2 bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-4 rounded-full transition-colors"
          >
            Confirm and Continue
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
          {submitSuccess ? (
            /* Success state */
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
              <div>
                <h3 className="text-white text-xl font-semibold">Investment Submitted</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Your investment of ${investmentData?.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been submitted successfully.
                </p>
              </div>
              <p className="text-gray-500 text-xs">
                You will receive an email at {userData.email} with next steps to complete your investment, including document signing and payment processing.
              </p>
              {accessLink && (
                <a
                  href={accessLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-3 px-8 rounded-full transition-colors"
                >
                  Continue to Complete Investment
                </a>
              )}
            </div>
          ) : (
            /* Pre-submit state */
            <>
              <div className="bg-[#1a2744]/60 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  By clicking the button below, your investment details will be submitted to our processing partner. 
                  You will then receive instructions via email to complete document signing and payment.
                </p>
              </div>

              {investmentData && (
                <div className="flex justify-between items-center bg-[#1a2744]/40 rounded-lg px-4 py-3">
                  <span className="text-gray-400 text-sm">Total Investment</span>
                  <span className="text-white font-semibold">
                    ${investmentData.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {submitError && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{submitError}</p>
                </div>
              )}

              <button
                onClick={handleSubmitInvestment}
                disabled={isSubmitting}
                className="w-full bg-[#e91e8c] hover:bg-[#d11a7d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-full transition-colors"
              >
                {isSubmitting ? "Submitting Investment..." : "Complete Payment"}
              </button>
            </>
          )}
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
