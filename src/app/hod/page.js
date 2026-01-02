"use client";
import { useState } from "react";
import { 
  LayoutDashboard, Calendar, TrendingUp, Users, 
  Target, Building2, Home, Filter, ArrowUpRight, ChevronDown 
} from "lucide-react";

export default function HODDashboard() {
  const [dateRange, setDateRange] = useState({ start: "2025-12-01", end: "2025-12-30" });
  const [selectedSector, setSelectedSector] = useState("All");
  
  // ✅ NEW STATE: Custom Dropdown Open/Close control
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- DATA CONFIGURATION ---
  const SECTOR_DATA = {
    domestic: {
      id: "domestic",
      name: "Domestic Sector",
      icon: Home,
      theme: "green", 
      stats: {
        activeFSE: 18,
        pipeline: { wpHigh: 12, wpLow: 5, mpHigh: 20, mpLow: 8 },
        kpiList: [
            { label: "Onboarding", target: 12, achieved: 4, unit: "Nos", percent: 33 },
            { label: "Avg Visit / day", target: 240, achieved: 185, unit: "Nos", percent: 77 },
            { label: "Joinings", target: 50, achieved: 22, unit: "Nos", percent: 44 },
            { label: "CTC Generated", target: "1.2 Cr", achieved: "80 L", unit: "INR", percent: 66 },
            { label: "Total Positions", target: 150, achieved: 95, unit: "Nos", percent: 63 },
            { label: "Rev. Source Count", target: 20, achieved: 12, unit: "Nos", percent: 60 },
        ]
      }
    },
    corporate: {
      id: "corporate",
      name: "Corporate Sector",
      icon: Building2,
      theme: "blue", 
      stats: {
        activeFSE: 6,
        pipeline: {
            clients: { wpHigh: 4, wpLow: 2, mpHigh: 8, mpLow: 3 },    
            franchise: { wpHigh: 2, wpLow: 1, mpHigh: 5, mpLow: 0 }   
        },
        kpiList: [
            { label: "Onboarding", target: 10, achieved: 6, unit: "Nos", percent: 60 },
            { label: "Avg Calling / day", target: 80, achieved: 65, unit: "Nos", percent: 81 },
            { label: "Joinings", target: 15, achieved: 8, unit: "Nos", percent: 53 },
            { label: "Franchise Signups", target: 5, achieved: 2, unit: "Nos", percent: 40 },
            { label: "CTC Generated", target: "5.0 Cr", achieved: "3.2 Cr", unit: "INR", percent: 64 },
            { label: "Total Positions", target: 60, achieved: 45, unit: "Nos", percent: 75 },
            { label: "Rev. Source Count", target: 10, achieved: 8, unit: "Nos", percent: 80 },
        ]
      }
    }
  };

  // --- FILTER LOGIC ---
  const displayedSectors = Object.values(SECTOR_DATA).filter(sector => 
    selectedSector === "All" || sector.id === selectedSector.toLowerCase()
  );

  return (
    <div className="h-screen overflow-y-auto bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 shrink-0">
        <div>
           <h1 className="text-3xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
             Strategic Overview
           </h1>
           <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span> 
              HOD Control Center
           </p>
        </div>

        {/* Global Filter */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm z-50">
           <div className="flex items-center px-3 gap-2 border-r border-gray-200">
             <Calendar size={16} className="text-gray-300"/>
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-transparent text-[11px] font-bold text-[#103c7f] outline-none w-24" />
             <span className="text-gray-300 font-bold">-</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-transparent text-[11px] font-bold text-[#103c7f] outline-none w-24" />
           </div>

           {/* ✅ FIXED: CUSTOM DROPDOWN (Replaced Native Select) */}
           <div className="relative flex items-center px-3 gap-2 border-r border-gray-200">
             <Filter size={16} className="text-gray-300"/>
             
             {/* Trigger Button */}
             <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#103c7f] outline-none uppercase tracking-wide hover:opacity-80 min-w-[90px] justify-between"
             >
                {selectedSector === "All" ? "All Sectors" : selectedSector}
                <ChevronDown size={12} strokeWidth={3} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Dropdown Menu Overlay */}
             {isFilterOpen && (
                <div className="absolute top-full left-0 mt-3 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
                   {["All", "Domestic", "Corporate"].map((opt) => (
                      <button
                         key={opt}
                         onClick={() => {
                            setSelectedSector(opt === "All" ? "All" : opt.toLowerCase());
                            setIsFilterOpen(false);
                         }}
                         className={`px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide transition-colors flex items-center justify-between
                            ${(selectedSector === "All" && opt === "All") || selectedSector === opt.toLowerCase() 
                                ? 'bg-[#effae8] text-[#103c7f]' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                      >
                         {opt === "All" ? "All Sectors" : opt}
                         {/* Active Check Indicator */}
                         {((selectedSector === "All" && opt === "All") || selectedSector === opt.toLowerCase()) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#a1db40]"></div>
                         )}
                      </button>
                   ))}
                </div>
             )}
           </div>

           <button className="bg-[#103c7f] text-white px-4 py-2 rounded-[10px] font-black text-[9px] uppercase tracking-widest shadow-md hover:bg-[#0d316a] transition-all">
             Update View
           </button>
        </div>
      </div>

      {/* --- SECTOR BREAKDOWN --- */}
      <div className={`grid grid-cols-1 ${selectedSector === 'All' ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl mx-auto'} gap-6`}>

        {displayedSectors.map((sector) => {
           const isGreen = sector.theme === 'green';
           const bgHeader = isGreen ? 'bg-[#effae8]' : 'bg-[#eff6ff]';
           const borderHeader = isGreen ? 'border-green-100' : 'border-blue-100';
           const iconColor = isGreen ? 'text-green-600' : 'text-blue-600';
           const borderColor = isGreen ? 'border-green-500' : 'border-blue-500';

           return (
            <div key={sector.id} className="bg-white rounded-[32px] border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow">
                
                {/* Sector Header */}
                <div className={`${bgHeader} px-8 py-6 flex justify-between items-center border-b ${borderHeader}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center ${iconColor} shadow-sm`}>
                            <sector.icon size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#103c7f] uppercase tracking-tight italic">{sector.name}</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {isGreen ? "High Volume" : "High Value"} • {sector.stats.activeFSE} {isGreen ? "FSEs" : "Managers"}
                            </p>
                        </div>
                    </div>
                    <button className={`bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:opacity-80 flex items-center gap-2 ${isGreen ? 'text-green-700' : 'text-blue-700'}`}>
                        View Targets <ArrowUpRight size={14}/>
                    </button>
                </div>

                {/* Metrics Body (Both now use Tables) */}
                <div className="flex-1 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100 text-[9px] uppercase font-black text-gray-400 tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">KPI Metric</th>
                                    <th className="px-6 py-4 text-center">Goal</th>
                                    <th className="px-6 py-4 text-center">Achieved</th>
                                    <th className="px-6 py-4 text-center">% Done</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-bold text-gray-700">
                                {sector.stats.kpiList.map((kpi, idx) => (
                                    <tr key={idx} className={`border-b border-gray-50 transition-all ${isGreen ? 'hover:bg-green-50/30' : 'hover:bg-blue-50/30'}`}>
                                        <td className="px-6 py-4 text-[#103c7f] font-black">{kpi.label}</td>
                                        <td className="px-6 py-4 text-center text-gray-400">{kpi.target}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black ${
                                                kpi.percent >= 80 ? 'bg-green-100 text-green-700' : 
                                                kpi.percent >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-50 text-red-600'
                                            }`}>
                                                {kpi.achieved}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className={`text-[10px] font-black ${kpi.percent >= 80 ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {kpi.percent}%
                                                </span>
                                                <div className="w-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div style={{width: `${kpi.percent}%`}} className={`h-full ${kpi.percent >= 80 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- FOOTER LOGIC --- */}
                {sector.id === 'domestic' ? (
                    <div className={`bg-[#103c7f] p-6 grid grid-cols-4 gap-4 border-t-4 ${borderColor}`}>
                         <div className="text-center border-r border-white/10"><p className="text-[9px] text-green-300 font-bold uppercase mb-1">WP {'>'} 50%</p><p className="text-2xl font-black text-white">{sector.stats.pipeline.wpHigh}</p></div>
                         <div className="text-center border-r border-white/10"><p className="text-[9px] text-gray-400 font-bold uppercase mb-1">WP {'<'} 50%</p><p className="text-2xl font-black text-white">{sector.stats.pipeline.wpLow}</p></div>
                         <div className="text-center border-r border-white/10"><p className="text-[9px] text-green-300 font-bold uppercase mb-1">MP {'>'} 50%</p><p className="text-2xl font-black text-white">{sector.stats.pipeline.mpHigh}</p></div>
                         <div className="text-center"><p className="text-[9px] text-gray-400 font-bold uppercase mb-1">MP {'<'} 50%</p><p className="text-2xl font-black text-white">{sector.stats.pipeline.mpLow}</p></div>
                    </div>
                ) : (
                    <div className={`bg-[#103c7f] border-t-4 ${borderColor} flex flex-col`}>
                         <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-2 mb-3"><Building2 size={14} className="text-blue-300"/> <span className="text-[10px] font-black text-white uppercase tracking-widest">Client Pipeline</span></div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center border-r border-white/10"><p className="text-[9px] text-blue-300 font-bold uppercase mb-1">WP {'>'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.clients.wpHigh}</p></div>
                                <div className="text-center border-r border-white/10"><p className="text-[9px] text-gray-400 font-bold uppercase mb-1">WP {'<'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.clients.wpLow}</p></div>
                                <div className="text-center border-r border-white/10"><p className="text-[9px] text-blue-300 font-bold uppercase mb-1">MP {'>'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.clients.mpHigh}</p></div>
                                <div className="text-center"><p className="text-[9px] text-gray-400 font-bold uppercase mb-1">MP {'<'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.clients.mpLow}</p></div>
                            </div>
                         </div>
                         <div className="p-4 bg-[#0d316a]">
                            <div className="flex items-center gap-2 mb-3"><Target size={14} className="text-yellow-400"/> <span className="text-[10px] font-black text-white uppercase tracking-widest">Franchise Pipeline</span></div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center border-r border-white/10"><p className="text-[9px] text-yellow-400 font-bold uppercase mb-1">WP {'>'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.franchise.wpHigh}</p></div>
                                <div className="text-center border-r border-white/10"><p className="text-[9px] text-gray-400 font-bold uppercase mb-1">WP {'<'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.franchise.wpLow}</p></div>
                                <div className="text-center border-r border-white/10"><p className="text-[9px] text-yellow-400 font-bold uppercase mb-1">MP {'>'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.franchise.mpHigh}</p></div>
                                <div className="text-center"><p className="text-[9px] text-gray-400 font-bold uppercase mb-1">MP {'<'} 50</p><p className="text-xl font-black text-white">{sector.stats.pipeline.franchise.mpLow}</p></div>
                            </div>
                         </div>
                    </div>
                )}
            </div>
           );
        })}

      </div>
    </div>
  );
}