"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import {
  Users, Briefcase, AlertCircle, MapPin, Filter, Calendar,
  UserCheck, CalendarClock, CalendarRange, Eye, UserPlus, X,
  LayoutGrid, Phone, CheckCircle, TrendingUp, Database, 
  PhoneOutgoing, FileText, Send, Rocket, Search as SearchIcon,
  PhoneIncoming, PhoneMissed, FileCheck, Smartphone, Award
} from "lucide-react";

export default function ManagerHome() {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("LeadGen");
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    selectedFse: "All"
  });
  const [fseTeam, setFseTeam] = useState([]);
  const [leadgenTeam, setLeadgenTeam] = useState([]);
  const [monthlyData, setMonthlyData] = useState({ total: 0, fseData: {}, month: "", loading: true, error: null });
  const [weeklyData, setWeeklyData] = useState({ wpGreater50: 0, wpLess50: 0, total: 0, fseData: {}, loading: true, error: null });
  const [monthlyProjData, setMonthlyProjData] = useState({ mpGreater50: 0, mpLess50: 0, total: 0, loading: true, error: null });
  const [todayActivity, setTodayActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [avgVisits, setAvgVisits] = useState("-");
  const [pendingCount, setPendingCount] = useState(0);
  const [leadgenMetrics, setLeadgenMetrics] = useState({
    searched: { total: 0, startup: 0 }, contacts: { total: 0, startup: 0 },
    calls: { total: 0, startup: 0 }, picked: { total: 0, startup: 0 },
    notPicked: { total: 0, startup: 0 }, accepted: { total: 0, startup: 0 },
    contracts: { total: 0, startup: 0 }, discussed: { total: 0, startup: 0 },
    formShared: { total: 0, startup: 0 }, sentToManager: { total: 0, startup: 0 },
    onboarded: { total: 0, startup: 0 }, interested: { total: 0, startup: 0 },
    loading: true
  });

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const periodLabel = filters.fromDate ? "Selected Period" : "Current Month";

  const fetchLeadgenMetrics = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      let params = [];
      if (filters.selectedFse !== 'All') params.push(`leadgen_id=${filters.selectedFse}`);
      if (filters.fromDate) params.push(`from_date=${filters.fromDate}`);
      if (filters.toDate) params.push(`to_date=${filters.toDate}`);
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await fetch(`/api/corporate/manager/leadgen-metrics${query}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeadgenMetrics({
          searched: data.data.searched || { total: 0, startup: 0 },
          contacts: data.data.contacts || { total: 0, startup: 0 },
          calls: data.data.calls || { total: 0, startup: 0 },
          picked: data.data.picked || { total: 0, startup: 0 },
          notPicked: data.data.notPicked || { total: 0, startup: 0 },
          accepted: data.data.accepted || { total: 0, startup: 0 },
          contracts: data.data.contracts || { total: 0, startup: 0 },
          discussed: data.data.discussed || { total: 0, startup: 0 },
          formShared: data.data.formShared || { total: 0, startup: 0 },
          sentToManager: data.data.sentToManager || { total: 0, startup: 0 },
          onboarded: data.data.onboarded || { total: 0, startup: 0 },
          interested: data.data.interested || { total: 0, startup: 0 },
          loading: false
        });
      } else { setLeadgenMetrics(prev => ({ ...prev, loading: false })); }
    } catch (error) {
      console.error('Failed to fetch LeadGen metrics:', error);
      setLeadgenMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => { if (activeTab === 'LeadGen') fetchLeadgenMetrics(); }, [activeTab, filters.selectedFse, filters.fromDate, filters.toDate]);
  
  // Fetch team data regardless of active tab
  useEffect(() => {
    const fetchTeamData = async () => {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      
      const fseRes = await fetch('/api/corporate/manager/fse-team', { headers });
      const fseData = await fseRes.json();
      if (fseData.success) setFseTeam(fseData.data);
      
      const lgRes = await fetch('/api/corporate/manager/leadgen-users', { headers });
      const lgData = await lgRes.json();
      if (lgData.success) setLeadgenTeam(lgData.data);
    };
    fetchTeamData();
  }, []);
  
  // Only fetch FSE data when FSE tab is active
  useEffect(() => {
    if (activeTab !== 'FSE') return; // Skip if not FSE tab
    
    const fetchFseData = async () => {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      
      let q = filters.selectedFse !== "All" ? `?fse_id=${filters.selectedFse}` : "";
      if (filters.fromDate) q += q ? `&from_date=${filters.fromDate}` : `?from_date=${filters.fromDate}`;
      if (filters.toDate) q += q.includes('?') ? `&to_date=${filters.toDate}` : `?to_date=${filters.toDate}`;
      
      const monRes = await fetch(`/api/corporate/manager/monthly-onboarded${q}`, { headers });
      const monData = await monRes.json();
      if (monData.success) setMonthlyData({ ...monData.data, month: monData.data.month, loading: false, error: null });
      
      const wpRes = await fetch(`/api/corporate/manager/weekly-projections${q}`, { headers });
      const wpData = await wpRes.json();
      if (wpData.success) setWeeklyData({ ...wpData.data, loading: false, error: null });
      
      const mpRes = await fetch(`/api/corporate/manager/monthly-projections${q}`, { headers });
      const mpData = await mpRes.json();
      if (mpData.success) setMonthlyProjData({ ...mpData.data, loading: false, error: null });
      
      const actRes = await fetch(`/api/corporate/manager/today-activity${filters.selectedFse !== "All" ? `?fse_id=${filters.selectedFse}` : ""}`, { headers });
      const actData = await actRes.json();
      if (actData.success) { setTodayActivity(actData.data); setActivityLoading(false); }
      
      if (filters.selectedFse !== "All") {
        let av = `fse_id=${filters.selectedFse}`;
        if (filters.fromDate) av += `&from_date=${filters.fromDate}`;
        if (filters.toDate) av += `&to_date=${filters.toDate}`;
        const avRes = await fetch(`/api/corporate/manager/avg-visits?${av}`, { headers });
        const avData = await avRes.json();
        if (avData.success) setAvgVisits(parseFloat(avData.data).toFixed(2));
      } else setAvgVisits("-");
    };
    
    fetchFseData();
  }, [activeTab, filters.selectedFse, filters.fromDate, filters.toDate]);

  useEffect(() => {
    const fetchPending = async () => {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const now = new Date();
      const fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const res = await fetch(`/api/corporate/manager/pending-expenses?from_date=${fromDate}&to_date=${toDate}&status=pending`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) setPendingCount(data.data.length);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-[calc(100vh-2rem)] bg-[#f8fafc] w-full font-['Calibri'] p-6 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-6 w-full shrink-0">
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none whitespace-nowrap">Manager Command Center</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-none">Live Performance Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <button onClick={() => setActiveTab('FSE')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'FSE' ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}><Briefcase size={14} /> FSE Team</button>
            <button onClick={() => setActiveTab('LeadGen')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'LeadGen' ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}><Phone size={14} /> LeadGen</button>
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <div className="relative group">
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div>
              <input type="date" value={filters.fromDate || ''} className="pl-8 pr-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold text-[#103c7f] focus:ring-2 focus:ring-[#103c7f]/20 outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors w-[110px]" onChange={(e) => handleFilterChange('fromDate', e.target.value)}/>
            </div>
            <span className="text-gray-300 font-bold">-</span>
            <div className="relative group">
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div>
              <input type="date" value={filters.toDate || ''} className="pl-8 pr-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold text-[#103c7f] focus:ring-2 focus:ring-[#103c7f]/20 outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors w-[110px]" onChange={(e) => handleFilterChange('toDate', e.target.value)}/>
            </div>
            <button onClick={() => { handleFilterChange('fromDate', ''); handleFilterChange('toDate', ''); }} className="p-2 text-gray-400 hover:text-[#103c7f] hover:bg-blue-50 rounded-lg transition-all" title="Clear Date Filters"><X size={16} /></button>
            <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
            <div className="relative">
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-white/70"><Filter size={14} /></div>
              <select className="pl-8 pr-4 py-2 bg-[#103c7f] text-white rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#a1db40] outline-none appearance-none cursor-pointer hover:bg-[#0d2e61] transition-colors uppercase tracking-wide min-w-[140px]" value={filters.selectedFse} onChange={(e) => handleFilterChange('selectedFse', e.target.value)}>
                <option value="All">All {activeTab === 'LeadGen' ? 'LeadGen' : 'FSE'} Members</option>
                {(activeTab === 'LeadGen' ? leadgenTeam : fseTeam).map((member, idx) => (<option key={idx} value={member.user_id} className="bg-white text-gray-800">{member.name}</option>))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'FSE' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 shrink-0">
            <CompactKpiCard title="Onboarded" value={monthlyData.loading ? "..." : monthlyData.total} icon={<UserCheck size={16}/>} color="blue" />
            <CompactKpiCard title="Avg Visits" value={avgVisits} icon={<MapPin size={16}/>} color="teal" />
            <CompactKpiCard title="WP > 50%" value={weeklyData.loading ? "..." : weeklyData.wpGreater50} icon={<CalendarClock size={16}/>} color="purple" />
            <CompactKpiCard title="WP < 50%" value={weeklyData.loading ? "..." : weeklyData.wpLess50} icon={<AlertCircle size={16}/>} color="red" />
            <CompactKpiCard title="MP > 50%" value={monthlyProjData.loading ? "..." : monthlyProjData.mpGreater50} icon={<CalendarRange size={16}/>} color="green" />
            <CompactKpiCard title="MP < 50%" value={monthlyProjData.loading ? "..." : monthlyProjData.mpLess50} icon={<AlertCircle size={16}/>} color="orange" />
          </div>
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 pb-1">
            <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-50 flex justify-between items-center shrink-0 bg-gray-50/50">
                <h2 className="text-xs font-black text-[#103c7f] uppercase tracking-wider">Today's Activity</h2>
                <button onClick={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/corporate/manager/team-leads?from_date=${today}&to_date=${today}`); }} className="text-[9px] font-bold text-blue-600 hover:underline">View Full Report</button>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white text-[9px] uppercase font-bold text-gray-400 tracking-wider z-10 border-b border-gray-100">
                    <tr><th className="px-3 py-2">Member</th><th className="px-3 py-2 text-center">Visits</th><th className="px-3 py-2 text-center">Onboarded</th><th className="px-3 py-2 text-center">Action</th></tr>
                  </thead>
                  <tbody className="text-xs">
                    {activityLoading ? (<tr><td colSpan="4" className="p-4 text-center text-gray-400 text-xs">Loading activity...</td></tr>) : todayActivity.length === 0 ? (<tr><td colSpan="4" className="p-4 text-center text-gray-400 text-xs">No activity logged today</td></tr>) : todayActivity.map((member) => (
                      <tr key={member.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                        <td className="px-3 py-2"><div className="flex items-center gap-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] border ${member.status === 'Absent' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>{member.avatar}</div><div><p className="font-bold text-gray-700 text-[11px] group-hover:text-blue-700 leading-tight">{member.name}</p><p className="text-[8px] text-gray-400 uppercase leading-none mt-0.5">{member.status}</p></div></div></td>
                        <td className="px-3 py-2 text-center"><span className="font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{member.visitsToday}</span></td>
                        <td className="px-3 py-2 text-center">{member.onboardedToday > 0 ? (<span className="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center justify-center gap-1 w-fit mx-auto text-[10px]"><UserPlus size={10}/> {member.onboardedToday}</span>) : <span className="text-gray-300 text-[10px]">-</span>}</td>
                        <td className="px-3 py-2 text-center"><button onClick={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/corporate/manager/team-leads?from_date=${today}&to_date=${today}&selectedFse=${member.id}`); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="View Details"><Eye size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="w-full md:w-1/3 flex flex-col gap-3">
              <div className="bg-[#103c7f] text-white rounded-xl p-4 shadow-md relative overflow-hidden shrink-0">
                <div className="relative z-10 flex justify-between items-center">
                  <div><h3 className="text-lg font-black italic tracking-tight">{pendingCount} Pending</h3><p className="text-[9px] text-blue-200 mt-0.5">Claims require approval.</p></div>
                  <button onClick={() => router.push('/corporate/manager/approvals')} className="bg-white text-[#103c7f] px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-[#a1db40] transition-colors shadow-sm">Review</button>
                </div>
                <div className="absolute -right-4 -top-8 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LeadGen' && (
        <div className="flex-1 flex gap-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex flex-col gap-5 pb-4">
                {/* Cards as per user requirement */}
                <div className="grid grid-cols-3 gap-3">
                  <BigSuccessCard title="Onboarded" total={leadgenMetrics.loading ? '...' : leadgenMetrics.onboarded.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.onboarded.startup} icon={<UserCheck size={14}/>} color="teal" />
                  <BigSuccessCard title="Interested" total={leadgenMetrics.loading ? '...' : leadgenMetrics.interested.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.interested.startup} icon={<TrendingUp size={14}/>} color="blue" />
                  <BigSuccessCard title="Franchise Accepted" total={leadgenMetrics.loading ? '...' : leadgenMetrics.accepted.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.accepted.startup} icon={<Award size={14}/>} color="green" />
                  <BigSuccessCard title="Searched" total={leadgenMetrics.loading ? '...' : leadgenMetrics.searched.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.searched.startup} icon={<SearchIcon size={14}/>} color="orange" />
                  <BigSuccessCard title="Contact Persons" total={leadgenMetrics.loading ? '...' : leadgenMetrics.contacts.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.contacts.startup} icon={<Users size={14}/>} color="purple" />
                  <BigSuccessCard title="Total Calls" total={leadgenMetrics.loading ? '...' : leadgenMetrics.calls.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.calls.startup} icon={<Phone size={14}/>} color="red" />
                  <BigSuccessCard title="Picked" total={leadgenMetrics.loading ? '...' : leadgenMetrics.picked.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.picked.startup} icon={<PhoneIncoming size={14}/>} color="green" />
                  <BigSuccessCard title="Not Picked" total={leadgenMetrics.loading ? '...' : leadgenMetrics.notPicked.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.notPicked.startup} icon={<PhoneMissed size={14}/>} color="red" />
                  <BigSuccessCard title="Contracts Share" total={leadgenMetrics.loading ? '...' : leadgenMetrics.contracts.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.contracts.startup} icon={<FileCheck size={14}/>} color="teal" />
                  <BigSuccessCard title="Franchise Discussed" total={leadgenMetrics.loading ? '...' : leadgenMetrics.discussed.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.discussed.startup} icon={<Send size={14}/>} color="orange" />
                  <BigSuccessCard title="App. Forms Shared" total={leadgenMetrics.loading ? '...' : leadgenMetrics.formShared.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.formShared.startup} icon={<Smartphone size={14}/>} color="purple" />
                  <BigSuccessCard title="Sent to Manager" total={leadgenMetrics.loading ? '...' : leadgenMetrics.sentToManager.total} startup={leadgenMetrics.loading ? '...' : leadgenMetrics.sentToManager.startup} icon={<Send size={14}/>} color="blue" />
                </div>
              </div>
            </div>
          </div>
          <div className="w-1/2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
              <h2 className="text-xs font-black text-[#103c7f] uppercase tracking-wider">Detailed Report / Logs</h2>
              <button className="text-[9px] font-bold text-blue-600 hover:underline">Export</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3"><LayoutGrid size={24} /></div>
                <p className="text-xs font-bold uppercase tracking-widest">Detailed Report / Logs</p>
                <p className="text-[10px] text-gray-300 mt-1">Content will appear here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BigSuccessCard({ title, total, startup, icon, color }) {
  const colors = { teal: "bg-teal-50 text-teal-600 border-teal-100", blue: "bg-blue-50 text-blue-600 border-blue-100", green: "bg-emerald-50 text-emerald-600 border-emerald-100", purple: "bg-purple-50 text-purple-600 border-purple-100", orange: "bg-orange-50 text-orange-600 border-orange-100", red: "bg-red-50 text-red-600 border-red-100" };
  const style = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-[120px] hover:shadow-md transition-all">
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">{title}</p>
          <div className={`p-1.5 rounded-lg ${style}`}>{icon}</div>
        </div>
        <h3 className="text-3xl font-black text-slate-800 leading-none mt-1">{total}</h3>
      </div>
      <div className="bg-orange-50 px-3 py-1.5 border-t border-orange-100 flex items-center gap-2">
        <Rocket size={10} className="text-orange-600"/>
        <span className="text-[10px] font-bold text-orange-700">{startup} <span className="opacity-70 text-[9px] uppercase tracking-wide">Startups</span></span>
      </div>
    </div>
  );
}

function CompactKpiCard({ title, value, icon, color }) {
  const colors = { blue: "bg-blue-50 text-blue-600", teal: "bg-teal-50 text-teal-600", purple: "bg-purple-50 text-purple-600", red: "bg-red-50 text-red-600", green: "bg-emerald-50 text-emerald-600", orange: "bg-orange-50 text-orange-600" };
  const activeColor = colors[color] || colors.blue;
  return (
    <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3">
      <div className={`p-2 rounded-lg ${activeColor} shrink-0`}>{icon}</div>
      <div className="overflow-hidden">
        <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider truncate">{title}</p>
        <h4 className="text-lg font-black text-slate-800 leading-none mt-0.5">{value}</h4>
      </div>
    </div>
  );
}
