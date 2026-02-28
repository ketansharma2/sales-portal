"use client";
import { useState } from "react";
import Link from "next/link";
import { 
  Users, Briefcase, FileText, CheckCircle, 
  Phone, Mail, Calendar, TrendingUp, 
  Share2, UserCheck, Award, MessageSquare,
  Clock, ArrowUpRight, Filter, Search
} from "lucide-react";

export default function CRMDashboard() {

  // --- STATE FOR DATE FILTER ---
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0], // Default Today
    to: new Date().toISOString().split('T')[0]    // Default Today
  });

  // --- MOCK DATA: ROW 1 (LIFETIME TOTALS - Always Visible) ---
  const totalStats = [
    { label: "Total Clients", value: "142", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Reqs", value: "320", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Package", value: "₹4.2Cr", icon: Award, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Trackers Shared", value: "850", icon: Share2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Interviews", value: "410", icon: Phone, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Total Selected", value: "120", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Joined", value: "98", icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  // --- MOCK DATA: ROW 2 (FILTERED ACTIVITY) ---
  // This data represents metrics ONLY for the Selected Date Range
  const filteredStats = [
    { label: "Acknowledged", value: "12", icon: Mail },
    { label: "Calls Made", value: "45", icon: Phone },
    { label: "Reqs Worked", value: "8", icon: Briefcase },
    { label: "Trackers Shared", value: "24", icon: Share2 },
    { label: "Interviews", value: "9", icon: Users },
    { label: "Selected", value: "3", icon: CheckCircle },
    { label: "Joined", value: "1", icon: UserCheck },
  ];

  // --- MOCK DATA: ROW 3 (TABLE DATA) ---
  const tableData = [
    { id: 1, client: "Nexus Retail", reqs: "Senior Analyst (2)", shared: 12, interview: 4, selected: 1, joined: 0 },
    { id: 2, client: "Urban Clap", reqs: "Java Dev (5)", shared: 25, interview: 8, selected: 2, joined: 1 },
    { id: 3, client: "TechSys Sol", reqs: "DevOps Eng (1)", shared: 5, interview: 2, selected: 0, joined: 0 },
    { id: 4, client: "Green Agro", reqs: "Sales Mgr (2)", shared: 10, interview: 3, selected: 1, joined: 1 },
    { id: 5, client: "Alpha Corp", reqs: "HR BP (1)", shared: 8, interview: 1, selected: 0, joined: 0 },
    { id: 6, client: "Blue Star", reqs: "React Native (3)", shared: 18, interview: 6, selected: 2, joined: 0 },
    { id: 7, client: "FinEdge", reqs: "Accountant (2)", shared: 4, interview: 1, selected: 0, joined: 0 },
    { id: 8, client: "Rapid Logistics", reqs: "Ops Manager (1)", shared: 6, interview: 2, selected: 1, joined: 0 },
  ];

  // --- MOCK DATA: RIGHT SIDEBAR ---
  const followUpList = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    company: i % 2 === 0 ? `Nexus Retail Group ${i+1}` : `Tech Solutions ${i+1}`,
    contact: i % 2 === 0 ? "Mr. Vikram Singh" : "Ms. Priya Sharma",
    lastConvo: i % 2 === 0 ? "Asked for new JD profiles." : "Discussed commercial terms.",
    time: `${9 + (i % 8)}:30 ${i < 4 ? 'AM' : 'PM'}`,
    type: i % 3 === 0 ? "Call" : "Email"
  }));

  return (
    <div className="flex h-screen bg-[#f8fafc] font-['Calibri'] text-slate-800 overflow-hidden">
      
      {/* ================= LEFT SECTION (MAIN DASHBOARD - 75% Width) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200">
        
        {/* HEADER WITH DATE FILTERS */}
        <div className="bg-[#103c7f] px-6 py-4 border-b border-[#0d316a] shadow-sm flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">
              CRM Analytics
            </h1>
            <p className="text-xs font-bold text-blue-200 mt-1">Performance Overview</p>
          </div>

          {/* DATE FILTER CONTROLS */}
          <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-lg border border-white/10">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-200 uppercase px-2">From</span>
                <input 
                  type="date" 
                  value={dateRange.from}
                  onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  className="bg-[#0d316a] text-white text-xs font-bold px-2 py-1.5 rounded border border-blue-800 outline-none focus:border-blue-400"
                />
             </div>
             <div className="w-px h-6 bg-blue-800"></div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-200 uppercase px-2">To</span>
                <input 
                  type="date" 
                  value={dateRange.to}
                  onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  className="bg-[#0d316a] text-white text-xs font-bold px-2 py-1.5 rounded border border-blue-800 outline-none focus:border-blue-400"
                />
             </div>
             <button className="bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded ml-2 transition-colors">
                Apply
             </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-6 bg-slate-50">
          
          {/* --- ROW 1: DATABASE OVERVIEW (LIFETIME) --- */}
          <div className="shrink-0">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={14}/> Database Overview (Lifetime)
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {totalStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-all">
                  <div className={`p-1.5 rounded-full ${stat.bg} mb-1.5`}>
                    <stat.icon size={14} className={stat.color} />
                  </div>
                  <h4 className="text-lg font-black text-slate-700 leading-none">{stat.value}</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROW 2: FILTERED ACTIVITY REPORT (MERGED MONTHLY/DAILY) --- */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14}/> Activity Report
                </h3>
                <span className="text-[10px] font-bold text-[#103c7f] bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                    {dateRange.from} <span className="mx-1 text-gray-400">to</span> {dateRange.to}
                </span>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {filteredStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-[#103c7f] transition-all cursor-default">
                   {/* Top Accent Line */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-[#103c7f]"></div>
                   
                   <div className="mb-1 text-blue-300 group-hover:text-[#103c7f] transition-colors">
                      <stat.icon size={14} />
                   </div>
                   <h4 className="text-xl font-black text-[#103c7f] leading-none mt-1">{stat.value}</h4>
                   <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROW 3: DETAILED TABLE --- */}
          <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14}/> Client Data ({dateRange.from} - {dateRange.to})
              </h3>
              
            </div>
            
            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse relative">
                  <thead className="bg-white text-[10px] font-black text-gray-500 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 bg-gray-50/95 backdrop-blur">Client Name</th>
                      <th className="px-4 py-3 bg-gray-50/95 backdrop-blur">Requirements</th>
                      <th className="px-4 py-3 text-center bg-gray-50/95 backdrop-blur">Tracker Share</th>
                      <th className="px-4 py-3 text-center bg-gray-50/95 backdrop-blur">Interview</th>
                      <th className="px-4 py-3 text-center bg-gray-50/95 backdrop-blur">Selected</th>
                      <th className="px-4 py-3 text-center bg-gray-50/95 backdrop-blur">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                    {tableData.map((row) => (
                      <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-[#103c7f]">{row.client}</td>
                        <td className="px-4 py-3">{row.reqs}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold">{row.shared}</span>
                        </td>
                        <td className="px-4 py-3 text-center">{row.interview}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-bold">{row.selected}</td>
                        <td className="px-4 py-3 text-center text-teal-600 font-bold">{row.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>

        </div>
      </div>

      {/* ================= RIGHT SECTION (FOLLOW-UPS SIDEBAR - 25% Width) ================= */}
      <div className="bg-white flex flex-col h-full shadow-xl z-10 w-72 shrink-0 border-l border-gray-200">
        
        {/* HEADER */}
        <div className="bg-white px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 h-[76px]">
          <div>
            <h2 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} /> Follow-ups
            </h2>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">For Selected Range</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
            {followUpList.length} Pending
          </span>
        </div>

        {/* SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-gray-50/50">
          {followUpList.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
              
              <div className="mb-2">
                <h4 className="text-xs font-black text-gray-800 group-hover:text-[#103c7f] transition-colors line-clamp-1 leading-tight">
                  {item.company}
                </h4>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-gray-600 truncate">{item.contact}</span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                  <MessageSquare size={10} className="text-gray-300"/> Last Discussion
                </p>
                <p className="text-[10px] text-gray-600 font-medium italic line-clamp-3 leading-relaxed">
                  "{item.lastConvo}"
                </p>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}