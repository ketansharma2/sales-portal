"use client";
import React, { useState, useEffect } from "react";
import { 
  Filter, Calendar, Briefcase, Plus, X, Save, 
  Target, BarChart2, Percent, Trash2,
  Edit, Eye, User, CheckCircle
} from "lucide-react";

export default function CRMCorporateTargetPage() {
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [teamTargets, setTeamTargets] = useState([]);
  
  // My Targets State (Assigned by HOD)
  const [myTargetMonth, setMyTargetMonth] = useState("April");
  const [myTargetsData, setMyTargetsData] = useState([]);

  // Team Filter States
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterRole, setFilterRole] = useState("All");
  const [filterName, setFilterName] = useState("All");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); 
  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    month: "",
    workingDays: "",
    department: "Delivery", // Locked to Delivery
    sector: "Corporate", // Locked to Corporate
    role: "Team Leader (TL)", // Only TL is available
    assignedTo: "",
    targetList: [{ guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }]
  });
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // --- OPTIONS & LOGIC ---
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // ✅ Specific to Delivery Sector (Only TL now)
  const teamRoles = ["Team Leader (TL)"];
  const teamEmployees = {
      "Team Leader (TL)": ["Karan Mehta", "Anjali Deshmukh", "Vikas Singh"]
  };

  const kpiMetrics = [
      "Team Revenue Target", "SLA Compliance", "Escalation Resolution", 
      "Niche Submissions (Team)", "Final Joinings (Team)", "Attrition Control"
  ];

  // --- MOCK DATA: TEAM TARGETS ASSIGNED BY CRM (Only to TLs) ---
  const dummyTeamTargets = [
    {
      id: 1, year: "2026", month: "April", workingDays: "22", department: "Delivery", sector: "Corporate", role: "Team Leader (TL)", assignedTo: "Karan Mehta",
      guideline: "Ensure team hits 100% of their niche profile submission targets.",
      kpi_metric: "Team Revenue Target", frequency: "Monthly",
      target: 5000000, achieved: 3200000
    },
    {
      id: 2, year: "2026", month: "April", workingDays: "22", department: "Delivery", sector: "Corporate", role: "Team Leader (TL)", assignedTo: "Anjali Deshmukh",
      guideline: "Maintain strict control over candidate backouts before joining.",
      kpi_metric: "Final Joinings (Team)", frequency: "Monthly",
      target: 40, achieved: 28
    }
  ];

  // Fetch my targets from API
  const fetchMyTargets = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      
      if (!token) return;
      
      const response = await fetch('/api/corporate/crm/my-targets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const mappedData = result.data.map(t => ({
          id: t.id,
          year: t.year,
          month: t.month,
          workingDays: t.workingDays,
          assignedBy: t.assignedBy,
          assignedRole: t.assignedRole,
          guideline: t.guideline,
          kpi_metric: t.kpi,
          frequency: t.frequency,
          target: t.totalTarget,
          achieved: t.achieved || 0
        }));
        setMyTargetsData(mappedData);
      }
    } catch (error) {
      console.error('Error fetching my targets:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setTeamTargets(dummyTeamTargets);
      setLoading(false);
    }, 500);
    
    fetchMyTargets();
    
    return () => clearTimeout(timer);
  }, []);

  // --- HANDLERS ---

  const handleOpenModal = (item = null) => {
    if (item && item.id) {
        setEditId(item.id);
        setForm({
            year: item.year, month: item.month, workingDays: item.workingDays || "", 
            department: "Delivery", sector: "Corporate", role: "Team Leader (TL)", assignedTo: item.assignedTo || "",
            targetList: [{ 
                guideline: item.guideline, kpi_metric: item.kpi_metric, 
                frequency: item.frequency, target: item.target.toString() 
            }]
        });
    } else {
        setEditId(null);
        setForm({
            year: new Date().getFullYear().toString(), month: "", workingDays: "", 
            department: "Delivery", sector: "Corporate", role: "Team Leader (TL)", assignedTo: "",
            targetList: [{ guideline: "", kpi_metric: "Team Revenue Target", frequency: "Monthly", target: "" }]
        });
    }
    setIsModalOpen(true);
  };

  const handleRoleChange = (e) => {
      const selectedRole = e.target.value;
      // Now only TL exists, so we just set defaults for TL
      const autoKPIs = [{ guideline: "", kpi_metric: "Team Revenue Target", frequency: "Monthly", target: "" }];
      setForm({ ...form, role: selectedRole, assignedTo: "", targetList: autoKPIs }); 
  };

  const handleTargetChange = (index, field, value) => {
      const newList = [...form.targetList];
      newList[index][field] = value;
      setForm({ ...form, targetList: newList });
  };

  const addTargetRow = () => {
      setForm({ ...form, targetList: [...form.targetList, { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }] });
  };

  const removeTargetRow = (index) => {
      const newList = form.targetList.filter((_, i) => i !== index);
      setForm({ ...form, targetList: newList });
  };

  const handleSaveTarget = () => {
    if(!form.month || !form.role || !form.workingDays || !form.assignedTo) {
        alert("Please fill all details including Employee Name.");
        return;
    }

    if (editId) {
        const t = form.targetList[0];
        const updatedTargets = teamTargets.map(item => {
            if (item.id === editId) {
                return {
                    ...item,
                    year: form.year, month: form.month, workingDays: form.workingDays, 
                    role: form.role, assignedTo: form.assignedTo,
                    guideline: t.guideline, kpi_metric: t.kpi_metric, frequency: t.frequency,
                    target: parseInt(t.target) || 0
                };
            }
            return item;
        });
        setTeamTargets(updatedTargets);
    } else {
        const newEntries = form.targetList.map((t, idx) => {
            return {
                id: Date.now() + idx,
                year: form.year, month: form.month, workingDays: form.workingDays, 
                department: "Delivery", sector: "Corporate", role: form.role, assignedTo: form.assignedTo,
                guideline: t.guideline, kpi_metric: t.kpi_metric, frequency: t.frequency,
                target: parseInt(t.target) || 0, achieved: 0
            };
        });
        setTeamTargets([...newEntries, ...teamTargets]);
    }
    
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleClearFilters = () => {
    setFilterMonth("All"); setFilterRole("All"); setFilterName("All");
  };

  // Filters
  const filteredMyTargets = myTargetsData.filter(t => t.month === myTargetMonth);
  
  const filteredTeamTargets = teamTargets.filter(item => {
    const matchMonth = filterMonth === "All" || item.month === filterMonth;
    const matchRole = filterRole === "All" || item.role === filterRole;
    const matchName = filterName === "All" || item.assignedTo === filterName; 
    return matchMonth && matchRole && matchName;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20">
      
      {/* ========================================== */}
      {/* 1. MY TARGETS (Assigned by HOD) SECTION    */}
      {/* ========================================== */}
      <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
             <div>
                <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle size={24} className="text-indigo-600"/> Corporate Targets (CRM)
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Delivery targets assigned to you by HOD</p>
             </div>
             
             {/* Month Filter for My Targets */}
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                 <Calendar size={14} className="text-gray-400"/>
                 <select value={myTargetMonth} onChange={(e) => setMyTargetMonth(e.target.value)} className="bg-transparent text-xs font-bold text-[#103c7f] outline-none cursor-pointer pr-4">
                     {months.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
             </div>
          </div>

          {/* TABLE SECTION FOR MY TARGETS */}
          <div className="bg-white border-2 border-indigo-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
             <div className="overflow-x-auto overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                   <thead className="text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm tracking-widest bg-indigo-800">
                      <tr>
                         <th className="p-3 border-r border-white/10 w-24 text-center">Period</th>
                         <th className="p-3 border-r border-white/10 w-24 text-center">Work Days</th>
                         <th className="p-3 border-r border-white/10 w-56">Assigned By</th>
                         <th className="p-3 border-r border-white/10 min-w-[200px]">Guideline</th>
                         <th className="p-3 border-r border-white/10 w-40">KPI Metric</th>
                         <th className="p-3 border-r border-white/10 text-center w-24">Freq.</th>
                         <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Target</th>
                         <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Achieved</th>
                         <th className="p-3 border-r border-white/10 text-center bg-black/20 w-24">%</th>
                         <th className="p-3 text-center bg-black/10 sticky right-0 z-20 w-20 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                      {filteredMyTargets.length > 0 ? filteredMyTargets.map((item, idx) => {
                          const percentage = item.target > 0 ? Math.min(Math.round((item.achieved / item.target) * 100), 100) : 0;
                          let percColor = "text-red-600 bg-red-50 border-red-200";
                          if(percentage >= 100) percColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                          else if(percentage >= 50) percColor = "text-amber-600 bg-amber-50 border-amber-200";

                          return (
                          <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition group">
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <div className="flex flex-col items-center gap-1">
                                   <span className="font-black text-gray-800">{item.month}</span>
                                   <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.year}</span>
                                </div>
                             </td>

                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                 <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-[11px]">
                                     {item.workingDays} <span className="text-[9px] text-indigo-500 uppercase">Days</span>
                                 </span>
                             </td>

                             <td className="p-3 border-r border-gray-100 align-middle">
                                 <div className="flex flex-col gap-1">
                                     <span className="font-black text-gray-900 flex items-center gap-1.5"><User size={12} className="text-indigo-500"/> {item.assignedBy}</span>
                                     <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider flex items-center gap-1"><Briefcase size={10}/>{item.assignedRole}</span>
                                 </div>
                             </td>
                             
                             <td className="p-3 border-r border-gray-100 align-middle"><p className="text-[11px] text-gray-600 leading-relaxed">{item.guideline}</p></td>
                             <td className="p-3 border-r border-gray-100 align-middle"><span className="font-bold text-indigo-700 flex items-center gap-1.5"><BarChart2 size={12}/>{item.kpi_metric}</span></td>
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${item.frequency === 'Daily' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{item.frequency}</span>
                             </td>
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-gray-800">{item.target.toLocaleString('en-IN')}</span></td>
                             <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-indigo-700">{item.achieved.toLocaleString('en-IN')}</span></td>
                             
                             <td className="p-3 border-r border-gray-100 text-center align-middle">
                                 <span className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-0.5 border ${percColor}`}>{percentage} <Percent size={10}/></span>
                             </td>
                             
                             <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-indigo-50 transition-colors">
                                <div className="flex flex-row items-center gap-2 w-full px-1 justify-center">
                                    <button onClick={() => {
                                         setViewData({ role: item.assignedRole, assignedTo: item.assignedBy, kpi_metric: item.kpi_metric });
                                         setIsViewModalOpen(true);
                                    }} className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-800 hover:text-white px-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1">
                                        <Eye size={10} /> View
                                    </button>
                                </div>
                             </td>
                             
                          </tr>
                      )}) : (
                          <tr><td colSpan="10" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No targets assigned for {myTargetMonth}</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
      </div>

      <hr className="border-gray-200 mb-8" />

      {/* ========================================== */}
      {/* 2. TEAM ASSIGNMENT SECTION (TL Only) */}
      {/* ========================================== */}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
         <div>
            <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={24} className="text-indigo-600"/> Team Targets
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Assign delivery targets to Team Leaders</p>
         </div>
         <button 
            onClick={() => handleOpenModal()} 
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-md"
         >
            <Plus size={14}/> Assign New Target
         </button>
      </div>

      {/* FILTERS SECTION */}
      <div className="p-4 rounded-xl border shadow-sm mb-6 flex flex-wrap items-end gap-4 bg-white border-gray-200">
        <div className="w-36 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Month</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer">
                <option value="All">All Months</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
        <div className="w-48 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer" disabled>
                {/* Only TL is available */}
                <option value="Team Leader (TL)">Team Leader (TL)</option>
            </select>
        </div>
        <div className="w-48 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Employee Name</label>
            <select value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer">
                <option value="All">All Team Leaders</option>
                {teamRoles
                    .flatMap(role => teamEmployees[role] || [])
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map((emp) => <option key={emp} value={emp}>{emp}</option>)
                }
            </select>
        </div>

        {(filterMonth !== "All" || filterRole !== "All" || filterName !== "All") && (
            <button onClick={handleClearFilters} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent h-[34px]">
              Clear
            </button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-450px)] min-h-[300px]">
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
               <thead className="text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm tracking-widest bg-[#103c7f]">
                  <tr>
                     <th className="p-3 border-r border-white/10 w-24 text-center">Period</th>
                     <th className="p-3 border-r border-white/10 w-24 text-center">Work Days</th>
                     <th className="p-3 border-r border-white/10 w-56">Assigned To</th>
                     <th className="p-3 border-r border-white/10 min-w-[200px]">Guideline</th>
                     <th className="p-3 border-r border-white/10 w-40">KPI Metric</th>
                     <th className="p-3 border-r border-white/10 text-center w-24">Freq.</th>
                     <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Target</th>
                     <th className="p-3 border-r border-white/10 text-center bg-black/10 w-24">Achieved</th>
                     <th className="p-3 border-r border-white/10 text-center bg-black/20 w-24">%</th>
                     <th className="p-3 text-center bg-black/10 sticky right-0 z-20 w-32 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                  </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="10" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Targets...</td></tr>
                  ) : filteredTeamTargets.length > 0 ? (
                     filteredTeamTargets.map((item) => {
                         const percentage = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
                         let percColor = "text-red-600 bg-red-50 border-red-200";
                         if(percentage >= 100) percColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                         else if(percentage >= 50) percColor = "text-amber-600 bg-amber-50 border-amber-200";

                         return (
                         <tr key={item.id} className="hover:bg-indigo-50/30 transition group">
                            
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                               <div className="flex flex-col items-center gap-1">
                                  <span className="font-black text-gray-800">{item.month}</span>
                                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.year}</span>
                               </div>
                            </td>
                            
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 text-[11px]">
                                    {item.workingDays} <span className="text-[9px] text-indigo-500 uppercase">Days</span>
                                </span>
                            </td>

                            <td className="p-3 border-r border-gray-100 align-middle">
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-gray-900 flex items-center gap-1.5"><User size={12} className="text-indigo-500"/> {item.assignedTo}</span>
                                    <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider flex items-center gap-1"><Briefcase size={10}/>{item.role}</span>
                                </div>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-middle"><p className="text-[11px] text-gray-600 leading-relaxed">{item.guideline}</p></td>
                            <td className="p-3 border-r border-gray-100 align-middle"><span className="font-bold text-indigo-700 flex items-center gap-1.5"><BarChart2 size={12}/>{item.kpi_metric}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${item.frequency === 'Daily' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{item.frequency}</span>
                            </td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-gray-800">{item.target.toLocaleString('en-IN')}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle bg-gray-50/50"><span className="text-sm font-mono font-black text-indigo-700">{item.achieved.toLocaleString('en-IN')}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-middle">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-0.5 border ${percColor}`}>{percentage} <Percent size={10}/></span>
                            </td>
                            
                            {/* ACTION COLUMN */}
                            <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-indigo-50 transition-colors">
                               <div className="flex flex-row items-center gap-2 w-full px-1 justify-center">
                                   <button onClick={() => handleOpenModal(item)} className="flex-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 min-w-[50px]">
                                       <Edit size={10} /> Edit
                                   </button>
                                   <button onClick={() => {
                                        setViewData({ role: item.role, assignedTo: item.assignedTo, kpi_metric: item.kpi_metric });
                                        setIsViewModalOpen(true);
                                   }} className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-800 hover:text-white px-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 min-w-[50px]">
                                       <Eye size={10} /> View
                                   </button>
                               </div>
                            </td>
                         </tr>
                     )})
                  ) : (
                      <tr><td colSpan="10" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No team targets found matching filters</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- ADD/EDIT TARGET MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                <div className="p-4 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        {editId ? <Edit size={16}/> : <Target size={16}/>} 
                        {editId ? "Edit Team Target" : "Assign Corporate Target to Team Leader"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>

                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Scope</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Year</label>
                                <input type="text" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-white font-bold"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Month</label>
                                <select value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-white">
                                    <option value="">- Select -</option>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Working Days</label>
                                <input type="number" placeholder="e.g. 24" value={form.workingDays} onChange={e => setForm({...form, workingDays: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none bg-white"/>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-indigo-600 uppercase">Role</label>
                                <select value={form.role} onChange={handleRoleChange} className="w-full border border-indigo-200 p-2 rounded-lg text-sm outline-none bg-indigo-50 focus:border-indigo-500" disabled>
                                    {/* ✅ Only TL is available */}
                                    <option value="Team Leader (TL)">Team Leader (TL)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-purple-600 uppercase">Employee Name</label>
                                <select 
                                    value={form.assignedTo} 
                                    onChange={e => setForm({...form, assignedTo: e.target.value})} 
                                    disabled={!form.role} 
                                    className="w-full border border-purple-200 p-2 rounded-lg text-sm outline-none bg-purple-50 focus:border-purple-500 disabled:opacity-50"
                                >
                                    <option value="">- Select Name -</option>
                                    {form.role && teamEmployees[form.role]?.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-4">
                        {form.targetList.map((t, index) => (
                            <div key={index} className="border border-indigo-100 rounded-xl p-4 bg-white shadow-sm relative group">
                                
                                {!editId && form.targetList.length > 1 && (
                                    <button onClick={() => removeTargetRow(index)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Remove this KPI">
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">KPI Metric</label>
                                        <select value={t.kpi_metric} onChange={e => handleTargetChange(index, 'kpi_metric', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 bg-gray-50">
                                            <option value="">- Select Metric -</option>
                                            {kpiMetrics.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Frequency</label>
                                        <select value={t.frequency} onChange={e => handleTargetChange(index, 'frequency', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 bg-gray-50">
                                            <option value="Daily">Daily</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-indigo-600 uppercase">Target Number</label>
                                        <input type="number" placeholder="E.g. 50" value={t.target} onChange={e => handleTargetChange(index, 'target', e.target.value)} className="w-full border border-indigo-200 p-2 rounded-lg text-sm font-black outline-none focus:border-indigo-600 bg-indigo-50 text-[#103c7f]"/>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Guideline / Instructions</label>
                                    <textarea rows="2" placeholder="Write specific instructions for this KPI..." value={t.guideline} onChange={e => handleTargetChange(index, 'guideline', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 bg-gray-50 resize-none"></textarea>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!editId && (
                        <div className="flex justify-center mb-6">
                            <button onClick={addTargetRow} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm">
                                <Plus size={14}/> Add Another KPI
                            </button>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <button onClick={handleSaveTarget} className="w-full bg-indigo-700 hover:bg-indigo-800 py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-md flex items-center justify-center gap-2 transition-colors text-xs">
                            <Save size={16}/> {editId ? "Update Target" : `Save & Assign Target`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW TARGET MODAL --- */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <Eye size={16}/> View Details
                    </h3>
                    <button onClick={() => setIsViewModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>
                <div className="p-5 flex flex-col items-center justify-center text-center">
                    <User size={40} className="text-gray-300 mb-3" />
                    <h4 className="text-base font-black text-gray-800">{viewData.assignedTo}</h4>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{viewData.role}</p>
                    <div className="w-full bg-gray-100 h-px my-4"></div>
                    <p className="text-xs text-gray-600">Detailed logs for <b>{viewData.kpi_metric}</b> will be available once the employee submits their daily updates.</p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}