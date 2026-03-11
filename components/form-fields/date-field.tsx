"use client"

import { Calendar } from "lucide-react"

interface DateFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  touched?: boolean
  onBlur?: () => void
  required?: boolean
  requiredError?: string
  incompleteError?: string
  minAge?: number
}

function getAgeError(value: string, minAge?: number): string | null {
  if (!minAge || value.length < 10) return null
  const [mm, dd, yyyy] = value.split("/")
  const dob = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  const age = today.getFullYear() - dob.getFullYear() -
    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
  return age < minAge ? `You must be at least ${minAge} years old to invest` : null
}

export function DateField({
  value,
  onChange,
  placeholder = "Date of Birth (MM/DD/YYYY)",
  touched,
  onBlur,
  required = true,
  requiredError = "Date is required",
  incompleteError = "Enter a complete date (MM/DD/YYYY)",
  minAge,
}: DateFieldProps) {
  const hasError = touched && required && !value
  const isIncomplete = touched && value.length > 0 && value.length < 10
  const ageError = touched ? getAgeError(value, minAge) : null

  return (
    <div className="relative">
      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        autoComplete="bday"
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            const input = e.target as HTMLInputElement
            const pos = input.selectionStart ?? 0
            if (pos > 0 && value[pos - 1] === "/") {
              e.preventDefault()
              onChange(value.slice(0, pos - 2))
            }
          }
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 8)

          // Clamp only when both digits of a segment are present
          let mm = digits.slice(0, 2)
          if (mm.length === 2) {
            const m = parseInt(mm, 10)
            if (m < 1) mm = "01"
            else if (m > 12) mm = "12"
          }

          let dd = digits.slice(2, 4)
          if (dd.length === 2) {
            const month = parseInt(mm, 10) || 1
            const year = digits.length >= 8 ? parseInt(digits.slice(4, 8), 10) : 2000
            const maxDay = new Date(year, month, 0).getDate()
            const d = parseInt(dd, 10)
            if (d < 1) dd = "01"
            else if (d > maxDay) dd = String(maxDay)
          }

          const yyyy = digits.slice(4, 8)

          // Reassemble with slashes
          let result = mm
          if (mm.length === 2 && digits.length > 2) result += "/" + dd
          if (dd.length === 2 && digits.length > 4) result += "/" + yyyy

          onChange(result)
        }}
        maxLength={10}
        className={`w-full bg-[#0E031EBF] border rounded-lg py-4 pl-12 pr-4 text-[#F8F8F8] placeholder-[#F8F8F899] focus:outline-none focus:border-gray-400 transition-colors ${
          hasError || isIncomplete || ageError ? "border-red-500" : "border-[#F6248833]"
        }`}
      />
      {hasError && (
        <p className="text-red-400 text-xs mt-1 ml-1">{requiredError}</p>
      )}
      {isIncomplete && (
        <p className="text-red-400 text-xs mt-1 ml-1">{incompleteError}</p>
      )}
      {ageError && (
        <p className="text-red-400 text-xs mt-1 ml-1">{ageError}</p>
      )}
    </div>
  )
}
