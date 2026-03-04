"use client"

import { Plus, Trash2 } from "lucide-react"

interface RepeatableSectionProps<T> {
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number, update: (item: T) => void) => React.ReactNode
  createEmpty: () => T
  addLabel?: string
  removeLabel?: string
  minItems?: number
  maxItems?: number
}

export function RepeatableSection<T>({
  items,
  onChange,
  renderItem,
  createEmpty,
  addLabel = "Add another",
  removeLabel = "Remove",
  minItems = 1,
  maxItems = 10,
}: RepeatableSectionProps<T>) {
  function addItem() {
    if (items.length >= maxItems) return
    onChange([...items, createEmpty()])
  }

  function removeItem(index: number) {
    if (items.length <= minItems) return
    onChange(items.filter((_, i) => i !== index))
  }

  function updateItem(index: number, updated: T) {
    const next = [...items]
    next[index] = updated
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="relative">
          {/* Remove button (only when above minItems) */}
          {items.length > minItems && (
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute -top-2 right-0 flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors z-10"
              title={removeLabel}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{removeLabel}</span>
            </button>
          )}

          {/* Divider between items */}
          {index > 0 && (
            <div className="border-t border-gray-700/50 mb-4" />
          )}

          {renderItem(item, index, (updated) => updateItem(index, updated))}
        </div>
      ))}

      {/* Add button */}
      {items.length < maxItems && (
        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-600 hover:border-gray-400 rounded-lg text-gray-400 hover:text-gray-300 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  )
}
