"use client";
import { useState, useEffect } from "react";
import { 
  Check, X, ShieldCheck, UserCircle, Search, Download, 
  Clock, FileText, CheckCircle, ArrowRightCircle, Building2, Send,
  Wallet, Plus, Paperclip, AlertCircle, ChevronDown, Trash2
} from "lucide-react";
import * as API from '@/lib/api-client';

export default function HODExpenseManagement() {
  // Tab State: 'approvals' (Team Claims) | 'personal' (HOD Claims)
  const [activeTab, setActiveTab] = useState("approvals");

  // --- APPROVALS STATES ---
  const [approvals, setApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [approvalSearch, setApprovalSearch] = useState("");

  // --- PERSONAL CLAIMS STATES ---
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ date: "", category: "TRAVEL", amount: "", notes: "" });
  const [selectedFile, setSelectedFile] = useState(null);

  // --- SHARED PREVIEW MODAL STATES ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewExpense, setPreviewExpense] = useState(null);

  // ================= FETCH FUNCTIONS =================
  const fetchPendingExpenses = async () => {
    try {
      const response = await API.apiGet("/api/hod/pending-expenses");
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending expenses:', error);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const fetchPersonalExpenses = async (dateFilter = "") => {
    try {
      const url = dateFilter ? `/api/hod/expenses?date=${dateFilter}` : '/api/hod/expenses';
      const response = await API.apiGet(url);
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch personal expenses:', error);
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchPendingExpenses();
    fetchPersonalExpenses();
  }, []);

  // ================= APPROVAL ACTIONS =================
  const handleApprove = async (exp_id) => {
    try {
      const response = await API.apiPost("/api/hod/approve-expense", { exp_id });
      const data = await response.json();
      if (data.success) {
        fetchPendingExpenses();
      }
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const handleReject = async (exp_id) => {
    try {
      const response = await API.apiPost("/api/hod/reject-expense", { exp_id });
      const data = await response.json();
      if (data.success) {
        fetchPendingExpenses();
      }
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };

  const handleSendToHR = async (exp_id) => {
    try {
      const response = await API.apiPost("/api/hod/send-to-hr", { exp_id });
      const data = await response.json();
      if (data.success) {
        fetchPendingExpenses();
      }
    } catch (error) {
      console.error('Failed to send to HR:', error);
    }
  };

  // ================= PERSONAL CLAIM ACTIONS =================
  const handleSavePersonalClaim = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('date', formData.date);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('notes', formData.notes);
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const response = await API.apiUpload("/api/hod/expenses", formDataToSend);
      const data = await response.json();
      if (data.success) {
        fetchPersonalExpenses(filterDate);
        setIsModalOpen(false);
        setFormData({ date: "", category: "TRAVEL", amount: "", notes: "" });
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleSubmitToAdmin = async (exp_id) => {
    try {
      const response = await API.apiPost("/api/hod/submit-expense", { exp_id });
      const data = await response.json();
      if (data.success) {
        fetchPersonalExpenses(filterDate);
      }
    } catch (error) {
      console.error('Failed to submit expense:', error);
    }
  };

  const handleDeleteExpense = async (exp_id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const response = await API.apiDelete("/api/hod/expenses", { exp_id });
      const data = await response.json();
      if (data.success) {
        fetchPersonalExpenses(filterDate);
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  // Filter approvals based on search input
  const filteredApprovals = approvals.filter(item => 
    item.name?.toLowerCase().includes(approvalSearch.toLowerCase()) ||
    item.category?.toLowerCase().includes(approvalSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col overflow-hidden">      
      
      {/* --- HEADER SECTION --- */}
      <div className="bg-white rounded-[16px] p-4 mb-3 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#103c7f] p-3 rounded-[14px] shadow-lg shadow-[#103c7f]/20">
            <ShieldCheck size={24} className="text-[#a1db40]" strokeWidth={2.5}/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">
              HOD Expense Portal
            </h1>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] mt-1.5 uppercase flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
               Unified Management Console
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center bg-gray-50 p-1.5 rounded-[14px] border border-gray-100 gap-1">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`px-5 py-2 rounded-[10px] font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === "approvals"
                ? "bg-[#103c7f] text-[#a1db40] shadow-md"
                : "text-gray-500 hover:text-[#103c7f]"
            }`}
          >
            Team Approvals ({approvals.length})
          </button>
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-5 py-2 rounded-[10px] font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === "personal"
                ? "bg-[#103c7f] text-[#a1db40] shadow-md"
                : "text-gray-500 hover:text-[#103c7f]"
            }`}
          >
            My Claims ({expenses.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: TEAM APPROVALS ================= */}
      {activeTab === "approvals" && (
        <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-200">
          
          {/* Sub-Header / Controls */}
          <div className="flex justify-between items-center mb-3 px-1 shrink-0">
            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm w-72">
              <Search size={16} className="text-gray-300"/>
              <input 
                type="text" 
                placeholder="Search Manager / Category..." 
                value={approvalSearch}
                onChange={(e) => setApprovalSearch(e.target.value)}
                className="bg-transparent text-[11px] font-bold text-[#103c7f] outline-none w-full" 
              />
            </div>
            <button className="bg-[#103c7f] text-[#a1db40] px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-[#0d316a] transition-all">
              <Download size={12} /> Export Report
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-[#103c7f] text-white z-10 text-[10px] uppercase font-black tracking-[0.1em]">
                  <tr>
                    <th className="px-5 py-3.5">Sales Manager</th>
                    <th className="px-5 py-3.5">Expense Category & Notes</th>
                    <th className="px-5 py-3.5 text-center">Amount</th>
                    <th className="px-5 py-3.5 text-center">Date</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredApprovals.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-purple-50 transition-all group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${item.img || 'bg-gray-100 text-gray-500'}`}>
                            <UserCircle size={22} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="font-black text-[#103c7f] text-sm leading-none tracking-tight">{item.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-1">
                              <span className={`w-1 h-1 rounded-full ${item.source === 'corporate' ? 'bg-green-500' : 'bg-[#a1db40]'}`}></span>
                              {item.role} {item.source === 'corporate' && <span className="text-[8px] text-green-600 font-bold">(Corp)</span>}
                            </p>
                            {item.sector && (
                              <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded mt-1 inline-block font-bold">
                                {item.sector}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                            <span className="font-black text-gray-700 uppercase tracking-tight text-[11px] mb-0.5">{item.category}</span>
                            <span className="text-[11px] font-bold text-gray-400 italic">"{item.notes}"</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <p className="text-lg font-black text-[#103c7f] italic leading-none">₹{item.amount}</p>
                      </td>
                      <td className="px-5 py-3 text-center font-black text-gray-400 text-[11px]">
                        {item.date}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border italic flex items-center justify-center gap-1.5 w-fit mx-auto
                          ${item.status === 'Sent to HR' ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                            : item.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100'
                            : item.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100'
                            : item.status === 'Pending (HOD)' ? 'bg-orange-50 text-orange-600 border-orange-100'
                            : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                          {item.status === 'Pending (HOD)' && <Clock size={10} />}
                          {item.status === 'Sent to HR' && <Building2 size={10} />}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {item.status === "Pending (HOD)" ? (
                          <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleApprove(item.id)} className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm" title="Approve">
                              <Check size={16} strokeWidth={3}/>
                            </button>
                            <button onClick={() => handleReject(item.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Reject">
                              <X size={16} strokeWidth={3}/>
                            </button>
                            <button onClick={() => { setPreviewExpense(item); setIsPreviewOpen(true); }} className="bg-gray-100 text-[#103c7f] p-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-all shadow-sm" title="View Bill Proof">
                              <FileText size={16} strokeWidth={2}/>
                            </button>
                          </div>
                        ) : item.status === "Approved" ? (
                          <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleSendToHR(item.id)} className="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Send to HR">
                              <Send size={16} strokeWidth={2}/>
                            </button>
                            <button onClick={() => { setPreviewExpense(item); setIsPreviewOpen(true); }} className="bg-gray-100 text-[#103c7f] p-2 rounded-lg hover:bg-[#103c7f] hover:text-white transition-all shadow-sm" title="View Bill Proof">
                              <FileText size={16} strokeWidth={2}/>
                            </button>
                          </div>
                        ) : item.status === "Sent to HR" ? (
                          <div className="flex justify-center items-center gap-1 opacity-60">
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">HOD</span>
                             <ArrowRightCircle size={10} className="text-indigo-600" />
                             <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">HR Dept</span>
                          </div>
                        ) : item.status === "Rejected" ? (
                          <div className="flex justify-center items-center gap-2 opacity-80">
                            <X size={16} className="text-red-600" />
                            <button onClick={() => { setPreviewExpense(item); setIsPreviewOpen(true); }} className="text-[#103c7f] hover:text-[#a1db40] transition-colors" title="View Bill Proof">
                              <FileText size={16} strokeWidth={2}/>
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center items-center opacity-60">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.status}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Approvals Footer */}
            <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center text-[#103c7f] shrink-0">
               <div className="flex items-center gap-4">
                 <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Action Req: {approvals.length} Claims</p>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest">Total Pending Value: <span className="text-lg italic">₹{approvals.reduce((sum, item) => sum + parseFloat(item.amount?.toString().replace(/,/g, '') || 0), 0).toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: HOD PERSONAL CLAIMS ================= */}
      {activeTab === "personal" && (
        <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-200">
          
          {/* Sub-Header / Controls */}
          <div className="flex justify-between items-center mb-3 px-1 shrink-0">
            <div className="relative flex items-center">
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-[#103c7f] outline-none shadow-sm cursor-pointer"
              />
              {filterDate && (
                <button onClick={() => setFilterDate("")} className="absolute -right-6 text-gray-400 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#a1db40] text-[#103c7f] px-5 py-2 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-md text-xs uppercase"
            >
              <Plus size={16} strokeWidth={3} /> Create Claim
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10 bg-[#103c7f] text-white">
                  <tr className="text-[10px] uppercase font-black tracking-widest">
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Details</th>
                    <th className="px-5 py-3.5 text-center">Amount</th>
                    <th className="px-5 py-3.5 text-center">Proof</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {expenses
                    .filter(exp => filterDate === "" || exp.date === filterDate)
                    .map((exp) => (
                      <tr key={exp.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-all">
                        <td className="px-5 py-3 font-black text-gray-500 text-[11px]">{exp.date}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col">
                            <span className="font-black text-[#103c7f] text-xs uppercase">{exp.category}</span>
                            <span className="text-gray-400 text-[11px] font-bold italic">{exp.notes}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <p className="text-lg font-black text-[#103c7f] italic leading-none">₹{exp.amount}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {exp.file_link ? (
                            <button onClick={() => { setPreviewExpense(exp); setIsPreviewOpen(true); }} className="text-[#103c7f] hover:text-[#a1db40] transition-colors flex justify-center w-full">
                              <Paperclip size={16} />
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border italic flex items-center justify-center gap-1.5 w-fit mx-auto ${
                              exp.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100'
                              : exp.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100'
                              : exp.status?.includes('S.SIR') ? 'bg-purple-50 text-purple-600 border-purple-100'
                              : exp.status?.includes('Pending') ? 'bg-orange-50 text-orange-600 border-orange-100'
                              : 'bg-gray-50 text-gray-400 border-gray-100'
                            }`}>
                            {exp.status === 'APPROVED' && <CheckCircle size={10} />}
                            {exp.status === 'REJECTED' && <AlertCircle size={10} />}
                            {exp.status?.includes('PENDING') && <ShieldCheck size={10} />}
                            {exp.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {exp.status === "DRAFT" ? (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleSubmitToAdmin(exp.id)} className="bg-[#103c7f] text-white px-3 py-1.5 rounded-lg hover:bg-[#a1db40] hover:text-[#103c7f] flex items-center gap-1.5 shadow-sm transition-colors text-[10px] font-black uppercase">
                                <Send size={12} /> Submit
                              </button>
                              <button onClick={() => handleDeleteExpense(exp.id)} className="bg-red-50 text-red-600 p-1.5 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-300 font-bold italic text-[9px] uppercase bg-gray-50 px-2.5 py-1 rounded border border-gray-100">Locked</span>
                          )}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE PERSONAL CLAIM ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Calibri'] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full p-8 relative overflow-hidden">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="mb-6 flex items-center gap-4">
              <div className="bg-[#103c7f]/5 w-14 h-14 rounded-2xl flex items-center justify-center text-[#103c7f] border border-[#103c7f]/10 shrink-0">
                <Wallet size={26} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">New HOD Claim</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Submit to S.Sir / Management</p>
              </div>
            </div>

            <form onSubmit={handleSavePersonalClaim} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Date</label>
                  <input type="date" required onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-xs font-semibold text-gray-700 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Category</label>
                  <div className="relative">
                    <select onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-xs font-semibold text-gray-700 appearance-none cursor-pointer">
                      <option value="TRAVEL">Travel / Fuel</option>
                      <option value="FLIGHT">Flight</option>
                      <option value="STAY">Hotel / Stay</option>
                      <option value="FOOD">Client Hosting / Food</option>
                      <option value="MISC">Dept Activity / Misc</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input type="number" required placeholder="0.00" onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-xs font-semibold text-gray-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Proof</label>
                  <div className="relative border border-dashed border-[#103c7f]/30 rounded-xl bg-[#103c7f]/5 hover:bg-[#103c7f]/10 flex items-center justify-center gap-2 cursor-pointer h-[42px]">
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <FileText size={14} className="text-[#103c7f]" />
                    <span className="text-[10px] font-bold text-[#103c7f] uppercase">{selectedFile ? selectedFile.name.slice(0, 12) + '...' : 'Upload Bill'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Notes</label>
                <textarea rows="2" placeholder="Purpose of expense..." onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-xs font-medium text-gray-700 resize-none"></textarea>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-1 bg-[#103c7f] text-white py-3 rounded-xl font-bold hover:bg-[#0d316a] text-xs uppercase flex items-center justify-center gap-1.5 shadow-md">
                  <CheckCircle size={14} strokeWidth={2.5} /> Save Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SHARED PREVIEW MODAL ================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Calibri'] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl max-w-4xl w-full p-8 relative overflow-hidden">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
              <X size={20} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-5 mb-6">
              <div className="bg-[#103c7f]/5 w-16 h-16 rounded-2xl flex items-center justify-center text-[#103c7f] border border-[#103c7f]/10 shrink-0">
                <FileText size={30} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">Bill Preview</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1.5">Expense Proof Document</p>
              </div>
            </div>
            <div className="flex justify-center">
              <img src={previewExpense?.file_link} alt="Bill Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}