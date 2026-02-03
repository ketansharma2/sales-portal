"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Database, Phone, CheckCircle, Clock, Calendar,
  ArrowRight, Target, Zap, PhoneOutgoing,
  TrendingUp, Bell, UserCheck, XCircle, FileText, Briefcase, Award,Send,
  Rocket, ChevronDown, Filter
} from "lucide-react";

export default function LeadGenHome() {
  
  // --- STATE ---
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Filter Dropdown State
  const [activeDropdown, setActiveDropdown] = useState(null); // 'year', 'month', 'week' or null
  const [selectedLabel, setSelectedLabel] = useState("Today");

  // --- KPI DATA ---
 // --- KPI DATA ---
 // --- KPI DATA ---
  const [kpiData, setKpiData] = useState({
    searched: { total: 0, startup: 0 },
    contacts: { total: 0, startup: 0 },
    calls: { total: 0, startup: 0 },
    picked: { total: 0, startup: 0 },
    notPicked: { total: 0, startup: 0 },
    contract: { total: 0, startup: 0 },
    sentToManager: { total: 0, startup: 0 },
    onboarded: { total: 0, startup: 0 },
    interested: { total: 0, startup: 0 },

    performance: 0, 

    franchise: {
        discussed: { total: 0, startup: 0 },
        formShared: { total: 0, startup: 0 },
        accepted: { total: 0, startup: 0 } // 
    }
  });

  // ... (Inside fetchDashboardData function) ...
 

  const [followUps, setFollowUps] = useState([]);

  // --- FILTER HELPERS ---
  const wrapperRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Generate Year List (Current -2 to +2)
  const getYears = () => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  // Generate Weeks (Last 6 weeks)
  // Generate Weeks for the Selected Month
  const getWeeks = () => {
    const weeks = [];
    const targetDate = new Date(fromDate); // Jo date selected hai uska month lenge
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // Month ki 1st date se shuru karenge
    let currentDate = new Date(year, month, 1);
    let weekCount = 1;

    // Jab tak month same hai, loop chalega
    while (currentDate.getMonth() === month) {
        let start = new Date(currentDate);
        
        // Week ka end nikalo (Saturday ya Month End)
        let dayOfWeek = currentDate.getDay(); // 0 = Sunday
        let daysToSaturday = 6 - dayOfWeek; 
        
        let end = new Date(currentDate);
        end.setDate(end.getDate() + daysToSaturday);

        // Agar Saturday next month mein ja raha hai, toh month ke end pe rok do
        if (end.getMonth() !== month) {
           end = new Date(year, month + 1, 0);
        }

        weeks.push({
          label: `Week ${weekCount}`, // Output: Week 1, Week 2...
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        });

        // Next week ke liye date set karo (End date + 1 day)
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
        // value is index 0-11
        start = new Date(today.getFullYear(), value, 1).toISOString().split('T')[0];
        end = new Date(today.getFullYear(), value + 1, 0).toISOString().split('T')[0];
        const monthName = new Date(today.getFullYear(), value).toLocaleString('default', { month: 'long' });
        setSelectedLabel(`Month: ${monthName}`);
    } else if (type === 'Week') {
        start = value.start;
        end = value.end;
        setSelectedLabel(value.label);
    } else if (type === 'All') {
        start = '2024-01-01'; // Static start
        end = new Date().toISOString().split('T')[0];
        setSelectedLabel('All Data');
    }

    setFromDate(start);
    setToDate(end);
    setActiveDropdown(null); // Close dropdown
  };


  // --- FETCH DATA ---
  useEffect(() => {
    fetchDashboardData();
    fetchFollowUps();
  }, [fromDate, toDate]);

 const fetchDashboardData = async () => {
    // Simulate API Call
    setTimeout(() => {
      setKpiData({
        searched: { total: 150, startup: 40 },
        contacts: { total: 120, startup: 30 },
        calls: { total: 200, startup: 50 },
        picked: { total: 110, startup: 25 },
        notPicked: { total: 90, startup: 25 },
        contract: { total: 20, startup: 5 },
        sentToManager: { total: 12, startup: 4 },
        onboarded: { total: 8, startup: 2 },
        interested: { total: 15, startup: 5 },
        
        performance: 78,

        franchise: {
            discussed: { total: 12, startup: 3 },
            formShared: { total: 4, startup: 1 },
            accepted: { total: 1, startup: 0 } // 👈 YE BHI UPDATE KAREIN
        }
      });
    }, 500);
  };
  const fetchFollowUps = async () => {
    // API call simulation
    // Ensure 'contact_person' is present in each object
    setFollowUps([
      { 
        id: 1, 
        company: "Tech Solutions", 
        contact_person: "Rahul Sharma", // Added Name
        remark: "Interested in incubation", 
      },
      { 
        id: 2, 
        company: "Alpha Traders", 
        contact_person: "Amit Verma", // Added Name
        remark: "Contract negotiation", 
      },
      { 
        id: 3, 
        company: "NextGen Foods", 
        contact_person: "Priya Singh", // Added Name
        remark: "Call back for funding", 
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
          
        {/* ---------------- ROW 1: SUCCESS METRICS (Compact) ---------------- */}
         {/* ---------------- ROW 1: SUCCESS METRICS (Updated Layout) ---------------- */}
          <div>
            <h4 className="text-xs font-black text-teal-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <CheckCircle size={14} /> Success Metrics
            </h4>
            
            {/* Changed to grid-cols-4 to fit Performance Card */}
            <div className="grid grid-cols-4 gap-3">
                
                {/* 1. Onboarded */}
                <BigSuccessCard 
                    title="Total Onboarded" 
                    total={kpiData.onboarded.total} 
                    startup={kpiData.onboarded.startup} 
                    icon={<Briefcase size={20}/>} 
                    color="teal"
                />

                {/* 2. Interested */}
                <BigSuccessCard 
                    title="Interested Pipeline" 
                    total={kpiData.interested.total} 
                    startup={kpiData.interested.startup} 
                    icon={<TrendingUp size={20}/>} 
                    color="blue"
                />

                {/* 3. Franchise Accepted */}
                <BigSuccessCard 
                    title="Franchise Accepted" 
                    total={kpiData.franchise.accepted.total} 
                    startup={kpiData.franchise.accepted.startup} 
                    icon={<Award size={20}/>} 
                    color="green"
                    isFranchise={true} 
                />

                {/* 4. Performance Card (Moved Here) */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0"><Target size={18}/></div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight">Performance</span>
                   </div>
                   
                   <div className="flex flex-col justify-end h-full pb-1">
                      <div className="flex items-end gap-2 mb-1.5">
                          <h3 className="text-2xl font-black text-slate-800 leading-none ml-1">{kpiData.performance}%</h3>
                          <span className="text-[9px] font-bold text-indigo-500 mb-0.5">of Monthly Goal</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{width: `${Math.min(kpiData.performance, 100)}%`}}></div>
                      </div>
                   </div>
                </div>

            </div>
          </div>

         {/* ---------------- ROW 2: COMBINED PIPELINE & OPERATIONS ---------------- */}

         <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <Database size={14} /> Leads Overview
            </h4>
            
            {/* Grid */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* --- Row 1 --- */}
              <KpiCard title="Companies Searched" total={kpiData.searched.total} startup={kpiData.searched.startup} icon={<SearchIcon/>} color="blue" />
              <KpiCard title="Contact Persons" total={kpiData.contacts.total} startup={kpiData.contacts.startup} icon={<UserCheck size={18}/>} color="blue" />
              <KpiCard title="Total Calls" total={kpiData.calls.total} startup={kpiData.calls.startup} icon={<Phone size={18}/>} color="purple" />

              {/* --- Row 2 --- */}
              <KpiCard title="Calls Picked" total={kpiData.picked.total} startup={kpiData.picked.startup} icon={<PhoneOutgoing size={18}/>} color="green" />
              <KpiCard title="Not Picked" total={kpiData.notPicked.total} startup={kpiData.notPicked.startup} icon={<XCircle size={18}/>} color="red" />
              <KpiCard title="Contracts Shared" total={kpiData.contract.total} startup={kpiData.contract.startup} icon={<FileText size={18}/>} color="orange" />
              
              {/* --- Row 3 --- */}
              <KpiCard title="Franchise Discussed" total={kpiData.franchise.discussed.total} startup={kpiData.franchise.discussed.startup} icon={<Phone size={18}/>} color="purple" />
              <KpiCard title="App. Form Shared" total={kpiData.franchise.formShared.total} startup={kpiData.franchise.formShared.startup} icon={<FileText size={18}/>} color="purple" />
              
              {/* Sent to Manager Card (Replaces Performance) */}
              <KpiCard title="Sent to Manager" total={kpiData.sentToManager.total} startup={kpiData.sentToManager.startup} icon={<Send size={18}/>} color="orange" />

            </div>
          </div>

        </div>
      </div>

      

      {/* ================= RIGHT SECTION (SIDEBAR) ================= */}
     {/* 2. UPDATE SIDEBAR JSX */}
  <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-10 shrink-0">
    <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm sticky top-0 z-10 flex items-center justify-between">
      <h2 className="text-sm font-black text-[#103c7f] flex items-center gap-2 tracking-tight uppercase italic">
        <Clock size={18} className="text-orange-500" /> Follow-up Schedule for Today
      </h2>
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {followUps.map((item) => (
            <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all group relative">
              {/* Color Bar based on Type */}
              
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
                  <Link href="/corporate/leadgen/leads">
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
       <Link href="/corporate/leadgen/leads">
         <button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm">
           <Database size={16} /> Open Full Database
         </button>
       </Link>
    </div>
  </div>

    </div>
  );
}

// --- HELPER 1: BIG SUCCESS CARD (Top Row) ---
// --- HELPER 1: BIG SUCCESS CARD (Compact Version) ---
// --- HELPER 1: BIG SUCCESS CARD (Compact Version) ---
function BigSuccessCard({ title, total, startup, icon, color, isFranchise = false }) {
    const colors = {
        teal: "from-teal-50 to-white border-teal-100 text-teal-600",
        blue: "from-blue-50 to-white border-blue-100 text-blue-600",
        green: "from-green-50 to-white border-green-100 text-green-600"
    };
    const style = colors[color] || colors.blue;

    return (
        <div className={`bg-gradient-to-br ${style} p-3 rounded-xl border shadow-sm relative overflow-hidden group`}>
            {/* Background Icon (Smaller & Fainter) */}
            <div className="absolute right-[-5px] top-[-5px] p-0 opacity-5 scale-75">{icon}</div>
            
            <div className="flex justify-between items-start mb-1">
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isFranchise ? 'text-green-700' : ''}`}>{title}</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{total}</h3>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
            </div>
            
            {/* Startup Bar (Always Visible Now) */}
            <div className="mt-2 bg-white/60 rounded-lg p-1.5 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-orange-100 text-orange-600 rounded-md"><Rocket size={10}/></div>
                    <span className="text-[9px] font-bold text-slate-600 uppercase">Startups</span>
                </div>
                <span className="text-sm font-black text-orange-600">{startup}</span>
            </div>
        </div>
    )
}


// --- HELPER 2: UPDATED KPI CARD (Icon + Title Side-by-Side) ---
function KpiCard({ title, total, startup, icon, color }) {
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
            
            {/* Header: Icon + Title Side-by-Side */}
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-1.5">
                {/* Total Count */}
                <h3 className="text-2xl font-black text-slate-800 leading-none ml-1">{total}</h3>
                
                {/* Startup Breakdown Section */}
                {startup > 0 && (
                    <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
                        <div className="flex items-center gap-1.5">
                            <div className="bg-white p-0.5 rounded-full shadow-sm">
                                <Rocket size={8} className="text-orange-600"/>
                            </div>
                            <span className="text-[9px] font-bold text-orange-700 uppercase tracking-tight">Startup</span>
                        </div>
                        <span className="text-xs font-black text-orange-600">{startup}</span>
                    </div>
                )}
                {/* Placeholder to keep height consistent if no startup data */}
                {startup === 0 && <div className="h-[26px]"></div>}
            </div>
        </div>
    );
}

// --- HELPER 3: SIMPLE KPI CARD (Compact) ---
function SimpleKpiCard({ title, value, icon, color }) {
    const colorClasses = {
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        green: "text-green-600 bg-green-50 border-green-100",
    };
    const style = colorClasses[color] || colorClasses.purple;

    return (
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
            <div className={`p-2 rounded-full ${style} border`}>
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-xl font-black text-slate-800 leading-none mt-0.5">{value}</h3>
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
}