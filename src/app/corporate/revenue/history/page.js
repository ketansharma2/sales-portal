"use client";
import { useState, useEffect } from "react";
import { 
  Search, Filter, Calendar, User, Briefcase, 
  Eye, Building2, Clock, CheckCircle, AlertCircle,
  Plus, X, Save, Edit
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

  // --- NEW STATES FOR ADD/EDIT DETAILS MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [kycFiles, setKycFiles] = useState([]);
  const [mainForm, setMainForm] = useState({ 
      candidate_name: "", client_name: "", payment_from: "", account_email: "", candidate_phone: "", 
      offer_salary: "", payment_terms: "", base_invoice: "", total_amount: "",
      payment_due_date: "", payment_followup_date: "" 
  });

  const mockCandidates = ["Amit Verma", "Sneha Patil", "Ravi Teja", "Kiran Rao", "Priya Sharma"];
  const mockClients = ["TechNova Solutions", "Global Finance", "Urban Builders", "Apex Retail", "Stellar Jobs"];

  // --- DUMMY DATA ---
  const dummyRevenueData = [
    {
      id: 1,
      entry_date: "2026-04-10",
      entered_by_rc: "Pooja Singh",
      tl_name: "Vikram Sharma",
      crm_name: "Neha Gupta",
      client_name: "TechNova Solutions",
      candidate_name: "Amit Verma",
      position: "Frontend Developer",
      joining_date: "2026-04-15",
      candidate_status: "Working",
      payment_status: "Invoice Sent",
      base_invoice: "1,00,000", // Already has data, will show "Edit"
      total_amount: "1,18,000"
    },
    {
      id: 2,
      entry_date: "2026-03-25",
      entered_by_rc: "Rahul Kumar",
      tl_name: "Vikram Sharma",
      crm_name: "Rohan Patel",
      client_name: "Global Finance",
      candidate_name: "Sneha Patil",
      position: "Data Analyst",
      joining_date: "2026-03-01",
      candidate_status: "Working",
      payment_status: "Received",
      base_invoice: "", // No data, will show "Add"
      total_amount: ""
    },
    {
      id: 3,
      entry_date: "2026-04-05",
      entered_by_rc: "Anjali Desai",
      tl_name: "Priya Mehta",
      crm_name: "Neha Gupta",
      client_name: "Urban Builders",
      candidate_name: "Ravi Teja",
      position: "Civil Engineer",
      joining_date: "2026-04-20",
      candidate_status: "Pending Join",
      payment_status: "Pending",
      base_invoice: "",
      total_amount: ""
    },
    {
      id: 4,
      entry_date: "2026-02-15",
      entered_by_rc: "Pooja Singh",
      tl_name: "Vikram Sharma",
      crm_name: "Rohan Patel",
      client_name: "Apex Retail",
      candidate_name: "Kiran Rao",
      position: "Store Manager",
      joining_date: "2026-02-25",
      candidate_status: "Absconded",
      payment_status: "Pending Replacement",
      base_invoice: "",
      total_amount: ""
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

  const handleOpenAddModal = (record) => {
      setSelectedRecord(record);
      setMainForm({
          candidate_name: record.candidate_name || "",
          client_name: record.client_name || "",
          payment_from: record.payment_from || "", 
          account_email: record.account_email || "", 
          candidate_phone: record.candidate_phone || "", 
          offer_salary: record.offer_salary ? String(record.offer_salary).replace(/,/g, '') : "", 
          payment_terms: record.payment_terms || "", 
          base_invoice: record.base_invoice ? String(record.base_invoice).replace(/,/g, '') : "", 
          total_amount: record.total_amount ? String(record.total_amount).replace(/,/g, '') : "", 
          payment_due_date: record.payment_due_date || "", 
          payment_followup_date: record.payment_followup_date || ""
      });
      setKycFiles([]);
      setIsModalOpen(true);
  };

  const handleKycUpload = (files) => {
      if (files && files.length > 0) setKycFiles(Array.from(files));
  };

  const handleSaveDetails = () => {
      // Mock saving logic to update the table immediately
      const updatedData = revenueData.map(item => {
          if (item.id === selectedRecord.id) {
              return {
                  ...item,
                  candidate_name: mainForm.candidate_name,
                  client_name: mainForm.client_name,
                  payment_from: mainForm.payment_from,
                  candidate_phone: mainForm.candidate_phone,
                  account_email: mainForm.account_email,
                  offer_salary: mainForm.offer_salary ? Number(mainForm.offer_salary).toLocaleString('en-IN') : "",
                  payment_terms: mainForm.payment_terms,
                  base_invoice: mainForm.base_invoice ? Number(mainForm.base_invoice).toLocaleString('en-IN') : "",
                  total_amount: mainForm.total_amount ? Number(mainForm.total_amount).toLocaleString('en-IN') : "",
                  payment_due_date: mainForm.payment_due_date,
                  payment_followup_date: mainForm.payment_followup_date
              };
          }
          return item;
      });
      
      setRevenueData(updatedData);
      setIsModalOpen(false);
  };

  // --- FILTER LOGIC ---
  const filteredData = revenueData.filter(item => {
      const matchesSearch = 
        item.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.entered_by_rc.toLowerCase().includes(searchTerm.toLowerCase());
      
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
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6">
      
      {/* HEADER */}
      <div className="flex flex-col mb-6">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Revenue & Billing Directory</h1>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Track Candidate Lifecycle & Payment Status</p>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-end gap-4">
        
        <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Search</label>
            <div className="relative">
                <input 
                  type="text" 
                  placeholder="Client, Candidate, or RC..." 
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
            <table className="w-full text-left border-collapse min-w-[1200px]">
               <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-sm">
                  <tr>
                     <th className="p-3 border-r border-blue-800 text-center w-12">#</th>
                     <th className="p-3 border-r border-blue-800 min-w-[140px]">Date & CRM</th>
                     <th className="p-3 border-r border-blue-800 min-w-[140px]">RC & TL</th>
                     <th className="p-3 border-r border-blue-800 min-w-[160px]">Client Name</th>
                     <th className="p-3 border-r border-blue-800 min-w-[200px]">Candidate Details</th>
                     <th className="p-3 border-r border-blue-800 text-center min-w-[110px]">Joining Date</th>
                     <th className="p-3 border-r border-blue-800 text-center min-w-[130px]">Candidate Status</th>
                     <th className="p-3 border-r border-blue-800 text-center min-w-[140px]">Payment Status</th>
                     <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-36 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">Action</th>
                  </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Directory...</td></tr>
                  ) : filteredData.length > 0 ? (
                     filteredData.map((item, index) => (
                     <tr key={item.id} className="hover:bg-blue-50/30 transition group">
                        
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-400">{index + 1}</td>
                        
                        <td className="p-3 border-r border-gray-100 align-top">
                           <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-gray-800 flex items-center gap-1.5"><Calendar size={12} className="text-blue-500"/> {item.entry_date}</span>
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100 uppercase">CRM: {item.crm_name}</span>
                           </div>
                        </td>

                        <td className="p-3 border-r border-gray-100 align-top">
                           <div className="flex flex-col gap-1.5">
                              <span className="text-[10px] font-bold text-gray-600 uppercase">RC: <span className="text-gray-800">{item.entered_by_rc}</span></span>
                              <span className="text-[10px] font-bold text-gray-600 uppercase">TL: <span className="text-gray-800">{item.tl_name}</span></span>
                           </div>
                        </td>

                        <td className="p-3 border-r border-gray-100 align-top">
                            <span className="font-black text-[#103c7f] text-sm flex items-center gap-1.5 mt-0.5">
                                <Building2 size={14} className="text-blue-400"/> {item.client_name}
                            </span>
                        </td>

                        <td className="p-3 border-r border-gray-100 align-top">
                           <div className="flex flex-col gap-1.5">
                              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5"><User size={14} className="text-gray-400"/> {item.candidate_name}</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1"><Briefcase size={10}/> {item.position}</span>
                              </div>
                           </div>
                        </td>

                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className="font-mono text-gray-700 font-bold">{item.joining_date}</span>
                        </td>

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

                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border inline-block ${
                                item.payment_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                item.payment_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                            }`}>
                                {item.payment_status}
                            </span>
                        </td>

                        {/* ACTION COLUMN */}
                        <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-blue-50/30 transition-colors">
                           <div className="flex flex-col gap-1.5 w-full px-1">
                               {/* DYNAMIC ADD/EDIT DETAILS BUTTON */}
                               <button 
                                onClick={() => handleOpenAddModal(item)}
                                className={`w-full px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 ${
                                    item.base_invoice ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                               >
                                   {item.base_invoice ? <><Edit size={10} /> Edit Details</> : <><Plus size={10} /> Add Details</>}
                               </button>

                               <button 
                                onClick={() => handleViewHistory(item.id)}
                                className="w-full bg-white border border-gray-200 text-[#103c7f] hover:bg-[#103c7f] hover:text-white hover:border-[#103c7f] px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
                               >
                                   <Eye size={10} /> Full History
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

   {/* --- ADD/EDIT DETAILS MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-3 flex justify-between items-center text-white bg-[#103c7f]">
                    <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        {selectedRecord?.base_invoice ? <Edit size={14}/> : <Plus size={14}/>} 
                        {selectedRecord?.base_invoice ? "Edit Payment Details" : "Add Payment Details"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={16}/></button>
                </div>

                <div className="p-4 space-y-3 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {(() => {
                        const liveTotalNum = parseInt(mainForm.total_amount) || 0;
                        const liveRemaining = liveTotalNum; 

                        return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                         {/* Billing Contact Info */}
                            <div className="col-span-1 sm:col-span-2 border-b border-gray-100 pb-1 mb-1">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Contact Info</h4>
                            </div>
                            
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Payment From</label>
                                <select 
                                    value={mainForm.payment_from} 
                                    onChange={e => setMainForm({...mainForm, payment_from: e.target.value})} 
                                    className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
                                >
                                    <option value="">-- Select --</option>
                                    <option value="Client">Client</option>
                                    <option value="Candidate">Candidate</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Account Email</label>
                                <input 
                                    type="email" 
                                    value={mainForm.account_email} 
                                    onChange={e => setMainForm({...mainForm, account_email: e.target.value})} 
                                    className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-[#103c7f] bg-gray-50" 
                                    placeholder="finance@company.com"
                                />
                            </div>
                            
                            {/* Row 2 */}
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Phone Number</label>
                                <input 
                                    type="text" 
                                    value={mainForm.candidate_phone} 
                                    onChange={e => setMainForm({...mainForm, candidate_phone: e.target.value})} 
                                    className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-[#103c7f] bg-gray-50" 
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            {/* KYC Upload (Ab Phone Number ke theek bagal me aayega) */}
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Upload KYC Docs (Multiple)</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept=".pdf,.jpg,.png"
                                        onChange={(e) => handleKycUpload(e.target.files)}
                                        className="flex-1 border border-gray-200 p-1 rounded-md text-xs outline-none focus:border-[#103c7f] bg-gray-50 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-[#103c7f] file:text-white cursor-pointer"
                                    />
                                    {kycFiles.length > 0 && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{kycFiles.length} file(s)</span>}
                                </div>
                            </div>

                            {/* Financials */}
                            <div className="col-span-1 sm:col-span-2 border-b border-gray-100 pb-1 mt-2 mb-1">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Details</h4>
                            </div>
                            
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Offer Salary</label>
                                <input type="number" value={mainForm.offer_salary} onChange={e => setMainForm({...mainForm, offer_salary: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-[#103c7f] bg-gray-50" placeholder="Eg: 1200000"/>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Payment Terms (%)</label>
                                <input type="text" value={mainForm.payment_terms} onChange={e => setMainForm({...mainForm, payment_terms: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-[#103c7f] bg-gray-50" placeholder="Eg: 8.33%"/>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Base Invoice</label>
                                <input type="number" value={mainForm.base_invoice} onChange={e => setMainForm({...mainForm, base_invoice: e.target.value})} className="w-full border border-blue-200 p-2 rounded-md text-xs font-bold outline-none focus:border-[#103c7f] bg-blue-50" placeholder="Eg: 100000"/>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-green-700 uppercase tracking-widest">Total Invoice (With GST)</label>
                                <input 
                                    type="number" 
                                    value={mainForm.total_amount} 
                                    onChange={e => setMainForm({...mainForm, total_amount: e.target.value})} 
                                    className="w-full border border-green-300 p-2 rounded-md text-xs font-black text-green-800 outline-none focus:border-green-600 bg-green-50" 
                                    placeholder="Eg: 118000"
                                />
                            </div>

                            {/* Dates */}
                            <div className="col-span-1 sm:col-span-2 border-b border-gray-100 pb-1 mt-2 mb-1">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Follow-up Dates</h4>
                            </div>
                            
                            <div>
                                <label className="text-[9px] font-bold text-orange-600 uppercase">Payment Due Date</label>
                                <input type="date" value={mainForm.payment_due_date} onChange={e => setMainForm({...mainForm, payment_due_date: e.target.value})} className="w-full border border-orange-200 p-2 rounded-md text-xs font-bold outline-none focus:border-orange-500 bg-orange-50"/>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-indigo-600 uppercase">Payment Follow-up Date</label>
                                <input type="date" value={mainForm.payment_followup_date} onChange={e => setMainForm({...mainForm, payment_followup_date: e.target.value})} className="w-full border border-indigo-200 p-2 rounded-md text-xs font-bold outline-none focus:border-indigo-500 bg-indigo-50"/>
                            </div>

                        </div>
                        );
                    })()}

                    <div className="pt-3 mt-1 border-t border-gray-100">
                        <button onClick={handleSaveDetails} className="w-full py-2.5 rounded-lg font-black uppercase tracking-widest text-white shadow-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-xs">
                            <Save size={14}/> {selectedRecord?.base_invoice ? "Save Changes" : "Save Details"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}