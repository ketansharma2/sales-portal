"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Database, Phone, CheckCircle, Clock, Calendar,
  TrendingUp, UserCheck, FileText, Briefcase, Award, Send,
  Rocket, ChevronDown, Filter, PhoneOutgoing, PhoneIncoming, PhoneMissed
} from "lucide-react";

// --- Helper function to build filter URL ---
const buildFilterUrl = (router, fromDate, toDate, isAllData, filters) => {
  const params = new URLSearchParams();
  
  if (!isAllData && fromDate && toDate) {
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'All') {
      if (key === 'status') params.append('status', value);
      if (key === 'subStatus') params.append('subStatus', value);
      if (key === 'franchiseStatus') params.append('franchiseStatus', value);
      if (key === 'startup') params.append('startup', value);
      if (key === 'isSubmitted') params.append('isSubmitted', value);
    }
  });
  
  const queryString = params.toString();
  router.push(`/corporate/leadgen/details${queryString ? '?' + queryString : ''}`);
};

export default function LeadGenHome() {
  const router = useRouter();
  
  // --- STATE ---
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isAllData, setIsAllData] = useState(false);
  const [latestInteractionDate, setLatestInteractionDate] = useState('');
  
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [selectedLabel, setSelectedLabel] = useState("Today");
  const [kpiData, setKpiData] = useState({
    searched: { total: 145, startup: 45 },
    contacts: { total: 230, startup: 85 },
    calls: { total: 110, startup: 40, new: { total: 70, startup: 25 }, followup: { total: 40, startup: 15 } },
    picked: { total: 65, startup: 22 },
    contract: { total: 18, startup: 8 },
    sentToManager: { total: 12, startup: 5 },
    onboarded: { total: 8, startup: 3 },
    interested: { total: 35, startup: 14 },
    
    masterUnion: { company: 20, profiles: 55, calling: 8 },

    franchise: {
        discussed: { total: 15, startup: 6 },
        formAsk: { total: 12, startup: 5 },
        formShared: { total: 9, startup: 4 },
        accepted: { total: 4, startup: 2 }
    }
  });

  const [followUps, setFollowUps] = useState([
      { id: 1, company: "TechNova Solutions", contact_person: "Rahul Sharma", remarks: "Asked to call back after 2 PM to discuss proposal." },
      { id: 2, company: "Global Innovators", contact_person: "Priya Singh", remarks: "Shared company deck. Waiting for their review." },
      { id: 3, company: "NextGen Startups", contact_person: "Amit Verma", remarks: "Highly interested in franchise model." }
  ]);

  const notPickedTotal = kpiData.calls.total - kpiData.picked.total;
  const normalSearched = kpiData.searched.total - kpiData.searched.startup;
  const normalCalls = kpiData.calls.total - kpiData.calls.startup;

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

  useEffect(() => {
      const today = new Date().toISOString().split('T')[0];
      setLatestInteractionDate(today);
      setFromDate(today);
      setToDate(today);
  }, []);

  const getYears = () => {
    const current = new Date().getFullYear();
    return [current - 2, current - 1, current, current + 1, current + 2];
  };

  const getWeeks = () => {
    const weeks = [];
    const targetDate = new Date(fromDate || new Date());
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
        setIsAllData(false);
    } else if (type === 'Month') {
        start = new Date(today.getFullYear(), value, 1).toISOString().split('T')[0];
        end = new Date(today.getFullYear(), value + 1, 0).toISOString().split('T')[0];
        const monthName = new Date(today.getFullYear(), value).toLocaleString('default', { month: 'long' });
        setSelectedLabel(`Month: ${monthName}`);
        setIsAllData(false);
    } else if (type === 'Week') {
        start = value.start;
        end = value.end;
        setSelectedLabel(value.label);
        setIsAllData(false);
    } else if (type === 'All') {
        start = '2024-01-01';
        end = new Date().toISOString().split('T')[0];
        setSelectedLabel('All Data');
        setIsAllData(true);
    }

    setFromDate(start);
    setToDate(end);
    setActiveDropdown(null);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-['Calibri'] text-slate-800">
      
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        
        <div className="bg-white px-6 py-2 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic">Lead Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4" ref={wrapperRef}>
            {latestInteractionDate && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock size={12} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-700">Latest Date : {latestInteractionDate}</span>
              </div>
            )}
              
              <div className="flex bg-gray-100 p-1 rounded-lg relative">
                  <button onClick={() => handleDateSelection('All')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${selectedLabel === 'All Data' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                  <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'year' ? null : 'year')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Year') || activeDropdown === 'year' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Year <ChevronDown size={10}/></button>
                      {activeDropdown === 'year' && (
                          <div className="absolute top-full left-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                              {getYears().map(year => <button key={year} onClick={() => handleDateSelection('Year', year)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{year}</button>)}
                          </div>
                      )}
                  </div>
                  <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'month' ? null : 'month')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Month') || activeDropdown === 'month' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Month <ChevronDown size={10}/></button>
                      {activeDropdown === 'month' && (
                          <div className="absolute top-full left-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 max-h-60 overflow-y-auto custom-scrollbar">
                              {Array.from({length: 12}).map((_, i) => <button key={i} onClick={() => handleDateSelection('Month', i)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{new Date(0, i).toLocaleString('default', { month: 'long' })}</button>)}
                          </div>
                      )}
                  </div>
                  <div className="relative">
                      <button onClick={() => setActiveDropdown(activeDropdown === 'week' ? null : 'week')} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md flex items-center gap-1 transition-all ${selectedLabel.includes('Week') || activeDropdown === 'week' ? 'bg-white text-[#103c7f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Week <ChevronDown size={10}/></button>
                      {activeDropdown === 'week' && (
                          <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
                              {getWeeks().map((week, idx) => <button key={idx} onClick={() => handleDateSelection('Week', week)} className="block w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-gray-700 font-bold">{week.label}</button>)}
                          </div>
                      )}
                  </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                 <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="text-xs font-bold text-slate-700 outline-none w-24 bg-transparent"/>
                 <span className="text-gray-300">-</span>
                 <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="text-xs font-bold text-slate-700 outline-none w-24 bg-transparent"/>
              </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-6">
          {/* ROW 1: OVERALL */}
          <div>
            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Database size={14} /> 1. Overall Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Total Leads" total={kpiData.searched.total} icon={<SearchIcon/>} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Total Contacts" total={kpiData.contacts.total} icon={<UserCheck size={18}/>} color="blue" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Total Calls" total={kpiData.calls.total} icon={<Phone size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="New Calls" total={kpiData.calls.new.total} icon={<PhoneOutgoing size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Followup Calls" total={kpiData.calls.followup.total} icon={<PhoneIncoming size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Picked" total={kpiData.picked.total} icon={<CheckCircle size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Not Picked" total={notPickedTotal} icon={<PhoneMissed size={18}/>} color="red" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Contract Share" total={kpiData.contract.total} icon={<FileText size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { subStatus: 'Contract Share' })} />
              <KpiCard title="Interested" total={kpiData.interested.total} icon={<TrendingUp size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { status: 'Interested' })} />
              <KpiCard title="Sent to Manager" total={kpiData.sentToManager.total} icon={<Send size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { isSubmitted: 'true' })} />
              <KpiCard title="Total Onboard" total={kpiData.onboarded.total} icon={<Briefcase size={18}/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { status: 'Onboard' })} />
            </div>
          </div>

          {/* ROW 2: NORMAL */}
          <div>
            <h4 className="text-xs font-black text-teal-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><UserCheck size={14} /> 2. Normal Clients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Leads" total={normalSearched} icon={<SearchIcon/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
              <KpiCard title="Calls" total={normalCalls} icon={<Phone size={18}/>} color="teal" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, {})} />
            </div>
          </div>

          {/* ROW 3: STARTUP (KEPT THESE CARDS) */}
          <div>
            <h4 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Rocket size={14} /> 3. Startup Clients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Leads" total={kpiData.searched.startup} icon={<SearchIcon/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Yes' })} />
              <KpiCard title="Calls" total={kpiData.calls.startup} icon={<Phone size={18}/>} color="orange" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Yes' })} />
            </div>
          </div>

          {/* ROW 4: MASTER UNION */}
          <div>
            <h4 className="text-xs font-black text-purple-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Briefcase size={14} /> 4. Master Union Clients</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Leads" total={kpiData.masterUnion.company} icon={<Briefcase size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
              <KpiCard title="Profiles" total={kpiData.masterUnion.profiles} icon={<UserCheck size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
              <KpiCard title="Calls" total={kpiData.masterUnion.calling} icon={<Phone size={18}/>} color="purple" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { startup: 'Master Union' })} />
            </div>
          </div>

          {/* ROW 5: FRANCHISE */}
          <div>
            <h4 className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><Award size={14} /> 5. Franchise Pipeline</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <KpiCard title="Franchise Discussed" total={kpiData.franchise.discussed.total} icon={<Phone size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { franchiseStatus: 'Discussed' })} />
              <KpiCard title="Form Ask" total={kpiData.franchise.formAsk.total} icon={<FileText size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { franchiseStatus: 'Form Ask' })} />
              <KpiCard title="Form Shared" total={kpiData.franchise.formShared.total} icon={<Send size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { franchiseStatus: 'Application Form Share' })} />
              <KpiCard title="Franchise Accepted" total={kpiData.franchise.accepted.total} icon={<CheckCircle size={18}/>} color="green" onClick={() => buildFilterUrl(router, fromDate, toDate, isAllData, { franchiseStatus: 'Form Filled' })} />
            </div>
          </div>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shadow-xl z-10 shrink-0">
        <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm sticky top-0 z-10 flex items-center justify-between">
          <h2 className="text-sm font-black text-[#103c7f] flex items-center gap-2 tracking-tight uppercase italic"><Clock size={18} className="text-orange-500" /> Follow-up Schedule</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {followUps.map((item) => (
                <div key={item.id} className="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all group relative">
                  <div className="pl-2.5">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1 mb-1.5">{item.company}</h4>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="p-1 bg-gray-100 rounded-full text-gray-500"><UserCheck size={10} /></div>
                        <span className="text-xs font-bold text-slate-700">{item.contact_person}</span>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2 mb-3">
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 flex items-center gap-1"><FileText size={10}/> Last Discussion</p>
                        <p className="text-xs text-slate-600 italic leading-snug">"{item.remarks}"</p>
                      </div>
                      <button onClick={() => router.push(`/corporate/leadgen/leads?search=${encodeURIComponent(item.company)}`)} className="w-full bg-blue-50 border border-blue-100 text-[#103c7f] text-[10px] font-bold py-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-colors flex items-center justify-center gap-1.5"><Phone size={12} className="fill-current"/> Call Now</button>
                  </div>
                </div>
            ))}
        </div>
        <div className="p-4 border-t border-gray-100 mt-auto bg-white">
          <Link href="/corporate/leadgen/leads"><button className="w-full bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm"><Database size={16} /> Open Full Database</button></Link>
        </div>
      </div>
    </div>
  );
}

// --- UPDATED KPI CARD: NO STRIP ---
function KpiCard({ title, total, icon, color, onClick }) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-700 border-blue-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100",
        green: "bg-green-50 text-green-700 border-green-100",
        red: "bg-red-50 text-red-700 border-red-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        teal: "bg-teal-50 text-teal-700 border-teal-100",
    };

    const activeColor = colorClasses[color] || colorClasses.blue;

    return (
        <div 
          className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full cursor-pointer"
          onClick={onClick}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${activeColor} border shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider leading-tight">{title}</p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black text-slate-800 leading-none ml-1">{total}</h3>
            </div>
        </div>
    );
}

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
}