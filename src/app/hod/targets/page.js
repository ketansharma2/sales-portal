"use client";
import { useState, useEffect } from "react";
import { 
  Target, Edit2, Save, BarChart3, Plus, X, 
  MapPin, Phone, PieChart, Users, CheckCircle, AlertCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function HodTargetPage() {
  
  // --- STATE ---
  const [currentDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterMonth, setFilterMonth] = useState(currentDate);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'edit'

  // Form State
  const [targetForm, setTargetForm] = useState({
    managerId: "", month: currentDate,
    visitTarget: "", onboardTarget: "", callTarget: "", leadTarget: ""
  });

  // Data State
  const [managers, setManagers] = useState([]); 
  const [performanceData, setPerformanceData] = useState([]); 
  const [loading, setLoading] = useState(false);

  // --- MOCK DATA LOADER ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setManagers([
        { id: 1, name: "Amit Verma", region: "North" },
        { id: 2, name: "Priya Singh", region: "West" },
        { id: 3, name: "Rahul Sharma", region: "South" }
      ]);

      setPerformanceData([
        { 
          id: 1, name: "Amit Verma", region: "North", 
          fseCount: 5, callerCount: 2,
          fse: { visitTarget: 240, visitAchieved: 180, onboardTarget: 15, onboardAchieved: 12 },
          caller: { callTarget: 1500, callAchieved: 1450, leadTarget: 60, leadAchieved: 45 }
        },
        { 
          id: 2, name: "Priya Singh", region: "West", 
          fseCount: 8, callerCount: 4,
          fse: { visitTarget: 300, visitAchieved: 310, onboardTarget: 20, onboardAchieved: 22 }, 
          caller: { callTarget: 1200, callAchieved: 800, leadTarget: 50, leadAchieved: 20 }  
        },
        { 
          id: 3, name: "Rahul Sharma", region: "South", 
          fseCount: 6, callerCount: 3,
          fse: { visitTarget: 200, visitAchieved: 50, onboardTarget: 10, onboardAchieved: 1 }, 
          caller: { callTarget: 1000, callAchieved: 950, leadTarget: 40, leadAchieved: 38 }
        }
      ]);
      setLoading(false);
    }, 600);
  }, [filterMonth]);

  // --- CHART DATA PREPARATION ---
  const chartData = performanceData.map(d => ({
    name: d.name.split(" ")[0],
    Target: d.fse.onboardTarget,
    Achieved: d.fse.onboardAchieved,
  }));

  // --- HANDLERS ---
  const handleFormChange = (e) => setTargetForm({ ...targetForm, [e.target.name]: e.target.value });
  
  const handleSetTarget = (e) => {
    e.preventDefault();
    if(!targetForm.managerId && activeTab === 'new') return alert("Please select a manager");
    
    alert(`${activeTab === 'new' ? 'New Targets Set' : 'Targets Updated'} for ${targetForm.month}!`);
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
    <div className="min-h-screen bg-gray-50/50 font-['Calibri'] p-6 pb-12 relative z-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
         <div>
             <h1 className="text-3xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                <Target size={32} /> Target & Analytics Console
             </h1>
             <p className="text-gray-500 text-sm font-bold mt-1">Performance Overview & Monthly Planning</p>
         </div>
         
         <div className="flex gap-3">
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Viewing:</span>
                <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent border-none text-sm font-bold text-[#103c7f] outline-none cursor-pointer"/>
             </div>
             <button onClick={() => { setActiveTab('new'); setIsTargetModalOpen(true); }} className="bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2 uppercase tracking-wide">
                <Plus size={18}/> Manage Targets
             </button>
         </div>
      </div>

      {/* --- ANALYTICS SUMMARY --- */}
    
      {/* --- TEAM CARDS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
              <p className="col-span-3 text-center py-12 text-gray-400">Loading Data...</p>
          ) : performanceData.map((row) => (
              <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                  
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                      <div>
                          <h3 className="font-bold text-lg text-gray-800">{row.name}</h3>
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase font-bold tracking-wider">{row.region}</span>
                      </div>
                      <div className="flex gap-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg" title="FSE Count"><Users size={12}/> {row.fseCount}</span>
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg" title="Caller Count"><Phone size={12}/> {row.callerCount}</span>
                      </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col gap-6">
                      
                      {/* FSE Section */}
                      <div>
                          <h4 className="text-xs font-black text-[#103c7f] uppercase mb-3 flex items-center gap-1"><MapPin size={12}/> Field Sales Performance</h4>
                          <div className="space-y-3">
                              {/* Visits */}
                              <div>
                                  <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-500 font-bold">Visits</span>
                                      <span className="font-black text-gray-800">{row.fse.visitAchieved} <span className="text-gray-400 font-normal">/ {row.fse.visitTarget}</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${getProgressColor(row.fse.visitAchieved, row.fse.visitTarget)}`} style={{ width: `${Math.min((row.fse.visitAchieved / row.fse.visitTarget) * 100, 100)}%` }}></div>
                                  </div>
                              </div>
                              {/* Onboards */}
                              <div>
                                  <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-500 font-bold">Onboards</span>
                                      <span className="font-black text-gray-800">{row.fse.onboardAchieved} <span className="text-gray-400 font-normal">/ {row.fse.onboardTarget}</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${getProgressColor(row.fse.onboardAchieved, row.fse.onboardTarget)}`} style={{ width: `${Math.min((row.fse.onboardAchieved / row.fse.onboardTarget) * 100, 100)}%` }}></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Caller Section */}
                      <div>
                          <h4 className="text-xs font-black text-orange-600 uppercase mb-3 flex items-center gap-1"><Phone size={12}/> Caller Performance</h4>
                          <div className="space-y-3">
                              {/* Calls */}
                              <div>
                                  <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-500 font-bold">Total Calls</span>
                                      <span className="font-black text-gray-800">{row.caller.callAchieved} <span className="text-gray-400 font-normal">/ {row.caller.callTarget}</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${getProgressColor(row.caller.callAchieved, row.caller.callTarget)}`} style={{ width: `${Math.min((row.caller.callAchieved / row.caller.callTarget) * 100, 100)}%` }}></div>
                                  </div>
                              </div>
                              {/* Leads */}
                              <div>
                                  <div className="flex justify-between text-xs mb-1">
                                      <span className="text-gray-500 font-bold">Interested Leads</span>
                                      <span className="font-black text-gray-800">{row.caller.leadAchieved} <span className="text-gray-400 font-normal">/ {row.caller.leadTarget}</span></span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${getProgressColor(row.caller.leadAchieved, row.caller.leadTarget)}`} style={{ width: `${Math.min((row.caller.leadAchieved / row.caller.leadTarget) * 100, 100)}%` }}></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                  </div>
              </div>
          ))}
      </div>

      {/* --- ADD / EDIT TARGET MODAL --- */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border-4 border-white">
                
                {/* Header with Tabs */}
                <div className="bg-[#103c7f] p-0">
                    <div className="flex justify-between items-center p-4 pb-0">
                        <h3 className="font-bold text-lg text-white uppercase flex items-center gap-2 mb-4">
                            <Edit2 size={20} /> Manage Monthly Targets
                        </h3>
                        <button onClick={() => setIsTargetModalOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition text-white mb-4"><X size={20}/></button>
                    </div>
                    
                    {/* TABS */}
                    <div className="flex px-4 gap-1">
                        <button 
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'new' ? 'bg-white text-[#103c7f]' : 'bg-[#0d2e61] text-gray-400 hover:text-white'}`}
                        >
                            Set New Target
                        </button>
                        <button 
                            onClick={() => setActiveTab('edit')}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === 'edit' ? 'bg-white text-[#103c7f]' : 'bg-[#0d2e61] text-gray-400 hover:text-white'}`}
                        >
                            Quick Edit
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSetTarget} className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
                    
                    {/* Conditional Select based on Tab */}
                    {activeTab === 'new' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Select Manager</label>
                                <select name="managerId" value={targetForm.managerId} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-gray-50">
                                    <option value="">-- Choose Manager --</option>
                                    {managers.map(mgr => <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.region})</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block ml-1">Target Month</label>
                                <input type="month" name="month" value={targetForm.month} onChange={handleFormChange} className="w-full border border-gray-300 rounded-xl p-3 text-sm font-bold text-[#103c7f] outline-none focus:border-[#103c7f]"/>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 font-bold">
                            Select a manager from the list below to update their existing targets for {filterMonth}.
                            <select name="managerId" value={targetForm.managerId} onChange={handleFormChange} className="w-full mt-2 border border-blue-200 rounded p-2 bg-white outline-none">
                                <option value="">-- Select Manager to Edit --</option>
                                {managers.map(mgr => <option key={mgr.id} value={mgr.id}>{mgr.name}</option>)}
                            </select>
                        </div>
                    )}

                    <hr className="border-gray-100"/>

                    {/* FSE KPI Inputs */}
                    <div>
                        <h3 className="text-xs font-black text-[#103c7f] uppercase mb-3 flex items-center gap-2"><MapPin size={14}/> Field Sales (FSE) KPIs</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Visits</label><input type="number" name="visitTarget" value={targetForm.visitTarget} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-blue-500"/></div>
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Onboards</label><input type="number" name="onboardTarget" value={targetForm.onboardTarget} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-blue-500"/></div>
                        </div>
                    </div>

                    {/* Caller KPI Inputs */}
                    <div>
                        <h3 className="text-xs font-black text-orange-600 uppercase mb-3 flex items-center gap-2"><Phone size={14}/> Caller KPIs</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Calls</label><input type="number" name="callTarget" value={targetForm.callTarget} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-orange-500"/></div>
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Leads</label><input type="number" name="leadTarget" value={targetForm.leadTarget} onChange={handleFormChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none focus:border-orange-500"/></div>
                        </div>
                    </div>

                    <button type="submit" className="mt-2 bg-[#103c7f] hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex justify-center items-center gap-2">
                        <Save size={18} /> {activeTab === 'new' ? 'Create Targets' : 'Update Targets'}
                    </button>

                </form>
            </div>
        </div>
      )}
    </div>
  );
}