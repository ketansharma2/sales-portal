"use client";
import { useState } from "react";
import { 
  Calendar, Users, Target, Building2, Home, 
  Briefcase, BarChart2, TrendingUp, Phone, Headset
} from "lucide-react";

export default function HODDashboard() {
  const [dateRange, setDateRange] = useState({ start: "2026-04-01", end: "2026-04-30" });
  
  // ✅ TAB STATE: "domestic" or "corporate"
  const [activeTab, setActiveTab] = useState("domestic");

  // Helper function to format numbers
  const formatValue = (value, type) => {
      if (type === 'currency') return `₹ ${(value / 100000).toFixed(1)}L`; // Converts to Lakhs
      if (type === 'percent') return `${value}%`;
      return value.toLocaleString('en-IN');
  };
  // --- HOD's OWN TARGETS ---
  const HOD_DATA = {
      roleName: "Head of Department (HOD)",
      icon: Target,
      kpis: [
          { metric: "Total Dept Revenue", target: 50000000, achieved: 32000000, type: "currency" },
          { metric: "Overall Profit Margin", target: 45, achieved: 42, type: "percent" },
          { metric: "New Strategic Alliances", target: 5, achieved: 3, type: "number" }
      ]
  };

  // --- NEW UNIFIED DATA STRUCTURE (Grouped by Role) ---
  const ROLE_DATA = [
    {
      id: "sm",
      roleName: "Sales Manager (SM)",
      icon: TrendingUp,
      domestic: [
        { metric: "Branch Visits", target: 20, achieved: 15, type: "number" },
        { metric: "Domestic Revenue", target: 5000000, achieved: 3500000, type: "currency" }
      ],
      corporate: [
        { metric: "Key Account Meetings", target: 15, achieved: 12, type: "number" },
        { metric: "Enterprise Deals", target: 5, achieved: 2, type: "number" },
        { metric: "Corp Revenue", target: 10000000, achieved: 8500000, type: "currency" }
      ]
    },
    {
      id: "fse",
      roleName: "Field Sales Exec. (FSE)",
      icon: Briefcase,
      domestic: [
        { metric: "Daily Field Visits", target: 240, achieved: 185, type: "number" },
        { metric: "New Onboardings", target: 30, achieved: 14, type: "number" },
        { metric: "Local Biz Signups", target: 15, achieved: 8, type: "number" }
      ],
      corporate: [
        { metric: "Corporate Pitches", target: 80, achieved: 65, type: "number" },
        { metric: "Franchise Leads", target: 10, achieved: 4, type: "number" }
      ]
    },
    {
      id: "leadgen",
      roleName: "Lead Generation",
      icon: Phone,
      domestic: [
        { metric: "Cold Calls / Day", target: 1500, achieved: 1250, type: "number" },
        { metric: "Qualified Leads", target: 300, achieved: 210, type: "number" }
      ],
      corporate: [
        { metric: "LinkedIn Outreach", target: 500, achieved: 450, type: "number" },
        { metric: "B2B Meetings Setup", target: 50, achieved: 32, type: "number" },
        { metric: "LinkedIn Outreach", target: 500, achieved: 450, type: "number" },
        { metric: "B2B Meetings Setup", target: 50, achieved: 32, type: "number" }
      ]
    },
    {
      id: "crm",
      roleName: "Account Manager (CRM)",
      icon: Headset,
      domestic: [
        { metric: "Client Retention", target: 95, achieved: 90, type: "percent" },
        { metric: "Issue Resolutions", target: 100, achieved: 85, type: "percent" }
      ],
      corporate: [
        { metric: "Key Client Retention", target: 100, achieved: 100, type: "percent" },
        { metric: "Upselling/Cross-selling", target: 2000000, achieved: 1200000, type: "currency" },
        { metric: "Contract Renewals", target: 10, achieved: 7, type: "number" }
      ]
    },
    {
      id: "tl",
      roleName: "Team Leader (TL)",
      icon: Target,
      domestic: [
        { metric: "Team Target Acc.", target: 100, achieved: 75, type: "percent" },
        { metric: "Team Revenue", target: 8000000, achieved: 5500000, type: "currency" },
        { metric: "Attrition Control", target: 5, achieved: 2, type: "number" }
      ],
      corporate: [
        { metric: "Team Target Acc.", target: 100, achieved: 92, type: "percent" },
        { metric: "High-Value Closures", target: 10, achieved: 8, type: "number" }
      ]
    },
    {
      id: "rc",
      roleName: "Recruiter (RC)",
      icon: Users,
      domestic: [
        { metric: "Bulk Submissions", target: 1000, achieved: 850, type: "number" },
        { metric: "Interviews L1", target: 400, achieved: 290, type: "number" },
        { metric: "Final Joinings", target: 100, achieved: 45, type: "number" }
      ],
      corporate: [
        { metric: "Niche Submissions", target: 150, achieved: 110, type: "number" },
        { metric: "CXO Level Interviews", target: 25, achieved: 18, type: "number" },
        { metric: "Offer Rollouts", target: 15, achieved: 12, type: "number" }
      ]
    }
  ];

  // Reusable Component for mapping KPIs (Keeps code clean)
  const renderKPIs = (kpiList, theme) => {
      if (!kpiList || kpiList.length === 0) return <p className="text-[10px] text-gray-400 font-bold uppercase py-4">No KPIs Defined</p>;
      
      const isGreen = theme === 'green';

      return (
          <div className="space-y-5">
              {kpiList.map((kpi, idx) => {
                  const percentage = kpi.target > 0 ? Math.min(Math.round((kpi.achieved / kpi.target) * 100), 100) : 0;
                  
                  // Colors based on performance
                  let barColor = "bg-red-500"; let textColor = "text-red-600"; let bgLight = "bg-red-50";
                  if (percentage >= 100) { barColor = "bg-emerald-500"; textColor = "text-emerald-700"; bgLight = "bg-emerald-50"; } 
                  else if (percentage >= 50) { barColor = "bg-amber-500"; textColor = "text-amber-600"; bgLight = "bg-amber-50"; }

                  return (
                      <div key={idx} className="flex flex-col">
                          <div className="flex justify-between items-end mb-1.5">
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{kpi.metric}</span>
                              <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-gray-500">{formatValue(kpi.achieved, kpi.type)} / {formatValue(kpi.target, kpi.type)}</span>
                                  <span className={`px-1.5 py-0.5 rounded border border-white shadow-sm text-[10px] font-black ${bgLight} ${textColor}`}>{percentage}%</span>
                              </div>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${isGreen ? 'bg-green-100' : 'bg-blue-100'}`}>
                              <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  const isGreenTab = activeTab === "domestic";

  return (
    <div className="min-h-screen bg-[#f8fafc] w-full font-['Calibri'] p-4 md:p-6 pb-20">
      
      {/* --- HEADER, TABS & FILTER ROW --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 shrink-0">
        
        {/* Title */}
        <div>
           <h1 className="text-3xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none flex items-center gap-3">
              <BarChart2 size={28} className="text-blue-500" /> Target vs Achievement
           </h1>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span> 
              HOD Performance Tracking
           </p>
        </div>

        {/* Right Controls Container */}
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            
            {/* Tab Switcher */}
            <div className="flex bg-gray-200/50 p-1.5 rounded-2xl w-full md:w-auto border border-gray-200 shadow-inner">
                <button 
                    onClick={() => setActiveTab("domestic")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === "domestic" 
                            ? "bg-white text-green-700 shadow-sm border border-green-100" 
                            : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                    <Home size={14} className={activeTab === "domestic" ? "text-green-500" : ""} /> Domestic
                </button>
                <button 
                    onClick={() => setActiveTab("corporate")}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-2 px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === "corporate" 
                            ? "bg-white text-blue-700 shadow-sm border border-blue-100" 
                            : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                    <Building2 size={14} className={activeTab === "corporate" ? "text-blue-500" : ""} /> Corporate
                </button>
            </div>

            {/* Global Date Filter (Auto-update on change) */}
            <div className="flex items-center bg-white py-[9px] px-4 rounded-xl border border-gray-200 shadow-sm z-10 w-full md:w-auto shrink-0">
               <div className="flex items-center gap-2 flex-1 md:flex-none justify-center">
                 <Calendar size={16} className="text-gray-400"/>
                 <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                    className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer" 
                 />
                 <span className="text-gray-300 font-bold mx-1">-</span>
                 <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                    className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer" 
                 />
               </div>
            </div>

        </div>
      </div>

     {/* --- SECTOR HEADER BANNER --- */}
      <div className={`rounded-xl p-2 mb-6 flex items-center justify-between border-l-4 shadow-sm ${
          isGreenTab ? "bg-[#effae8] border-green-500" : "bg-[#eff6ff] border-blue-500"
      }`}>
          <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg bg-white shadow-sm ${isGreenTab ? "text-green-600" : "text-blue-600"}`}>
                  {isGreenTab ? <Home size={24} /> : <Building2 size={24} />}
              </div>
              <div>
                  <h2 className={`text-lg font-black uppercase tracking-tight leading-tight ${isGreenTab ? "text-green-800" : "text-[#103c7f]"}`}>
                      {isGreenTab ? "Domestic" : "Corporate"}
                  </h2>
                  <p className="text-[11px] font-bold text-gray-500 mt-0.5">Individual KPI targets vs achievements</p>
              </div>
          </div>
      </div>

    {/* --- CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* 1. HOD'S OWN TARGET CARD (Always visible, same styling as others) */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-md shadow-gray-200/50 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
              <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${isGreenTab ? "bg-green-50/30" : "bg-blue-50/30"}`}>
                  <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${isGreenTab ? "text-green-600" : "text-blue-600"}`}>
                          <HOD_DATA.icon size={18} />
                      </div>
                      <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">{HOD_DATA.roleName}</h3>
                  </div>
                  <span className="bg-yellow-50 text-yellow-600 border border-yellow-200 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">My Targets</span>
              </div>
              <div className="p-6 flex-1">
                  {renderKPIs(HOD_DATA.kpis, isGreenTab ? 'green' : 'blue')}
              </div>
          </div>

          {/* 2. TEAM ROLE CARDS (Filtered by Active Tab) */}
          {ROLE_DATA.map((role, index) => {
              const currentKPIs = role[activeTab];
              
              if (!currentKPIs || currentKPIs.length === 0) return null;

              return (
                  <div key={index} className="bg-white rounded-3xl border border-gray-100 shadow-md shadow-gray-200/50 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                      <div className={`px-6 py-5 border-b border-gray-100 flex items-center gap-3 ${isGreenTab ? "bg-green-50/30" : "bg-blue-50/30"}`}>
                          <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${isGreenTab ? "text-green-600" : "text-blue-600"}`}>
                              <role.icon size={18} />
                          </div>
                          <h3 className="text-base font-black text-gray-800 uppercase tracking-tight">{role.roleName}</h3>
                      </div>
                      <div className="p-6 flex-1">
                          {renderKPIs(currentKPIs, isGreenTab ? 'green' : 'blue')}
                      </div>
                  </div>
              );
          })}
      </div>

    </div>
  );
}