export function AdditionalInfo() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-[#e91e8c]" />
        <h3 className="text-white font-semibold">Additional Information</h3>
      </div>

      <div className="bg-[#1a2744] rounded-lg p-4 space-y-4 text-sm">
        <p className="text-gray-300">
          Please note that while <span className="text-[#e91e8c]">bonus share shares won't be visible at checkout</span>
          , they will be added to your account after your purchase.
        </p>
        <p className="text-gray-400 text-xs leading-relaxed">
          I consent to receiving reports, promotional emails and other commercial electronic messages from Elf Labs or
          from other service providers on behalf of Elf Labs.
        </p>
      </div>
    </div>
  )
}
