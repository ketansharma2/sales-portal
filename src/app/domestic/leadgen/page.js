"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Database, Phone, CheckCircle, Clock, Calendar,
  ArrowRight, Target, Zap, PhoneOutgoing,
  TrendingUp, UserCheck, XCircle, FileText, Briefcase, Award,Send,
  ChevronDown
} from "lucide-react";

export default function LeadGenHome() {
  
  // --- STATE ---
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filter Dropdown State
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("Today");

  // --- KPI DATA (Simplified - No Startup/Franchise splits) ---
  const [kpiData, setKpiData] = useState({
    searched: 0,
    contacts: 0,
    calls: 0,
    picked: 0,
    notPicked: 0,
    sentToMgr: 0, // <--- New State
    contract: 0,
    onboarded: 0,
    interested: 0,
    performance: 0, 
  });

  const [followUps, setFollowUps] = useState([]);

  // --- FILTER HELPERS ---
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const getYears = () => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const getWeeks = () => {
    const weeks = [];
    const targetDate = new Date(fromDate);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    let currentDate = new Date(year, month, 1);
    let weekCount = 1;

    while (currentDate.getMonth() === month) {
        let start = new Date(currentDate);
        let dayOfWeek = currentDate.getDay();
        let daysToSaturday = 6 - dayOfWeek; 
        let end = new Date(currentDate);
        end.setDate(end.getDate() + daysToSaturday);

        if (end.getMonth() !== month) {
           end = new Date(year, month + 1, 0);
        }

        weeks.push({
          label: `Week ${weekCount}`,
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        });

        currentDate = new Date(end);
        currentDate.setDate(currentDate.getDate() + 1);
        weekCount++;
    }
    return weeks;
  };

  const handleDateSelection = (type, value) => {
    const today = new Date();
    let start, end;

    if (type === 'Year') {
        start = `${value}-01-01`;
        end = `${value}-12-31`;
        setSelectedLabel(`Year: ${value}`);
    } else if (type === 'Month') {
        start = new Date(today.getFullYear(), value, 1).toISOString().split('T')[0];
        end = new Date(today.getFullYear(), value + 1, 0).toISOString().split('T')[0];
        const monthName = new Date(today.getFullYear(), value).toLocaleString('default', { month: 'long' });
        setSelectedLabel(`Month: ${monthName}`);
    } else if (type === 'Week') {
        start = value.start;
        end = value.end;
        setSelectedLabel(value.label);
    } else if (type === 'All') {
        start = '2024-01-01';
        end = new Date().toISOString().split('T')[0];
        setSelectedLabel('All Data');
    }

    setFromDate(start);
    setToDate(end);
    setActiveDropdown(null);
  };

  // --- FETCH DATA ---
  useEffect(() => {
    fetchDashboardData();
    fetchFollowUps();
  }, [fromDate, toDate]);

  const fetchDashboardData = async () => {
    // Simulate API Call - Simplified Data
    setTimeout(() => {
      setKpiData({
        searched: 150,
        contacts: 120,
        calls: 200,
        picked: 110,
        notPicked: 90,
        sentToMgr: 12, // <--- Mock Data for Sent to Mgr
        contract: 20,
        onboarded: 8,
        interested: 15,
        performance: 78,
      });
    }, 500);
  };

  const fetchFollowUps = async () => {
    setFollowUps([
      { 
        id: 1, 
        company: "Tech Solutions", 
        contact_person: "Rahul Sharma", 
        remark: "Interested in incubation, asked to call regarding terms." 
      },
      { 
        id: 2, 
        company: "Alpha Traders", 
        contact_person: "Amit Verma", 
        remark: "Contract negotiation pending, needs final rates." 
      },
      { 
        id: 3, 
        company: "NextGen Foods", 
        contact_person: "Priya Singh", 
        remark: "Callback regarding funding options." 
      },
    ]);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['Calibri'] text-slate-800">
      
      {/* ================= LEFT SECTION (MAIN DASHBOARD) ================= */}
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        
        {/* HEADER & FILTERS */}
        <div className="bg-white px-6 py-2 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic">Lead Dashboard</h1>
          </div>
          
          {/* RIGHT SIDE FILTERS */}
          <div className="flex items-center gap-4" ref={wrapperRef}>
              
              {/* Quick Filters Group */}
              <div className="flex bg-gray-100 p-1 rounded-lg relative">
                  
                  {/* ALL Button */}
                  <button 
                    onClick={() => handleDateSelection('All')} 
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${selectedLabel === 'All Data' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    All
                  </button>

                  {/* YEAR Button */}
                  <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Year') || activeDropdown === 'year' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Year <ChevronDown size={10}/>
                      </button>
                      {activeDropdown === 'year' && (
                          <div className="absolute top-full left-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                              {getYears().map(year => (
                                  <button key={year} onClick={() => handleDateSelection('Year', year)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{year}</button>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* MONTH Button */}
                  <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === 'month' ? null : 'month')}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Month') || activeDropdown === 'month' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Month <ChevronDown size={10}/>
                      </button>
                      {activeDropdown === 'month' && (
                          <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 max-h-60 overflow-y-auto custom-scrollbar">
                              {Array.from({length: 12}).map((_, i) => (
                                  <button key={i} onClick={() => handleDateSelection('Month', i)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">
                                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* WEEK Button */}
                  <div className="relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === 'week' ? null : 'week')}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Week') || activeDropdown === 'week' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Week <ChevronDown size={10}/>
                      </button>
                      {activeDropdown === 'week' && (
                          <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                              {getWeeks().map((week, idx) => (
                                  <button key={idx} onClick={() => handleDateSelection('Week', week)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">
                                      {week.label}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              </div>

              {/* Manual Date Input */}
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                 <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-xs font-bold text-slate-700 outline-none w-24 bg-transparent"/>
                 <span className="text-gray-300">-</span>
                 <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-xs font-bold text-slate-700 outline-none w-24 bg-transparent"/>
              </div>

          </div>
        </div>

        <div className="p-4 flex flex-col gap-5">
          
          {/* ---------------- ROW 1: SUCCESS & TARGETS ---------------- */}
          <div>
            <h4 className="text-xs font-black text-teal-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <CheckCircle size={14} /> Key Outcomes
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
                {/* 1. Onboarded */}
                <BigSuccessCard 
                    title="Total Onboarded" 
                    total={kpiData.onboarded} 
                    icon={<Briefcase size={20}/>} 
                    color="teal"
                />

                {/* 2. Interested */}
                <BigSuccessCard 
                    title="Interested Pipeline" 
                    total={kpiData.interested} 
                    icon={<TrendingUp size={20}/>} 
                    color="blue"
                />

                {/* 3. Performance / Target */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full group">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Target Achieved</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{kpiData.performance}%</h3>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100 group-hover:scale-110 transition-transform"><Target size={20}/></div>
                    </div>
                    
                    <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{kpiData.performance}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{width: `${Math.min(kpiData.performance, 100)}%`}}></div>
                        </div>
                    </div>
                </div>

            </div>
          </div>

          {/* ---------------- ROW 2: PIPELINE OVERVIEW ---------------- */}
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <Database size={14} /> Leads Pipeline
            </h4>
            
            {/* Grid 3x2 for 6 Metrics */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* --- Row A --- */}
              <KpiCard title="Companies Searched" total={kpiData.searched} icon={<SearchIcon/>} color="blue" />
              <KpiCard title="Contact Persons" total={kpiData.contacts} icon={<UserCheck size={18}/>} color="blue" />
              <KpiCard title="Total Calls" total={kpiData.calls} icon={<Phone size={18}/>} color="purple" />

              {/* --- Row B --- */}
              <KpiCard title="Calls Picked" total={kpiData.picked} icon={<PhoneOutgoing size={18}/>} color="green" />
              <KpiCard title="Not Picked" total={kpiData.notPicked} icon={<XCircle size={18}/>} color="red" />
              <KpiCard title="Sent to Manager" total={kpiData.sentToMgr} icon={<Send size={18}/>} color="orange" />
            </div>
          </div>

        </div>
      </div>

      {/* ================= RIGHT SECTION (SIDEBAR) ================= */}
      <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-10 shrink-0">
        <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#103c7f] flex items-center gap-2 tracking-tight uppercase italic">
            <Clock size={18} className="text-orange-500" /> Follow-up Schedule for Today
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {followUps.map((item) => (
                <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all group relative">
                  
                  <div className="pl-2.5">
                      {/* Row 1: Company Name & Type Badge */}
                      <div className="flex justify-between items-start mb-1.5">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1" title={item.company}>
                            {item.company}
                        </h4>
                        
                      </div>

                      {/* Row 2: Contact Person (Highlighted) */}
                      <div className="flex items-center gap-1.5 mb-2">
                         <div className="p-1 bg-gray-100 rounded-full text-gray-500">
                            <UserCheck size={10} />
                         </div>
                         <span className="text-xs font-bold text-slate-700">
                            {item.contact_person}
                         </span>
                      </div>

                      {/* Row 3: Remark (Context Box) */}
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 mb-3">
                         <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 flex items-center gap-1">
                            <FileText size={10}/> Last Discussion
                         </p>
                         <p className="text-xs text-slate-600 italic leading-snug">
                            "{item.remark}"
                         </p>
                      </div>

                      {/* Call Action Button */}
                      <Link href="/domestic/leadgen/leads">
                        <button className="w-full bg-blue-50 border border-blue-100 text-[#103c7f] text-[10px] font-bold py-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-colors flex items-center justify-center gap-1.5 group-hover:shadow-sm">
                          <Phone size={12} className="fill-current"/> Call Now
                        </button>
                      </Link>
                  </div>
                </div>
            ))}
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-gray-100 mt-auto bg-white">
           <Link href="/domestic/leadgen/leads">
             <button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm">
               <Database size={16} /> Open Full Database
             </button>
           </Link>
        </div>
      </div>

    </div>
  );
}

// --- HELPER 1: BIG SUCCESS CARD (Simplified - No Startup Split) ---
function BigSuccessCard({ title, total, icon, color }) {
    const colors = {
        teal: "from-teal-50 to-white border-teal-100 text-teal-600",
        blue: "from-blue-50 to-white border-blue-100 text-blue-600",
        green: "from-green-50 to-white border-green-100 text-green-600"
    };
    const style = colors[color] || colors.blue;

    return (
        <div className={`bg-gradient-to-br ${style} p-4 rounded-xl border shadow-sm relative overflow-hidden group h-full flex flex-col justify-between`}>
            {/* Background Icon (Faint) */}
            <div className="absolute right-[-5px] top-[-5px] p-0 opacity-5 scale-75">{icon}</div>
            
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1 leading-none">{total}</h3>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
            </div>
            
            {/* Visual Indicator (Simple Bar) */}
            <div className="w-full h-1 bg-black/5 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-current opacity-50 rounded-full w-2/3"></div>
            </div>
        </div>
    )
}

// --- HELPER 2: PIPELINE KPI CARD (Clean - No Startups) ---
function KpiCard({ title, total, icon, color }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        green: "bg-green-50 text-green-700 border-green-100",
        red: "bg-red-50 text-red-700 border-red-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
    };

    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
            
            {/* Header: Icon + Title */}
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
            </div>

            {/* Total Count */}
            <div className="flex items-baseline gap-1 ml-1">
                <h3 className="text-3xl font-black text-slate-800 leading-none">{total}</h3>
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
}