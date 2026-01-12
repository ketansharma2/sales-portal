"use client";
import { useState, useEffect } from "react";
import {
  Wallet, Plus, X, FileText, Send, CheckCircle,
  Clock, Paperclip, AlertCircle, ChevronDown, Trash2
} from "lucide-react";

export default function ExpenseList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Working State & Logic
  const [formData, setFormData] = useState({ date: "", category: "TRAVEL", amount: "", notes: "" });

  const fetchExpenses = async (dateFilter = "") => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const url = dateFilter ? `/api/corporate/fse/expenses?date=${dateFilter}` : '/api/corporate/fse/expenses';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      // Call API to save
    const session = JSON.parse(localStorage.getItem('session') || '{}');
    const response = await fetch('/api/corporate/fse/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (data.success) {
      fetchExpenses(filterDate);
      setIsModalOpen(false);
      setFormData({ date: "", category: "TRAVEL", amount: "", notes: "" });
    }
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };
  const handleSubmitToManager = async (exp_id) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/fse/submit-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ exp_id })
      });
      const data = await response.json();
      if (data.success) {
        fetchExpenses(filterDate); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to submit expense:', error);
    }
  };

  const handleDeleteExpense = async (exp_id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/corporate/fse/expenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ exp_id })
      });
      const data = await response.json();
      if (data.success) {
        fetchExpenses(filterDate); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  return (
    <div className="h-screen bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col overflow-hidden">
      
     {/* --- HEADER: Heading (Left) | Grouped Filter & Button (Right) --- */}
<div className="flex justify-between items-end mb-4 shrink-0 transition-all duration-500 ease-in-out">
  
  {/* LEFT: Heading Section */}
  <div>
    <h1 className="text-4xl font-black text-[#103c7f] tracking-tight uppercase italic">
      Expense Claims
    </h1>
    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
      <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse"></span> 
      FSE Personal Portal
    </p>
  </div>

  {/* RIGHT: Filter aur Button ka Group */}
  {/* gap-6 yahan Filter aur Button ke beech space bana raha hai */}
  <div className="flex items-end gap-10">
    
    {/* Date Filter Section */}
    <div className="flex flex-col gap-1">
      {/*<label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Filter by Date</label>*/}
      <div className="relative flex items-center">
        <input 
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-5 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold text-[#103c7f] outline-none focus:ring-2 focus:ring-[#a1db40]/30 transition-all shadow-sm cursor-pointer"
        />
        {filterDate && (
          <button 
            onClick={() => setFilterDate("")}
            className="absolute -right-8 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>

    {/* Create Button Section */}
    <button 
      onClick={() => setIsModalOpen(true)}
      className="bg-[#a1db40] text-[#103c7f] px-8 py-4 rounded-[22px] font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[#a1db40]/20 active:scale-95 text-xs uppercase"
    >
      <Plus size={18} strokeWidth={3} /> 
      Create Claim
    </button>
  </div>
</div>

      {/* TABLE: Internal Scroll & Navy Header */}
     <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden flex flex-col flex-1 max-h-[74vh]">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 z-10 bg-[#103c7f] text-white">
              <tr className="text-[12px] uppercase font-black tracking-widest">
                <th className="px-4 py-3 border-b border-white/10">Date</th>
                <th className="px-4 py-3 border-b border-white/10">Details</th>
                <th className="px-4 py-3 text-center border-b border-white/10">Amount</th>
                <th className="px-4 py-3 text-center border-b border-white/10">Status</th>
                <th className="px-4 py-3 text-center border-b border-white/10">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
  {expenses
    .filter(exp => filterDate === "" || exp.date === filterDate) // Filter logic
    .map((exp) => (
                <tr key={exp.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-all">
                  <td className="px-6 py-4 font-black text-gray-500">{exp.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[#103c7f] text-xs uppercase flex items-center gap-2">
                        {exp.category}
                      </span>
                      <span className="text-gray-400 text-[11px] font-bold italic mt-0.5">{exp.notes}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-xl font-black text-[#103c7f] italic leading-none">₹{exp.amount}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic flex items-center justify-center gap-1.5 ${
  // 1. APPROVED (Green)
  exp.status === 'Approved'
    ? 'bg-green-50 text-green-600 border-green-100'
  // 2. REJECTED (Red)
  : exp.status === 'Rejected'
    ? 'bg-red-50 text-red-600 border-red-100'
  // 3. CLARIFICATION REQUIRED (Yellow)
  : exp.status === 'CLARIFICATION REQ'
    ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
  // 4. PENDING (Orange)
  : exp.status.includes('Pending')
    ? 'bg-orange-50 text-orange-600 border-orange-100'
  // 5. DRAFT (Gray)
  : 'bg-gray-50 text-gray-400 border-gray-100'
}`}>
  {/* Icons for visual feedback */}
  {exp.status === 'APPROVED' && <CheckCircle size={10} />}
  {(exp.status === 'REJECTED' || exp.status === 'CLARIFICATION REQ') && <AlertCircle size={10} />}
  {exp.status.includes('PENDING') && <Clock size={10} />}
  
  {exp.status}
</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {exp.status === "DRAFT" ? (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleSubmitToManager(exp.id)} className="bg-[#103c7f] text-white px-4 py-2 rounded-[12px] hover:bg-[#a1db40] hover:text-[#103c7f] flex items-center gap-2 shadow-md">
                          <Send size={12} /> <span className="text-[10px] font-black uppercase">Submit to Manager</span>
                        </button>
                        <button onClick={() => handleDeleteExpense(exp.id)} className="bg-red-50 text-red-600 p-2 rounded-[12px] hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                      </div>
                    ) : (
                      <span className="text-gray-300 font-bold italic text-[10px] uppercase bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ORIGINAL PREMIUM MODAL (Restored) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn font-['Calibri']">
          <div className="bg-white/95 rounded-[32px] shadow-2xl max-w-2xl w-full p-8 relative border border-white/40 overflow-hidden">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-100/80 rounded-full text-gray-500 hover:text-red-500 transition-all z-10">
              <X size={18} strokeWidth={2.5} />
            </button>
            
            <div className="mb-6 text-center">
              <div className="bg-[#a1db40]/20 w-14 h-14 rounded-[20px] flex items-center justify-center text-[#103c7f] mx-auto mb-3">
                <Wallet size={26} strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-black text-[#103c7f] tracking-tight leading-none uppercase italic">New Expense Claim</h2>
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Maven Jobs Reimbursement</p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Date</label>
                  <input type="date" required onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Category</label>
                  <div className="relative">
                    <select onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700 appearance-none">
                      <option value="TRAVEL">Travel</option>
                      <option value="FOOD">Food</option>
                      <option value="STAY">Stay</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount (₹)</label>
                  <input type="number" required placeholder="0.00" onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700" />
                </div>
                {/* <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Proof of Expense</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-[14px] p-2 bg-gray-50/50 hover:bg-[#a1db40]/5 hover:border-[#a1db40]/50 transition-all group flex items-center justify-center gap-3 cursor-pointer h-[46px]">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <FileText size={18} className="text-[#103c7f] opacity-40 group-hover:text-[#a1db40]" />
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-tight group-hover:text-[#103c7f]">Upload Bill</p>
                  </div>
                </div> */}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Notes</label>
                <textarea rows="2" placeholder="Briefly describe the expense..." onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700 resize-none"></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-500 py-3.5 rounded-[14px] font-black tracking-widest hover:bg-gray-200 transition-all text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-1 bg-[#103c7f] text-white py-3.5 rounded-[14px] font-black tracking-widest hover:bg-[#0d316a] shadow-lg transition-all text-xs uppercase">Save Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}