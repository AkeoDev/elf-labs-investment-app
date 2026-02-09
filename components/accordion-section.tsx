"use client"

import type React from "react"

import { Check, ChevronDown, ChevronUp } from "lucide-react"

interface AccordionSectionProps {
  number: number
  title: string
  isActive: boolean
  isCompleted: boolean
  onToggle: () => void
  children: React.ReactNode
  summary?: React.ReactNode
  isLast?: boolean
}

export function AccordionSection({
  number,
  title,
  isActive,
  isCompleted,
  onToggle,
  children,
  summary,
  isLast = false,
}: AccordionSectionProps) {
  return (
    <div className={`${!isLast ? "border-b border-gray-700" : ""}`}>
      <button onClick={onToggle} className="w-full py-4 flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          {isCompleted ? <Check className="w-5 h-5 text-green-500" /> : <span className="text-white">{number}.</span>}
          <span className={`text-lg ${isCompleted ? "text-green-500" : "text-white"}`}>{title}</span>
        </div>
        {isActive ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {isCompleted && !isActive && summary}

      {isActive && <div className="pb-4">{children}</div>}
    </div>
  )
}
