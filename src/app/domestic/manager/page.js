"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // 👈 1. IMPORT ROUTER
import {
  Users, Briefcase, AlertCircle, MapPin, Filter, Calendar,
  UserCheck, Activity, CalendarClock, CalendarRange, Eye, UserPlus, X,
  LayoutGrid, Phone, CheckCircle, TrendingUp, Award, Database,
  PhoneOutgoing, XCircle, FileText, Send, Rocket, Search as SearchIcon
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
  
  // LeadGen team members for dropdown
  const [leadgenTeam, setLeadgenTeam] = useState([]);
  const [leadgenLoading, setLeadgenLoading] = useState(true);

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState("FSE"); // FSE or LeadGen

  // --- LEADGEN METRICS ---
  const [leadgenMetrics, setLeadgenMetrics] = useState({
    searched: 0,
    contacts: 0,
    calls: 0,
    picked: 0,
    notPicked: 0,
    onboarded: 0,
    interested: 0,
    contracts: 0,
    sentToManager: 0,
    loading: true
  });

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

  // Fetch team data on mount
  useEffect(() => {
    fetchFseTeam();
    fetchLeadgenTeam();
  }, []);

  // Fetch FSE data only when FSE tab is active
  useEffect(() => {
    if (activeTab !== 'FSE') {
      // Reset FSE data when LeadGen tab is active
      setMonthlyData(prev => ({ ...prev, loading: false }));
      setWeeklyData(prev => ({ ...prev, loading: false }));
      setMonthlyProjData(prev => ({ ...prev, loading: false }));
      setTodayActivity([]);
      setActivityLoading(false);
      setAvgVisits("-");
      return;
    }
    
    fetchMonthlyOnboarded();
    fetchWeeklyProjections();
    fetchMonthlyProjections();
    fetchTodayActivity();
    fetchAvgVisits();
  }, [filters.selectedFse, filters.fromDate, filters.toDate, activeTab]);

  // Fetch pending count on mount and periodically
  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch LeadGen metrics when LeadGen tab is active
  useEffect(() => {
    if (activeTab === 'LeadGen') {
      fetchLeadgenMetrics();
    }
  }, [activeTab, filters.selectedFse, filters.fromDate, filters.toDate]);

  const fetchFseTeam = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/manager/fse-team', {
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

  const fetchLeadgenTeam = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/manager/leadgen-users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setLeadgenTeam(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch LeadGen team:', error);
    } finally {
      setLeadgenLoading(false);
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
      const url = `/api/domestic/manager/monthly-onboarded${query}`;
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
      const url = `/api/domestic/manager/weekly-projections${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('Manager Weekly Projections:', data.data);
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
      const url = `/api/domestic/manager/monthly-projections${query}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('Manager Monthly Projections:', data.data);
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
      const url = `/api/domestic/manager/today-activity${params}`;
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
      const response = await fetch(`/api/domestic/manager/avg-visits?${params}`, {
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
      const response = await fetch(`/api/domestic/manager/pending-expenses?from_date=${fromDate}&to_date=${toDate}&status=pending`, {
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

  const fetchLeadgenMetrics = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      let params = [];
      if (filters.selectedFse !== 'All') params.push(`leadgen_id=${filters.selectedFse}`);
      if (filters.fromDate) params.push(`from_date=${filters.fromDate}`);
      if (filters.toDate) params.push(`to_date=${filters.toDate}`);
      const query = params.length > 0 ? `?${params.join('&')}` : '';
      const response = await fetch(`/api/domestic/manager/leadgen-metrics${query}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeadgenMetrics({
          searched: data.data.searched || 0,
          contacts: data.data.contacts || 0,
          calls: data.data.calls || 0,
          picked: data.data.picked || 0,
          notPicked: data.data.notPicked || 0,
          onboarded: data.data.onboarded || 0,
          interested: data.data.interested || 0,
          contracts: data.data.contracts || 0,
          sentToManager: data.data.sentToManager || 0,
          loading: false
        });
      } else {
        setLeadgenMetrics(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to fetch LeadGen metrics:', error);
      setLeadgenMetrics(prev => ({ ...prev, loading: false }));
    }
  };

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


  // 3. PENDING ACTIONS
  const [pendingActions] = useState([]);

  return (
    <div className="h-[calc(100vh-2rem)] bg-[#f8fafc] w-full font-['Calibri'] p-6 flex flex-col overflow-hidden">

      {/* HEADER & FILTERS */}
        <div className="flex items-center justify-between gap-4 mb-3 w-full shrink-0">

        {/* 1. LEFT: TITLE & LIVE BADGE */}
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none whitespace-nowrap">
            Manager Command Center
          </h1>
         
        </div>

        {/* 2. RIGHT: TABS & FILTERS (Merged Group) */}
        <div className="flex items-center gap-3 shrink-0">
            
          {/* A. TAB SWITCHER */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <button 
              onClick={() => setActiveTab('FSE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'FSE' ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
              <Briefcase size={14} /> FSE Team
            </button>
            <button 
              onClick={() => setActiveTab('LeadGen')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === 'LeadGen' ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            >
              <Phone size={14} /> LeadGen
            </button>
          </div>

          {/* B. FILTERS (Date & Team) */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm shrink-0">
                
            {/* Date Inputs */}
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

            {/* Vertical Divider */}
            <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

            {/* Team Selector */}
            <div className="relative">
              <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-white/70"><Filter size={14} /></div>
              <select 
                className="pl-8 pr-4 py-2 bg-[#103c7f] text-white rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#a1db40] outline-none appearance-none cursor-pointer hover:bg-[#0d2e61] transition-colors uppercase tracking-wide min-w-[140px]" 
                value={filters.selectedFse} 
                onChange={(e) => handleFilterChange('selectedFse', e.target.value)}
              >
                <option value="All">All {activeTab === 'LeadGen' ? 'LeadGen' : 'FSE'} Members</option>
                {(activeTab === 'LeadGen' ? leadgenTeam : fseTeam).map((member, idx) => (
                  <option key={idx} value={member.user_id} className="bg-white text-gray-800">{member.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
        </div>

      {activeTab === 'FSE' && (
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in zoom-in-95 duration-300">
            
            {/* KPI GRID: LG screens par 6 columns (Ek Hi Row) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4 shrink-0">
                {/* 1. Onboarded */}
                <CompactKpiCard 
                    title="Onboarded" 
                    value={monthlyData.loading ? "..." : monthlyData.total}  
                    icon={<UserCheck size={16}/>} 
                    color="blue"
                    onClick={() => {
                        // If no date filter is selected, use current month's 1st and last day
                        let fromDate = filters.fromDate;
                        let toDate = filters.toDate;
                        
                        if (!fromDate || !toDate) {
                            const now = new Date();
                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            // Use local date methods to avoid timezone issues
                            fromDate = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
                            toDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
                        }
                        
                        router.push(`/domestic/manager/fse-onboard?status=Onboarded&from=${fromDate}&to=${toDate}`);
                    }}
                />
                {/* 2. Avg Visits */}
                <CompactKpiCard title="Avg Visits" value={avgVisits}  icon={<MapPin size={16}/>} color="teal" />
                {/* 3. WP > 50 */}
                <CompactKpiCard 
                    title="WP > 50%" 
                    value={weeklyData.loading ? "..." : weeklyData.wpGreater50}  
                    icon={<CalendarClock size={16}/>} 
                    color="purple"
                    onClick={() => router.push('/domestic/manager/fse-onboard?projection=WP%20%3E%2050')}
                />
                {/* 4. WP < 50 */}
                <CompactKpiCard 
                    title="WP < 50%" 
                    value={weeklyData.loading ? "..." : weeklyData.wpLess50}  
                    icon={<AlertCircle size={16}/>} 
                    color="red"
                    onClick={() => router.push('/domestic/manager/fse-onboard?projection=WP%20%3C%2050')}
                />
                {/* 5. MP > 50 */}
                <CompactKpiCard 
                    title="MP > 50%" 
                    value={monthlyProjData.loading ? "..." : monthlyProjData.mpGreater50}  
                    icon={<CalendarRange size={16}/>} 
                    color="green"
                    onClick={() => router.push('/domestic/manager/fse-onboard?projection=MP%20%3E%2050')}
                />
                {/* 6. MP < 50 */}
                <CompactKpiCard 
                    title="MP < 50%" 
                    value={monthlyProjData.loading ? "..." : monthlyProjData.mpLess50}  
                    icon={<AlertCircle size={16}/>} 
                    color="orange"
                    onClick={() => router.push('/domestic/manager/fse-onboard?projection=MP%20%3C%2050')}
                />
            </div>

            {/* MAIN CONTENT SPLIT */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 pb-1">

                {/* LEFT: COMPACT ACTIVITY TABLE (Status Column Removed) */}
                <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-50 flex justify-between items-center shrink-0 bg-gray-50/50">
                        <h2 className="text-xs font-black text-[#103c7f] uppercase tracking-wider">Today's Activity</h2>
                        <button onClick={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/domestic/manager/team-leads?from_date=${today}&to_date=${today}`); }} className="text-[9px] font-bold text-blue-600 hover:underline">View Full Report</button>
                    </div>
                    <div className="overflow-y-auto flex-1 custom-scrollbar p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white text-[9px] uppercase font-bold text-gray-400 tracking-wider z-10 border-b border-gray-100">
                                <tr>
                                    <th className="px-3 py-2">Member</th>
                                    <th className="px-3 py-2 text-center">Visits</th>
                                    <th className="px-3 py-2 text-center">Onboarded</th>
                                    <th className="px-3 py-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {activityLoading ? (
                                    <tr><td colSpan="4" className="p-4 text-center text-gray-400 text-xs">Loading activity...</td></tr>
                                ) : todayActivity.length === 0 ? (
                                    <tr><td colSpan="4" className="p-4 text-center text-gray-400 text-xs">No activity logged today</td></tr>
                                ) : (
                                    todayActivity.map((member) => (
                                        <tr key={member.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] border ${member.status === 'Absent' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>{member.avatar}</div>
                                                    <div>
                                                        <p className="font-bold text-gray-700 text-[11px] group-hover:text-blue-700 leading-tight">{member.name}</p>
                                                        {/* Status is shown here as subtitle instead of separate column */}
                                                        <p className="text-[8px] text-gray-400 uppercase leading-none mt-0.5">{member.status}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-center"><span className="font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{member.visitsToday}</span></td>
                                            <td className="px-3 py-2 text-center">
                                                {member.onboardedToday > 0 ? (
                                                    <span className="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 flex items-center justify-center gap-1 w-fit mx-auto text-[10px]">
                                                        <UserPlus size={10}/> {member.onboardedToday}
                                                    </span>
                                                ) : <span className="text-gray-300 text-[10px]">-</span>}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button onClick={() => { const today = new Date().toISOString().split('T')[0]; router.push(`/domestic/manager/team-leads?from_date=${today}&to_date=${today}&selectedFse=${member.id}`); }} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="View Details">
                                                    <Eye size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: ACTION & TARGET (Ultra Compact) */}
                <div className="w-full md:w-1/3 flex flex-col gap-3">
                    
                    {/* Action Center */}
                    <div className="bg-[#103c7f] text-white rounded-xl p-4 shadow-md relative overflow-hidden shrink-0">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black italic tracking-tight">{pendingCount} Pending</h3>
                                <p className="text-[9px] text-blue-200 mt-0.5">Claims require approval.</p>
                            </div>
                            <button onClick={() => router.push('/domestic/manager/approvals')} className="bg-white text-[#103c7f] px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-[#a1db40] transition-colors shadow-sm">
                                Review
                            </button>
                        </div>
                        <div className="absolute -right-4 -top-8 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                    </div>

                    {/* Target Widget */}
                   
                </div>
            </div>
        </div>
      )}

      {activeTab === 'LeadGen' && (
        <div className="flex-1 flex gap-6 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* LEFT HALF: DASHBOARD CARDS */}
          <div className="w-1/2 overflow-y-auto custom-scrollbar p-1 pr-2">
            
            <div className="flex flex-col gap-5">
              
              {/* ---------------- SECTION 1: SUCCESS METRICS ---------------- */}
              <div>
                <h4 className="text-[10px] font-black text-teal-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                   <CheckCircle size={12} /> Success Metrics
                </h4>
                
                <div className="grid grid-cols-3 xl:grid-cols-3 gap-3"> 
                    <BigSuccessCard 
                        title="Onboarded" 
                        total={leadgenMetrics.loading ? '...' : leadgenMetrics.onboarded} 
                        icon={<Briefcase size={14}/>} 
                        color="teal"
                    />
                    <BigSuccessCard 
                        title="Interested" 
                        total={leadgenMetrics.loading ? '...' : leadgenMetrics.interested} 
                        icon={<TrendingUp size={14}/>} 
                        color="blue"
                    />
                   
                </div>
              </div>

             {/* ---------------- SECTION 2: LEADS OVERVIEW ---------------- */}
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 mt-1">
                   <Database size={12} /> Overview
                </h4>
                
                <div className="grid grid-cols-3 xl:grid-cols-3 gap-3">
                  
                  {/* Row 1 */}
                  <KpiCard title="Searched" total={leadgenMetrics.loading ? '...' : leadgenMetrics.searched} icon={<SearchIcon size={14}/>} color="blue" />
                  <KpiCard title="Contacts" total={leadgenMetrics.loading ? '...' : leadgenMetrics.contacts} icon={<UserCheck size={14}/>} color="blue" />
                  <KpiCard title="Total Calls" total={leadgenMetrics.loading ? '...' : leadgenMetrics.calls} icon={<Phone size={14}/>} color="purple" />

                  {/* Row 2 */}
                  <KpiCard title="Picked" total={leadgenMetrics.loading ? '...' : leadgenMetrics.picked} icon={<PhoneOutgoing size={14}/>} color="green" />
                  <KpiCard title="Not Picked" total={leadgenMetrics.loading ? '...' : leadgenMetrics.notPicked} icon={<XCircle size={14}/>} color="red" />
                  
                  {/* Row 3 */}
                  
                  {/* Sent to Manager */}
                  <KpiCard 
                      title="Sent to Mgr" 
                      total={leadgenMetrics.loading ? '...' : leadgenMetrics.sentToManager} 
                      icon={<Send size={14}/>} 
                      color="orange" 
                  />

                </div>
              </div>

            </div>
          </div>

          {/* RIGHT HALF: DETAILED REPORT / LOGS */}
          <div className="w-1/2 h-full bg-white rounded-[24px] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
                  <h2 className="text-xs font-black text-[#103c7f] uppercase tracking-wider">Detailed Report / Logs</h2>
                  <button className="text-[9px] font-bold text-blue-600 hover:underline">Export</button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <LayoutGrid size={24} />
                      </div>
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


// --- COMPACT CENTERED CARDS (WITH "STARTUPS" LABEL) ---

// --- 2-PART SPLIT CARDS (Top: Total, Bottom: Startups) ---

// --- 2-PART SPLIT CARDS (Top: Total, Bottom: Startups) ---

function BigSuccessCard({ title, total, icon, color, showStartup = false }) {
    const colors = {
        teal: "bg-teal-50 text-teal-600 border-teal-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };
    const style = colors[color] || colors.blue;

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-[120px] hover:shadow-md transition-all">
            
            {/* PART 1: TOP (Main Data) */}
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">{title}</p>
                    <div className={`p-1.5 rounded-lg ${style}`}>
                        {icon}
                    </div>
                </div>
                <h3 className="text-3xl font-black text-slate-800 leading-none mt-1">{total}</h3>
            </div>

            {/* PART 2: BOTTOM (Startup Strip) - Only show if showStartup is true */}
            {showStartup && (
                <div className="bg-orange-50 px-3 py-1.5 border-t border-orange-100 flex items-center gap-2">
                    <Rocket size={10} className="text-orange-600"/>
                    <span className="text-[10px] font-bold text-orange-700">
                        Startups
                    </span>
                </div>
            )}
        </div>
    )
}

function KpiCard({ title, total, icon, color }) {
    // Icon colors
    const iconColors = {
        blue: "text-blue-600 bg-blue-50",
        purple: "text-purple-600 bg-purple-50",
        green: "text-emerald-600 bg-emerald-50",
        red: "text-red-600 bg-red-50",
        orange: "text-orange-600 bg-orange-50",
    };
    const activeClass = iconColors[color] || iconColors.blue;

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between h-[100px] hover:shadow-md transition-all">
            
            {/* PART 1: TOP (Main Data) */}
            <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wide truncate w-[70%]" title={title}>{title}</p>
                    <div className={`p-1 rounded-md ${activeClass}`}>
                        {icon}
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 leading-none mt-[-2px]">{total}</h3>
            </div>

        </div>
    );
}
// --- COMPACT FSE KPI CARD ---
function CompactKpiCard({ title, value, subtitle, icon, color, onClick, projectionValue }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        teal: "bg-teal-50 text-teal-600",
        purple: "bg-purple-50 text-purple-600",
        red: "bg-red-50 text-red-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
    };
    const activeColor = colors[color] || colors.blue;

    return (
        <div 
            className={`bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 cursor-pointer ${onClick ? 'hover:border-blue-300' : ''}`}
            onClick={onClick}
        >
            <div className={`p-2 rounded-lg ${activeColor} shrink-0`}>
                {icon}
            </div>
            <div className="overflow-hidden">
                <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider truncate">{title}</p>
                <h4 className="text-lg font-black text-slate-800 leading-none mt-0.5">{value}</h4>
                <p className="text-[8px] text-gray-300 font-medium truncate">{subtitle}</p>
            </div>
        </div>
    );
}