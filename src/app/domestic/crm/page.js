"use client";
import Link from "next/link";
import { 
  Users, Briefcase, FileText, CheckCircle, 
  Phone, Mail, Calendar, TrendingUp, 
  Share2, UserCheck, Award, MessageSquare,
  Clock, ArrowUpRight
} from "lucide-react";

export default function CRMDashboard() {

  // --- MOCK DATA: ROW 1 (LIFETIME TOTALS) ---
  const totalStats = [
    { label: "Total Clients", value: "142", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Reqs", value: "320", icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Package", value: "₹4.2Cr", icon: Award, color: "text-orange-600", bg: "bg-orange-50" }, // Est. Value
    { label: "Trackers Shared", value: "850", icon: Share2, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Interviews", value: "410", icon: Phone, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Total Selected", value: "120", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Joined", value: "98", icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  // --- MOCK DATA: ROW 2 (TODAY / LATEST ACTIVITY) ---
  const dailyStats = [
    { label: "Acknowledged", value: "5", sub: "Today" },
    { label: "Latest Calls", value: "12", sub: "Today" },
    { label: "Reqs Worked", value: "8", sub: "Active" },
    { label: "Tracker Shared", value: "15", sub: "Today" },
    { label: "Interviews", value: "6", sub: "Scheduled" },
    { label: "Selected", value: "2", sub: "Today" },
    { label: "Joined", value: "1", sub: "Today" },
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

  // --- MOCK DATA: RIGHT SIDEBAR (TODAY'S FOLLOW-UPS) ---
  // Generating dummy data to ensure scrolling
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
     {/* ================= LEFT SECTION (MAIN DASHBOARD - 75% Width) ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-gray-200">
        
        {/* HEADER */}
        <div className="bg-[#103c7f] px-6 py-4 border-b border-[#0d316a] shadow-sm flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">
              CRM Analytics
            </h1>
            <p className="text-xs font-bold text-blue-200 mt-1">Performance Overview</p>
          </div>
          <div className="text-white text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
            {new Date().toDateString()}
          </div>
        </div>

        {/* CONTENT AREA (Flex Column to manage height) */}
        <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-6 bg-slate-50">
          
          {/* --- ROW 1: DATABASE OVERVIEW (LIFETIME TOTALS) - Fixed Height --- */}
          <div className="shrink-0">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Briefcase size={14}/> Database Overview
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

          {/* --- ROW 2: MONTHLY PULSE (NEW ROW) - Fixed Height --- */}
          <div className="shrink-0">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Calendar size={14}/> Monthly Performance (Jan)
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {/* Using dailyStats data for demo, ideally pass monthlyStats here */}
              {dailyStats.map((stat, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-purple-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 group-hover:h-full group-hover:opacity-5 transition-all"></div>
                   <h4 className="text-lg font-black text-purple-700 leading-none mt-1">{stat.value * 20}</h4> {/* Mocking higher Monthly # */}
                   <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{stat.label}</p>
                   <span className="text-[8px] font-bold text-purple-400 mt-1 bg-purple-50 px-1.5 rounded border border-purple-100">Monthly</span>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROW 3: TODAY'S PULSE (DAILY) - Fixed Height --- */}
          <div className="shrink-0">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <TrendingUp size={14}/> Today's Pulse
            </h3>
            <div className="grid grid-cols-7 gap-3">
              {dailyStats.map((stat, idx) => (
                <div key={idx} className="bg-gradient-to-br from-white to-blue-50 p-2.5 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#103c7f]/10 group-hover:bg-[#103c7f] transition-colors"></div>
                  <h4 className="text-lg font-black text-[#103c7f] leading-none mt-1">{stat.value}</h4>
                  <p className="text-[9px] font-bold text-gray-600 uppercase mt-1">{stat.label}</p>
                  <span className="text-[8px] font-semibold text-blue-400 mt-1 bg-white px-1.5 rounded border border-blue-100">Today</span>
                </div>
              ))}
            </div>
          </div>

          {/* --- ROW 4: DETAILED TABLE (SCROLLABLE AREA) --- */}
          <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Table Header (Fixed) */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14}/> Latest Data Entry
              </h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                View Full Report <ArrowUpRight size={10}/>
              </button>
            </div>
            
            {/* Table Body (Scrollable) */}
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
                    {/* Repeat data to test scrolling */}
                    {tableData.map((row) => (
                      <tr key={`${row.id}-dup`} className="hover:bg-blue-50/30 transition-colors">
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
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">Today's Action List</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
            {followUpList.length} Pending
          </span>
        </div>

        {/* SCROLLABLE LIST */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-gray-50/50">
          {followUpList.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer">
              
              {/* Top Row: Company Name Only */}
              <div className="mb-2">
                <h4 className="text-xs font-black text-gray-800 group-hover:text-[#103c7f] transition-colors line-clamp-1 leading-tight">
                  {item.company}
                </h4>
              </div>

              {/* Middle Row: Contact Person */}
              <div className="flex items-center gap-2 mb-3">
               
                <span className="text-[10px] font-bold text-gray-600 truncate">{item.contact}</span>
              </div>

              {/* Bottom Row: Last Conversation */}
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