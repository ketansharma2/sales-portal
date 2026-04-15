"use client";
import { useState, useEffect } from "react";
import { 
  Search, Filter, Calendar, User, Briefcase, 
  Building2, Clock, CheckCircle, AlertCircle,
  History, IndianRupee
} from "lucide-react";
import { useRouter } from 'next/navigation';

export default function RevenuePage() {
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- DUMMY DATA ---
  // --- DUMMY DATA ---
  const dummyRevenueData = [
    {
      id: 1,
      entry_date: "2026-04-10",
      submitted_date: "2026-04-12", // Changed from invoice_sent_date
      crm_name: "Neha Gupta",
      payment_from: "Client", 
      client_name: "TechNova Solutions",
      candidate_name: "Amit Verma",
      position: "Frontend Developer",
      joining_date: "2026-04-15",
      candidate_status: "Working",
      payment_status: "Invoice Sent",
    },
    {
      id: 2,
      entry_date: "2026-03-25",
      submitted_date: "2026-03-28", // Changed from invoice_sent_date
      crm_name: "Rohan Patel",
      payment_from: "Candidate",
      client_name: "Global Finance",
      candidate_name: "Sneha Patil",
      position: "Data Analyst",
      joining_date: "2026-03-01",
      candidate_status: "Working",
      payment_status: "Received",
    },
    {
      id: 3,
      entry_date: "2026-04-05",
      submitted_date: "", // Not submitted to revenue yet
      crm_name: "Neha Gupta",
      payment_from: "Client",
      client_name: "Urban Builders",
      candidate_name: "Ravi Teja",
      position: "Civil Engineer",
      joining_date: "2026-04-20",
      candidate_status: "Pending Join",
      payment_status: "Pending",
    },
    {
      id: 4,
      entry_date: "2026-02-15",
      submitted_date: "", // Not submitted to revenue yet
      crm_name: "Rohan Patel",
      payment_from: "Client",
      client_name: "Apex Retail",
      candidate_name: "Kiran Rao",
      position: "Store Manager",
      joining_date: "2026-02-25",
      candidate_status: "Absconded",
      payment_status: "Pending Replacement",
    }
  ];

  // --- MOCK API CALL ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setRevenueData(dummyRevenueData);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // --- HANDLERS ---
  const handleViewHistory = (id) => {
    router.push(`/corporate/revenue/history/${id}`); 
  };

  const handleClearFilters = () => {
    setSelectedMonth("All");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");
  };

  // --- FILTER LOGIC ---
  const filteredData = revenueData.filter(item => {
      const matchesSearch = 
        item.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.crm_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesDateRange = true;
      if (dateFrom && dateTo) {
          const itemDate = new Date(item.entry_date);
          const from = new Date(dateFrom);
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          matchesDateRange = itemDate >= from && itemDate <= to;
      } else if (dateFrom) {
          matchesDateRange = new Date(item.entry_date) >= new Date(dateFrom);
      } else if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          matchesDateRange = new Date(item.entry_date) <= to;
      }

      let matchesMonth = true;
      if (selectedMonth !== "All") {
        const monthIndex = months.indexOf(selectedMonth) + 1; 
        const itemMonth = parseInt(item.entry_date.split('-')[1], 10);
        matchesMonth = monthIndex === itemMonth;
      }

      return matchesSearch && matchesDateRange && matchesMonth;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col mb-6">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
             <IndianRupee size={24} className="text-blue-500" /> Revenue & Billing Directory
         </h1>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Track Invoice Status and Payment Records</p>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-end gap-4">
        
        <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Search</label>
            <div className="relative">
                <input 
                  type="text" 
                  placeholder="Client, Candidate, or CRM..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] transition bg-gray-50"
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400"><Search size={14} /></div>
            </div>
        </div>

        <div className="w-40 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Filter by Month</label>
            <div className="relative">
                <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer"
                >
                    <option value="All">All Months</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <Filter size={12} />
                </div>
            </div>
        </div>

        <div className="w-36 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Date From</label>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer"
            />
        </div>

        <div className="w-36 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Date To</label>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer"
            />
        </div>

        {(searchTerm || selectedMonth !== "All" || dateFrom || dateTo) && (
            <button 
              onClick={handleClearFilters}
              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 h-[34px]"
            >
              Clear
            </button>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-240px)]">
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                     <th className="p-3 border-r border-blue-800 text-center w-12">#</th>
                     <th className="p-3 border-r border-blue-800 min-w-[150px]">Submitted & CRM</th> 
                     <th className="p-3 border-r border-blue-800 min-w-[130px]">Payment From</th>
                     <th className="p-3 border-r border-blue-800 min-w-[160px]">Client Name</th>
                     <th className="p-3 border-r border-blue-800 min-w-[200px]">Candidate & Profile</th>
                     <th className="p-3 border-r border-blue-800 text-center min-w-[110px]">Joining Date</th>
                     <th className="p-3 border-r border-blue-800 text-center min-w-[130px]">Candidate Status</th>
                     <th className="p-3 border-r border-blue-800 text-center min-w-[140px]">Payment Status</th>
                     <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-32 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                  </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Directory...</td></tr>
                  ) : filteredData.length > 0 ? (
                     filteredData.map((item, index) => (
                     <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                        
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-400">{index + 1}</td>
                        
                        {/* 1. Submitted Date & CRM */}
                        <td className="p-3 border-r border-gray-100 align-top">
                           <div className="flex flex-col gap-1.5">
                              {item.submitted_date ? (
                                  <span className="font-bold text-gray-800 flex items-center gap-1.5"><Calendar size={12} className="text-emerald-500"/> {item.submitted_date}</span>
                              ) : (
                                  <span className="font-bold text-gray-400 flex items-center gap-1.5"><Calendar size={12} className="text-gray-300"/> Not Submitted</span>
                              )}
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100 uppercase flex items-center gap-1">
                                  <User size={10} /> {item.crm_name}
                              </span>
                           </div>
                        </td>

                        {/* 2. Payment From */}
                        <td className="p-3 border-r border-gray-100 align-top">
                           {item.payment_from ? (
                               <span className={`text-[10px] font-black uppercase px-2 py-1 rounded inline-block ${
                                   item.payment_from === 'Client' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                               }`}>
                                   {item.payment_from}
                               </span>
                           ) : (
                               <span className="text-gray-400 italic">Not set</span>
                           )}
                        </td>

                        {/* 3. Client Name */}
                        <td className="p-3 border-r border-gray-100 align-top">
                            <span className="font-black text-[#103c7f] text-sm flex items-center gap-1.5 mt-0.5">
                                <Building2 size={14} className="text-blue-400"/> {item.client_name}
                            </span>
                        </td>

                        {/* 4. Candidate & Profile */}
                        <td className="p-3 border-r border-gray-100 align-top">
                           <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><User size={14} className="text-gray-400"/> {item.candidate_name}</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold"><Briefcase size={10}/> {item.position}</span>
                              </div>
                           </div>
                        </td>

                        {/* 5. Joining Date */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className="font-mono text-gray-700 font-bold">{item.joining_date}</span>
                        </td>

                        {/* 6. Candidate Status */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border inline-flex items-center gap-1 ${
                                item.candidate_status === 'Working' ? 'bg-green-50 text-green-700 border-green-200' : 
                                item.candidate_status === 'Pending Join' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {item.candidate_status === 'Working' && <CheckCircle size={10}/>}
                                {item.candidate_status === 'Pending Join' && <Clock size={10}/>}
                                {item.candidate_status === 'Absconded' && <AlertCircle size={10}/>}
                                {item.candidate_status}
                            </span>
                        </td>

                        {/* 7. Payment Status */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border inline-block ${
                                item.payment_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                item.payment_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                                {item.payment_status}
                            </span>
                        </td>

                        {/* 8. ACTION COLUMN (View Only) */}
                        <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-blue-50/30 transition-colors">
                           <div className="flex flex-col gap-1.5 w-full px-1">
                               <button 
                                onClick={() => handleViewHistory(item.id)}
                                className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-2 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
                               >
                                   <History size={12} /> View History
                               </button>
                           </div>
                        </td>

                     </tr>
                  ))
                  ) : (
                      <tr><td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No records found matching filters</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}