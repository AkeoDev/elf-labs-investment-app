"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Mail, User, Phone, ChevronDown } from "lucide-react"

const COUNTRY_CODES = [
  // Popular / prioritized
  { code: "+1", country: "US", name: "United States" },
  { code: "+1", country: "CA", name: "Canada" },
  { code: "+44", country: "GB", name: "United Kingdom" },
  { code: "+61", country: "AU", name: "Australia" },
  // Alphabetical by country name
  { code: "+93", country: "AF", name: "Afghanistan" },
  { code: "+355", country: "AL", name: "Albania" },
  { code: "+213", country: "DZ", name: "Algeria" },
  { code: "+376", country: "AD", name: "Andorra" },
  { code: "+244", country: "AO", name: "Angola" },
  { code: "+1268", country: "AG", name: "Antigua and Barbuda" },
  { code: "+54", country: "AR", name: "Argentina" },
  { code: "+374", country: "AM", name: "Armenia" },
  { code: "+43", country: "AT", name: "Austria" },
  { code: "+994", country: "AZ", name: "Azerbaijan" },
  { code: "+1242", country: "BS", name: "Bahamas" },
  { code: "+973", country: "BH", name: "Bahrain" },
  { code: "+880", country: "BD", name: "Bangladesh" },
  { code: "+1246", country: "BB", name: "Barbados" },
  { code: "+375", country: "BY", name: "Belarus" },
  { code: "+32", country: "BE", name: "Belgium" },
  { code: "+501", country: "BZ", name: "Belize" },
  { code: "+229", country: "BJ", name: "Benin" },
  { code: "+975", country: "BT", name: "Bhutan" },
  { code: "+591", country: "BO", name: "Bolivia" },
  { code: "+387", country: "BA", name: "Bosnia and Herzegovina" },
  { code: "+267", country: "BW", name: "Botswana" },
  { code: "+55", country: "BR", name: "Brazil" },
  { code: "+673", country: "BN", name: "Brunei" },
  { code: "+359", country: "BG", name: "Bulgaria" },
  { code: "+226", country: "BF", name: "Burkina Faso" },
  { code: "+257", country: "BI", name: "Burundi" },
  { code: "+238", country: "CV", name: "Cabo Verde" },
  { code: "+855", country: "KH", name: "Cambodia" },
  { code: "+237", country: "CM", name: "Cameroon" },
  { code: "+236", country: "CF", name: "Central African Republic" },
  { code: "+235", country: "TD", name: "Chad" },
  { code: "+56", country: "CL", name: "Chile" },
  { code: "+86", country: "CN", name: "China" },
  { code: "+57", country: "CO", name: "Colombia" },
  { code: "+269", country: "KM", name: "Comoros" },
  { code: "+242", country: "CG", name: "Congo" },
  { code: "+243", country: "CD", name: "Congo (DRC)" },
  { code: "+506", country: "CR", name: "Costa Rica" },
  { code: "+385", country: "HR", name: "Croatia" },
  { code: "+53", country: "CU", name: "Cuba" },
  { code: "+357", country: "CY", name: "Cyprus" },
  { code: "+420", country: "CZ", name: "Czechia" },
  { code: "+225", country: "CI", name: "Cote d'Ivoire" },
  { code: "+45", country: "DK", name: "Denmark" },
  { code: "+253", country: "DJ", name: "Djibouti" },
  { code: "+1767", country: "DM", name: "Dominica" },
  { code: "+1809", country: "DO", name: "Dominican Republic" },
  { code: "+593", country: "EC", name: "Ecuador" },
  { code: "+20", country: "EG", name: "Egypt" },
  { code: "+503", country: "SV", name: "El Salvador" },
  { code: "+240", country: "GQ", name: "Equatorial Guinea" },
  { code: "+291", country: "ER", name: "Eritrea" },
  { code: "+372", country: "EE", name: "Estonia" },
  { code: "+268", country: "SZ", name: "Eswatini" },
  { code: "+251", country: "ET", name: "Ethiopia" },
  { code: "+679", country: "FJ", name: "Fiji" },
  { code: "+358", country: "FI", name: "Finland" },
  { code: "+33", country: "FR", name: "France" },
  { code: "+241", country: "GA", name: "Gabon" },
  { code: "+220", country: "GM", name: "Gambia" },
  { code: "+995", country: "GE", name: "Georgia" },
  { code: "+49", country: "DE", name: "Germany" },
  { code: "+233", country: "GH", name: "Ghana" },
  { code: "+30", country: "GR", name: "Greece" },
  { code: "+1473", country: "GD", name: "Grenada" },
  { code: "+502", country: "GT", name: "Guatemala" },
  { code: "+224", country: "GN", name: "Guinea" },
  { code: "+245", country: "GW", name: "Guinea-Bissau" },
  { code: "+592", country: "GY", name: "Guyana" },
  { code: "+509", country: "HT", name: "Haiti" },
  { code: "+504", country: "HN", name: "Honduras" },
  { code: "+852", country: "HK", name: "Hong Kong" },
  { code: "+36", country: "HU", name: "Hungary" },
  { code: "+354", country: "IS", name: "Iceland" },
  { code: "+91", country: "IN", name: "India" },
  { code: "+62", country: "ID", name: "Indonesia" },
  { code: "+98", country: "IR", name: "Iran" },
  { code: "+964", country: "IQ", name: "Iraq" },
  { code: "+353", country: "IE", name: "Ireland" },
  { code: "+972", country: "IL", name: "Israel" },
  { code: "+39", country: "IT", name: "Italy" },
  { code: "+1876", country: "JM", name: "Jamaica" },
  { code: "+81", country: "JP", name: "Japan" },
  { code: "+962", country: "JO", name: "Jordan" },
  { code: "+7", country: "KZ", name: "Kazakhstan" },
  { code: "+254", country: "KE", name: "Kenya" },
  { code: "+686", country: "KI", name: "Kiribati" },
  { code: "+965", country: "KW", name: "Kuwait" },
  { code: "+996", country: "KG", name: "Kyrgyzstan" },
  { code: "+856", country: "LA", name: "Laos" },
  { code: "+371", country: "LV", name: "Latvia" },
  { code: "+961", country: "LB", name: "Lebanon" },
  { code: "+266", country: "LS", name: "Lesotho" },
  { code: "+231", country: "LR", name: "Liberia" },
  { code: "+218", country: "LY", name: "Libya" },
  { code: "+423", country: "LI", name: "Liechtenstein" },
  { code: "+370", country: "LT", name: "Lithuania" },
  { code: "+352", country: "LU", name: "Luxembourg" },
  { code: "+853", country: "MO", name: "Macau" },
  { code: "+261", country: "MG", name: "Madagascar" },
  { code: "+265", country: "MW", name: "Malawi" },
  { code: "+60", country: "MY", name: "Malaysia" },
  { code: "+960", country: "MV", name: "Maldives" },
  { code: "+223", country: "ML", name: "Mali" },
  { code: "+356", country: "MT", name: "Malta" },
  { code: "+692", country: "MH", name: "Marshall Islands" },
  { code: "+222", country: "MR", name: "Mauritania" },
  { code: "+230", country: "MU", name: "Mauritius" },
  { code: "+52", country: "MX", name: "Mexico" },
  { code: "+691", country: "FM", name: "Micronesia" },
  { code: "+373", country: "MD", name: "Moldova" },
  { code: "+377", country: "MC", name: "Monaco" },
  { code: "+976", country: "MN", name: "Mongolia" },
  { code: "+382", country: "ME", name: "Montenegro" },
  { code: "+212", country: "MA", name: "Morocco" },
  { code: "+258", country: "MZ", name: "Mozambique" },
  { code: "+95", country: "MM", name: "Myanmar" },
  { code: "+264", country: "NA", name: "Namibia" },
  { code: "+674", country: "NR", name: "Nauru" },
  { code: "+977", country: "NP", name: "Nepal" },
  { code: "+31", country: "NL", name: "Netherlands" },
  { code: "+64", country: "NZ", name: "New Zealand" },
  { code: "+505", country: "NI", name: "Nicaragua" },
  { code: "+227", country: "NE", name: "Niger" },
  { code: "+234", country: "NG", name: "Nigeria" },
  { code: "+850", country: "KP", name: "North Korea" },
  { code: "+389", country: "MK", name: "North Macedonia" },
  { code: "+47", country: "NO", name: "Norway" },
  { code: "+968", country: "OM", name: "Oman" },
  { code: "+92", country: "PK", name: "Pakistan" },
  { code: "+680", country: "PW", name: "Palau" },
  { code: "+970", country: "PS", name: "Palestine" },
  { code: "+507", country: "PA", name: "Panama" },
  { code: "+675", country: "PG", name: "Papua New Guinea" },
  { code: "+595", country: "PY", name: "Paraguay" },
  { code: "+51", country: "PE", name: "Peru" },
  { code: "+63", country: "PH", name: "Philippines" },
  { code: "+48", country: "PL", name: "Poland" },
  { code: "+351", country: "PT", name: "Portugal" },
  { code: "+974", country: "QA", name: "Qatar" },
  { code: "+40", country: "RO", name: "Romania" },
  { code: "+7", country: "RU", name: "Russia" },
  { code: "+250", country: "RW", name: "Rwanda" },
  { code: "+1869", country: "KN", name: "Saint Kitts and Nevis" },
  { code: "+1758", country: "LC", name: "Saint Lucia" },
  { code: "+1784", country: "VC", name: "Saint Vincent and the Grenadines" },
  { code: "+685", country: "WS", name: "Samoa" },
  { code: "+378", country: "SM", name: "San Marino" },
  { code: "+239", country: "ST", name: "Sao Tome and Principe" },
  { code: "+966", country: "SA", name: "Saudi Arabia" },
  { code: "+221", country: "SN", name: "Senegal" },
  { code: "+381", country: "RS", name: "Serbia" },
  { code: "+248", country: "SC", name: "Seychelles" },
  { code: "+232", country: "SL", name: "Sierra Leone" },
  { code: "+65", country: "SG", name: "Singapore" },
  { code: "+421", country: "SK", name: "Slovakia" },
  { code: "+386", country: "SI", name: "Slovenia" },
  { code: "+677", country: "SB", name: "Solomon Islands" },
  { code: "+252", country: "SO", name: "Somalia" },
  { code: "+27", country: "ZA", name: "South Africa" },
  { code: "+82", country: "KR", name: "South Korea" },
  { code: "+211", country: "SS", name: "South Sudan" },
  { code: "+34", country: "ES", name: "Spain" },
  { code: "+94", country: "LK", name: "Sri Lanka" },
  { code: "+249", country: "SD", name: "Sudan" },
  { code: "+597", country: "SR", name: "Suriname" },
  { code: "+46", country: "SE", name: "Sweden" },
  { code: "+41", country: "CH", name: "Switzerland" },
  { code: "+963", country: "SY", name: "Syria" },
  { code: "+886", country: "TW", name: "Taiwan" },
  { code: "+992", country: "TJ", name: "Tajikistan" },
  { code: "+255", country: "TZ", name: "Tanzania" },
  { code: "+66", country: "TH", name: "Thailand" },
  { code: "+670", country: "TL", name: "Timor-Leste" },
  { code: "+228", country: "TG", name: "Togo" },
  { code: "+676", country: "TO", name: "Tonga" },
  { code: "+1868", country: "TT", name: "Trinidad and Tobago" },
  { code: "+216", country: "TN", name: "Tunisia" },
  { code: "+90", country: "TR", name: "Turkey" },
  { code: "+993", country: "TM", name: "Turkmenistan" },
  { code: "+688", country: "TV", name: "Tuvalu" },
  { code: "+256", country: "UG", name: "Uganda" },
  { code: "+380", country: "UA", name: "Ukraine" },
  { code: "+971", country: "AE", name: "United Arab Emirates" },
  { code: "+598", country: "UY", name: "Uruguay" },
  { code: "+998", country: "UZ", name: "Uzbekistan" },
  { code: "+678", country: "VU", name: "Vanuatu" },
  { code: "+379", country: "VA", name: "Vatican City" },
  { code: "+58", country: "VE", name: "Venezuela" },
  { code: "+84", country: "VN", name: "Vietnam" },
  { code: "+967", country: "YE", name: "Yemen" },
  { code: "+260", country: "ZM", name: "Zambia" },
  { code: "+263", country: "ZW", name: "Zimbabwe" },
]

