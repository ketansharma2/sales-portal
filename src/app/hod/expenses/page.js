"use client";
import { useState } from "react";
import { 
  Wallet, Plus, X, FileText, Send, CheckCircle, 
  Clock, Paperclip, AlertCircle, ChevronDown, Trash2, ShieldCheck 
} from "lucide-react";

export default function HODPersonalClaims() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  
  // 👇 DATA CHANGED: HOD Expenses (Higher Value / Strategic)
  // Status is now handled by S.Sir (Super Admin/Director)
  const [expenses, setExpenses] = useState([
    { id: 1, date: "2025-12-18", type: "FLIGHT", amount: "12500", status: "APPROVED", notes: "Annual Strategy Meet - Bangalore", bill: "flight_biz.pdf" },
    { id: 2, date: "2025-12-20", type: "STAY", amount: "8500", status: "PENDING (S.SIR)", notes: "Hotel Oberoi - Client Hosting", bill: "hotel_lux.pdf" },
    { id: 3, date: "2025-12-22", type: "FOOD", amount: "4200", status: "PENDING (S.SIR)", notes: "Dinner with Regional Directors", bill: "dinner_bill.jpg" },
    { id: 4, date: "2025-12-25", type: "MISC", amount: "15000", status: "DRAFT", notes: "Diwali Gifts for Department", bill: null },
    { id: 5, date: "2025-12-26", type: "TRAVEL", amount: "2200", status: "REJECTED", notes: "Personal Cab Detour", bill: "cab_bill.jpg" },
  ]);

  // Working State & Logic
  const [formData, setFormData] = useState({ date: "", type: "TRAVEL", amount: "", notes: "", bill: null });

  const handleSave = (e) => {
    e.preventDefault();
    
    const newExpense = { 
      ...formData, 
      id: Date.now(), 
      status: "DRAFT" 
    };

    setExpenses([...expenses, newExpense]);
    setIsModalOpen(false);
    setFormData({ date: "", type: "TRAVEL", amount: "", notes: "", bill: null });
  };

  // 👇 LOGIC CHANGED: Submit to S.Sir (Hierarchy Maintained)
  const submitToSuperior = (id) => {
    setExpenses(expenses.map(exp => 
      exp.id === id ? { ...exp, status: "PENDING (S.SIR)" } : exp
    ));
  };

  return (
    <div className="h-screen bg-[#f8fafc] w-full font-['Calibri'] p-2 flex flex-col overflow-hidden">      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end mb-3 shrink-0 transition-all duration-500 ease-in-out">
        <div>
          <h1 className="text-4xl font-black text-[#103c7f] tracking-tight uppercase italic">
            HOD Expense Claims
          </h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#a1db40] rounded-full animate-pulse"></span> 
            HOD Personal Portal
          </p>
        </div>

        <div className="flex items-end gap-10">
          {/* Date Filter */}
          <div className="flex flex-col gap-1">
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

          {/* Create Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#a1db40] text-[#103c7f] px-8 py-4 rounded-[22px] font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-[#a1db40]/20 active:scale-95 text-xs uppercase"
          >
            <Plus size={18} strokeWidth={3} /> 
            Create Claim
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden flex flex-col flex-1 max-h-[80vh]">
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
              .filter(exp => filterDate === "" || exp.date === filterDate)
              .map((exp) => (
                <tr key={exp.id} className="border-b border-gray-50 hover:bg-blue-50/40 transition-all">
                  <td className="px-6 py-4 font-black text-gray-500">{exp.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[#103c7f] text-xs uppercase flex items-center gap-2">
                        {exp.type} {exp.bill && <Paperclip size={12} className="text-[#a1db40]" />}
                      </span>
                      <span className="text-gray-400 text-[11px] font-bold italic mt-0.5">{exp.notes}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-xl font-black text-[#103c7f] italic leading-none">₹{exp.amount}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border italic flex items-center justify-center gap-1.5 ${
                        exp.status === 'APPROVED' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                        : exp.status === 'REJECTED'
                          ? 'bg-red-50 text-red-600 border-red-100'
                        : exp.status.includes('S.SIR') 
                          ? 'bg-purple-50 text-purple-600 border-purple-100' // Purple for S.Sir Pending
                        : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                      {exp.status === 'APPROVED' && <CheckCircle size={10} />}
                      {exp.status === 'REJECTED' && <AlertCircle size={10} />}
                      {exp.status.includes('PENDING') && <ShieldCheck size={10} />}
                      
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {exp.status === "DRAFT" ? (
                      <div className="flex justify-center gap-2">
                        {/* 👇 Updated Action Button for HOD */}
                        <button onClick={() => submitToSuperior(exp.id)} className="bg-[#103c7f] text-white px-4 py-2 rounded-[12px] hover:bg-[#a1db40] hover:text-[#103c7f] flex items-center gap-2 shadow-md transition-colors">
                          <Send size={12} /> <span className="text-[10px] font-black uppercase">Submit to S.Sir</span>
                        </button>
                        <button className="bg-red-50 text-red-600 p-2 rounded-[12px] hover:bg-red-600 hover:text-white transition-all"><Trash2 size={14} /></button>
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

      {/* --- MODAL --- */}
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
              <h2 className="text-2xl font-black text-[#103c7f] tracking-tight leading-none uppercase italic">New HOD Claim</h2>
              {/* 👇 Updated Subtitle */}
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Submit to S.Sir / Management</p>
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
                    <select onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700 appearance-none">
                      <option value="TRAVEL">Travel / Fuel</option>
                      <option value="FLIGHT">Flight</option>
                      <option value="STAY">Hotel / Stay</option>
                      <option value="FOOD">Client Hosting / Food</option>
                      <option value="MISC">Dept Activity / Misc</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Amount (₹)</label>
                  <input type="number" required placeholder="0.00" onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Proof</label>
                  <div className="relative border-2 border-dashed border-gray-200 rounded-[14px] p-2 bg-gray-50/50 hover:bg-[#a1db40]/5 hover:border-[#a1db40]/50 transition-all group flex items-center justify-center gap-3 cursor-pointer h-[46px]">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <FileText size={18} className="text-[#103c7f] opacity-40 group-hover:text-[#a1db40]" />
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-tight group-hover:text-[#103c7f]">Upload Bill</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Notes</label>
                <textarea rows="2" placeholder="Purpose of expense..." onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-[14px] focus:ring-2 focus:ring-[#a1db40]/50 outline-none text-sm font-bold text-gray-700 resize-none"></textarea>
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