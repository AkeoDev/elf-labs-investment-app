"use client"

import { useState } from "react"
import { InvestmentAmount } from "@/components/investment-amount"
import { ContactInformation, type ContactData } from "@/components/contact-information"
import type { PersonFields, AddressFields, CorporationFields, TrustFields, IRAFields } from "@/lib/investor-types"
import type { ExistingInvestorData } from "@/app/page"
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
  X,
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

interface InvestmentFlowProps {
  userData: UserData
  existingInvestor?: ExistingInvestorData | null
  onDismissExisting?: () => void
  onBack?: () => void
  profileId?: number | null
}

export function InvestmentFlow({ userData, existingInvestor, onDismissExisting, onBack, profileId }: InvestmentFlowProps) {
  const [activeSection, setActiveSection] = useState(1)
  const [investmentData, setInvestmentData] = useState<{
    amount: number
    shares: number
    bonusShares: number
  } | null>(null)
  const [contactData, setContactData] = useState<ContactData | null>(null)
  const [investorId, setInvestorId] = useState<number | null>(
    existingInvestor?.investor?.id ?? null
  )
  const [isCreatingInvestor, setIsCreatingInvestor] = useState(false)
  const [investorCreateError, setInvestorCreateError] = useState("")
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

  const handleInvestmentComplete = async (amount: number, shares: number, bonusShares: number) => {
    setInvestmentData({ amount, shares, bonusShares })
    setInvestorCreateError("")

    // If we already have an investorId (existing investor or back-navigation), just proceed
    if (investorId) {
      // Update the existing investor with the new amount
      try {
        setIsCreatingInvestor(true)
        await fetch("/api/dealmaker/investors/early-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            countryCode: userData.countryCode,
            investmentAmount: amount,
            profileId,
            existingInvestorId: investorId,
          }),
        })
      } catch {
        // Non-critical — update will happen at final step
      } finally {
        setIsCreatingInvestor(false)
      }
      setActiveSection(2)
      return
    }

    // New investor: create in DealMaker with profileId + actual amount
    if (profileId) {
      setIsCreatingInvestor(true)
      try {
        const res = await fetch("/api/dealmaker/investors/early-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            countryCode: userData.countryCode,
            investmentAmount: amount,
            profileId,
          }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setInvestorId(data.investorId)
        }
        // On failure: proceed anyway — investor will be created at final step.
        // Only block on 400-level validation errors the user can fix.
      } catch {
        // Network error — proceed, investor will be created at final step
      } finally {
        setIsCreatingInvestor(false)
      }
    }

    // Always proceed to Step 2
    setActiveSection(2)
  }

  const handleContactComplete = (data: ContactData) => {
    setContactData(data)
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
          existingInvestorId: investorId,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmitSuccess(true)
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
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-3 h-3 rounded-sm bg-[#e91e8c]" />
        <h2 className="text-white font-medium">Begin your Investment</h2>
      </div>

      {/* Welcome back banner for existing investors */}
      {existingInvestor?.found && (
        <div className="bg-[#1a2744]/80 border border-[#e91e8c]/30 rounded-lg p-4 mb-4 flex items-start justify-between">
          <div>
            <p className="text-white font-medium">
              Welcome back, {existingInvestor.investor?.firstName || userData.firstName}!
            </p>
            <p className="text-gray-400 text-sm mt-1">
              We found your previous investment record. Your details have been pre-filled.
            </p>
          </div>
          <button
            onClick={onDismissExisting}
            className="text-gray-500 hover:text-gray-300 ml-4 shrink-0"
            title="Dismiss and proceed as new investor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Investment Amount */}
      {activeSection === 1 && (
        <InvestmentAmount
          onContinue={handleInvestmentComplete}
          onBack={onBack}
          defaultAmount={investmentData?.amount ?? existingInvestor?.investor?.investmentAmount}
          isCreating={isCreatingInvestor}
          createError={investorCreateError}
        />
      )}

      {/* Step 2: Contact Information */}
      {activeSection === 2 && (
        <ContactInformation
          onContinue={handleContactComplete}
          onBack={() => setActiveSection(1)}
          defaultCountryCode={userData.countryCode}
          defaultProfileData={existingInvestor?.profile || undefined}
          defaultContactData={contactData || undefined}
          defaultPhone={{ phone: userData.phone, countryCode: userData.countryCode }}
        />
      )}

      {/* Step 3: Investor Confirmation */}
      {activeSection === 3 && (
        <div className="space-y-4">
          <h3 className="text-white text-xl font-semibold text-center">Investor Confirmation</h3>
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
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Account Details</h4>
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

          {submitSuccess ? (
            /* Success state */
            <div className="space-y-4">
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
            <>
              <div className="bg-[#1a2744]/60 rounded-lg p-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  By clicking the button below, your investment details will be submitted to our
                  processing partner. You will then receive instructions via email to complete
                  document signing and payment.
                </p>
              </div>

              {submitError && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{submitError}</p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setActiveSection(2)}
                  disabled={isSubmitting}
                  className="py-4 px-6 rounded-full font-medium flex items-center justify-center gap-2 transition-colors border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">←</span>
                  Back
                </button>
                <button
                  onClick={handleSubmitInvestment}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#e91e8c] hover:bg-[#d11a7d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Submitting Investment..." : (
                    <>
                      Complete Payment
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

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
