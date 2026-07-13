"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, Filter, Calendar, User, Briefcase, 
  Building2, Clock, CheckCircle, AlertCircle,
  History, CheckSquare, X, Printer, FileText, FileCheck, Award
} from "lucide-react";
import * as API from '@/lib/api-client';
// --- CONSTANTS ---
const COMPANY_DATA = {
  name: "SAVVI SALES & SERVICES PVT LTD",
  address: "331, GANDHI COLONY, SAMALKHA PANIPAT (HR)",
  email: "savvisales@gmail.com",
  gstin: "06AAZCS0495D1ZY",
  bank: {
    name: "STATE BANK OF INDIA",
    account: "37085013734",
    ifsc: "SBIN0050099",
    branch: "SAMALKHA (CODE: 1073)" 
  },
  terms: [
    "All disputes subject to Samalkha jurisdiction.",
    "Our responsibility ceases as soon as goods/services leave our premises.",
    "Payments by Account Payee Cheque/NEFT/RTGS only."
  ]
};

function DomesticBillingPage() {
    const searchParams = useSearchParams(); 
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || "");
  const [dateTo, setDateTo] = useState(searchParams.get('to') || "");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState(searchParams.get('candidateStatus') || "All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get('paymentStatus') || "All");
  const [retentionStatusFilter, setRetentionStatusFilter] = useState(searchParams.get('retentionStatus') || "All"); 

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const previewRef = useRef(null);
  
  // --- REAL DATA FROM API (like corporate) ---
  const [revenueData, setRevenueData] = useState([]);

  // Sync filters with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (candidateStatusFilter !== "All") params.set('candidateStatus', candidateStatusFilter);
    if (paymentStatusFilter !== "All") params.set('paymentStatus', paymentStatusFilter);
    if (retentionStatusFilter !== "All") params.set('retentionStatus', retentionStatusFilter);
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, dateFrom, dateTo, candidateStatusFilter, paymentStatusFilter, retentionStatusFilter]);

    // Real Data Fetch from API (exact like corporate)
    useEffect(() => {
      const fetchRevenueData = async () => {
        try {
          const response = await API.apiGet('/api/domestic/revenue/history');


          const result = await response.json();

          if (result.success && result.data) {
            setRevenueData(result.data);
          } else {
            setRevenueData([]);
          }
        } catch (error) {
          console.error('Error fetching domestic revenue history:', error);
          setRevenueData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchRevenueData();
    }, []);

  // --- HANDLERS ---
  const handleViewHistory = (id) => {
    // Navigate to the Domestic Candidate History Page
    router.push(`/domestic/revenue/history/${id}`); 
  };

  const handleClearFilters = () => {
    setDateFrom(""); setDateTo(""); setSearchTerm("");
    setCandidateStatusFilter("All"); setPaymentStatusFilter("All"); setRetentionStatusFilter("All");
  };

  // --- FILTER LOGIC ---
  const filteredData = revenueData.filter(item => {
      const matchesSearch = 
        item.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.crm_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date Filter applied to Payment Due Date
      let matchesDateRange = true;
      if (dateFrom && dateTo) {
          if(!item.payment_due_date) { matchesDateRange = false; }
          else {
              const itemDate = new Date(item.payment_due_date);
              const from = new Date(dateFrom);
              const to = new Date(dateTo);
              to.setHours(23, 59, 59, 999);
              matchesDateRange = itemDate >= from && itemDate <= to;
          }
      } else if (dateFrom) {
          matchesDateRange = item.payment_due_date && new Date(item.payment_due_date) >= new Date(dateFrom);
      } else if (dateTo) {
          if(!item.payment_due_date) { matchesDateRange = false; }
          else {
              const to = new Date(dateTo);
              to.setHours(23, 59, 59, 999);
              matchesDateRange = new Date(item.payment_due_date) <= to;
          }
      }

      const matchesCandidateStatus = candidateStatusFilter === "All" || item.candidate_status === candidateStatusFilter;
      const matchesPaymentStatus = paymentStatusFilter === "All" || item.payment_status === paymentStatusFilter;
      const matchesRetentionStatus = retentionStatusFilter === "All" || item.retention_status === retentionStatusFilter;

      return matchesSearch && matchesDateRange && matchesCandidateStatus && matchesPaymentStatus && matchesRetentionStatus;
      
  }).sort((a, b) => {
      const dateA = a.joining_date ? new Date(a.joining_date).getTime() : 0;
      const dateB = b.joining_date ? new Date(b.joining_date).getTime() : 0;
      return dateB - dateA; 
  });

   // --- PI MODAL STATES (View Only) ---
   const [isPiModalOpen, setIsPiModalOpen] = useState(false);
   const [generatedPi, setGeneratedPi] = useState(null);
   const [invoiceViewType, setInvoiceViewType] = useState('PI'); 

   // DUMMY Invoice View (Opens in Modal)
   const handleViewInvoice = async (invoiceId, viewType = 'PI') => {
     setInvoiceViewType(viewType);
     const previewData = {
           invoiceNo: invoiceId || "INV-9999", date: "2026-05-16", clientName: "Tech Mahindra", address: "Pune IT Park", gstin: "27AABBCC1234D1Z", state: "Maharashtra", pincode: "411057", fromDate: "2026-01-01", toDate: "2026-01-31",
           candidates: [{ id: 101, name: "Amit Sharma", role: "Java Developer", ctc: 600000, billingPercent: 8.33 }],
           taxableValue: 49980, cgst: 0, sgst: 0, igst: 8996, grandTotal: 58976, amountInWords: "Fifty Eight Thousand Nine Hundred Seventy Six Rupee Only"
     };
     setGeneratedPi(previewData);
     setIsPiModalOpen(true);
   };
   
   return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-2 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col mb-4">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
             <FileText size={24} className="text-blue-500" /> Domestic Revenue Directory
         </h1>
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Track Invoice Status and Retention Records</p>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-wrap items-end gap-2">
    
        <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Search</label>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search Client, Candidate, or CRM..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] transition bg-gray-50"
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400"><Search size={14} /></div>
            </div>
        </div>

        {/* CANDIDATE STATUS FILTER */}
        <div className="w-36 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Cand. Status</label>
            <div className="relative">
                <select value={candidateStatusFilter} onChange={(e) => setCandidateStatusFilter(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Status</option>
                    <option value="Joined">Joined</option>
                    <option value="Working">Working</option>
                    <option value="Absconded">Absconded</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminate">Terminate</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Filter size={12} /></div>
            </div>
        </div>

        {/* PAYMENT STATUS FILTER */}
        <div className="w-36 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Payment Status</label>
            <div className="relative">
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Status</option>
                    <option value="Received">Received</option>
                    <option value="Invoice Sent">Invoice Sent</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Filter size={12} /></div>
            </div>
        </div>

        {/* RETENTION STATUS FILTER */}
        <div className="w-36 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Ret. Status</label>
            <div className="relative">
                <select value={retentionStatusFilter} onChange={(e) => setRetentionStatusFilter(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Status</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Eligible">Eligible</option>
                    <option value="Invoice Sent">Invoice Sent</option>
                    <option value="Received">Received</option>
                    <option value="Missed">Missed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Filter size={12} /></div>
            </div>
        </div>

        <div className="w-32 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Payment Due From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer"/>
        </div>

        <div className="w-32 shrink-0">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Payment Due To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer"/>
        </div>

        {(searchTerm || dateFrom || dateTo || candidateStatusFilter !== "All" || paymentStatusFilter !== "All" || retentionStatusFilter !== "All") && (
            <button onClick={handleClearFilters} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 h-[34px]">
                Clear
            </button>
        )}
      </div>

      {/* DOMESTIC TABLE SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-220px)]">
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px] table-fixed">
               <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20 shadow-sm">
                   <tr>
                      <th className="p-3 border-r border-blue-800 text-center w-10">#</th>
                      <th className="p-3 border-r border-blue-800 w-[140px]">Submitted & CRM</th> 
                      <th className="p-3 border-r border-blue-800 w-[150px]">Client Name</th>
                      <th className="p-3 border-r border-blue-800 w-[180px]">Candidate & Profile</th>
                      <th className="p-3 border-r border-blue-800 text-center w-[90px]">Joining Date</th>
                      <th className="p-3 border-r border-blue-800 text-center w-[120px]">Cand. Status</th>
                      
                      {/* BASE PAYMENT */}
                      <th className="p-3 border-r border-blue-800 text-center bg-blue-900 w-[100px]">Payment Due</th>
                      <th className="p-3 border-r border-blue-800 text-center bg-blue-900 w-[120px]">Payment Status</th>
                      
                      {/* RETENTION PAYMENT */}
                      <th className="p-3 border-r border-blue-800 text-center bg-indigo-900 w-[110px]">Ret. Target</th>
                      <th className="p-3 border-r border-blue-800 text-center bg-indigo-900 w-[120px]">Ret. Status</th>
                      
                      <th className="p-3 border-r border-blue-800 text-center w-[120px]">PI / Invoice</th>
                      <th className="p-3 text-center w-[90px]">Action</th>
                   </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="12" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Directory...</td></tr>
                  ) : filteredData.length > 0 ? (
                      filteredData.map((item, index) => (
                      <tr key={item.revenue_id} className="hover:bg-blue-50/30 transition group">
                        
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-400">{index + 1}</td>
                        
                        {/* 1. Submitted Date & CRM */}
                        <td className="p-3 border-r border-gray-100 align-top overflow-hidden">
                            <div className="flex flex-col gap-1.5">
                               {item.sent_date ? (
                                   <span className="font-bold text-gray-800 flex items-center gap-1.5"><Calendar size={12} className="text-emerald-500 shrink-0"/> {item.sent_date}</span>
                               ) : (
                                   <span className="font-bold text-gray-400 flex items-center gap-1.5"><Calendar size={12} className="text-gray-300 shrink-0"/> Not Submitted</span>
                               )}
                               <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100 uppercase flex items-center gap-1 truncate max-w-full" title={item.crm_name}>
                                   <User size={10} className="shrink-0"/> <span className="truncate">{item.crm_name}</span>
                               </span>
                            </div>
                        </td>

                        {/* 2. Client Name */}
                        <td className="p-3 border-r border-gray-100 align-top overflow-hidden">
                            <span className="font-black text-[#103c7f] text-sm flex items-center gap-1.5 mt-0.5 w-full" title={item.client_name}>
                                <Building2 size={14} className="text-blue-400 shrink-0"/> <span className="truncate">{item.client_name}</span>
                            </span>
                        </td>

                        {/* 3. Candidate & Profile */}
                        <td className="p-3 border-r border-gray-100 align-top overflow-hidden">
                           <div className="flex flex-col gap-1.5 w-full">
                              <span className="font-bold text-gray-900 text-sm flex items-center gap-1.5 w-full" title={item.candidate_name}><User size={14} className="text-gray-400 shrink-0"/> <span className="truncate">{item.candidate_name}</span></span>
                              <div className="flex items-center gap-3 w-full">
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold w-full" title={item.profile}><Briefcase size={10} className="shrink-0"/> <span className="truncate">{item.profile || '-'}</span></span>
                              </div>
                           </div>
                        </td>

                        {/* 4. Joining Date */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className="font-mono text-gray-700 font-bold">{item.joining_date || '-'}</span>
                        </td>

                        {/* 5. Candidate Status */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border inline-flex items-center gap-1 justify-center w-full truncate max-w-full ${
                                item.candidate_status === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                item.candidate_status === 'Joined' ? 'bg-green-50 text-green-700 border-green-200' :
                                item.candidate_status === 'Absconded' ? 'bg-red-50 text-red-700 border-red-200' :
                                item.candidate_status === 'Resigned' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                item.candidate_status === 'Terminate' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                                'bg-gray-50 text-gray-500 border-gray-200' 
                            }`} title={item.candidate_status}>
                                {(item.candidate_status === 'Working' || item.candidate_status === 'Joined') && <CheckCircle size={10} className="shrink-0"/>}
                                {(item.candidate_status === 'Absconded' || item.candidate_status === 'Terminate' || item.candidate_status === 'Resigned') && <AlertCircle size={10} className="shrink-0"/>}
                                <span className="truncate">{item.candidate_status}</span>
                            </span>
                        </td>

                        {/* 6. Base Payment Due & Amount */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle bg-blue-50/20">
                            {item.payment_due_date ? (
                                <span className="font-bold text-gray-700 flex flex-col items-center justify-center gap-1">
                                    <span className="flex items-center gap-1"><Calendar size={10} className="text-blue-500"/> {item.payment_due_date}</span>
                                    {/* Amount added here */}
                                    {item.payment_amount && (
                                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 rounded">₹ {parseInt(item.payment_amount).toLocaleString('en-IN')}</span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-400 italic">Not Scheduled</span>
                            )}
                        </td>

                        {/* 7. Base Payment Status */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle bg-blue-50/20">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border inline-block truncate max-w-full ${
                                item.payment_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                item.payment_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.payment_status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                            }`} title={item.payment_status}>
                                {item.payment_status}
                            </span>
                        </td>

                        {/* 8. Retention Target & Amount */}
                        <td className="p-3 border-r border-indigo-50 text-center align-middle bg-indigo-50/30">
                            {item.retention_target_date ? (
                                <span className="font-bold text-indigo-700 flex flex-col items-center justify-center gap-1">
                                    <span className="flex items-center gap-1"><Award size={10} className="text-indigo-500"/> {item.retention_target_date}</span>
                                    {/* Amount added here */}
                                    {item.retention_amount && (
                                        <span className="text-[10px] font-black text-indigo-800 bg-indigo-100 px-1.5 rounded">₹ {parseInt(item.retention_amount).toLocaleString('en-IN')}</span>
                                    )}
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-400 italic">-</span>
                            )}
                        </td>

                        {/* 9. Retention Status */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle bg-indigo-50/30 overflow-hidden">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border inline-block truncate max-w-full ${
                                item.retention_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                item.retention_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.retention_status === 'Eligible' ? 'bg-yellow-100 text-yellow-700 border-yellow-300 shadow-inner' :
                                item.retention_status === 'Missed' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-slate-50 text-slate-500 border-slate-200' 
                            }`} title={item.retention_status || "In Progress"}>
                                {item.retention_status || "In Progress"}
                            </span>
                        </td>

                        {/* 10. PI Column (View / Edit) */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            {item.invoice_id ? (
                              <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                                <button 
                                    onClick={() => handleViewInvoice(item.invoice_id, 'PI')}
                                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors border border-indigo-200" title="View PI"
                                >PI</button>
                                {item.payment_status === 'Received' && (
                                  <button 
                                      onClick={() => handleViewInvoice(item.invoice_id, 'INVOICE')}
                                      className="bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors border border-amber-200" title="View Invoice"
                                  >INV</button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">Not Generated</span>
                            )}
                        </td>

                        {/* 11. ACTION COLUMN (History ONLY) */}
                        <td className="p-2 text-center bg-white align-middle group-hover:bg-blue-50 transition-colors sticky right-0 z-10 border-l shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-center gap-2 w-full px-1">
                               <button 
                                   onClick={() => handleViewHistory(item.revenue_id)}
                                   className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white px-1 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
                               >
                                  <History size={12} /> History
                               </button>
                          </div>
                      </td>
                     </tr>
                  ))
                  ) : (
                      <tr><td colSpan="12" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No records found matching filters</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

   {/* ================= PI PREVIEW MODAL (Pop-up) ================= */}
      {isPiModalOpen && generatedPi && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
          {/* Modal Container */}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:w-full print:rounded-none">
            
            {/* Modal Header (Hidden on Print) */}
            <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 print:hidden">
              <span className="text-xs font-black uppercase flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-400"/> 
                {invoiceViewType === 'INVOICE' ? 'Invoice Preview' : 'Proforma Invoice Preview'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-emerald-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-emerald-600 transition">
                  <Printer size={14}/> Print
                </button>
                <button onClick={() => setIsPiModalOpen(false)} className="hover:text-red-300 transition-colors">
                  <X size={20}/>
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area */}
            <div id="preview-container" className="overflow-y-auto custom-scrollbar p-6 bg-gray-50 flex-1 print:p-0 print:bg-white print:overflow-visible">
              
              {/* Actual A4 Page Structure */}
              <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-md print:shadow-none p-8 box-border">
                
                {/* --- Header --- */}
                <div className="border-b-4 border-[#103c7f] pb-1 mb-8">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <img src="/Savvi-Logo.png" alt="Savvi Logo" className="h-20 w-auto object-contain" />
                      <div className="text-[11px] font-bold leading-tight text-gray-600 uppercase border-l-2 border-gray-200 pl-5 py-2">
                        <p className="text-black text-sm mb-1">{COMPANY_DATA.name}</p>
                        <p>{COMPANY_DATA.address}</p>
                        <p>EMAIL: {COMPANY_DATA.email}</p>
                        <p className="text-black mt-1">GSTIN: {COMPANY_DATA.gstin}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-right mt-1"> 
                      <div className="flex flex-col items-end mb-3">
                        <img src="/maven-logo.png" alt="Maven Logo" className="h-8 w-auto object-contain" />
                      </div>
                      <div className="text-xs space-y-1.5">
                        <p><b>{invoiceViewType === 'INVOICE' ? 'INVOICE NO:' : 'PI NO:'}</b> {generatedPi.invoiceNo}</p>
                        <p><b>DATE:</b> {generatedPi.date}</p>
                        {generatedPi.fromDate && <p><b>FROM:</b> {generatedPi.fromDate} <span className="mx-1">|</span> <b>TO:</b> {generatedPi.toDate}</p>}
                      </div>
                    </div>
                  </div>
                  <h1 className="text-center text-3xl font-black uppercase mb-0 text-[#103c7f] tracking-tight w-full">
                    {invoiceViewType === 'INVOICE' ? 'INVOICE' : 'Proforma Invoice'}
                  </h1>
                </div>

                {/* --- Billed To & Bank Details --- */}
                <div className="grid grid-cols-2 gap-12 mb-2 pb-8 border-b border-gray-100">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Billed To (Buyer)</h4>
                      <div className="text-xs leading-relaxed text-gray-800 space-y-1.5">
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Name:</span>
                          <span className="flex-1 font-black uppercase">{generatedPi.clientName}</span>
                        </p>
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Address:</span>
                          <span className="flex-1 font-medium whitespace-pre-line">{generatedPi.address}</span>
                        </p>
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">State:</span>
                          <span className="flex-1 font-bold">{generatedPi.state}</span>
                        </p>
                        {generatedPi.pincode && (
                          <p className="flex items-start">
                            <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Pincode:</span>
                            <span className="flex-1 font-bold">{generatedPi.pincode}</span>
                          </p>
                        )}
                        {generatedPi.gstin && (
                          <p className="flex items-start">
                            <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">GSTIN:</span>
                            <span className="flex-1 font-bold">{generatedPi.gstin}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                    <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Payment / Bank Details</h4>
                    <div className="text-[10px] leading-relaxed font-bold text-gray-700 space-y-1">
                      <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">BANK:</span> {COMPANY_DATA.bank.name}</p>
                      <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">A/C NO:</span> {COMPANY_DATA.bank.account}</p>
                      <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">IFSC:</span> {COMPANY_DATA.bank.ifsc}</p>
                      <p><span className="text-[#103c7f] opacity-60 w-16 inline-block">BRANCH:</span> {COMPANY_DATA.bank.branch}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  
                  {/* --- CANDIDATE DETAILS TABLE --- */}
                  <div className="mb-6 mt-4">
                    <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-2">Candidate Details</h4>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600">
                          <th className="p-2 border border-gray-300 text-center text-[9px] font-bold uppercase tracking-wider w-12">Sr No</th>
                          <th className="p-2 border border-gray-300 text-center text-[9px] font-bold uppercase tracking-wider">Candidate Name</th>
                          <th className="p-2 border border-gray-300 text-left text-[9px] font-bold uppercase tracking-wider">Job Role</th>
                          <th className="p-2 border border-gray-300 text-right text-[9px] font-bold uppercase tracking-wider">CTC (Annual)</th>
                          <th className="p-2 border border-gray-300 text-center text-[9px] font-bold uppercase tracking-wider w-16">Billing %</th>
                          <th className="p-2 border border-gray-300 text-right text-[9px] font-bold uppercase tracking-wider">Fee Amount</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {generatedPi.candidates && generatedPi.candidates.map((c, idx) => {
                          const feeAmt = (c.ctc * c.billingPercent) / 100;
                          return (
                            <tr key={c.id}>
                              <td className="p-2 border-r border-gray-300 text-center text-gray-500">{idx + 1}</td>
                              <td className="p-2 border-r border-gray-300 text-center font-bold uppercase text-[#103c7f]">{c.name}</td>
                              <td className="p-2 border-r border-gray-300 text-left text-gray-700">{c.role}</td>
                              <td className="p-2 border-r border-gray-300 text-right text-gray-700">₹{Number(c.ctc).toLocaleString('en-IN')}</td>
                              <td className="p-2 border-r border-gray-300 text-center text-gray-700">{c.billingPercent}%</td>
                              <td className="p-2 text-right font-bold text-gray-900">₹{feeAmt.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* --- EXISTING SERVICE TABLE --- */}
                  <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-2 mt-4">Service Details</h4>
                  <table className="w-full mb-4 border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#103c7f] text-white">
                        <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider w-12">S.No</th>
                        <th className="p-3 border border-[#103c7f] text-left text-[10px] font-black uppercase tracking-wider">Description of Goods/Services</th>
                        <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider">HSN/SAC</th>
                        <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider">Quantity</th>
                        <th className="p-3 border border-[#103c7f] text-center text-[10px] font-black uppercase tracking-wider">Unit</th>
                        <th className="p-3 border border-[#103c7f] text-right text-[10px] font-black uppercase tracking-wider">Unit Rate</th>
                        <th className="p-3 border border-[#103c7f] text-right text-[10px] font-black uppercase tracking-wider">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr className="border-b border-gray-300 h-10">
                        <td className="p-3 border-r border-gray-300 text-center font-bold text-gray-700">1</td>
                        <td className="p-3 border-r border-gray-300 font-bold uppercase">Permanent Staffing Services</td>
                        <td className="p-3 border-r border-gray-300 text-center text-gray-600">998512</td>
                        <td className="p-3 border-r border-gray-300 text-center font-medium">1</td>
                        <td className="p-3 border-r border-gray-300 text-center font-medium">No.</td>
                        <td className="p-3 border-r border-gray-300 text-right text-gray-600 font-medium">
                          ₹{Number(generatedPi.taxableValue).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3 text-right font-black text-gray-800">
                          ₹{Number(generatedPi.taxableValue).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* --- TOTALS --- */}
                  <div className="flex flex-row justify-between items-end pt-6 mt-10">
                    <div className="border-l-4 border-[#103c7f] pl-3 py-1 mb-1 max-w-[55%]">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount in Words</p>
                      <p className="text-xs font-bold italic text-gray-800 leading-relaxed">{generatedPi.amountInWords}</p>
                    </div>

                    <div className="w-72 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>Taxable Value:</span>
                        <span>₹ {Number(generatedPi.taxableValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>CGST (9%):</span>
                        <span>₹ {Number(generatedPi.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>SGST (9%):</span>
                        <span>₹ {Number(generatedPi.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>IGST (18%):</span>
                        <span>₹ {Number(generatedPi.igst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>Round Off:</span>
                        <span>
                          {(generatedPi.grandTotal - (generatedPi.taxableValue + generatedPi.cgst + generatedPi.sgst + generatedPi.igst)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-black border-t-2 border-black pt-2 mt-2 px-2 text-[#103c7f]">
                        <span>Grand Total:</span>
                        <span>₹ {Math.round(generatedPi.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-16 flex justify-between items-start">
                  <div className="text-[10px] space-y-1 max-w-[60%]">
                    <p className="font-black text-[#103c7f] uppercase mb-3">Terms & Conditions:</p>
                    {COMPANY_DATA.terms.map((t, i) => (
                      <p key={i} className="text-gray-600 font-medium mb-1">{i+1}. {t}</p>
                    ))}
                  </div>

                  <div className="text-center flex flex-col justify-between min-h-[100px]">
                    <p className="text-[11px] font-black uppercase text-gray-800">For {COMPANY_DATA.name}</p>
                    <div className="mt-auto">
                      <div className="border-t-2 border-gray-800 w-48 mx-auto"></div>
                      <p className="text-[9px] uppercase tracking-widest font-black text-gray-400 italic mt-1.5">Authorised Signatory</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                     Powered by <span className="text-[#103c7f]">SAVVI SALES & SERVICES PVT LTD</span>
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
     {/* Global Print Styles (Strict Mode) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden !important; }
          #preview-container, #preview-container * { visibility: visible !important; }
          #preview-container {
            position: absolute !important; left: 0 !important; top: 0 !important;
            margin: 0 !important; padding: 0 !important; width: 210mm !important; 
            box-shadow: none !important;
          }
          html, body {
            width: 100% !important; height: 100% !important; margin: 0 !important;
            padding: 0 !important; background-color: white !important; overflow: visible !important;
          }
          @page { size: A4 portrait; margin: 0mm !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
        }
      `}} />

    </div>
  );
}

export default dynamic(() => Promise.resolve(DomesticBillingPage), { ssr: false });