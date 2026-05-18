"use client";
import React, { useState, useMemo } from "react";
import { 
  Printer, TrendingUp, AlertTriangle, Layers, Activity, 
  Building2, Users, CheckCircle, Briefcase, Clock, FileText 
} from "lucide-react";

export default function OperationsReport() {
  // --- SECTOR FILTER STATE ---
  const [activeTab, setActiveTab] = useState("All"); // "All" | "Corporate" | "Domestic" | "Tech"

  // Raw static operational numbers for quick top summary processing
  const totals = useMemo(() => {
    return {
      totalRequirements: 189 + 52,
      totalCtc: 685.44 + 227.42,
      totalCvParsed: 1285 + 685,
      totalInterviews: 5 + 3,
      openJobPosts: 62,
      pendingProjects: 0
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 font-['Cambria',sans-serif]">
      
      {/* ========================================================= */}
      {/* UNIFIED HEADER (Visible on Screen AND Print)               */}
      {/* ========================================================= */}
      <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto border-b-2 border-[#103c7f] pb-4">
        <div className="flex items-center gap-4">
          <img src="/maven-logo.png" alt="Maven Logo" className="h-10 md:h-12 w-auto object-contain" />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#103c7f] uppercase tracking-tight">Operations Report</h1>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">Master Executive Tracker</p>
          </div>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="bg-[#103c7f] hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all print:hidden"
        >
          <Printer size={14} /> Print Report
        </button>
      </div>

      {/* ========================================================= */}
      {/* TIER 1: EXECUTIVE SCREEN DASHBOARD (Hidden on Print)     */}
      {/* ========================================================= */}
      <div className="print:hidden max-w-7xl mx-auto space-y-6 mb-6">
        
        {/* INTERACTIVE CONTROLS / SECTOR TOGGLES */}
        <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm flex-wrap gap-2">
          <div className="flex gap-1.5">
            {["All", "Corporate", "Domestic", "Tech"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab 
                    ? "bg-[#103c7f] text-white shadow-sm" 
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {tab === "All" ? "Complete View" : `${tab} Section`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 text-[11px] font-bold uppercase tracking-wide">
            <AlertTriangle size={12}/> System Warning: 3,333 Domestic Duplicates Detected
          </div>
        </div>

        {/* HIGH-IMPACT METRICS PERFORMANCE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Sales Revenue Volume */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={20}/></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pipeline Volume</p>
              <h3 className="text-xl font-black text-gray-800">₹ {totals.totalCtc.toFixed(2)} Lakh</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase">{totals.totalRequirements} Active Open Requirements mapped</p>
            </div>
          </div>

          {/* Card 2: Operations Funnel At-A-Glance */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Layers size={20}/></div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversion Funnel Velocity</p>
              <div className="flex items-center gap-2 text-xs font-black text-gray-700 pt-0.5">
                <span title="CV Parsed">{totals.totalCvParsed} Parse</span> ➔ 
                <span title="Interviews" className="text-indigo-600">{totals.totalInterviews} Intv</span> ➔ 
                <span title="Joinings" className="text-red-500">0 Join</span>
              </div>
              <p className="text-[10px] text-amber-600 font-bold uppercase">Severe drop-off identified post-interview</p>
            </div>
          </div>

          {/* Card 3: Technical Constraints & Support */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Activity size={20}/></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Internal Tech Health</p>
              <h3 className="text-xl font-black text-gray-800">{totals.openJobPosts} Active Job Posts</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase">100+ Legacy Data Management sheets require cleanup</p>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* TIER 2: MASTER SPREADSHEET (Responsive / Print Master)     */}
      {/* ========================================================= */}
      <div className="max-w-7xl mx-auto print:max-w-full print:w-full bg-white shadow-xl print:shadow-none overflow-x-auto print:overflow-visible print:mx-0 rounded-xl border border-gray-200 print:border-none">
        
        <table className="w-full text-center border-collapse border border-gray-400 text-xs md:text-sm print:text-[10px]">
          <tbody className="divide-y divide-gray-400">
            
            {/* ======================= SALES SECTION ======================= */}
            {(activeTab === "All" || activeTab === "Corporate" || activeTab === "Domestic") && (
              <>
                <tr>
                  <td rowSpan={8} className="vertical-title border border-gray-400 font-bold bg-[#e2efda] text-gray-800 text-sm md:text-base w-8 print:w-6" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Sales</td>              
                  {/* --- Corporate --- */}
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#38761d] text-white p-1">Corporate</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Leads</td>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Leads</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Pipeline Clients</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Onboard</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Requirement Profiles</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Total Requirement</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Total CTC Generated</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">1347</td>
                  <td className="border border-gray-400 font-semibold p-1">28</td>
                  <td className="border border-gray-400 font-semibold p-1">21</td>
                  <td className="border border-gray-400 font-semibold p-1">17</td>
                  <td className="border border-gray-400 font-bold p-1">189</td>
                  <td className="border border-gray-400 font-bold p-1">685.44 lakh</td>
                </tr>
                
                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Franchise</td>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Franchise discussed</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Form ask</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Franchise Form Shared</th>
                  <th className="border border-gray-400 font-bold bg-[#e2efda] p-1 text-[#38761d]">Franchise Acceptance</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">129</td>
                  <td className="border border-gray-400 font-semibold p-1">37</td>
                  <td className="border border-gray-400 font-semibold p-1">37</td>
                  <td className="border border-gray-400 font-semibold p-1">2</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- Domestic --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#0b5394] text-white p-1">Domestic</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Leads</td>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Leads</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Pipeline Clients</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Onboard</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Requirement Profiles</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Total Requirement</th>
                  <th className="border border-gray-400 font-bold bg-[#cfe2f3] p-1 text-[#0b5394]">Total CTC Generated</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">3333- having duplicates</td>
                  <td className="border border-gray-400 font-semibold p-1">Not updated</td>
                  <td className="border border-gray-400 font-semibold p-1">146 + missing</td>
                  <td className="border border-gray-400 font-semibold p-1">172</td>
                  <td className="border border-gray-400 font-semibold p-1">52 - missing data</td>
                  <td className="border border-gray-400 font-bold p-1">227.42 lakh</td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">Job Post</td>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Total Job Post</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Open</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Paused</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">Flagged</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">CV by JOB Post</th>
                  <th className="border border-gray-400 font-bold bg-[#a2c4c9] p-1 text-gray-800">CV Calling</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">178</td>
                  <td className="border border-gray-400 font-semibold p-1">62</td>
                  <td className="border border-gray-400 font-semibold p-1">96</td>
                  <td className="border border-gray-400 font-semibold p-1">9</td>
                  <td className="border border-gray-400 font-semibold p-1">779</td>
                  <td className="border border-gray-400 font-semibold p-1">734</td>
                </tr>
              </>
            )}

            {/* ======================= DELIVERY SECTION ======================= */}
            {(activeTab === "All" || activeTab === "Corporate" || activeTab === "Domestic") && (
              <>
                <tr>
                  <td rowSpan={8} className="vertical-title border border-gray-400 font-bold bg-[#cfe2f3] text-gray-800 text-sm md:text-base w-8 print:w-6" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Delivery</td>              
                  {/* --- Corporate --- */}
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#38761d] text-white p-1">Corporate</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">RC</td>
                  <th className="border border-gray-400 font-bold bg-[#d9d2e9] p-1 text-[#351c75]">CV Parse</th>
                  <th className="border border-gray-400 font-bold bg-[#d9d2e9] p-1 text-[#351c75]">Tracker Share by RC</th>
                  <th className="border border-gray-400 font-bold bg-[#d9d2e9] p-1 text-[#351c75]">Tracker Share by TL</th>
                  <th className="border border-gray-400 font-bold bg-[#b4a7d6] p-1 text-[#351c75]">Tracker Share BY CRM</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">1285</td>
                  <td className="border border-gray-400 font-semibold p-1">-</td>
                  <td className="border border-gray-400 font-semibold p-1">-</td>
                  <td className="border border-gray-400 font-bold p-1">60</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">CRM</td>
                  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Interview</th>
                  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Joining</th>
                  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Recovery by</th>
                  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Total Amt</th>
                  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Received</th>
                  <th className="border border-gray-400 font-bold bg-[#ead1dc] p-1 text-[#741b47]">Pending</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">5</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                </tr>

                {/* --- Domestic --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#0b5394] text-white p-1">Domestic</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">RC</td>
                  <th className="border border-gray-400 font-bold bg-[#fff2cc] p-1 text-[#b45f06]">CV Parse</th>
                  <th className="border border-gray-400 font-bold bg-[#fff2cc] p-1 text-[#b45f06]">Tracker Share by RC</th>
                  <th className="border border-gray-400 font-bold bg-[#fff2cc] p-1 text-[#b45f06]">Tracker Share by TL</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Tracker Share by CRM</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">685</td>
                  <td className="border border-gray-400 font-semibold p-1">4</td>
                  <td className="border border-gray-400 font-semibold p-1">1</td>
                  <td className="border border-gray-400 font-bold p-1">14</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1">CRM</td>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Interview</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Joining</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Recovery by</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Total Amt</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Received</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Pending</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">3</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                  <td className="border border-gray-400 font-semibold p-1">In Progress</td>
                </tr>
              </>
            )}

            {/* ======================= TECH SECTION ======================= */}
            {(activeTab === "All" || activeTab === "Tech") && (
              <>
                <tr>
                  <td rowSpan={22} className="vertical-title border border-gray-400 font-bold bg-[#d9d2e9] text-gray-800 text-sm md:text-base w-8 print:w-6" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Tech</td>
                  
                  {/* --- Data Mgmt --- */}
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-[#a61c00] text-white p-1">Data Mgmt</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white text-[#cc0000] p-1">Tech</td>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Sheets</th>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Mail ID</th>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Tools</th>
                  <th className="border border-gray-400 font-bold bg-[#f4cccc] p-1 text-[#a61c00]">Data Cleanup</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">Not able to count -</td>
                  <td className="border border-gray-400 font-semibold p-1">65</td>
                  <td className="border border-gray-400 font-semibold p-1">Need to sort</td>
                  <td className="border border-gray-400 font-semibold p-1">100+ Sheets , files</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- Monitor --- */}
                <tr>
                  <td rowSpan={12} className="border border-gray-400 font-bold bg-[#a64d79] text-white p-1">Monitor</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Scanner</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Application</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Company</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">User</th>
                  <td colSpan={3} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">Not able to count due to dummy data</td>
                  <td className="border border-gray-400 font-semibold p-1">Not able to count due to dummy data</td>
                  <td className="border border-gray-400 font-semibold p-1">1</td>
                  <td colSpan={3} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Searchbar</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">CV uploaded</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">View</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Cv Download</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">User</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">48667</td>
                  <td className="border border-gray-400 font-semibold p-1">Saloni , Nikita</td>
                  <td className="border border-gray-400 font-semibold p-1">49 (only saloni)</td>
                  <td className="border border-gray-400 font-semibold p-1">10 RC , 1 Admin</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">WPR</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Total User</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Fill</th>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">29 ID</td>
                  <td className="border border-gray-400 font-semibold p-1">Most - 13</td>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Cafe App</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Orders</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Completed</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Rejected</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Menu Items</th>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">User</th>
                  <td colSpan={1} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">44</td>
                  <td className="border border-gray-400 font-semibold p-1">44</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td className="border border-gray-400 font-semibold p-1">47</td>
                  <td className="border border-gray-400 font-semibold p-1">27</td>
                  <td colSpan={1} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Sales</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Total User</th>
                  <td colSpan={5} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">18</td>
                  <td colSpan={5} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Delivery</td>
                  <th className="border border-gray-400 font-bold bg-[#d5a6bd] p-1 text-[#741b47]">Total User</th>
                  <td colSpan={5} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">18</td>
                  <td colSpan={5} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- Development --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#134f5c] text-white p-1">Development</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">In - House</td>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Total Project</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Done</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">In Progress</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Pending</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">2</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td className="border border-gray-400 font-semibold p-1">2</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Out - Source</td>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Total Project</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Done</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">In Progress</th>
                  <th className="border border-gray-400 font-bold bg-[#d0e0e3] p-1 text-[#0c343d]">Pending</th>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">2</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td className="border border-gray-400 font-semibold p-1">2</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td colSpan={2} className="border border-gray-400 bg-gray-50"></td>
                </tr>

                {/* --- DM --- */}
                <tr>
                  <td rowSpan={4} className="border border-gray-400 font-bold bg-[#e69138] text-white p-1">DM</td>
                  
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">In - House</td>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Company</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Platforms</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Pages</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Post Design</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Post Publish</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Linkedin Connection</th>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">3</td>
                  <td className="border border-gray-400 font-semibold p-1">6</td>
                  <td className="border border-gray-400 font-semibold p-1">22</td>
                  <td className="border border-gray-400 font-semibold p-1">197 + 16</td>
                  <td className="border border-gray-400 font-semibold p-1">191 + 5</td>
                  <td className="border border-gray-400 font-semibold p-1 leading-tight">
                    Bhavishya - 1121<br/>
                    Ketan - 3559
                  </td>
                </tr>

                <tr>
                  <td rowSpan={2} className="border border-gray-400 font-bold bg-white p-1 text-gray-800">Out - Source</td>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Post Publish</th>
                  <th className="border border-gray-400 font-bold bg-[#fce5cd] p-1 text-[#b45f06]">Leads Gen.</th>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>
                <tr>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td className="border border-gray-400 font-semibold p-1">0</td>
                  <td colSpan={4} className="border border-gray-400 bg-gray-50"></td>
                </tr>
              </>
            )}

          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* NUCLEAR PRINT CSS - STRETCHES TO FILL A4 PORTRAIT SHEET    */}
      {/* ========================================================= */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 2mm 2mm 2mm 2mm; /* Top, Right, Bottom, LEFT (Extra room left) */
          }
          
          /* FORCE BACKGROUND COLORS */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* RESET WRAPPERS TO AVOID OVERFLOW/SCROLL CUT-OFFS */
          html, body, #__next, main, .min-h-screen {
            background-color: white !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            width: 100% !important;
          }

          div {
            overflow: visible !important;
            max-height: none !important;
          }

          .overflow-x-auto, .overflow-y-auto, .custom-scrollbar {
            overflow: visible !important;
            display: block !important;
          }

          /* CRITICAL: HIDES SCREEN TABS AND KPIS TO PROTECT ONE PAGE SPACE */
          .print\\:hidden { display: none !important; }

          /* VERTICAL EXTENSION MASTER MATH: Fits both Table + Header on one page */
          table {
            width: 100% !important;
            max-width: 100% !important;
            height: 84vh !important; 
            border-collapse: collapse !important;
            table-layout: auto !important; 
          }

          th, td {
            border: 1px solid #4b5563 !important; 
            padding: 4px !important; 
            font-size: 11px !important; 
            word-wrap: break-word !important;
          }
          
          .vertical-title {
            font-size: 16px !important; 
            width: 35px !important;
            padding: 2px !important;
          }

          .print\\:rotate-0 {
            writing-mode: horizontal-tb !important;
            transform: none !important;
          }
          
          ::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}