"use client";
import { useState, useEffect } from "react";
import { 
  Target, Edit2, Save, BarChart3, Plus, X, 
  MapPin, Phone, Users, MessageSquare, Briefcase, Home, 
  Calendar, History, TrendingUp, Filter, Search
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function HodTargetPage() {
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("current"); // 'history' | 'current' | 'projection'
  const [currentDate] = useState(new Date().toISOString().slice(0, 7)); // e.g. "2026-02"
  
  // Modal State
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'

  // Filters
  const [historyFilter, setHistoryFilter] = useState({ month: "", manager: "" });
  const [projectionMonth, setProjectionMonth] = useState(
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 7)
  );

  // Form State
  const [targetForm, setTargetForm] = useState({
    managerId: "", month: "", 
    fseCount: 0, callerCount: 0,
    visitTarget: "", onboardTarget: "", callTarget: "", leadTarget: "",
    remarks: ""
  });

  const [managers, setManagers] = useState([]); 
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);

  // --- MOCK DATA GENERATOR ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // 1. Managers List
      setManagers([
        { id: 1, name: "Amit Verma", region: "North", sector: "Corporate", currentFse: 5, currentCaller: 2 },
        { id: 2, name: "Priya Singh", region: "West", sector: "Domestic", currentFse: 8, currentCaller: 4 },
        { id: 3, name: "Rahul Sharma", region: "South", sector: "Corporate", currentFse: 6, currentCaller: 3 }
      ]);

      // 2. Mock Data based on Tabs
      if (activeTab === 'history') {
        setData([
          { id: 101, managerId: 1, name: "Amit Verma", month: "2026-01", fseCount: 4, callerCount: 1, remarks: "Slow start.", fse: { vt: 200, va: 190, ot: 10, oa: 8 }, caller: { ct: 1000, ca: 950, lt: 40, la: 30 } },
          { id: 102, managerId: 2, name: "Priya Singh", month: "2026-01", fseCount: 7, callerCount: 3, remarks: "Good.", fse: { vt: 280, va: 300, ot: 18, oa: 20 }, caller: { ct: 1200, ca: 1100, lt: 50, la: 45 } },
          { id: 103, managerId: 1, name: "Amit Verma", month: "2025-12", fseCount: 4, callerCount: 1, remarks: "Year end push.", fse: { vt: 200, va: 210, ot: 10, oa: 12 }, caller: { ct: 1000, ca: 1000, lt: 40, la: 42 } },
        ]);
      } 
      else if (activeTab === 'current') {
        setData([
          { id: 201, managerId: 1, name: "Amit Verma", region: "North", sector: "Corporate", fseCount: 5, callerCount: 2, remarks: "Focus on corporate.", fse: { vt: 240, va: 180, ot: 15, oa: 12 }, caller: { ct: 1500, ca: 1450, lt: 60, la: 45 } },
          { id: 202, managerId: 2, name: "Priya Singh", region: "West", sector: "Domestic", fseCount: 8, callerCount: 4, remarks: "", fse: { vt: 300, va: 310, ot: 20, oa: 22 }, caller: { ct: 1200, ca: 800, lt: 50, la: 20 } },
        ]);
      } 
      else if (activeTab === 'projection') {
        // Data for Next Month (Achievements are 0)
        setData([
          { id: 301, managerId: 1, name: "Amit Verma", region: "North", sector: "Corporate", fseCount: 6, callerCount: 2, remarks: "Hiring 1 new FSE.", fse: { vt: 300, va: 0, ot: 20, oa: 0 }, caller: { ct: 1600, ca: 0, lt: 70, la: 0 } },
        ]);
      }
      setLoading(false);
    }, 500);
  }, [activeTab, projectionMonth]); 

  // --- CHART DATA PREPARATION (Only for Current Tab) ---
  const chartData = activeTab === 'current' ? data.map(d => ({
    name: d.name.split(" ")[0],
    Target: d.fse.ot,
    Achieved: d.fse.oa,
  })) : [];

  // --- HANDLERS ---
  const openModal = (mode, data = null) => {
    setModalMode(mode);
    
    if (mode === 'edit' && data) {
      // Pre-fill form for Editing
      setTargetForm({
        managerId: data.managerId,
        month: activeTab === 'projection' ? projectionMonth : currentDate,
        fseCount: data.fseCount, callerCount: data.callerCount,
        visitTarget: data.fse.vt, onboardTarget: data.fse.ot,
        callTarget: data.caller.ct, leadTarget: data.caller.lt,
        remarks: data.remarks || ""
      });
    } else {
      // Reset form for New Creation
      setTargetForm({
        managerId: "", 
        month: activeTab === 'projection' ? projectionMonth : currentDate,
        fseCount: 0, callerCount: 0,
        visitTarget: "", onboardTarget: "", callTarget: "", leadTarget: "", remarks: ""
      });
    }
    setIsTargetModalOpen(true);
  };

  const handleManagerSelect = (e) => {
    const selectedId = Number(e.target.value);
    const mgr = managers.find(m => m.id === selectedId);
    
    // Auto-fill Current Resource Count when manager is selected
    setTargetForm({
        ...targetForm,
        managerId: selectedId,
        fseCount: mgr ? mgr.currentFse : 0,     
        callerCount: mgr ? mgr.currentCaller : 0 
    });
  };

  const handleFormChange = (e) => {
    setTargetForm({ ...targetForm, [e.target.name]: e.target.value });
  };

  const handleSetTarget = (e) => {
    e.preventDefault();
    if(!targetForm.managerId) return alert("Please select a manager");
    alert(`Target Saved Successfully!\nManager ID: ${targetForm.managerId}\nMonth: ${targetForm.month}`);
    setIsTargetModalOpen(false);
  };

  const getProgressColor = (achieved, target) => {
    if(!target) return "bg-gray-200";
    const percent = (achieved / target) * 100;
    if (percent >= 100) return "bg-green-500";
    if (percent >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-['Calibri'] p-6 pb-12">
      
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
         <div>
             <h1 className="text-3xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={32} /> Target & Performance
             </h1>
             <p className="text-gray-500 text-sm font-bold mt-1">
               {activeTab === 'history' ? 'Review Past Performance' : activeTab === 'current' ? 'Live Month Tracking' : 'Plan Future Targets'}
             </p>
         </div>
      </div>

      {/* --- TABS NAVIGATION (UPDATED COLORS) --- */}
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
                    <input type="text" placeholder="Filter by Manager..." className="bg-transparent text-sm font-bold text-gray-700 outline-none w-48" onChange={(e)=> setHistoryFilter({...historyFilter, manager: e.target.value})}/>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">Month</th>
                            <th className="px-6 py-4">Manager</th>
                            <th className="px-4 py-4 text-center">Team Size</th>
                            <th className="px-4 py-4 text-center">FSE Targets</th>
                            <th className="px-4 py-4 text-center">Caller Targets</th>
                            <th className="px-4 py-4 text-center">Achievement</th>
                            <th className="px-6 py-4 w-1/4">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {data.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-500">{row.month}</td>
                                <td className="px-6 py-4 font-bold text-[#103c7f]">{row.name}</td>
                                <td className="px-4 py-4 text-center">
                                    <div className="flex justify-center gap-2 text-xs">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{row.fseCount} F</span>
                                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded font-bold">{row.callerCount} C</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-gray-600">
                                    <div>Visits: {row.fse.vt}</div>
                                    <div>Onboard: {row.fse.ot}</div>
                                </td>
                                <td className="px-4 py-4 text-center text-xs text-gray-600">
                                    <div>Calls: {row.caller.ct}</div>
                                    <div>Leads: {row.caller.lt}</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${row.fse.oa >= row.fse.ot ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {Math.round((row.fse.oa / row.fse.ot) * 100)}%
                                    </span>
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
            
            {/* Analytics Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#103c7f] flex items-center gap-2"><BarChart3 size={20}/> Sales Performance Overview</h3>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#6b7280'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="Achieved" fill="#103c7f" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.map((row) => (
                    <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 bg-blue-50/30 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{row.name}</h3>
                                <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 font-bold uppercase">{row.region}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase">Team Size</span>
                                <div className="flex gap-1 mt-1">
                                    <span className="text-xs font-black text-[#103c7f] bg-blue-100 px-1.5 rounded">{row.fseCount} F</span>
                                    <span className="text-xs font-black text-orange-600 bg-orange-100 px-1.5 rounded">{row.callerCount} C</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Body */}
                        <div className="p-5 space-y-5">
                            {/* FSE Stats */}
                            <div>
                                <h4 className="text-[10px] font-black text-[#103c7f] uppercase mb-2 flex items-center gap-1"><MapPin size={12}/> Onboarding Target</h4>
                                <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                    <span>{row.fse.oa} Achieved</span>
                                    <span>Target: {row.fse.ot}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${getProgressColor(row.fse.oa, row.fse.ot)}`} style={{width: `${(row.fse.oa/row.fse.ot)*100}%`}}></div>
                                </div>
                            </div>

                            {/* Caller Stats */}
                            <div>
                                <h4 className="text-[10px] font-black text-orange-600 uppercase mb-2 flex items-center gap-1"><Phone size={12}/> Lead Gen Target</h4>
                                <div className="flex justify-between text-xs mb-1 font-bold text-gray-700">
                                    <span>{row.caller.la} Leads</span>
                                    <span>Target: {row.caller.lt}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${getProgressColor(row.caller.la, row.caller.lt)}`} style={{width: `${(row.caller.la/row.caller.lt)*100}%`}}></div>
                                </div>
                            </div>

                            {/* Remarks */}
                            {row.remarks && (
                                <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 items-start border border-yellow-100">
                                    <MessageSquare size={14} className="text-yellow-600 mt-0.5"/>
                                    <p className="text-xs text-gray-600 italic">"{row.remarks}"</p>
                                </div>
                            )}
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
            
            {/* Control Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 text-purple-700 p-2 rounded-lg"><Calendar size={20}/></div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Planning For:</h3>
                        <input type="month" value={projectionMonth} onChange={(e) => setProjectionMonth(e.target.value)} className="font-black text-purple-700 text-lg bg-transparent outline-none cursor-pointer"/>
                    </div>
                </div>
                <button onClick={() => openModal('create')} className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2 uppercase tracking-wide">
                    <Plus size={18}/> Set Target For Manager
                </button>
            </div>

            {/* Projection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.length === 0 ? (
                    <div className="col-span-3 text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <p className="text-gray-400 font-bold">No targets set for {projectionMonth} yet.</p>
                        <button onClick={() => openModal('create')} className="mt-2 text-purple-600 font-bold hover:underline">Set First Target</button>
                    </div>
                ) : data.map((row) => (
                    <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 relative hover:border-purple-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{row.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">FSE: {row.fseCount}</span>
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">Caller: {row.callerCount}</span>
                                </div>
                            </div>
                            <button onClick={() => openModal('edit', row)} className="bg-purple-50 text-purple-700 p-2 rounded-lg hover:bg-purple-100 transition"><Edit2 size={16}/></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase">FSE Sales</span>
                                <span className="block text-xl font-black text-gray-800">{row.fse.ot}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Leads</span>
                                <span className="block text-xl font-black text-gray-800">{row.caller.lt}</span>
                            </div>
                        </div>

                        {row.remarks && (
                            <p className="text-xs text-gray-500 italic border-t pt-3 mt-3">"{row.remarks}"</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- SHARED MODAL (Create/Edit Targets) --- */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border-4 border-white">
                <div className={`${activeTab === 'projection' ? 'bg-purple-700' : 'bg-[#103c7f]'} p-5 flex justify-between items-center text-white shrink-0`}>
                    <h3 className="font-bold text-lg uppercase flex items-center gap-2">
                        <Target size={20} /> {modalMode === 'create' ? 'Set New Target' : 'Update Target'}
                    </h3>
                    <button onClick={() => setIsTargetModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={20}/></button>
                </div>
                
                <form className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
                    {/* Manager Select */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Select Manager</label>
                            <select 
                                name="managerId" 
                                value={targetForm.managerId} 
                                onChange={handleManagerSelect} 
                                disabled={modalMode === 'edit'}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-700 outline-none focus:border-purple-500 bg-gray-50 disabled:opacity-60"
                            >
                                <option value="">-- Choose Manager --</option>
                                {managers.map(mgr => (
                                    <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.region})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Resource Snapshot */}
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Team Size for {targetForm.month}</h4>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">FSE Count</label>
                                <input type="number" name="fseCount" value={targetForm.fseCount} onChange={handleFormChange} className="w-full p-2 border rounded-lg text-sm font-bold"/>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 block mb-1">Caller Count</label>
                                <input type="number" name="callerCount" value={targetForm.callerCount} onChange={handleFormChange} className="w-full p-2 border rounded-lg text-sm font-bold"/>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Visits/FSE</label><input type="number" name="visitTarget" className="w-full border p-2 rounded-lg font-bold" value={targetForm.visitTarget} onChange={handleFormChange}/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Onboards/FSE</label><input type="number" name="onboardTarget" className="w-full border p-2 rounded-lg font-bold" value={targetForm.onboardTarget} onChange={handleFormChange}/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Calls/Caller</label><input type="number" name="callTarget" className="w-full border p-2 rounded-lg font-bold" value={targetForm.callTarget} onChange={handleFormChange}/></div>
                        <div><label className="text-[10px] font-bold text-gray-400 uppercase block">Leads/Caller</label><input type="number" name="leadTarget" className="w-full border p-2 rounded-lg font-bold" value={targetForm.leadTarget} onChange={handleFormChange}/></div>
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