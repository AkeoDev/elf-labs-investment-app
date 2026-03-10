"use client"

import { Check } from "lucide-react"

const STEPS = [
  { label: "Investment" },
  { label: "Details" },
  { label: "Review" },
]

interface ProgressStepperProps {
  currentStep: number // 1-based
  onStepClick?: (step: number) => void
}

export function ProgressStepper({ currentStep, onStepClick }: ProgressStepperProps) {
  return (
    <div className="py-3 pb-5 w-full">
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const stepNum = index + 1
          const isCompleted = stepNum < currentStep
          const isCurrent = stepNum === currentStep
          const isUpcoming = stepNum > currentStep
          const isClickable = isCompleted && onStepClick

          return (
            <div key={stepNum} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(stepNum)}
                  disabled={!isClickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-sm font-semibold transition-all
                    ${isCompleted
                      ? "bg-[#e91e8c] text-white cursor-pointer hover:bg-[#d11a7d]"
                      : isCurrent
                        ? "border-2 border-[#e91e8c] text-white bg-transparent"
                        : "border-2 border-gray-600 text-gray-500 bg-transparent"
                    }
                    ${!isClickable ? "cursor-default" : ""}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  ) : (
                    stepNum
                  )}
                </button>
                <span
                  className={`text-xs mt-1.5 whitespace-nowrap ${
                    isCurrent ? "text-white font-medium" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line (not after last step) */}
              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 mb-5 transition-colors ${
                    stepNum < currentStep ? "bg-[#e91e8c]" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
