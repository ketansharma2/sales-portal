"use client";
import React, { useState, useEffect } from "react";
import { 
  Search, Filter, Calendar, Briefcase, Plus, X, Save, 
  Target, Layers, BarChart2, Calculator, Percent, Trash2,
  Edit, Eye
} from "lucide-react";

export default function HodTargetPage() {
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState([]);
  
  // Filter States
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterSector, setFilterSector] = useState("All");
  const [filterRole, setFilterRole] = useState("All");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // Track if we are editing
  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    month: "",
    workingDays: "", // <-- NEW FIELD
    sector: "",
    role: "",
    targetList: [
        { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }
    ]
  });
  // --- VIEW MODAL STATES ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // --- DROPDOWN OPTIONS ---
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const sectors = ["Domestic", "Corporate"];
  const roles = ["RC", "TL", "CRM", "FSE", "SM","Leadgen"];
  const kpiMetrics = ["Calls", "Joining", "Revenue", "Onboard", "", ""];

  // --- MOCK DATA ---
  const dummyTargets = [
    {
      id: 1, year: "2026", month: "April", workingDays: "22", sector: "IT", role: "Recruiter (RC)",
      guideline: "Focus on React and Node.js developer profiles.",
      kpi_metric: "Submissions", frequency: "Daily",
      target: 88, achieved: 40,
      calculation: "(2 RCs × 2 Submissions/Day) × 22 Working Days"
    },
    {
      id: 2, year: "2026", month: "April", workingDays: "22", sector: "Non-IT", role: "Team Leader (TL)",
      guideline: "Ensure team meets monthly revenue quotas.",
      kpi_metric: "Revenue (₹)", frequency: "Monthly",
      target: 500000, achieved: 350000,
      calculation: "(5 RCs × ₹1,00,000 Target)"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setTargets(dummyTargets);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // --- HANDLERS ---

  // Opens modal for BOTH Add and Edit
  const handleOpenModal = (item = null) => {
    if (item && item.id) {
        // Edit Mode
        setEditId(item.id);
        setForm({
            year: item.year,
            month: item.month,
            workingDays: item.workingDays || "", // <-- Populate in Edit Mode
            sector: item.sector,
            role: item.role,
            targetList: [{ 
                guideline: item.guideline, 
                kpi_metric: item.kpi_metric, 
                frequency: item.frequency, 
                target: item.target.toString() 
            }]
        });
    } else {
        // Add Mode
        setEditId(null);
        setForm({
            year: new Date().getFullYear().toString(), month: "", workingDays: "", sector: "", role: "",
            targetList: [{ guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }]
        });
    }
    setIsModalOpen(true);
  };

  const handleViewTarget = (item) => {
      const breakdownData = [
          { id: 1, rc_name: "Aman Singh", target: Math.floor(item.target / 2), achieved: Math.floor(item.achieved / 2) },
          { id: 2, rc_name: "Priya Sharma", target: Math.ceil(item.target / 2), achieved: Math.ceil(item.achieved / 2) },
      ];

      setViewData({
          role: item.role,
          kpi_metric: item.kpi_metric,
          breakdown: breakdownData
      });
      setIsViewModalOpen(true);
  };

  const handleTargetChange = (index, field, value) => {
      const newList = [...form.targetList];
      newList[index][field] = value;
      setForm({ ...form, targetList: newList });
  };

  const addTargetRow = () => {
      setForm({
          ...form,
          targetList: [...form.targetList, { guideline: "", kpi_metric: "", frequency: "Monthly", target: "" }]
      });
  };

  const removeTargetRow = (index) => {
      const newList = form.targetList.filter((_, i) => i !== index);
      setForm({ ...form, targetList: newList });
  };

  const handleSaveTarget = () => {
    if(!form.month || !form.sector || !form.role || !form.workingDays) {
        alert("Please fill all Target Scope details (Month, Working Days, Sector, Role).");
        return;
    }

    if (editId) {
        // Update Existing Target
        const t = form.targetList[0];
        let mockCalc = t.frequency === "Daily" 
            ? `(X ${form.role}s × Y ${t.kpi_metric}/Day) × ${form.workingDays} Working Days` 
            : `(X ${form.role}s × Y ${t.kpi_metric}/Month)`;

        const updatedTargets = targets.map(item => {
            if (item.id === editId) {
                return {
                    ...item,
                    year: form.year, month: form.month, workingDays: form.workingDays, sector: form.sector, role: form.role,
                    guideline: t.guideline, kpi_metric: t.kpi_metric, frequency: t.frequency,
                    target: parseInt(t.target) || 0,
                    calculation: mockCalc
                };
            }
            return item;
        });
        setTargets(updatedTargets);
    } else {
        // Add New Targets
        const newEntries = form.targetList.map((t, idx) => {
            let mockCalc = t.frequency === "Daily" 
                ? `(X ${form.role}s × Y ${t.kpi_metric}/Day) × ${form.workingDays} Working Days` 
                : `(X ${form.role}s × Y ${t.kpi_metric}/Month)`;

            return {
                id: Date.now() + idx,
                year: form.year, month: form.month, workingDays: form.workingDays, sector: form.sector, role: form.role,
                guideline: t.guideline, kpi_metric: t.kpi_metric, frequency: t.frequency,
                target: parseInt(t.target) || 0, achieved: 0,
                calculation: mockCalc
            };
        });
        setTargets([...newEntries, ...targets]);
    }
    
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleClearFilters = () => {
    setFilterMonth("All");
    setFilterSector("All");
    setFilterRole("All");
  };

  // --- FILTER LOGIC ---
  const filteredTargets = targets.filter(item => {
    const matchMonth = filterMonth === "All" || item.month === filterMonth;
    const matchSector = filterSector === "All" || item.sector === filterSector;
    const matchRole = filterRole === "All" || item.role === filterRole;
    return matchMonth && matchSector && matchRole;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
      
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
         <div>
            <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={24} className="text-blue-500"/> HOD Targets & KRA
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Define and track performance metrics across sectors and roles</p>
         </div>
         <button 
            onClick={() => handleOpenModal()} 
            className="bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-md"
         >
            <Plus size={14}/> Set New Target
         </button>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-end gap-4">
        <div className="w-40 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Filter by Month</label>
            <div className="relative">
                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Months</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Filter size={12} /></div>
            </div>
        </div>

        <div className="w-48 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Filter by Sector</label>
            <div className="relative">
                <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Sectors</option>
                    {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Layers size={12} /></div>
            </div>
        </div>

        <div className="w-56 shrink-0">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Filter by Role</label>
            <div className="relative">
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Roles</option>
                    {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Briefcase size={12} /></div>
            </div>
        </div>

        {(filterMonth !== "All" || filterSector !== "All" || filterRole !== "All") && (
            <button onClick={handleClearFilters} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 h-[34px]">
              Clear
            </button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
               <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm tracking-widest">
                  <tr>
                     <th className="p-3 border-r border-blue-800 w-24 text-center">Period</th>
                     <th className="p-3 border-r border-blue-800 w-32">Sector</th>
                     <th className="p-3 border-r border-blue-800 w-48">Role</th>
                     <th className="p-3 border-r border-blue-800 min-w-[200px]">Guideline</th>
                     <th className="p-3 border-r border-blue-800 w-40">KPI Metric</th>
                     <th className="p-3 border-r border-blue-800 text-center w-28">Frequency</th>
                     <th className="p-3 border-r border-blue-800 text-center bg-[#0d316a] w-24">Target</th>
                     <th className="p-3 border-r border-blue-800 text-center bg-[#0d316a] w-24">Achieved</th>
                     <th className="p-3 border-r border-blue-800 text-center bg-[#0a2653] w-24">%</th>
                     <th className="p-3 border-r border-blue-800 min-w-[250px]">Calculation Formula</th>
                     <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-24 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                  </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="11" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Targets...</td></tr>
                  ) : filteredTargets.length > 0 ? (
                     filteredTargets.map((item) => {
                         const percentage = item.target > 0 ? Math.round((item.achieved / item.target) * 100) : 0;
                         let percColor = "text-red-600 bg-red-50 border-red-200";
                         if(percentage >= 100) percColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                         else if(percentage >= 50) percColor = "text-amber-600 bg-amber-50 border-amber-200";

                         return (
                         <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                            <td className="p-3 border-r border-gray-100 text-center align-top">
                               <div className="flex flex-col items-center gap-1">
                                  <span className="font-black text-gray-800">{item.month}</span>
                                  <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.year}</span>
                                  <span className="text-[8px] font-black text-blue-500 uppercase">{item.workingDays} Days</span>
                               </div>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-top"><span className="font-bold text-[#103c7f] bg-blue-50 px-2 py-1 rounded border border-blue-100">{item.sector}</span></td>
                            <td className="p-3 border-r border-gray-100 align-top"><span className="font-black text-gray-800 flex items-center gap-1.5"><Briefcase size={12} className="text-gray-400"/>{item.role}</span></td>
                            <td className="p-3 border-r border-gray-100 align-top"><p className="text-[11px] text-gray-600 leading-relaxed">{item.guideline}</p></td>
                            <td className="p-3 border-r border-gray-100 align-top"><span className="font-bold text-indigo-700 flex items-center gap-1.5"><BarChart2 size={12}/>{item.kpi_metric}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-top">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${item.frequency === 'Daily' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{item.frequency}</span>
                            </td>
                            <td className="p-3 border-r border-gray-100 text-center align-top bg-gray-50/50"><span className="text-sm font-mono font-black text-gray-800">{item.target.toLocaleString('en-IN')}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-top bg-gray-50/50"><span className="text-sm font-mono font-black text-[#103c7f]">{item.achieved.toLocaleString('en-IN')}</span></td>
                            <td className="p-3 border-r border-gray-100 text-center align-top">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-0.5 border ${percColor}`}>{percentage} <Percent size={10}/></span>
                            </td>
                            <td className="p-3 border-r border-gray-100 align-top">
                                <div className="bg-gray-50 border border-gray-200 p-2 rounded text-[10px] font-mono text-gray-600 flex items-start gap-2">
                                    <Calculator size={12} className="text-gray-400 mt-0.5 shrink-0"/>
                                    <span>{item.calculation}</span>
                                </div>
                            </td>
                            
                            {/* ACTION COLUMN */}
                            <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-blue-50/30 transition-colors">
                               <div className="flex flex-col gap-1.5 w-full px-1">
                                   <button 
                                    onClick={() => handleOpenModal(item)}
                                    className="w-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
                                   >
                                       <Edit size={10} /> Edit
                                   </button>
                                   <button 
                                    onClick={() => handleViewTarget(item)}
                                    className="w-full bg-white border border-gray-200 text-[#103c7f] hover:bg-[#103c7f] hover:text-white hover:border-[#103c7f] px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
                                   >
                                       <Eye size={10} /> View
                                   </button>
                               </div>
                            </td>

                         </tr>
                     )})
                  ) : (
                      <tr><td colSpan="11" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No targets found matching filters</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- ADD/EDIT TARGET MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                
                <div className="p-4 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        {editId ? <Edit size={16}/> : <Target size={16}/>} 
                        {editId ? "Edit Department Target" : "Set Department Targets"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>

                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Target Scope</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Year</label>
                                <input type="text" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-white font-bold"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Month</label>
                                <select value={form.month} onChange={e => setForm({...form, month: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-white">
                                    <option value="">- Select -</option>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            {/* NEW: Working Days */}
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Working Days</label>
                                <input type="number" placeholder="e.g. 22" value={form.workingDays} onChange={e => setForm({...form, workingDays: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-white"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Sector</label>
                                <select value={form.sector} onChange={e => setForm({...form, sector: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-white">
                                    <option value="">- Select -</option>
                                    {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Role</label>
                                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-white">
                                    <option value="">- Select -</option>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-4">
                        {form.targetList.map((t, index) => (
                            <div key={index} className="border border-blue-100 rounded-xl p-4 bg-white shadow-sm relative group">
                                
                                {!editId && form.targetList.length > 1 && (
                                    <button 
                                        onClick={() => removeTargetRow(index)} 
                                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                        title="Remove this KPI"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                                        {editId ? "KPI Details" : `Target #${index + 1}`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">KPI Metric</label>
                                        <select value={t.kpi_metric} onChange={e => handleTargetChange(index, 'kpi_metric', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-gray-50">
                                            <option value="">- Select Metric -</option>
                                            {kpiMetrics.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Frequency</label>
                                        <select value={t.frequency} onChange={e => handleTargetChange(index, 'frequency', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-gray-50">
                                            <option value="Daily">Daily</option>
                                            <option value="Monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-blue-600 uppercase">Total Target Number</label>
                                        <input type="number" placeholder="E.g. 50" value={t.target} onChange={e => handleTargetChange(index, 'target', e.target.value)} className="w-full border border-blue-200 p-2 rounded-lg text-sm font-black outline-none focus:border-blue-600 bg-blue-50 text-[#103c7f]"/>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Guideline / Instructions</label>
                                    <textarea rows="2" placeholder="Specific instructions for this KPI..." value={t.guideline} onChange={e => handleTargetChange(index, 'guideline', e.target.value)} className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-[#103c7f] bg-gray-50 resize-none"></textarea>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!editId && (
                        <div className="flex justify-center mb-6">
                            <button 
                                onClick={addTargetRow} 
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Plus size={14}/> Add Another KPI
                            </button>
                        </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 mt-auto">
                        <button onClick={handleSaveTarget} className="w-full py-3 rounded-xl font-black uppercase tracking-widest text-white shadow-md flex items-center justify-center gap-2 bg-[#103c7f] hover:bg-blue-900 transition-colors text-xs">
                            <Save size={16}/> {editId ? "Save Changes" : "Save All Targets"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- VIEW TARGET MODAL --- */}
      {isViewModalOpen && viewData && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                        <Eye size={16}/> Target Breakdown
                    </h3>
                    <button onClick={() => setIsViewModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={18}/></button>
                </div>

                <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col">
                    
                    <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-xl mb-5">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Role</p>
                            <p className="text-sm font-bold text-[#103c7f] flex items-center gap-1.5"><Briefcase size={14}/> {viewData.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">KPI Metric</p>
                            <p className="text-sm font-bold text-indigo-700 flex items-center justify-end gap-1.5"><BarChart2 size={14}/> {viewData.kpi_metric}</p>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-200">
                                <tr>
                                    <th className="p-3">Team Member Name</th>
                                    <th className="p-3 text-center w-24">Target</th>
                                    <th className="p-3 text-center w-24">Achieved</th>
                                    <th className="p-3 text-center w-28">% Completed</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                                {viewData.breakdown.map((row) => {
                                    const percentage = row.target > 0 ? Math.round((row.achieved / row.target) * 100) : 0;
                                    let percColor = "text-red-600 bg-red-50 border-red-200";
                                    if(percentage >= 100) percColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                                    else if(percentage >= 50) percColor = "text-amber-600 bg-amber-50 border-amber-200";

                                    return (
                                        <tr key={row.id} className="hover:bg-blue-50/30 transition">
                                            <td className="p-3 font-bold text-gray-800">{row.rc_name}</td>
                                            <td className="p-3 text-center font-mono font-bold bg-gray-50/50">{row.target}</td>
                                            <td className="p-3 text-center font-mono font-bold text-[#103c7f] bg-gray-50/50">{row.achieved}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-md text-[10px] font-black inline-flex items-center gap-0.5 border ${percColor}`}>
                                                    {percentage} <Percent size={10}/>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                </div>
            </div>
        </div>
      )}

    </div>
  );
}