interface InitialFormProps {
  onSubmit: (data: {
    email: string
    firstName: string
    lastName: string
    phone: string
    countryCode: string
  }) => void
}

export function InitialForm({ onSubmit }: InitialFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  })
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [touched, setTouched] = useState({
    email: false,
    firstName: false,
    lastName: false,
    phone: false,
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
        setCountrySearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isValidEmail = formData.email.includes("@") && formData.email.includes(".")
  const isFormComplete =
    formData.email.trim() !== "" &&
    isValidEmail &&
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.phone.trim().length >= 7

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ email: true, firstName: true, lastName: true, phone: true })
    if (!isFormComplete) return
    onSubmit({
      ...formData,
      phone: `${countryCode.code}${formData.phone}`,
      countryCode: countryCode.country,
    })
  }

  return (
    <div className="rounded-lg border border-[#e91e8c]/30 bg-[#0f1029] p-4 sm:p-8 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onBlur={() => setTouched({ ...touched, email: true })}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.email && (!formData.email.trim() || !isValidEmail) ? "border-red-500" : "border-gray-600"
            }`}
          />
          {touched.email && !formData.email.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Email is required</p>
          )}
          {touched.email && formData.email.trim() && !isValidEmail && (
            <p className="text-red-400 text-xs mt-1 ml-1">Please enter a valid email</p>
          )}
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onBlur={() => setTouched({ ...touched, firstName: true })}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.firstName && !formData.firstName.trim() ? "border-red-500" : "border-gray-600"
            }`}
          />
          {touched.firstName && !formData.firstName.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">First name is required</p>
          )}
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onBlur={() => setTouched({ ...touched, lastName: true })}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={`w-full bg-transparent border rounded-lg py-4 pl-12 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 ${
              touched.lastName && !formData.lastName.trim() ? "border-red-500" : "border-gray-600"
            }`}
          />
          {touched.lastName && !formData.lastName.trim() && (
            <p className="text-red-400 text-xs mt-1 ml-1">Last name is required</p>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <div className={`flex border rounded-lg overflow-hidden ${
            touched.phone && formData.phone.trim().length < 7 ? "border-red-500" : "border-gray-600"
          }`}>
            {/* Country code dropdown */}
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="flex items-center gap-1.5 px-3 py-4 border-r border-gray-600 hover:bg-white/5 transition-colors"
            >
              <span className="text-gray-300 text-sm font-medium">{countryCode.name}</span>
              <span className="text-gray-300 text-sm">{countryCode.code}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onBlur={() => setTouched({ ...touched, phone: true })}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setFormData({ ...formData, phone: value })
                }}
                className="w-full bg-transparent py-4 pl-10 pr-4 text-gray-300 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Country code dropdown menu */}
          {showCountryDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-[#1a2744] border border-gray-600 rounded-lg shadow-lg overflow-hidden">
              <div className="p-2 border-b border-gray-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search country..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full bg-[#0f1629] border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400"
                  autoFocus
                />
              </div>
              <div ref={listRef} className="max-h-52 overflow-y-auto custom-scrollbar">
                {COUNTRY_CODES.filter((cc) =>
                  cc.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                  cc.code.includes(countrySearch) ||
                  cc.country.toLowerCase().includes(countrySearch.toLowerCase())
                ).map((cc) => (
                  <button
                    key={`${cc.country}-${cc.code}`}
                    type="button"
                    onClick={() => {
                      setCountryCode(cc)
                      setShowCountryDropdown(false)
                      setCountrySearch("")
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                      cc.country === countryCode.country && cc.code === countryCode.code
                        ? "bg-white/5 text-white"
                        : "text-gray-300"
                    }`}
                  >
                    <span className="text-sm font-medium">{cc.name}</span>
                    <span className="text-sm text-gray-400">{cc.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {touched.phone && formData.phone.trim().length < 7 && (
            <p className="text-red-400 text-xs mt-1 ml-1">Please enter a valid phone number</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormComplete}
          className={`w-full mt-6 font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            isFormComplete
              ? "bg-[#e91e8c] hover:bg-[#d11a7d] text-white cursor-pointer shadow-lg shadow-[#e91e8c]/20"
              : "bg-gray-700/50 text-gray-500 cursor-not-allowed opacity-60"
          }`}
        >
          Continue
          <span className="text-xl">{"→"}</span>
        </button>
      </form>

      <p className="text-gray-500 text-sm text-center mt-6 leading-relaxed">
        By beginning the investment process, you consent to receive communications via email or SMS regarding updates to
        this offer, and may unsubscribe from non-transactional emails at any time.
      </p>
    </div>
  )
}
