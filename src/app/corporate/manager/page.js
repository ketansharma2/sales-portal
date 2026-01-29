"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // 👈 1. IMPORT ROUTER
import {
  Users, Briefcase, AlertCircle, MapPin, Filter, Calendar,
  UserCheck, Activity, CalendarClock, CalendarRange, Eye, UserPlus, X
} from "lucide-react";

export default function ManagerHome() {

  const router = useRouter(); // 👈 2. INITIALIZE ROUTER

  // --- FILTER STATE ---
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    selectedFse: "All"
  });

  // FSE team members for dropdown
  const [fseTeam, setFseTeam] = useState([]);
  const [fseLoading, setFseLoading] = useState(true);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const periodLabel = filters.fromDate ? "Selected Period" : "Current Month";

  // --- MONTHLY ONBOARDED DATA ---
  const [monthlyData, setMonthlyData] = useState({
    total: 0,
    fseData: {},
    month: "",
    loading: true,
    error: null
  });

  // --- WEEKLY PROJECTIONS DATA ---
  const [weeklyData, setWeeklyData] = useState({
    wpGreater50: 0,
    wpLess50: 0,
    total: 0,
    fseData: {},
    loading: true,
    error: null
  });

  // --- MONTHLY PROJECTIONS DATA ---
  const [monthlyProjData, setMonthlyProjData] = useState({
    mpGreater50: 0,
    mpLess50: 0,
    total: 0,
    loading: true,
    error: null
  });

  // --- TODAY'S ACTIVITY DATA ---
  const [todayActivity, setTodayActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // --- AVG VISITS DATA ---
  const [avgVisits, setAvgVisits] = useState("-");

  // --- PENDING ACTIONS COUNT ---
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch FSE team on mount
  useEffect(() => {
    fetchFseTeam();
  }, []);

  // Fetch monthly and weekly data on mount and when filters change
  useEffect(() => {
    fetchMonthlyOnboarded();
    fetchWeeklyProjections();
    fetchMonthlyProjections();
    fetchTodayActivity();
    fetchAvgVisits();
  }, [filters.selectedFse, filters.fromDate, filters.toDate]);

  // Fetch pending count on mount and periodically
  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchFseTeam = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/manager/fse-team', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setFseTeam(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch FSE team:', error);
    } finally {
      setFseLoading(false);
    }
  };

  const fetchMonthlyOnboarded = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      let params = [];
      if (filters.selectedFse !== "All") params.push(`fse_id=${filters.selectedFse}`);
      if (filters.fromDate) params.push(`from_date=${filters.fromDate}`);
      if (filters.toDate) params.push(`to_date=${filters.toDate}`);
      const query = params.length > 0 ? `?${params.join('&')}` : "";
      const url = `/api/corporate/manager/monthly-onboarded${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMonthlyData({
          total: data.data.onboarded,
          fseData: data.data.fseOnboarded,
          month: data.data.month,
          loading: false,
          error: null
        });
      } else {
        setMonthlyData(prev => ({
          ...prev,
          loading: false,
          error: data.error
        }));
      }
    } catch (error) {
      console.error('Failed to fetch monthly onboarded:', error);
      setMonthlyData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data'
      }));
    }
  };

  const fetchWeeklyProjections = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      let params = [];
      if (filters.selectedFse !== "All") params.push(`fse_id=${filters.selectedFse}`);
      if (filters.fromDate) params.push(`from_date=${filters.fromDate}`);
      if (filters.toDate) params.push(`to_date=${filters.toDate}`);
      const query = params.length > 0 ? `?${params.join('&')}` : "";
      const url = `/api/corporate/manager/weekly-projections${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setWeeklyData({
          wpGreater50: data.data.wpGreater50,
          wpLess50: data.data.wpLess50,
          total: data.data.total,
          fseData: data.data.fseProjections,
          loading: false,
          error: null
        });
      } else {
        setWeeklyData(prev => ({
          ...prev,
          loading: false,
          error: data.error
        }));
      }
    } catch (error) {
      console.error('Failed to fetch weekly projections:', error);
      setWeeklyData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data'
      }));
    }
  };

  const fetchMonthlyProjections = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      let params = [];
      if (filters.selectedFse !== "All") params.push(`fse_id=${filters.selectedFse}`);
      if (filters.fromDate) params.push(`from_date=${filters.fromDate}`);
      if (filters.toDate) params.push(`to_date=${filters.toDate}`);
      const query = params.length > 0 ? `?${params.join('&')}` : "";
      const url = `/api/corporate/manager/monthly-projections${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMonthlyProjData({
          mpGreater50: data.data.mpGreater50,
          mpLess50: data.data.mpLess50,
          total: data.data.total,
          fseData: data.data.fseProjections,
          loading: false,
          error: null
        });
      } else {
        setMonthlyProjData(prev => ({
          ...prev,
          loading: false,
          error: data.error
        }));
      }
    } catch (error) {
      console.error('Failed to fetch monthly projections:', error);
      setMonthlyProjData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load data'
      }));
    }
  };

  const fetchTodayActivity = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      const params = filters.selectedFse !== "All" ? `?fse_id=${filters.selectedFse}` : "";
      const url = `/api/corporate/manager/today-activity${params}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTodayActivity(data.data);
        setActivityLoading(false);
      } else {
        console.error('Failed to fetch today\'s activity:', data.error);
        setActivityLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s activity:', error);
      setActivityLoading(false);
    }
  };

  const fetchAvgVisits = async () => {
    if (filters.selectedFse === "All") {
      setAvgVisits("-")
      return
    }
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      let params = `fse_id=${filters.selectedFse}`
      if (filters.fromDate) params += `&from_date=${filters.fromDate}`
      if (filters.toDate) params += `&to_date=${filters.toDate}`
      const response = await fetch(`/api/corporate/manager/avg-visits?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setAvgVisits(parseFloat(data.data).toFixed(2))
      } else {
        setAvgVisits("0.00")
      }
    } catch (error) {
      console.error('Failed to fetch avg visits:', error)
      setAvgVisits("0.00")
    }
  }

  const fetchPendingCount = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const fromDate = startOfMonth.toISOString().split('T')[0]
      const toDate = endOfMonth.toISOString().split('T')[0]
      const response = await fetch(`/api/corporate/manager/pending-expenses?from_date=${fromDate}&to_date=${toDate}&status=pending`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setPendingCount(data.data.length)
      }
    } catch (error) {
      console.error('Failed to fetch pending count:', error)
    }
  }

  // --- LOGIC FOR TARGET WIDGET ---
  const targetPerFse = 12;
  const teamSize = fseTeam.length || 15; // Default to 15 if not loaded
  const totalTeamTarget = targetPerFse * teamSize;
  const achievedOnboarding = monthlyData.total;
  const progressPercent = Math.min((achievedOnboarding / totalTeamTarget) * 100, 100);

  // 1. KPI CARDS
  const stats = [
    {
      title: `Onboarded (${periodLabel})`,
      value: monthlyData.loading ? "..." : achievedOnboarding.toString(),
      subtext: "Total New Clients",
      icon: <UserCheck size={24}/>,
      color: "bg-[#103c7f] text-white",
      trend: "positive"
    },
    {
      title: `Avg. Visits (${periodLabel})`,
      value: avgVisits,
      subtext: "Per FSE / Day",
      icon: <MapPin size={24}/>,
      color: "bg-blue-50 text-[#103c7f]",
      trend: "neutral"
    },
    {
      title: "Weekly Projection (WP)",
      value: weeklyData.loading ? "..." : weeklyData.total.toString(),
      breakdown: [
        { label: "> 50%", count: weeklyData.loading ? 0 : weeklyData.wpGreater50, color: "text-purple-600" },
        { label: "< 50%", count: weeklyData.loading ? 0 : weeklyData.wpLess50, color: "text-gray-500" }
      ],
      icon: <CalendarClock size={24}/>,
      color: "bg-purple-50 text-purple-600",
      type: "projection"
    },
    {
      title: "Monthly Projection (MP)",
      value: monthlyProjData.loading ? "..." : monthlyProjData.total.toString(),
      breakdown: [
        { label: "> 50%", count: monthlyProjData.loading ? 0 : monthlyProjData.mpGreater50, color: "text-teal-600" },
        { label: "< 50%", count: monthlyProjData.loading ? 0 : monthlyProjData.mpLess50, color: "text-gray-500" }
      ],
      icon: <CalendarRange size={24}/>,
      color: "bg-teal-50 text-teal-600",
      type: "projection"
    }
  ];

  // 2. TEAM PERFORMANCE TABLE - now using todayActivity

  // 3. PENDING ACTIONS
  const [pendingActions] = useState([]);

  return (
    <div className="h-[calc(100vh-2rem)] bg-[#f8fafc] w-full font-['Calibri'] p-6 flex flex-col overflow-hidden">

      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 shrink-0 gap-4">
        <div>
           <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">Manager Command Center</h1>
           <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-none">Live Performance Dashboard</p>
           </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
           <div className="relative group"><div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div><input type="date" value={filters.fromDate || ''} className="pl-8 pr-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold text-[#103c7f] focus:ring-2 focus:ring-[#103c7f]/20 outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onChange={(e) => handleFilterChange('fromDate', e.target.value)}/></div>
           <span className="text-gray-300 font-bold">-</span>
           <div className="relative group"><div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Calendar size={14} /></div><input type="date" value={filters.toDate || ''} className="pl-8 pr-2 py-2 bg-gray-50 border-none rounded-lg text-xs font-bold text-[#103c7f] focus:ring-2 focus:ring-[#103c7f]/20 outline-none uppercase tracking-wide cursor-pointer hover:bg-gray-100 transition-colors" onChange={(e) => handleFilterChange('toDate', e.target.value)}/></div>
           <button onClick={() => { handleFilterChange('fromDate', ''); handleFilterChange('toDate', ''); }} className="p-2 text-gray-400 hover:text-[#103c7f] hover:bg-blue-50 rounded-lg transition-all" title="Clear Date Filters"><X size={16} /></button>
           <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>
           <div className="relative"><div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400"><Filter size={14} /></div><select className="pl-8 pr-4 py-2 bg-[#103c7f] text-white rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#a1db40] outline-none appearance-none cursor-pointer hover:bg-[#0d2e61] transition-colors uppercase tracking-wide" value={filters.selectedFse} onChange={(e) => handleFilterChange('selectedFse', e.target.value)}><option value="All">All Team Members</option>{fseTeam.map((fse, idx) => (<option key={idx} value={fse.user_id} className="bg-white text-gray-800">{fse.name}</option>))}</select></div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
        {stats.map((stat, idx) => (
          <div key={idx} className={`p-5 rounded-[20px] border shadow-sm transition-all hover:-translate-y-1 bg-white border-gray-100`}>
            <div className="flex justify-between items-start mb-3">
               <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
             { /* {stat.type === 'projection' && <span className="text-[9px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-500 uppercase">Pipeline</span>}*/}
            </div>
            <div>
               <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{stat.title}</h3>
               {stat.type === 'projection' ? (
                 <div className="mt-2 flex items-center justify-between">
                    <div><p className={`text-3xl font-black tracking-tight text-gray-800`}>{stat.value}</p><p className="text-[9px] font-bold text-gray-400">Total Leads</p></div>
                    <div className="flex flex-col gap-1 text-right">{stat.breakdown.map((item, bIdx) => (<div key={bIdx} className="flex items-center gap-2 justify-end"><span className={`text-xs font-black ${item.color}`}>{item.count}</span><span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.label}</span></div>))}</div>
                 </div>
               ) : (
                 <><p className={`text-3xl font-black mt-0.5 tracking-tight ${idx === 0 ? 'text-[#103c7f]' : 'text-gray-800'}`}>{stat.value}</p><p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">{stat.subtext}</p></>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 pb-2">

        {/* LEFT: TEAM PERFORMANCE TABLE */}
        <div className="flex-1 bg-white rounded-[24px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
           <div className="p-5 border-b border-gray-50 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-[#103c7f] uppercase italic tracking-tight">Today's Field Activity</h2>
              <button onClick={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/corporate/manager/team-leads?from_date=${today}&to_date=${today}`); }} className="text-[10px] font-black text-[#103c7f] uppercase bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-[#103c7f] hover:text-white transition-all">View Full Report</button>
           </div>
           <div className="overflow-y-auto flex-1 custom-scrollbar p-2">
              <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-white text-[9px] uppercase font-black text-gray-400 tracking-widest z-10 border-b border-gray-100">
                    <tr>
                       <th className="px-4 py-3">Team Member</th>
                       <th className="px-4 py-3 text-center">Visits Today</th>
                       <th className="px-4 py-3 text-center">Onboarded</th>
                       <th className="px-4 py-3 text-center">Status</th>
                       <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm">
                    {activityLoading ? (
                       <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading today's activity...</td>
                       </tr>
                    ) : todayActivity.length === 0 ? (
                       <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No activity data available</td>
                       </tr>
                    ) : (
                       todayActivity.map((member) => (
                          <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                             <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                   <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs border-2 ${member.status === 'Absent' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-blue-50 border-blue-100 text-[#103c7f]'}`}>{member.avatar}</div>
                                   <div><p className="font-bold text-gray-800 text-xs group-hover:text-[#103c7f] transition-colors">{member.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{member.role}</p></div>
                                </div>
                             </td>
                             <td className="px-4 py-3 text-center"><span className="font-black text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">{member.visitsToday}</span></td>
                             <td className="px-4 py-3 text-center">{member.onboardedToday === 'N/A' ? (<span className="text-gray-400 text-xs font-bold">N/A</span>) : member.onboardedToday > 0 ? (<span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-xs border border-green-100 flex items-center justify-center gap-1 w-fit mx-auto"><UserPlus size={12}/> {member.onboardedToday}</span>) : (<span className="text-gray-300 text-xs font-bold">-</span>)}</td>
                             <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${member.status === 'Absent' ? 'bg-red-50 text-red-600 border-red-100' : member.status === 'No Data' ? 'bg-gray-50 text-gray-600 border-gray-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{member.status}</span></td>
                             <td className="px-4 py-3 text-center"><button onClick={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/corporate/manager/team-leads?from_date=${today}&to_date=${today}&selectedFse=${member.id}`); }} className="p-1.5 text-gray-400 hover:text-[#103c7f] hover:bg-blue-50 rounded-lg transition-all" title="View Detailed Log"><Eye size={16} /></button></td>
                          </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {/* RIGHT: ACTION CENTER & TARGET WIDGET */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
           {/* Urgent Actions */}
           <div className="bg-[#103c7f] text-white rounded-[24px] p-6 shadow-lg shadow-[#103c7f]/20 relative overflow-hidden shrink-0">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black italic tracking-tight">{pendingCount} Pending Actions</h3>
                 <p className="text-[11px] font-medium text-blue-200 mt-1">Claims Approvals require your attention.</p>

                 {/* 👈 3. NAVIGATION BUTTON */}
                 <button
                    onClick={() => router.push('/corporate/manager/approvals')}
                    className="mt-4 w-full bg-white text-[#103c7f] py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#a1db40] transition-colors"
                 >
                    Review Now
                 </button>

              </div>
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           </div>

           {/* TARGET WIDGET (Unchanged) */}
           {/* TARGET WIDGET */}
           {/* 👇 Change: Added 'mb-6' to give space from bottom */}
           <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm flex-1 p-6 flex flex-col justify-center mb-8">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Team Onboarding Goal</h3>
                  <span className="text-[10px] font-bold bg-blue-50 text-[#103c7f] px-2 py-0.5 rounded">Target: {totalTeamTarget}</span>
              </div>

              <div className="relative w-full h-5 bg-gray-100 rounded-full overflow-hidden mb-2 shadow-inner">
                 <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#103c7f] to-blue-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                 ></div>
              </div>

              <div className="flex justify-between text-xs font-black text-[#103c7f]">
                 <span>{achievedOnboarding} Onboarded</span>
                 <span>{Math.round(progressPercent)}% Done</span>
              </div>

              <p className="text-[10px] text-gray-400 mt-3 italic text-center border-t border-gray-50 pt-2">
                 "Team needs <span className="text-[#103c7f] font-bold">{totalTeamTarget - achievedOnboarding} more</span> to hit monthly goal"
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}