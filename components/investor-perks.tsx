"use client"

import { useState } from "react"

export function InvestorPerks() {
  const [activeTab, setActiveTab] = useState<"volume" | "repeat">("volume")

  const volumePerks = [
    { invest: "$2,500 +", receive: "5%", label: "Bonus Shares" },
    { invest: "$10,000 +", receive: "15%", label: "Bonus Shares" },
    { invest: "$5,000 +", receive: "10%", label: "Bonus Shares" },
    { invest: "$25,000 +", receive: "20%", label: "Bonus Shares" },
  ]

  const repeatPerks = [
    { invest: "$2,500 +", receive: "5%", label: "Bonus Shares" },
    { invest: "$5,000 +", receive: "10%", label: "Bonus Shares" },
    { invest: "$10,000 +", receive: "15%", label: "Bonus Shares" },
    { invest: "$25,000 +", receive: "20%", label: "Bonus Shares" },
  ]

  const perks = activeTab === "volume" ? volumePerks : repeatPerks

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-sm bg-[#e91e8c]" />
        <h3 className="text-white font-semibold">Investor Perks</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("volume")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "volume" ? "bg-[#0D1425] text-white" : "bg-transparent text-gray-400 hover:text-white"
          }`}
        >
          Volume Based
        </button>
        <button
          onClick={() => setActiveTab("repeat")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "repeat" ? "bg-[#0D1425] text-white" : "bg-transparent text-gray-400 hover:text-white"
          }`}
        >
          Repeat Investor
        </button>
      </div>

      {/* Perks Grid */}
      <div className="grid grid-cols-2 gap-3">
        {perks.map((perk, index) => (
          <div key={index} className="bg-[#0D1425] rounded-lg p-4">
            <p className="text-gray-400 text-xs mb-1">Invest</p>
            <p className="text-white font-semibold text-sm">{perk.invest}</p>
            <p className="text-gray-400 text-xs mt-3 mb-1">Receive</p>
            <p className="text-white font-bold text-2xl">{perk.receive}</p>
            <p className="text-gray-400 text-xs">{perk.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
