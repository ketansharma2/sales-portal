"use client";
import { Target } from "lucide-react";

export default function ManagerTargetPage() {
  return (
    <div className="p-6 min-h-screen bg-gray-50/50 font-['Calibri']">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#103c7f] p-2 rounded-lg text-white">
          <Target size={22} />
        </div>
        <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Team Target Distribution</h1>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500 font-bold">Target management page - Content to be added</p>
      </div>
    </div>
  );
}
