"use client";
import Link from "next/link";
import { LayoutDashboard, ArrowLeft, Timer, Construction } from "lucide-react";

export default function RecruiterDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] flex flex-col items-center justify-center p-6">
      
      {/* 1. Animated Icon Container */}
      <div className="relative mb-8 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 to-gray-200 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white p-8 rounded-full shadow-sm border border-gray-100 ring-1 ring-gray-50">
            <LayoutDashboard size={64} className="text-[#103c7f]" />
            
            {/* Floating Badge */}
            <div className="absolute -top-2 -right-2 bg-orange-50 text-orange-600 border border-orange-100 p-2 rounded-full shadow-sm animate-bounce">
                <Construction size={20} />
            </div>
        </div>
      </div>

      {/* 2. Main Heading */}
      <h1 className="text-4xl font-black text-[#103c7f] uppercase tracking-tight mb-2 text-center">
        Recruiter Dashboard
      </h1>
      
      {/* 3. Subheading */}
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
        <Timer size={14} className="text-orange-500"/> Coming Soon
      </h2>

     

      

      {/* 6. Footer Text */}
      <div className="mt-20 text-xs font-bold text-gray-300 uppercase tracking-widest">
        Maven Jobs CRM v2.0
      </div>

    </div>
  );
}