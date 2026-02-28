"use client";
import { useState, useEffect } from "react";
import { 
  Target, Edit2, Save, BarChart3, Plus, X, 
  MapPin, Phone, Users, MessageSquare, Briefcase,
  Calendar, History, TrendingUp, Filter, Search
} from "lucide-react";

export default function CorporateManagerTargetPage() {
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("current"); // 'history' | 'current' | 'projection'
  const [currentDate] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-02"
  
  // Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'

  // Filters
  const [historyFilter, setHistoryFilter] = useState({ month: "", member: "" });
  const [filteredHistoryData, setFilteredHistoryData] = useState([]);
  const [projectionMonth, setProjectionMonth] = useState(
    new Date().toISOString().slice(0, 7) // Current month YYYY-MM
  );

  // Form State
  const [targetForm, setTargetForm] = useState({
    memberId: "", month: "", 
    visits: "", onboards: "", calls: "", leads: "", remarks: "",
    targetId: "", workingDays: "24"
  });
  
  // Separate data for each tab
  const [historyData, setHistoryData] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [projectionData, setProjectionData] = useState([]); // For member targets
  const [hodProjectionData, setHodProjectionData] = useState([]); // For HOD assigned targets
  const [filteredProjectionData, setFilteredProjectionData] = useState([]); // For member targets filtered
  const [filteredHodProjectionData, setFilteredHodProjectionData] = useState([]); // For HOD targets filtered
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Team members for each tab
  const [historyMembers, setHistoryMembers] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [projectionMembers, setProjectionMembers] = useState([]);

  // --- FETCH TEAM MEMBERS (FSEs and Leadgens) ---
  const fetchTeamMembers = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/manager/team-members', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        const members = result.data.map(m => ({
          id: m.user_id,
          name: m.name,
          role: m.role.includes('FSE') ? 'FSE' : 'LeadGen'
        }));
        setCurrentMembers(members);
        setProjectionMembers(members);
        setHistoryMembers(members);
        return members;
      }
      return [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  };

  // --- FETCH TARGETS FOR CURRENT TAB ---
  const fetchCurrentTargets = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/manager/current-targets', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching current targets:', error);
      return null;
    }
  };

  // --- FETCH TARGETS FOR HISTORY TAB ---
  const fetchHistoryTargets = async (month = null) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const monthParam = month ? `${month}-01` : '';
      const url = monthParam 
        ? `/api/corporate/manager/history-targets?month=${monthParam.substring(0, 7)}` 
        : '/api/corporate/manager/history-targets';
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching history targets:', error);
      return null;
    }
  };

  // --- FETCH TARGETS FOR PROJECTION TAB ---
  const fetchProjectionTargets = async (month = null) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const monthParam = month || '';
      
      // Fetch both HOD targets and Member targets in parallel
      const [hodResponse, memberResponse] = await Promise.all([
        fetch(`/api/corporate/manager/hod-targets${monthParam ? `?month=${monthParam}` : ''}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`/api/corporate/manager/member-targets${monthParam ? `?month=${monthParam}` : ''}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);
      
      const hodResult = await hodResponse.json();
      const memberResult = await memberResponse.json();
      
      return {
        hodTargets: hodResult.success && hodResult.data ? hodResult.data.targets : [],
        memberTargets: memberResult.success && memberResult.data ? memberResult.data.targets || memberResult.data : []
      };
    } catch (error) {
      console.error('Error fetching projection targets:', error);
      return { hodTargets: [], memberTargets: [] };
    }
  };

  // --- LOAD DATA FROM API ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Fetch team members
      await fetchTeamMembers();
      
      if (activeTab === 'history') {
        const targetData = await fetchHistoryTargets(null);
        if (targetData && targetData.targets && targetData.targets.length > 0) {
          const transformedData = targetData.targets.map((target, idx) => ({
            id: idx + 1,
            memberId: target.user_id,
            name: target.name || 'Unknown',
            role: target.role || 'FSE',
            month: target.month || currentDate,
            visits: target.visits || 0,
            onboards: target.onboards || 0,
            calls: target.calls || 0,
            leads: target.leads || 0,
            achievedVisits: target.achieved_visits || 0,
            achievedOnboards: target.achieved_onboards || 0,
            achievedCalls: target.achieved_calls || 0,
            achievedLeads: target.achieved_leads || 0,
            remarks: target.remarks || ''
          }));
          setHistoryData(transformedData);
        } else {
          setHistoryData([]);
        }
      } else if (activeTab === 'current') {
        const targetData = await fetchCurrentTargets();
        if (targetData && targetData.targets && targetData.targets.length > 0) {
          const transformedData = targetData.targets.map((target, idx) => ({
            id: idx + 1,
            memberId: target.user_id,
            name: target.name || 'Unknown',
            role: target.role || 'FSE',
            month: target.month ? target.month.substring(0, 7) : currentDate,
            visits: target.visits || 0,
            onboards: target.onboards || 0,
            calls: target.calls || 0,
            leads: target.leads || 0,
            achievedVisits: target.achieved_visits || 0,
            achievedOnboards: target.achieved_onboards || 0,
            achievedCalls: target.achieved_calls || 0,
            achievedLeads: target.achieved_leads || 0,
            remarks: target.remarks || ''
          }));
          setCurrentData(transformedData);
        } else {
          setCurrentData([]);
        }
      } else if (activeTab === 'projection') {
        // Fetch both HOD targets and member targets
        const targetData = await fetchProjectionTargets(null);
        
        // Transform HOD targets
        if (targetData.hodTargets && targetData.hodTargets.length > 0) {
          const hodTransformedData = targetData.hodTargets.map((target, idx) => ({
            id: target.id || idx + 1,
            month: target.month || projectionMonth,
            workingDays: target.workingDays || 0,
            fseCount: target.fseCount || 0,
            callersCount: target.callersCount || 0,
            visitsPerFse: target.visitsPerFse || 0,
            onboardPerFse: target.onboardPerFse || 0,
            callsPerCaller: target.callsPerCaller || 0,
            leadsPerCaller: target.leadsPerCaller || 0,
            totalVisits: target.totalVisits || 0,
            totalOnboards: target.totalOnboards || 0,
            totalCalls: target.totalCalls || 0,
            totalLeads: target.totalLeads || 0,
            remarks: target.remarks || ''
          }));
          setHodProjectionData(hodTransformedData);
        } else {
          setHodProjectionData([]);
        }
        
        // Transform member targets
        if (targetData.memberTargets && targetData.memberTargets.length > 0) {
          const memberTransformedData = targetData.memberTargets.map((target, idx) => ({
            id: target.id || idx + 1,
            targetId: target.id,
            month: target.month || projectionMonth,
            fseId: target.fseId,
            memberId: target.fseId,
            name: target.fseName || 'Unknown',
            role: target.fseRole || 'FSE',
            visits: target.monthlyVisits || 0,
            onboards: target.monthlyOnboards || 0,
            calls: target.monthlyCalls || 0,
            leads: target.monthlyLeads || 0,
            workingDays: target.workingDays || 0,
            remarks: target.remarks || ''
          }));
          setProjectionData(memberTransformedData);
        } else {
          setProjectionData([]);
        }
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [activeTab, currentDate, refreshKey]);

  // --- REFETCH PROJECTION DATA WHEN MONTH CHANGES ---
  useEffect(() => {
    if (activeTab !== 'projection') return;
    
    const fetchProjectionData = async () => {
      setLoading(true);
      const targetData = await fetchProjectionTargets(projectionMonth || null);
      
      // Transform HOD targets
      if (targetData.hodTargets && targetData.hodTargets.length > 0) {
        const hodTransformedData = targetData.hodTargets.map((target, idx) => ({
          id: target.id || idx + 1,
          month: target.month || projectionMonth,
          workingDays: target.workingDays || 0,
          fseCount: target.fseCount || 0,
          callersCount: target.callersCount || 0,
          visitsPerFse: target.visitsPerFse || 0,
          onboardPerFse: target.onboardPerFse || 0,
          callsPerCaller: target.callsPerCaller || 0,
          leadsPerCaller: target.leadsPerCaller || 0,
          totalVisits: target.totalVisits || 0,
          totalOnboards: target.totalOnboards || 0,
          totalCalls: target.totalCalls || 0,
          totalLeads: target.totalLeads || 0,
          remarks: target.remarks || ''
        }));
        setHodProjectionData(hodTransformedData);
      } else {
        setHodProjectionData([]);
      }
      
      // Transform member targets
      if (targetData.memberTargets && targetData.memberTargets.length > 0) {
        const memberTransformedData = targetData.memberTargets.map((target, idx) => ({
          id: target.id || idx + 1,
          targetId: target.id,
          month: target.month || projectionMonth,
          fseId: target.fseId,
          memberId: target.fseId,
          name: target.fseName || 'Unknown',
          role: target.fseRole || 'FSE',
          visits: target.monthlyVisits || 0,
          onboards: target.monthlyOnboards || 0,
          calls: target.monthlyCalls || 0,
          leads: target.monthlyLeads || 0,
          workingDays: target.workingDays || 0,
          remarks: target.remarks || ''
        }));
        setProjectionData(memberTransformedData);
      } else {
        setProjectionData([]);
      }
      
      setLoading(false);
    };
    
    fetchProjectionData();
  }, [projectionMonth, activeTab]);

  // --- FRONTEND FILTERING ---
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (activeTab === 'history' && historyData.length > 0) {
      const filtered = historyData.filter(item => {
        const monthMatch = !historyFilter.month || item.month === historyFilter.month;
        const memberMatch = !historyFilter.member || String(item.memberId) === String(historyFilter.member);
        const isPastMonth = item.month < currentMonth;
        return monthMatch && memberMatch && isPastMonth;
      });
      setFilteredHistoryData(filtered);
    } else if (activeTab === 'history') {
      setFilteredHistoryData(historyData.filter(item => item.month < new Date().toISOString().slice(0, 7)));
    } else {
      setFilteredHistoryData([]);
    }
    
    if (activeTab === 'projection') {
      // Filter HOD targets
      if (hodProjectionData.length > 0) {
        const hodFiltered = hodProjectionData.filter(item => {
          const monthMatch = !projectionMonth || item.month === projectionMonth;
          return monthMatch;
        });
        setFilteredHodProjectionData(hodFiltered);
      } else {
        setFilteredHodProjectionData([]);
      }
      
      // Filter member targets
      if (projectionData.length > 0) {
        const memberFiltered = projectionData.filter(item => {
          const monthMatch = !projectionMonth || item.month === projectionMonth;
          return monthMatch;
        });
        setFilteredProjectionData(memberFiltered);
      } else {
        setFilteredProjectionData([]);
      }
    } else {
      setFilteredHodProjectionData([]);
      setFilteredProjectionData([]);
    }
  }, [historyFilter, historyData, activeTab, projectionMonth, projectionData, hodProjectionData]);

  // --- HANDLERS ---
  const openModal = (mode, data = null) => {
    setModalMode(mode);
    
    if (mode === 'edit' && data) {
      setTargetForm({
        memberId: data.memberId,
        targetId: data.targetId || data.id || '',
        month: activeTab === 'projection' ? projectionMonth : currentDate,
        visits: data.visits || '',
        onboards: data.onboards || '',
        calls: data.calls || '',
        leads: data.leads || '',
        workingDays: data.workingDays || '24',
        remarks: data.remarks || ""
      });
    } else {
      setTargetForm({
        memberId: "", 
        targetId: "",
        month: activeTab === 'projection' ? projectionMonth : currentDate,
        visits: "", onboards: "", calls: "", leads: "", 
        workingDays: "24",
        remarks: ""
      });
    }
    setIsTargetModalOpen(true);
  };

  const handleMemberSelect = (e) => {
    const selectedId = e.target.value;
    const member = getMembersList().find(m => String(m.id) === selectedId);
    
    // Auto-set fields based on role
    if (member?.role === 'FSE') {
      setTargetForm({
        ...targetForm,
        memberId: selectedId,
        visits: targetForm.visits || '',
        onboards: targetForm.onboards || '',
        calls: '0',
        leads: '0',
        remarks: targetForm.remarks
      });
    } else if (member?.role === 'LeadGen') {
      setTargetForm({
        ...targetForm,
        memberId: selectedId,
        visits: '0',
        onboards: '0',
        calls: targetForm.calls || '',
        leads: targetForm.leads || '',
        remarks: targetForm.remarks
      });
    } else {
      setTargetForm({ ...targetForm, memberId: selectedId });
    }
  };

  const handleFormChange = (e) => {
    const value = e.target.value;
    setTargetForm({ ...targetForm, [e.target.name]: value });
  };

  const handleSetTarget = async (e) => {
    e.preventDefault();
    if(!targetForm.memberId) return alert("Please select a team member");
    
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const monthValue = targetForm.month || projectionMonth;
      
      // Build request body for new API
      const targetPayload = {
        month: monthValue,
        fseId: targetForm.memberId,
        monthlyVisits: parseInt(targetForm.visits) || 0,
        monthlyOnboards: parseInt(targetForm.onboards) || 0,
        monthlyCalls: parseInt(targetForm.calls) || 0,
        monthlyLeads: parseInt(targetForm.leads) || 0,
        workingDays: parseInt(targetForm.workingDays) || 24,
        remarks: targetForm.remarks || ''
      };
      
      const isEdit = modalMode === 'edit';
      
      let response;
      if (isEdit) {
        response = await fetch('/api/corporate/manager/member-targets', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            targetId: targetForm.targetId,
            ...targetPayload
          })
        });
      } else {
        response = await fetch('/api/corporate/manager/member-targets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(targetPayload)
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        const member = currentMembers.find(m => String(m.id) === String(targetForm.memberId));
        alert(`${isEdit ? 'Target Updated' : 'Target Saved'} Successfully!\nMember: ${member?.name || targetForm.memberId}\nMonth: ${targetForm.month}`);
        setIsTargetModalOpen(false);
        setRefreshKey(prev => prev + 1);
      } else if (result.existingTargetId) {
        // Target already exists - switch to edit mode
        const member = currentMembers.find(m => String(m.id) === String(targetForm.memberId));
        alert(`${result.error}\n\nClick OK to edit the existing target.`);
        setTargetForm({
          ...targetForm,
          targetId: result.existingTargetId
        });
        setModalMode('edit');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving target:', error);
      alert("Failed to save target. Please try again.");
    }
  };

  const getProgressColor = (achieved, target) => {
    if(!target) return "bg-gray-200";
    const percent = (achieved / target) * 100;
    if (percent > 70) return "bg-green-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMembersList = () => {
    if (activeTab === 'history') return historyMembers;
    if (activeTab === 'current') return currentMembers;
    return projectionMembers;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Calibri'] p-6 pt-2 pb-12">
      
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-4">
         <div>
             <h1 className="text-3xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={32} /> Team Target Distribution
                {activeTab === 'current' && (
                    <span className="text-lg font-black text-[#103c7f] bg-blue-100 px-3 py-1 rounded-lg ml-2">
                        {new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                )}
             </h1>
             <p className="text-gray-500 text-sm font-bold mt-1">
               {activeTab === 'history' ? 'Review Past Performance' : activeTab === 'current' ? 'Live Month Tracking' : 'Plan Future Targets'}
             </p>
         </div>
      </div>

      {/* --- TABS NAVIGATION --- */}
      <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-200 w-fit mb-8">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <History size={16}/> History
          </button>
          <button 
            onClick={() => setActiveTab('current')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'current' ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <BarChart3 size={16}/> Current Month
          </button>
          <button 
            onClick={() => setActiveTab('projection')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'projection' ? 'bg-purple-700 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <TrendingUp size={16}/> Projection
          </button>
      </div>

      {/* --- LOADING --- */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-[#103c7f] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#103c7f] font-bold">Loading...</span>
          </div>
        </div>
      )}

      {!loading && (
      <>
      {/* =========================================================================================
                                   TAB 1: HISTORY (TABLE VIEW)
         ========================================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <Filter size={14} className="text-gray-400"/>
                    <input type="month" className="bg-transparent text-sm font-bold text-gray-700 outline-none" onChange={(e)=> setHistoryFilter({...historyFilter, month: e.target.value})}/>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <Search size={14} className="text-gray-400"/>
                    <select 
                      className="bg-transparent text-sm font-bold text-gray-700 outline-none w-48"
                      value={historyFilter.member}
                      onChange={(e)=> setHistoryFilter({...historyFilter, member: e.target.value})}
                    >
                      <option value="">All Members</option>
                      {historyMembers.map(mbr => (
                        <option key={String(mbr.id)} value={String(mbr.id)}>
                          {mbr.name} ({mbr.role})
                        </option>
                      ))}
                    </select>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Month</th>
                            <th className="px-6 py-4">Member</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-4 py-4 text-center">Visits Target</th>
                            <th className="px-4 py-4 text-center">Onboards Target</th>
                            <th className="px-4 py-4 text-center">Calls Target</th>
                            <th className="px-4 py-4 text-center">Leads Target</th>
                            <th className="px-4 py-4 text-center">Achievement %</th>
                            <th className="px-6 py-4">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredHistoryData.map((row, idx) => (
                            <tr key={row.id || `history-${idx}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-500">{row.month ? new Date(row.month + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' }) : row.month}</td>
                                <td className="px-6 py-4 font-bold text-[#103c7f]">{row.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${row.role === 'FSE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{row.role}</span>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-gray-600">
                                    <div>{row.achievedVisits || 0}/{row.visits}</div>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-gray-600">
                                    <div>{row.achievedOnboards || 0}/{row.onboards}</div>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-gray-600">
                                    <div>{row.achievedCalls || 0}/{row.calls}</div>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-gray-600">
                                    <div>{row.achievedLeads || 0}/{row.leads || 0}</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {(() => {
                                        const totalAchieved = (row.achievedVisits || 0) + (row.achievedOnboards || 0) + (row.achievedCalls || 0) + (row.achievedLeads || 0);
                                        const totalTarget = (row.visits || 0) + (row.onboards || 0) + (row.calls || 0) + (row.leads || 0);
                                        const achievement = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
                                        return (
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${achievement > 70 ? 'bg-green-100 text-green-700' : achievement >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {achievement}%
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-4 text-xs italic text-gray-500">{row.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* =========================================================================================
                                   TAB 2: CURRENT MONTH (CARDS VIEW)
         ========================================================================================= */}
      {activeTab === 'current' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentData.length === 0 ? (
                    <div className="col-span-3 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <p className="text-gray-400 font-bold">No team members found or no targets set for this month.</p>
                    </div>
                ) : currentData.map((row, idx) => (
                    <div key={row.id || `current-${idx}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
                        <div className="p-5 border-b border-gray-100 bg-blue-50/30 flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-gray-800">{row.name}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${row.role === 'FSE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{row.role}</span>
                            </div>
                        </div>
                        <div className="p-5 space-y-5">
                            {row.role === 'FSE' && (
                                <>
                                    <div>
                                        <h4 className="text-[10px] font-black text-[#103c7f] uppercase mb-2 flex items-center gap-1"><MapPin size={12}/> Monthly Visits</h4>
                                        <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                            <span>{row.achievedVisits || 0} Achieved</span>
                                            <span>Target: {row.visits}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${getProgressColor(row.achievedVisits, row.visits)}`} style={{width: `${row.visits > 0 ? ((row.achievedVisits || 0)/row.visits)*100 : 0}%`}}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-[#103c7f] uppercase mb-2 flex items-center gap-1"><Briefcase size={12}/> Monthly Onboards</h4>
                                        <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                            <span>{row.achievedOnboards || 0} Achieved</span>
                                            <span>Target: {row.onboards}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${getProgressColor(row.achievedOnboards, row.onboards)}`} style={{width: `${row.onboards > 0 ? ((row.achievedOnboards || 0)/row.onboards)*100 : 0}%`}}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {row.role === 'LeadGen' && (
                                <>
                                    <div>
                                        <h4 className="text-[10px] font-black text-red-600 uppercase mb-2 flex items-center gap-1"><Phone size={12}/> Monthly Calls</h4>
                                        <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                            <span>{row.achievedCalls || 0} Achieved</span>
                                            <span>Target: {row.calls}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${getProgressColor(row.achievedCalls, row.calls)}`} style={{width: `${row.calls > 0 ? ((row.achievedCalls || 0)/row.calls)*100 : 0}%`}}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-red-600 uppercase mb-2 flex items-center gap-1"><Users size={12}/> Monthly Leads</h4>
                                        <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                            <span>{row.achievedLeads || 0} Achieved</span>
                                            <span>Target: {row.leads || 0}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${getProgressColor(row.achievedLeads, row.leads)}`} style={{width: `${(row.leads || 0) > 0 ? ((row.achievedLeads || 0)/(row.leads || 0))*100 : 0}%`}}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {row.remarks && (
                                <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start border border-yellow-100">
                                    <MessageSquare size={14} className="text-yellow-600 mt-0.5"/>
                                    <p className="text-xs text-gray-600 italic">"{row.remarks}"</p>
                                </div>
                            )}
                            
                            {/* Overall Achievement */}
                            {(() => {
                                const totalAchieved = (row.achievedVisits || 0) + (row.achievedOnboards || 0) + (row.achievedCalls || 0) + (row.achievedLeads || 0);
                                const totalTarget = (row.visits || 0) + (row.onboards || 0) + (row.calls || 0) + (row.leads || 0);
                                const achievement = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
                                return (
                                    <div className={`mt-3 pt-3 border-t ${achievement > 70 ? 'bg-green-50 border-green-200' : achievement >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} p-3 rounded-lg text-center`}>
                                        <span className="text-xs font-bold uppercase">Overall Achievement</span>
                                        <span className={`block text-2xl font-black ${achievement > 70 ? 'text-green-700' : achievement >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>{achievement}%</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* =========================================================================================
                                   TAB 3: PROJECTION (PLANNING VIEW)
         ========================================================================================= */}
      {activeTab === 'projection' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Control Bar - Moved to top */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-700 p-2 rounded-lg"><Calendar size={20}/></div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Planning For:</h3>
                        <input type="month" value={projectionMonth} onChange={(e) => setProjectionMonth(e.target.value)} className="font-black text-purple-700 text-lg bg-transparent outline-none cursor-pointer"/>
                    </div>
                </div>
                <button onClick={() => openModal('create')} className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2 uppercase tracking-wide">
                    <Plus size={18}/> Set Target For Member
                </button>
            </div>

            {/* HOD Assigned Targets Section */}
            {filteredHodProjectionData.length > 0 && filteredHodProjectionData[0] && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-200 text-gray-800">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-purple-700">
                        <Target size={20}/> HOD Assigned Targets - {projectionMonth ? new Date(projectionMonth + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Select Month'}
                    </h3>
                    <div className="flex gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{filteredHodProjectionData[0].fseCount || 0} FSE</span>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">{filteredHodProjectionData[0].callersCount || 0} Leadgen</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{filteredHodProjectionData[0].workingDays || 0} Working Days</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                        <span className="block text-xs font-bold text-purple-600 uppercase">Visits / FSE / Month</span>
                        <span className="block text-3xl font-black text-purple-700">{filteredHodProjectionData[0].visitsPerFse || 0}</span>
                        <div className="mt-0 text-right"><span className="inline-block text-xs font-bold bg-purple-800 text-white px-2 py-0.5 rounded">Total: {filteredHodProjectionData[0].totalVisits || 0}</span></div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                        <span className="block text-xs font-bold text-purple-600 uppercase">Onboards / FSE / Month</span>
                        <span className="block text-3xl font-black text-purple-700">{filteredHodProjectionData[0].onboardPerFse || 0}</span>
                        <div className="mt-0 text-right"><span className="inline-block text-xs font-bold bg-purple-800 text-white px-2 py-0.5 rounded">Total: {filteredHodProjectionData[0].totalOnboards || 0}</span></div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                        <span className="block text-xs font-bold text-purple-600 uppercase">Calls / Leadgen / Month</span>
                        <span className="block text-3xl font-black text-purple-700">{filteredHodProjectionData[0].callsPerCaller || 0}</span>
                        <div className="mt-0 text-right"><span className="inline-block text-xs font-bold bg-purple-800 text-white px-2 py-0.5 rounded">Total: {filteredHodProjectionData[0].totalCalls || 0}</span></div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
                        <span className="block text-xs font-bold text-purple-600 uppercase">Leads / Leadgen / Month</span>
                        <span className="block text-3xl font-black text-purple-700">{filteredHodProjectionData[0].leadsPerCaller || 0}</span>
                        <div className="mt-0 text-right"><span className="inline-block text-xs font-bold bg-purple-800 text-white px-2 py-0.5 rounded">Total: {filteredHodProjectionData[0].totalLeads || 0}</span></div>
                    </div>
                </div>
                
                {/* Remarks */}
                <div className="mt-2 pt-2 border-t border-purple-200">
                    <span className="text-xs font-bold text-purple-600 uppercase">Remarks: </span>
                    <span className="text-sm text-gray-700 font-bold">{filteredHodProjectionData[0].remarks || '-'}</span>
                </div>
            </div>
            )}

            {/* Show message if no HOD targets */}
            {filteredHodProjectionData.length === 0 && (
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 text-center">
                    <p className="text-purple-600 font-bold text-sm">No HOD assigned targets for {projectionMonth ? new Date(projectionMonth + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'this month'}</p>
                </div>
            )}

            {/* Member Targets Section Header */}
            <div className="flex justify-between items-center mt-6 mb-4">
                <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-[#103c7f]">
                    <Users size={20}/> Member Targets - {projectionMonth ? new Date(projectionMonth + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Select Month'}
                </h3>
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjectionData.length === 0 ? (
                    <div className="col-span-3 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <p className="text-gray-400 font-bold">No targets set for {projectionMonth} yet.</p>
                        <button onClick={() => openModal('create')} className="mt-2 text-purple-600 font-bold hover:underline">Set First Target</button>
                    </div>
                ) : filteredProjectionData.map((row, idx) => (
                    <div key={row.id || `projection-${idx}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 flex items-center">{row.name} <span className={`ml-2 text-[10px] px-2 py-0.5 rounded font-bold align-middle ${row.role === 'FSE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{row.role}</span></h3>
                            </div>
                            <button onClick={() => openModal('edit', row)} className="bg-purple-50 text-purple-700 p-2 rounded-lg hover:bg-purple-100 transition"><Edit2 size={16}/></button>
                        </div>

                        <div className="space-y-3">
                            {row.role === 'FSE' ? (
                                <>
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                        <span className="block text-[10px] font-bold text-blue-400 uppercase">Monthly Visits</span>
                                        <span className="block text-xl font-black text-blue-800">{row.visits || 0}</span>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
                                        <span className="block text-[10px] font-bold text-blue-400 uppercase">Monthly Onboards</span>
                                        <span className="block text-xl font-black text-blue-800">{row.onboards || 0}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                                        <span className="block text-[10px] font-bold text-orange-400 uppercase">Monthly Calls</span>
                                        <span className="block text-xl font-black text-orange-800">{row.calls || 0}</span>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                                        <span className="block text-[10px] font-bold text-orange-400 uppercase">Monthly Leads</span>
                                        <span className="block text-xl font-black text-orange-800">{row.leads || 0}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {row.remarks && (
                            <p className="text-xs text-gray-500 italic border-t pt-3 mt-3">"{row.remarks}"</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}
      </>
      )}

      {/* --- SHARED MODAL (Create/Edit Targets) --- */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border-4 border-white">
                <div className={`${activeTab === 'projection' ? 'bg-purple-700' : 'bg-[#103c7f]'} p-5 flex justify-between items-center text-white shrink-0`}>
                    <h3 className="font-bold text-lg uppercase flex items-center gap-2">
                        <Target size={20} /> {modalMode === 'create' ? `Set New Target - ${projectionMonth ? new Date(projectionMonth + '-01').toLocaleString('en-US', { month: 'short', year: 'numeric' }) : 'Select Month'}` : 'Update Target'}
                    </h3>
                    <button onClick={() => setIsTargetModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={20}/></button>
                </div>
                
                <form className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
                    {/* Member Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Select Team Member</label>
                            <select 
                                name="memberId" 
                                value={targetForm.memberId || ''} 
                                onChange={handleMemberSelect} 
                                disabled={modalMode === 'edit'}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-700 outline-none focus:border-purple-500 bg-gray-50 disabled:opacity-60"
                            >
                                <option value="">-- Choose Member --</option>
                                {getMembersList().map(mbr => (
                                    <option key={String(mbr.id)} value={String(mbr.id)}>
                                      {mbr.name} ({mbr.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-purple-600 uppercase mb-1 block ml-1">Working Days</label>
                            <input 
                              type="number" 
                              name="workingDays" 
                              className="w-full border border-purple-200 rounded-xl p-3 text-sm font-bold text-purple-700 outline-none focus:border-purple-500"
                              value={targetForm.workingDays || '24'}
                              onChange={handleFormChange}
                            />
                        </div>
                    </div>

                    {/* Target Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Monthly Visits</label>
                            <input type="number" name="visits" className="w-full border p-2 rounded-lg font-bold" value={targetForm.visits || ''} onChange={handleFormChange} disabled={getMembersList().find(m => String(m.id) === String(targetForm.memberId))?.role === 'LeadGen'}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Monthly Onboards</label>
                            <input type="number" name="onboards" className="w-full border p-2 rounded-lg font-bold" value={targetForm.onboards || ''} onChange={handleFormChange} disabled={getMembersList().find(m => String(m.id) === String(targetForm.memberId))?.role === 'LeadGen'}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Monthly Calls</label>
                            <input type="number" name="calls" className="w-full border p-2 rounded-lg font-bold" value={targetForm.calls || ''} onChange={handleFormChange} disabled={getMembersList().find(m => String(m.id) === String(targetForm.memberId))?.role === 'FSE'}/>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Monthly Leads</label>
                            <input type="number" name="leads" className="w-full border p-2 rounded-lg font-bold" value={targetForm.leads || ''} onChange={handleFormChange} disabled={getMembersList().find(m => String(m.id) === String(targetForm.memberId))?.role === 'FSE'}/>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Remarks</label>
                        <textarea name="remarks" className="w-full border p-2 rounded-lg font-medium text-sm h-16 resize-none" value={targetForm.remarks} onChange={handleFormChange}></textarea>
                    </div>

                    <button onClick={handleSetTarget} className={`mt-2 text-white font-bold py-3.5 rounded-xl shadow-lg uppercase tracking-wide text-sm ${activeTab === 'projection' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-[#103c7f] hover:bg-blue-900'}`}>
                        Save Target
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}
