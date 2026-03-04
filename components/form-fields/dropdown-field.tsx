"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"

interface DropdownFieldProps<T> {
  label?: string
  placeholder: string
  value: string
  options: T[]
  getLabel: (option: T) => string
  getValue: (option: T) => string
  getSecondary?: (option: T) => string
  onChange: (value: string, option: T) => void
  touched?: boolean
  error?: string
  typeahead?: boolean
  maxHeight?: string
}

export function DropdownField<T>({
  label,
  placeholder,
  value,
  options,
  getLabel,
  getValue,
  getSecondary,
  onChange,
  touched,
  error,
  typeahead = false,
  maxHeight = "max-h-52",
}: DropdownFieldProps<T>) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Typeahead: pressing a letter jumps to the first matching option
  useEffect(() => {
    if (!open || !typeahead) return
    function handleKeyDown(e: KeyboardEvent) {
      if (!/^[a-zA-Z]$/.test(e.key)) return
      const letter = e.key.toLowerCase()
      const idx = options.findIndex((o) => getLabel(o).toLowerCase().startsWith(letter))
      if (idx === -1) return
      const buttons = listRef.current?.querySelectorAll("button")
      buttons?.[idx]?.scrollIntoView({ block: "nearest" })
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, typeahead, options, getLabel])

  const hasError = touched && !!error
  const displayLabel = options.find((o) => getValue(o) === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-transparent border rounded-lg py-4 px-4 text-left flex items-center justify-between transition-colors focus:outline-none ${
          hasError
            ? "border-red-500"
            : "border-gray-600 hover:border-gray-400"
        }`}
      >
        {label ? (
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider leading-none mb-0.5">
              {label}
            </span>
            <span className={`text-sm truncate ${value ? "text-gray-300" : "text-gray-500"}`}>
              {displayLabel ? getLabel(displayLabel) : placeholder}
            </span>
          </div>
        ) : (
          <span className={value ? "text-white" : "text-gray-500"}>
            {displayLabel ? getLabel(displayLabel) : placeholder}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2744] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-30">
          <div ref={listRef} className={`${maxHeight} overflow-y-auto custom-scrollbar`}>
            {options.map((o) => {
              const optVal = getValue(o)
              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => {
                    onChange(optVal, o)
                    setOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    optVal === value
                      ? "bg-white/10 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span>{getLabel(o)}</span>
                  {getSecondary && (
                    <span className="text-gray-500 text-xs ml-2">{getSecondary(o)}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasError && (
        <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  )
}
