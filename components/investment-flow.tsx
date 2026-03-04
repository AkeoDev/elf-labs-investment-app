"use client"

import { useState } from "react"
import { InvestmentAmount } from "@/components/investment-amount"
import { ContactInformation, type ContactData } from "@/components/contact-information"
import type { PersonFields, AddressFields, CorporationFields, TrustFields, IRAFields } from "@/lib/investor-types"
import { AccordionSection } from "@/components/accordion-section"
import {
  CheckCircle2,
  AlertCircle,
  User,
  Users,
  Mail,
  Phone,
  DollarSign,
  BarChart3,
  MapPin,
  Building2,
  Calendar,
  Briefcase,
} from "lucide-react"

// ─── Confirmation display helpers ──────────────────────────────────────────

function formatConfirmAddress(a: Partial<AddressFields>): string {
  const parts: string[] = []
  if (a.address) {
    let line = a.address
    if (a.unit) line += `, ${a.unit}`
    parts.push(line)
  }
  if (a.city) parts.push(a.city)
  if (a.state) parts.push(a.state)
  if (a.zip) parts.push(a.zip)
  if (a.countryName) parts.push(a.countryName)
  else if (a.countryCode) parts.push(a.countryCode)
  return parts.join(", ")
}

function formatDateDisplay(date: string): string {
  if (!date) return ""
  let iso = date
  if (date.includes("/")) {
    const [mm, dd, yyyy] = date.split("/")
    iso = `${yyyy}-${mm}-${dd}`
  }
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return date
  }
}

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
  const [contactData, setContactData] = useState<ContactData | null>(null)
  const [completedSections, setCompletedSections] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [accessLink, setAccessLink] = useState("")
  const [investorData, setInvestorData] = useState<{
    id: number
    name: string
    email: string
    state: string
    investmentAmount: number
    numberOfSecurities: number
  } | null>(null)

  const handleInvestmentComplete = (amount: number, shares: number, bonusShares: number) => {
    setInvestmentData({ amount, shares, bonusShares })
    setCompletedSections([...completedSections, 1])
    setActiveSection(2)
  }

  const handleContactComplete = (data: ContactData) => {
    setContactData(data)
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
          countryCode: contactData?.countryCode ?? userData.countryCode,
          investorType: contactData?.investorTypeLabel || contactData?.investorType,
          investmentAmount: investmentData?.amount || 0,
          address: contactData?.address,
          city: contactData?.city,
          state: contactData?.state,
          dateOfBirth: contactData?.dateOfBirth,
          entityName: contactData?.entityName,
          formData: contactData?.formData,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmitSuccess(true)
        setCompletedSections([...completedSections, 4])
        if (data.investor?.accessLink) {
          setAccessLink(data.investor.accessLink)
        }
        if (data.investor) {
          setInvestorData({
            id: data.investor.id,
            name: data.investor.name,
            email: data.investor.email,
            state: data.investor.state,
            investmentAmount: data.investor.investmentAmount,
            numberOfSecurities: data.investor.numberOfSecurities,
          })
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

  // ─── Type-specific confirmation details ─────────────────────────────────
  const renderInvestorTypeDetails = () => {
    if (!contactData?.formData) return null

    switch (contactData.investorType) {
      case "individual": {
        const fd = contactData.formData as { person?: PersonFields }
        const p = fd?.person
        if (!p) return null
        return (
          <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Personal Information</h4>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Full Name</p>
                <p className="text-white text-sm">{p.firstName} {p.lastName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Address</p>
                <p className="text-white text-sm">{formatConfirmAddress(p)}</p>
              </div>
            </div>
            {p.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Phone</p>
                  <p className="text-white text-sm">{p.phone}</p>
                </div>
              </div>
            )}
            {p.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Date of Birth</p>
                  <p className="text-white text-sm">{formatDateDisplay(p.dateOfBirth)}</p>
                </div>
              </div>
            )}
          </div>
        )
      }

      case "joint": {
        const fd = contactData.formData as { primary?: PersonFields; joint?: PersonFields }
        if (!fd?.primary) return null
        return (
          <>
            {/* Primary Holder */}
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Primary Holder</h4>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Full Name</p>
                  <p className="text-white text-sm">{fd.primary.firstName} {fd.primary.lastName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Address</p>
                  <p className="text-white text-sm">{formatConfirmAddress(fd.primary)}</p>
                </div>
              </div>
              {fd.primary.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Phone</p>
                    <p className="text-white text-sm">{fd.primary.phone}</p>
                  </div>
                </div>
              )}
              {fd.primary.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Date of Birth</p>
                    <p className="text-white text-sm">{formatDateDisplay(fd.primary.dateOfBirth)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Joint Holder */}
            {fd.joint && (
              <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
                <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Joint Holder</h4>
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Full Name</p>
                    <p className="text-white text-sm">{fd.joint.firstName} {fd.joint.lastName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="text-white text-sm">{formatConfirmAddress(fd.joint)}</p>
                  </div>
                </div>
                {fd.joint.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs">Date of Birth</p>
                      <p className="text-white text-sm">{formatDateDisplay(fd.joint.dateOfBirth)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )
      }

      case "corporation": {
        const fd = contactData.formData as CorporationFields | undefined
        if (!fd) return null
        return (
          <>
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Entity Details</h4>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Entity Name</p>
                  <p className="text-white text-sm">{fd.entityName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Entity Address</p>
                  <p className="text-white text-sm">{formatConfirmAddress(fd.address)}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Signing Officer</h4>
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Full Name</p>
                  <p className="text-white text-sm">{fd.signingOfficer.firstName} {fd.signingOfficer.lastName}</p>
                </div>
              </div>
              {fd.signingOfficer.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Date of Birth</p>
                    <p className="text-white text-sm">{formatDateDisplay(fd.signingOfficer.dateOfBirth)}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      }

      case "trust": {
        const fd = contactData.formData as TrustFields | undefined
        if (!fd) return null
        return (
          <>
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Trust Details</h4>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Trust Name</p>
                  <p className="text-white text-sm">{fd.trustName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Trust Address</p>
                  <p className="text-white text-sm">{formatConfirmAddress(fd.address)}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Trustee</h4>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Full Name</p>
                  <p className="text-white text-sm">{fd.trustee.firstName} {fd.trustee.lastName}</p>
                </div>
              </div>
              {fd.trustee.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Date of Birth</p>
                    <p className="text-white text-sm">{formatDateDisplay(fd.trustee.dateOfBirth)}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      }

      case "ira": {
        const fd = contactData.formData as IRAFields | undefined
        if (!fd) return null
        return (
          <>
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Custodian Details</h4>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Custodian Name</p>
                  <p className="text-white text-sm">{fd.custodianName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Custodian Address</p>
                  <p className="text-white text-sm">{formatConfirmAddress(fd.custodianAddress)}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Account Holder</h4>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Full Name</p>
                  <p className="text-white text-sm">{fd.holder.firstName} {fd.holder.lastName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Address</p>
                  <p className="text-white text-sm">{formatConfirmAddress(fd.holder)}</p>
                </div>
              </div>
              {fd.holder.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Phone</p>
                    <p className="text-white text-sm">{fd.holder.phone}</p>
                  </div>
                </div>
              )}
              {fd.holder.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">Date of Birth</p>
                    <p className="text-white text-sm">{formatDateDisplay(fd.holder.dateOfBirth)}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-6 md:p-6">
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
          contactData && (
            <div className="text-sm mt-2 space-y-0.5">
              <p className="text-gray-400">
                <span className="text-gray-500">Type: </span>
                <span className="text-white">{contactData.investorTypeLabel || contactData.investorType}</span>
              </p>
              {contactData.entityName && (
                <p className="text-gray-400">
                  <span className="text-gray-500">Entity: </span>
                  <span className="text-white">{contactData.entityName}</span>
                </p>
              )}
              <p className="text-gray-400">
                <span className="text-gray-500">Location: </span>
                <span className="text-white">
                  {contactData.city}, {contactData.state}, {contactData.countryName}
                </span>
              </p>
            </div>
          )
        }
      >
        <ContactInformation
          onContinue={handleContactComplete}
          defaultCountryCode={userData.countryCode}
        />
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

          {/* Account Details */}
          <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-3">
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Account Details</h4>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="flex-1">
                <p className="text-gray-500 text-xs">Name</p>
                <p className="text-white text-sm">
                  {userData.firstName} {userData.lastName}
                </p>
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
            {contactData?.investorType && (
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Investor Type</p>
                  <p className="text-white text-sm">{contactData.investorTypeLabel || contactData.investorType}</p>
                </div>
              </div>
            )}
          </div>

          {/* Type-specific investor details */}
          {renderInvestorTypeDetails()}

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
            <div className="space-y-4">
              {/* Header confirmation */}
              <div className="flex items-center gap-3 py-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Investment Submitted</h3>
                  <p className="text-gray-400 text-sm">
                    Your investment of $
                    {investmentData?.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                    has been submitted.
                  </p>
                </div>
              </div>

              {/* Investor details from DealMaker */}
              {investorData && (
                <div className="bg-[#1a2744]/60 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Investor ID</span>
                    <span className="text-white font-mono">#{investorData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="text-white">{investorData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="text-[#e91e8c] capitalize">{investorData.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span className="text-white">
                      ${(investorData.investmentAmount || investmentData?.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shares</span>
                    <span className="text-white">{(investorData.numberOfSecurities ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* DealMaker OTP portal link */}
              {accessLink && (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">
                    Your investor profile has been created. Click below to verify your phone number
                    and complete your investment:
                  </p>
                  <a
                    href={accessLink}
                    target="_self"
                    className="flex items-center justify-center w-full bg-[#e91e8c] hover:bg-[#d11a7d] text-white font-medium py-4 rounded-full transition-colors"
                  >
                    Verify Phone &amp; Complete Investment
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Pre-submit state */
            <>
              <div className="bg-[#1a2744]/60 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  By clicking the button below, your investment details will be submitted to our
                  processing partner. You will then receive instructions via email to complete
                  document signing and payment.
                </p>
              </div>

              {investmentData && (
                <div className="flex justify-between items-center bg-[#1a2744]/40 rounded-lg px-4 py-3">
                  <span className="text-gray-400 text-sm">Total Investment</span>
                  <span className="text-white font-semibold">
                    $
                    {investmentData.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
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
