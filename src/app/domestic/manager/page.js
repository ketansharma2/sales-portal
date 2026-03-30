"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users, CheckCircle, MapPin, Target,
  TrendingUp, Calendar, Filter,
  Search, Activity, Phone, Ghost, AlertCircle, Copy,
  UserCheck, Headset, PhoneCall, CalendarDays, Database, Clock
} from "lucide-react";

export default function SalesManagerDashboard() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // --- MANAGER CONTROLS ---
  const [activeTab, setActiveTab] = useState("FSE"); // 'FSE' or 'LeadGen'
  const [selectedAgent, setSelectedAgent] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [latestDate, setLatestDate] = useState("");

  const currentMonth = new Date().toLocaleString('default', { month: 'long' }).toUpperCase();

  // Mock Lists for Dropdown
  const fseList = ["Rahul Sharma", "Vikram Singh", "Amit Desai", "Neha Gupta"];
  const leadGenList = ["Pooja", "Sneha", "Khushi", "Amit Kumar"];

  // --- MOCK STATS ---
  const [stats, setStats] = useState({
    global: { totalClients: 1240, totalOnboard: 45, totalVisits: 320, onboardCall: 15, onboardVisit: 30, untouched: 150, noStatus: 42, duplicate: 12 },
    monthly: { visitTarget: 180, individualVisits: 110, onboardMtd: "12/20", avgVisit: 4.5, visitGoal: 200, onboardGoal: 20 },
    projections: { mpLess50: 12, mpGreater50: 8, wpLess50: 20, wpGreater50: 15 },
    dynamicMetrics: { total: 320, individual: 110, repeat: 210, interested: 45, notInterested: 80, reachedOut: 300, onboard: 12 },
    clientsFSE: [
      { date: "2026-03-02", name: "TechCorp Solutions", agent: "Vikram Singh", status: "Visited", sub: "Follow up tomorrow", color: "bg-blue-100 text-blue-800" },
      { date: "2026-03-02", name: "Urban Money", agent: "Neha Gupta", status: "Onboarded", sub: "Docs pending", color: "bg-green-100 text-green-800" },
    ],
    clientsLeadGen: [
      { date: "2026-03-02", name: "Frankfin", agent: "Pooja", status: "Connected", duration: "2m 15s", remarks: "Meeting fixed for Friday", color: "bg-purple-100 text-purple-800" },
      { date: "2026-03-01", name: "MKS", agent: "Sneha", status: "Not Interested", duration: "0m 45s", remarks: "Budget issue", color: "bg-red-100 text-red-800" },
    ]
  });

  useEffect(() => {
    setMounted(true);
    setLoading(false);
    setLatestDate("2026-03-02");
  }, []);

  const handleFilter = () => {
    setLoading(true);
    console.log(`Filtering for Tab: ${activeTab}, Agent: ${selectedAgent}, From: ${fromDate}, To: ${toDate}`);
    setTimeout(() => setLoading(false), 500); // mock loading
  };

  if (!mounted) return null;

  return (
    <div className="p-2 md:p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col">
      <div className="max-w-8xl mx-auto w-full space-y-4">
        
        {/* ========================================= */}
        {/* HEADER & TABS */}
        {/* ========================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 px-5 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <UserCheck size={20}/> Sales Manager Overview
                </h1>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                <button 
                    onClick={() => { setActiveTab("FSE"); setSelectedAgent("All"); }}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "FSE" ? "bg-white text-[#103c7f] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <MapPin size={14} /> FSE Team
                </button>
                <button 
                    onClick={() => { setActiveTab("LeadGen"); setSelectedAgent("All"); }}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === "LeadGen" ? "bg-white text-[#103c7f] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <Headset size={14} /> LeadGen
                </button>
            </div>
        </div>

        {/* ========================================= */}
        {/* GLOBAL MANAGER CONTROL PANEL */}
        {/* ========================================= */}
        <div className="bg-white rounded-2xl p-3 px-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#103c7f] shrink-0">
            <h3 className="font-black text-sm uppercase tracking-wide">Filters</h3>
            {latestDate && <span className="text-xs font-bold text-gray-500">(Latest Data: {latestDate})</span>}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">{activeTab === "FSE" ? "FSE:" : "Agent:"}</span>
              <select 
                className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="All">All {activeTab}</option>
                {(activeTab === "FSE" ? fseList : leadGenList).map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                ))}
              </select>
            </div>

            <DateInput label="From" value={fromDate} onChange={setFromDate} />
            <DateInput label="To" value={toDate} onChange={setToDate} />
            
            <button onClick={handleFilter} className="bg-[#103c7f] text-white p-2.5 rounded-xl hover:bg-[#1a4da1] transition-all shadow-sm">
                <Filter size={16} />
            </button>
          </div>
        </div>

        {loading ? (
             <div className="flex items-center justify-center py-20">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#103c7f]"></div>
             </div>
        ) : (
            <div className="animate-in fade-in duration-500 space-y-4">
                
                {/* ========================================= */}
                {/* TAB 1: FSE CONTENT */}
                {/* ========================================= */}
                {activeTab === "FSE" && (
                    <>
                       {/* --- FSE DATABASE KPIs (Highlighted Section) --- */}
                       {/* --- FSE DATABASE KPIs (Highlighted Section - Compact) --- */}
                        <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl mb-4 shadow-sm w-full">
                          
                          {/* Section Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <Database size={14} className="text-[#103c7f]" />
                            <h2 className="text-[11px] font-black text-[#103c7f] uppercase tracking-widest">
                                Database KPIs
                            </h2>
                          </div>
                          
                          {/* 3 Cards Grid - Slimmer */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            
                            {/* 1. Total Clients */}
                            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between h-[70px] hover:shadow-md transition-all">
                              <div className="flex justify-between items-start min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-[#103c7f] shrink-0">
                                    <Users size={14} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Clients</p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-0.5 pl-1">
                                <h3 className="text-xl font-black text-[#103c7f] leading-none truncate">{stats.global.totalClients}</h3>
                              </div>
                            </div>

                            {/* 2. Total Visited */}
                            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between h-[70px] hover:shadow-md transition-all">
                              <div className="flex justify-between items-start min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-[#1a4da1]/10 flex items-center justify-center text-[#1a4da1] shrink-0">
                                    <MapPin size={14} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Clients Visited</p>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-0.5 pl-1">
                                <h3 className="text-xl font-black text-[#1a4da1] leading-none truncate">{stats.global.totalVisits}</h3>
                              </div>
                            </div>

                            {/* 3. Onboarded */}
                            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-between h-[70px] hover:shadow-md transition-all text-left">
                              <div className="flex justify-between items-start min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-6 h-6 rounded-md bg-[#a1db40]/20 flex items-center justify-center text-[#8cc530] shrink-0">
                                    <CheckCircle size={14} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Onboarded</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="flex items-center gap-0.5 bg-blue-50 px-1 py-0.5 rounded text-[8px] font-bold text-blue-600 border border-blue-100"><Phone size={8} /> {stats.global.onboardCall || 0}</span>
                                  <span className="flex items-center gap-0.5 bg-purple-50 px-1 py-0.5 rounded text-[8px] font-bold text-purple-600 border border-purple-100"><MapPin size={8} /> {stats.global.onboardVisit || 0}</span>
                                </div>
                              </div>
                              <div className="mt-0.5 pl-1">
                                <h3 className="text-xl font-black text-slate-800 leading-none truncate">{stats.global.totalOnboard}</h3>
                              </div>
                            </div>

                          </div>
                        </div>

                    {/* --- FSE MONTHLY KPIs & PROJECTIONS (Single Highlighted Section - Slim) --- */}
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-2xl mb-4 shadow-sm w-full">
                          
                          {/* Common Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} className="text-[#103c7f]" />
                            <h2 className="text-[11px] font-black text-[#103c7f] uppercase tracking-widest">
                              {currentMonth}
                            </h2>
                          </div>
                          
                          {/* Content Wrapper */}
                          <div className="flex flex-col lg:flex-row gap-3 items-stretch h-auto lg:h-[80px]">
                            
                            {/* Left Side: 4 KPI Cards */}
                            <div className="flex-1 grid grid-cols-2 xl:grid-cols-4 gap-2"> 
                              <CompactMonthCard label="Total Visit Target" value={stats.monthly.visitTarget} icon={<TrendingUp size={14} />} target={stats.monthly.visitGoal} progress={90} trend="-1%" />
                              <CompactMonthCard label="Individual Visits" value={stats.monthly.individualVisits} icon={<Users size={14} />} />
                              <CompactMonthCard label="Onboard (MTD)" value={stats.monthly.onboardMtd} icon={<CheckCircle size={14} />} target={stats.monthly.onboardGoal} progress={40} trend="+5%" />
                              <CompactMonthCard label="Avg Visit/Day" value={stats.monthly.avgVisit} icon={<Activity size={14} />} />
                            </div>
                            
                            {/* Right Side: Projections Card (Slimmer) */}
                            <div className="w-full lg:w-[280px] xl:w-[320px] bg-[#103c7f] rounded-xl p-4 px-4 text-white shadow-sm flex flex-col justify-center relative overflow-hidden border border-white/5 shrink-0">
                              <div className="flex justify-between items-center mb-1 relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#a1db40] pl-24">Projections</h3>
                                <Target size={12} className="opacity-30" />
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 relative z-10">
                                 <ProjItem label="MP < 50" value={stats.projections.mpLess50} />
                                 <ProjItem label="MP > 50" value={stats.projections.mpGreater50} />
                                 <ProjItem label="WP < 50" value={stats.projections.wpLess50} />
                                 <ProjItem label="WP > 50" value={stats.projections.wpGreater50} />
                              </div>
                              <Target size={60} className="absolute -right-3 -bottom-3 opacity-5 rotate-12" />
                            </div>
                            
                          </div>
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                          <DynamicCard label="Total Visits" value={stats.dynamicMetrics.totalVisits} color="border-l-[#103c7f]" />
                          <DynamicCard label="Calls" value={stats.dynamicMetrics.calls} color="border-l-[#1a4da1]" />
                          <DynamicCard label="Individual" value={stats.dynamicMetrics.individual} color="border-l-blue-400" />
                          <DynamicCard label="Repeat" value={stats.dynamicMetrics.repeat} color="border-l-blue-400" />
                          <DynamicCard label="Interested" value={stats.dynamicMetrics.interested} color="border-l-[#a1db40]" />
                          <DynamicCard label="Not Int." value={stats.dynamicMetrics.notInterested} color="border-l-red-400" />
                          <DynamicCard label="Reached Out" value={stats.dynamicMetrics.reachedOut} color="border-l-orange-400" />
                          <DynamicCard label="Onboarded" value={stats.dynamicMetrics.onboard} color="border-l-emerald-500" />
                        </div>

                        {/* --- FSE SPECIFIC TABLE --- */}
                        <div className="h-[300px] bg-white rounded-[1rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col mt-4"> 
                          <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-slate-50">
                              <h3 className="font-black text-[11px] text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                  <MapPin size={14}/> FSE Visit Log
                              </h3>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="sticky top-0 z-20 shadow-sm bg-white">
                                <tr>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Date</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">FSE Name</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Client Name</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Visit Status</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-right">Remarks/Location</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {stats.clientsFSE.map((client, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50 transition-all group">
                                    <td className="px-6 py-2.5 font-bold text-slate-700">{client.date}</td>
                                    <td className="px-6 py-2.5 font-black text-[#103c7f]">{selectedAgent === "All" ? client.agent : selectedAgent}</td>
                                    <td className="px-6 py-2.5 font-bold text-slate-700">{client.name}</td>
                                    <td className="px-6 py-2.5 text-center">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${client.color}`}>{client.status}</span>
                                    </td>
                                    <td className="px-6 py-2.5 text-[10px] font-bold text-gray-400 italic text-right group-hover:text-[#103c7f]">{client.sub}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                    </>
                )}

                {/* ========================================= */}
                {/* TAB 2: LEADGEN CONTENT */}
                {/* ========================================= */}
                {activeTab === "LeadGen" && (
                    <>
                        {/* --- LEADGEN GRID --- */}
                        <div className="flex flex-row flex-nowrap gap-2 w-full items-stretch overflow-x-auto custom-scrollbar pb-2">
                          <div className="flex-1 min-w-[150px] bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-[90px]">
                            <div className="flex justify-between items-start min-w-0">
                              <div className="overflow-hidden min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Database</p>
                                <h3 className="text-xl font-black text-[#103c7f] leading-none mt-1 truncate">8,540</h3>
                              </div>
                              <div className="p-1.5 bg-blue-50 text-[#103c7f] rounded-lg shrink-0"><Database size={16} /></div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[150px] bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-[90px] text-left">
                            <div className="flex justify-between items-start min-w-0">
                              <div className="overflow-hidden min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Calls Made</p>
                                <h3 className="text-xl font-black text-blue-600 leading-none mt-1 truncate">2,140</h3>
                              </div>
                              <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg shrink-0"><PhoneCall size={16} /></div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[150px] bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-[90px] text-left">
                            <div className="flex justify-between items-start min-w-0">
                              <div className="overflow-hidden min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Connected</p>
                                <h3 className="text-xl font-black text-green-600 leading-none mt-1 truncate">850</h3>
                              </div>
                              <div className="p-1.5 bg-green-50 text-green-500 rounded-lg shrink-0"><Headset size={16} /></div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[150px] bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-[90px]">
                            <div className="flex justify-between items-start min-w-0">
                              <div className="overflow-hidden min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Meetings Fixed</p>
                                <h3 className="text-xl font-black text-[#a1db40] leading-none mt-1 truncate">45</h3>
                              </div>
                              <div className="p-1.5 bg-[#a1db40]/20 text-[#8cc530] rounded-lg shrink-0"><CalendarDays size={16} /></div>
                            </div>
                          </div>
                        </div>

                        {/* --- LEADGEN KPIs --- */}
                        <div className="flex flex-col lg:flex-row gap-3 mb-4 items-stretch">
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2"> 
                            <CompactMonthCard label="Total Call Target" value="2,140" icon={<PhoneCall size={16} />} target="3,000" progress={71} trend="+2%" />
                            <CompactMonthCard label="Connect Rate" value="39%" icon={<Activity size={16} />} trend="+5%" />
                            <CompactMonthCard label="Interested Leads" value="120" icon={<CheckCircle size={16} />} target="200" progress={60} />
                            <CompactMonthCard label="Avg Talk Time" value="2m 30s" icon={<Clock size={16} />} />
                          </div>
                        </div>

                        {/* --- LEADGEN SPECIFIC TABLE --- */}
                        <div className="h-[300px] bg-white rounded-[1rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col mt-4"> 
                          <div className="px-5 py-3 border-b border-gray-50 flex justify-between items-center bg-slate-50">
                              <h3 className="font-black text-[11px] text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                  <Headset size={14}/> LeadGen Call Log
                              </h3>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="sticky top-0 z-20 shadow-sm bg-white">
                                <tr>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Date</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Telecaller</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white">Company Name</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Call Status</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-center">Talk Time</th>
                                  <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 border-b border-gray-100 bg-white text-right">Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {stats.clientsLeadGen.map((client, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50 transition-all group">
                                    <td className="px-6 py-2.5 font-bold text-slate-700">{client.date}</td>
                                    <td className="px-6 py-2.5 font-black text-[#103c7f]">{selectedAgent === "All" ? client.agent : selectedAgent}</td>
                                    <td className="px-6 py-2.5 font-bold text-slate-700">{client.name}</td>
                                    <td className="px-6 py-2.5 text-center">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${client.color}`}>{client.status}</span>
                                    </td>
                                    <td className="px-6 py-2.5 text-center font-bold text-gray-600">{client.duration}</td>
                                    <td className="px-6 py-2.5 text-[10px] font-bold text-gray-400 italic text-right group-hover:text-[#103c7f]">{client.remarks}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                    </>
                )}

            </div>
        )}
      </div>
    </div>
  );
}

/* --- REUSABLE SUB-COMPONENTS --- */
function CompactMonthCard({ label, value, icon, trend, progress, target }) {
  const isPositive = trend && trend.includes("+");
  const trendColor = isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50";
  const trendIcon = isPositive ? "↑" : "↓";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex flex-col justify-between h-full w-full relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-0.5">
        <div className="flex items-center gap-1.5">
           <div className="w-6 h-6 rounded-md bg-[#103c7f]/10 flex items-center justify-center text-[#103c7f] shrink-0 group-hover:bg-[#103c7f] group-hover:text-white transition-colors">
             {React.cloneElement(icon, { size: 14 })}
           </div>
           <div className="flex flex-col min-w-0">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{label}</span>
             {target != null && (
               <span className="text-[9px] font-semibold text-gray-300 leading-none mt-0.5">Goal: {target}</span>
             )}
           </div>
        </div>
        {trend && (
          <span className={`px-1 py-0.5 rounded text-[8px] font-black ${trendColor} flex items-center leading-none`}>
            {trendIcon} {trend}
          </span>
        )}
      </div>
      
      <div className="mt-0.5 pl-1">
        <span className="text-xl font-black text-[#103c7f] leading-none tracking-tight">{value}</span>
      </div>
      
      {progress !== undefined && (
        <div className="mt-1.5 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-[#103c7f] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
}

function ProjItem({ label, value }) {
  return (
    <button className="flex justify-between items-center border-b border-white/10 py-1 w-full gap-2 hover:bg-white/10 transition-colors cursor-pointer">
      <span className="text-[12px] font-bold text-[#a1db40] uppercase tracking-tighter shrink-0">{label}</span>
      <span className="text-[12px] font-black text-white italic shrink-0">{value}</span>
    </button>
  );
}

function DynamicCard({ label, value, color }) {
  return (
    <div className={`bg-white p-2 rounded-xl border border-gray-100 border-l-4 ${color} shadow-sm text-center`}>
      <p className="text-[12px] font-black text-gray-400 uppercase mb-1 truncate">{label}</p>
      <p className="text-lg font-black text-[#103c7f]">{value}</p>
    </div>
  );
}

function DateInput({ label, value, onChange }) {
    return (
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 gap-2 hover:border-[#103c7f]/30 transition-colors cursor-pointer group">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider group-hover:text-[#103c7f] transition-colors">{label}</span>
            <input 
              type="date" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer uppercase" 
            />
        </div>
    )
}