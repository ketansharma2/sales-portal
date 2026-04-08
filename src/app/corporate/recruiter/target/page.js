"use client";
import React, { useState, useEffect } from "react";
import { 
  Target, TrendingUp, Calendar, CheckCircle, Clock, Award, Users, FileText, MessageSquare
} from "lucide-react";

export default function TargetManagement() {
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState("All");

  // --- MOCK DATA FOR MONTHLY TARGETS ---
  const monthlyTargets = [
    {
      id: 1,
      month: "May 2026",
      status: "Ongoing",
      hodRemarks: "Shift in focus this month towards top of the funnel. Need to ramp up client meetings to build pipeline.",
      targets: [
        { name: "Client Meetings", set: 40, achieved: 15, unit: "Meetings", type: "number", icon: "Users" },
        { name: "Trackers Shared", set: 100, achieved: 65, unit: "Trackers", type: "number", icon: "FileText" },
        { name: "New Client Onboardings", set: 10, achieved: 2, unit: "Clients", type: "number", icon: "Award" }
      ]
    },
    {
      id: 2,
      month: "April 2026",
      status: "Completed",
      hodRemarks: "Great job hitting the revenue target. Onboarding was slightly short, but overall a solid month.",
      targets: [
        { name: "Revenue Generation", set: 500000, achieved: 520000, unit: "₹", type: "currency", icon: "TrendingUp" },
        { name: "New Client Onboardings", set: 20, achieved: 18, unit: "Clients", type: "number", icon: "Award" }
      ]
    },
    {
      id: 3,
      month: "March 2026",
      status: "Completed",
      hodRemarks: "Excellent performance! Target exceeded. Keep up the great momentum.",
      targets: [
        { name: "Revenue Generation", set: 800000, achieved: 850000, unit: "₹", type: "currency", icon: "TrendingUp" }
      ]
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Helpers
  const formatValue = (value, type) => {
    if (type === "currency") {
      return `₹ ${value.toLocaleString('en-IN')}`;
    }
    return value.toLocaleString('en-IN');
  };

  const calculatePercent = (achieved, set) => {
    const p = (achieved / set) * 100;
    return p.toFixed(1);
  };

  const getPercentColor = (percent) => {
    if (percent >= 100) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (percent >= 75) return "text-blue-600 bg-blue-50 border-blue-100";
    if (percent >= 50) return "text-orange-600 bg-orange-50 border-orange-100";
    return "text-red-600 bg-red-50 border-red-100";
  };

  const getIcon = (iconName) => {
    switch (iconName) {
      case "TrendingUp": return <TrendingUp size={14}/>;
      case "Award": return <Award size={14}/>;
      case "Users": return <Users size={14}/>;
      case "FileText": return <FileText size={14}/>;
      default: return <Target size={14}/>;
    }
  };

  // Filter Logic
  const filteredTargets = monthlyTargets.filter(monthData => {
    const yearMatch = monthData.month.includes(selectedYear);
    const monthMatch = selectedMonth === "All" || monthData.month.includes(selectedMonth);
    return yearMatch && monthMatch;
  });

  return (
    <div className="p-2 md:p-4 bg-[#f8fafc] font-['Calibri'] min-h-screen text-slate-800 flex flex-col">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 className="text-xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <Target size={22} className="text-blue-600"/> Targets & Performance
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monthly Progress & HOD Feedback</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {/* Year Filter */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 gap-2 focus-within:border-blue-400 transition-colors shrink-0">
                <Calendar size={14} className="text-gray-400" />
                <select 
                  className="bg-transparent text-sm font-bold text-[#103c7f] outline-none cursor-pointer"
                  value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2026">Year: 2026</option>
                  <option value="2025">Year: 2025</option>
                </select>
              </div>

              {/* Month Filter */}
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 gap-2 focus-within:border-blue-400 transition-colors shrink-0">
                <select 
                  className="bg-transparent text-sm font-bold text-[#103c7f] outline-none cursor-pointer"
                  value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="All">Month: All</option>
                  <option value="January">January</option>
                  <option value="February">February</option>
                  <option value="March">March</option>
                  <option value="April">April</option>
                  <option value="May">May</option>
                  <option value="June">June</option>
                  <option value="July">July</option>
                  <option value="August">August</option>
                  <option value="September">September</option>
                  <option value="October">October</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
            </div>
        </div>

        {/* --- CARDS LAYOUT --- */}
        <div className="space-y-6">
            {filteredTargets.length > 0 ? (
                filteredTargets.map((monthData) => (
                    <div key={monthData.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md animate-in fade-in duration-300">
                        
                        {/* Card Header (Month & Status) */}
                        <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={18} className="text-[#103c7f]"/> {monthData.month}
                            </h2>
                            <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${monthData.status === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                {monthData.status === 'Ongoing' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                                {monthData.status}
                            </span>
                        </div>

                        {/* Internal Clean Table for KPIs */}
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-white border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400">KPI Name</th>
                                        <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 text-center">Target (Set)</th>
                                        <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 text-center">Achieved</th>
                                        <th className="px-6 py-3 text-[10px] uppercase font-black text-gray-400 text-center">% Complete</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {monthData.targets.map((target, idx) => {
                                        const percent = calculatePercent(target.achieved, target.set);
                                        const isAchieved = target.achieved >= target.set;

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[#103c7f] bg-blue-50 p-2 rounded-lg">{getIcon(target.icon)}</span>
                                                        <div>
                                                            <p className="font-black text-slate-700 text-sm">{target.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-wider">Unit: {target.unit}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <span className="text-sm font-bold text-slate-500">
                                                        {formatValue(target.set, target.type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <span className={`text-sm font-black ${isAchieved ? 'text-emerald-600' : 'text-[#103c7f]'}`}>
                                                        {formatValue(target.achieved, target.type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    <span className={`px-2.5 py-1.5 rounded-lg text-xs font-black border shadow-sm ${getPercentColor(percent)}`}>
                                                        {percent}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Card Footer (HOD Remarks) */}
                        <div className="bg-indigo-50/30 border-t border-gray-100 px-6 py-4">
                            <div className="flex gap-3 items-start">
                                <MessageSquare size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">HOD Remarks</h4>
                                    {monthData.hodRemarks ? (
                                        <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                                            "{monthData.hodRemarks}"
                                        </p>
                                    ) : (
                                        <p className="text-xs font-semibold text-gray-400 italic">No remarks provided yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                ))
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                    <Calendar size={40} className="text-gray-300 mb-3" />
                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">No Targets Found</h3>
                    <p className="text-sm font-bold text-gray-400 mt-1">Try selecting a different Year or Month filter.</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}