"use client"

import type { LucideIcon } from "lucide-react"

interface TextFieldProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  touched?: boolean
  onBlur?: () => void
  error?: string
  icon?: LucideIcon
  autoComplete?: string
  inputMode?: "text" | "numeric" | "tel" | "email"
  maxLength?: number
  type?: string
}

export function TextField({
  placeholder,
  value,
  onChange,
  touched,
  onBlur,
  error,
  icon: Icon,
  autoComplete,
  inputMode,
  maxLength,
  type = "text",
}: TextFieldProps) {
  const hasError = touched && !!error

  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent border rounded-lg py-4 ${
          Icon ? "pl-12" : "pl-4"
        } pr-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors ${
          hasError ? "border-red-500" : "border-gray-600"
        }`}
      />
      {hasError && (
        <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  )
}
