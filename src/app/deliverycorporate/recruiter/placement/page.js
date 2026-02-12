"use client";
import { useState } from "react";
import { 
  Search, Calendar, User, Briefcase, Phone, Mail, 
  CheckCircle, Clock, IndianRupee, MessageSquare, ArrowUpRight, X
} from "lucide-react";

export default function JoiningFollowupPage() {
  
  // --- STATE ---
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [followupNote, setFollowupNote] = useState("");
  const [nextDate, setNextDate] = useState("");

  // --- MOCK DATA (Sirf JOINED Candidates) ---
  const [joinedCandidates, setJoinedCandidates] = useState([
    { 
      id: 1, 
      candidate_name: "Rohan Das", 
      role: "Java Developer",
      client: "TechCorp Solutions",
      joining_date: "15-01-2026", // Join ho chuka hai
      invoice_amt: "1,18,000",
      payment_status: "Pending", // Paisa nahi aya, isliye follow up lena hai
      payment_due_date: "15-02-2026",
      last_remark: "Client said process initiated.",
      contact: "9876543210"
    },
    { 
      id: 2, 
      candidate_name: "Priya Sharma", 
      role: "HR Manager",
      client: "Global Logistics",
      joining_date: "01-01-2026",
      invoice_amt: "59,000",
      payment_status: "Overdue", // Late ho gaya
      payment_due_date: "01-02-2026",
      last_remark: "Invoice sent but no reply.",
      contact: "9988776655"
    },
    { 
      id: 3, 
      candidate_name: "Amit Verma", 
      role: "Sales Executive",
      client: "GreenLeaf Organics",
      joining_date: "10-01-2026",
      invoice_amt: "45,000",
      payment_status: "Paid", // Paisa aa gaya (History ke liye)
      payment_due_date: "10-02-2026",
      last_remark: "Payment Received.",
      contact: "8877665544"
    }
  ]);

  // --- HANDLERS ---
  const openFollowupModal = (candidate) => {
      setSelectedCandidate(candidate);
      setIsModalOpen(true);
  };

  const handleSaveFollowup = () => {
      // API Call to update Remark in Revenue Table
      alert(`Follow-up saved for ${selectedCandidate.candidate_name}. Manager updated.`);
      setIsModalOpen(false);
      setFollowupNote("");
      setNextDate("");
  };

  // Filter Logic
  const filteredList = joinedCandidates.filter(item => 
      selectedStatus === "All" ? true : item.payment_status === selectedStatus
  );

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-6">
      
      {/* 1. HEADER */}
      <div className="flex justify-between items-end mb-6">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Joined & Billing Status</h1>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Track Payment & Retention Follow-ups</p>
         </div>
         
         {/* Filters */}
         <div className="flex gap-2">
            {['All', 'Pending', 'Overdue', 'Paid'].map(status => (
                <button 
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition shadow-sm ${
                        selectedStatus === status 
                        ? 'bg-[#103c7f] text-white' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
                    }`}
                >
                    {status}
                </button>
            ))}
         </div>
      </div>

      {/* 2. CANDIDATE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         
         {filteredList.map((item) => (
            <div key={item.id} className={`bg-white rounded-xl border p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                item.payment_status === 'Paid' ? 'border-green-200 opacity-80' : 
                item.payment_status === 'Overdue' ? 'border-red-200' : 'border-orange-200'
            }`}>
                
                {/* Header: Name & Amt */}
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-[#103c7f]">{item.candidate_name}</h3>
                            <p className="text-xs font-medium text-gray-500">{item.role}</p>
                        </div>
                        <div className="text-right">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${
                                item.payment_status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                item.payment_status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                                {item.payment_status}
                            </span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase">Client</span>
                            <span className="font-bold text-gray-700">{item.client}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase">Joined Date</span>
                            <span className="font-mono font-bold text-gray-600">{item.joining_date}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-bold uppercase">Invoice Amt</span>
                            <span className="font-black text-gray-800">₹ {item.invoice_amt}</span>
                        </div>
                        <div className="flex justify-between text-xs border-t border-gray-200 pt-2 mt-1">
                            <span className="text-gray-400 font-bold uppercase">Payment Due</span>
                            <span className={`font-bold ${item.payment_status === 'Overdue' ? 'text-red-600' : 'text-orange-600'}`}>
                                {item.payment_due_date}
                            </span>
                        </div>
                    </div>

                    {/* Last Remark */}
                    <div className="mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Latest Remark</p>
                        <p className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2 line-clamp-2">
                            "{item.last_remark}"
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition">
                        <Phone size={16} />
                    </button>
                    {item.payment_status !== 'Paid' && (
                        <button 
                            onClick={() => openFollowupModal(item)}
                            className="flex-1 bg-[#103c7f] text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-900 transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={14} /> Add Follow-up
                        </button>
                    )}
                </div>

            </div>
         ))}

      </div>

      {/* --- FOLLOW-UP MODAL --- */}
      {isModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-bold text-md uppercase">Payment Follow-up</h3>
                        <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">{selectedCandidate.client}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-6 font-['Calibri'] space-y-4">
                    
                    {/* Info Strip */}
                    <div className="flex justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-orange-400 uppercase">Due Amount</p>
                            <p className="text-sm font-black text-orange-700">₹ {selectedCandidate.invoice_amt}</p>
                        </div>
                        <div className="h-full w-px bg-orange-200"></div>
                        <div className="text-center">
                            <p className="text-[9px] font-bold text-orange-400 uppercase">Due Date</p>
                            <p className="text-sm font-bold text-orange-700">{selectedCandidate.payment_due_date}</p>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">New Remark</label>
                        <textarea 
                            value={followupNote}
                            onChange={(e) => setFollowupNote(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#103c7f] outline-none h-24 resize-none"
                            placeholder="Client se kya baat hui? Payment kab aayega?"
                        ></textarea>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Next Follow-up</label>
                        <input 
                            type="date" 
                            value={nextDate}
                            onChange={(e) => setNextDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#103c7f] outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleSaveFollowup}
                        className="w-full bg-[#103c7f] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-900 transition mt-2"
                    >
                        Update Status
                    </button>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}