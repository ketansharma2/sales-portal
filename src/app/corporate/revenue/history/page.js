"use client";
import { useState, useEffect , useRef } from "react";
import { 
  Search, Filter, Calendar, User, Briefcase, 
  Building2, Clock, CheckCircle, AlertCircle,
  History, IndianRupee , CheckSquare, X, Printer, FileText, FileCheck
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
  const previewRef = useRef(null); 
      // --- AMOUNT IN WORDS CONVERTER ---
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupee Only' : 'Rupee Only';
    return str;
  };
  // --- DUMMY DATA ---
  const CLIENT_DB = [
  { id: 1, name: "ZARIA", address: "C-58/2, PHASE-II, OKHLA INDUSTRIAL AREA, South East Delhi,Delhi, 110020", gstin: "07BUPPS7530B1ZF", state: "Delhi", defaultBillingPercent: 6.33 },
  { id: 2, name: "Global Finance", address: "45 Business Hub, Sector 62", gstin: "09AAABCGLOB2Z", state: "UP", defaultBillingPercent: 10.0 },
  { id: 3, name: "Urban Builders", address: "78 City Center", gstin: "06AAABCURBN3Z", state: "Haryana", defaultBillingPercent: 8.33 },
];

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
const STATES = ["Haryana", "Delhi", "Punjab", "UP", "Rajasthan", "Maharashtra", "Karnataka"];
  // --- DUMMY DATA ---
  const dummyRevenueData = [
    {
      id: 1,
      entry_date: "2026-04-10",
      submitted_date: "2026-04-12", // Changed from invoice_sent_date
      crm_name: "Neha Gupta",
      payment_from: "Client", 
      client_name: "TechNova Solutions",
      candidate_name: "Kanchan",
      position: "Telecaller",
      joining_date: "2026-04-15",
      candidate_status: "Working",
      payment_status: "Invoice Sent",
    },
    {
      id: 2,
      entry_date: "2026-03-25",
      submitted_date: "2026-03-28", // Changed from invoice_sent_date
      crm_name: "Rimjhim",
      payment_from: "Candidate",
      client_name: "Global Finance",
      candidate_name: "Rimjhim",
      position: "Telecaller",
      joining_date: "2026-03-01",
      candidate_status: "Working",
      payment_status: "Received",
    },
    {
      id: 3,
      entry_date: "2026-04-05",
      submitted_date: "", // Not submitted to revenue yet
      crm_name: "kajal",
      payment_from: "Client",
      client_name: "Urban Builders",
      candidate_name: "Kajal",
      position: "Telecaller",
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
   // --- PI GENERATION STATES ---
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [isPiModalOpen, setIsPiModalOpen] = useState(false);
  const [generatedPi, setGeneratedPi] = useState(null);
  
  const [piForm, setPiForm] = useState({
    clientName: "", address: "", gstin: "", state: "Haryana", pincode: "", 
    fromDate: "", toDate: "", billingPercent: 8.33, candidates: []
  });

  // --- SELECTION HANDLERS ---
  const toggleRowSelection = (id) => {
    setSelectedRowIds(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
  };

  const openPiModal = () => {
    // Selected rows से कैंडिडेट्स का डेटा निकालें (assuming ctc is available, else fallback to 0)
    const selectedCandidates = revenueData
      .filter(item => selectedRowIds.includes(item.id))
      .map(item => ({
        id: item.id,
        role: item.position,
        name: item.candidate_name,
        ctc: item.ctc || 500000, // Replace with actual item.ctc from your DB
        billingPercent: 8.33 // Default, will update when client is selected
      }));

    setPiForm(prev => ({ ...prev, candidates: selectedCandidates }));
    setIsPiModalOpen(true);
  };

  const handleClientSelect = (clientName) => {
    const client = CLIENT_DB.find(c => c.name === clientName);
    if (client) {
      setPiForm(prev => ({
        ...prev, clientName: client.name, address: client.address, gstin: client.gstin,
        state: client.state, billingPercent: client.defaultBillingPercent,
        // Update billing % for all selected candidates automatically
        candidates: prev.candidates.map(c => ({ ...c, billingPercent: client.defaultBillingPercent }))
      }));
    }
  };

 const handleGeneratePI = () => {
    const taxableValue = piForm.candidates.reduce((sum, c) => sum + ((c.ctc * c.billingPercent) / 100), 0);
    const isInterstate = piForm.state !== "Haryana";
    const cgst = isInterstate ? 0 : taxableValue * 0.09;
    const sgst = isInterstate ? 0 : taxableValue * 0.09;
    const igst = isInterstate ? taxableValue * 0.18 : 0;
    const grandTotal = Math.round(taxableValue + cgst + sgst + igst); // <-- पहले टोटल निकालें
    
    setGeneratedPi({
      invoiceNo: `SAVVI/PI/${new Date().toISOString().split('T')[0].replace(/-/g, '')}/11`,
      date: new Date().toISOString().split('T')[0],
      ...piForm, 
      taxableValue, 
      cgst, 
      sgst, 
      igst, 
      grandTotal,
      amountInWords: numberToWords(grandTotal) // <-- फिर यहाँ पास करें
    });
    setIsPiModalOpen(false); 
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 200);
  };
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
      {/* PI GENERATION BUTTON (Shows only when rows are selected) */}
        {selectedRowIds.length > 0 && (
            <button 
              onClick={openPiModal}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 h-[34px]"
            >
              <FileCheck size={14} /> Generate PI ({selectedRowIds.length})
            </button>
        )}

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
                     <th className="p-3 border-r border-blue-800 text-center min-w-[120px]">PI</th>
                    <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-32 shadow-[-4px_0px_5px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col items-center gap-1">
                        <span>Action</span>
                        </div>
            </th>                  
            </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="10" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Directory...</td></tr>
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
                        {/* --- NEW: 8. PI Column (View / Edit) --- */}
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <div className="flex items-center justify-center gap-2">
                                <button 
                                    onClick={() => {
                                        // TODO: Add logic to view existing PI
                                        console.log("View PI for:", item.id);
                                    }}
                                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white p-1.5 rounded transition-colors border border-indigo-200"
                                    title="View PI"
                                >
                                    <FileText size={14} />
                                </button>
                                <button 
                                    onClick={() => {
                                        // TODO: Add logic to edit existing PI
                                        console.log("Edit PI for:", item.id);
                                    }}
                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white p-1.5 rounded transition-colors border border-emerald-200"
                                    title="Edit PI"
                                >
                                    <FileCheck size={14} /> {/* Using FileCheck as edit icon for now, you can use Edit3 if imported */}
                                </button>
                            </div>
                        </td>

                        {/* 8. ACTION COLUMN (View Only) */}
                      <td className="p-2 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] align-middle group-hover:bg-blue-50/30 transition-colors">
      {/* flex-col हटाकर flex items-center और justify-center लगाया है */}
      <div className="flex items-center justify-center gap-2 w-full px-1">
          {/* CHECKBOX */}
          <input 
              type="checkbox" 
              className="cursor-pointer accent-blue-600 w-4 h-4 rounded shrink-0"
              checked={selectedRowIds.includes(item.id)}
              onChange={() => toggleRowSelection(item.id)}
          />
          {/* बटन में w-full की जगह flex-1 लगाया है */}
          <button 
              onClick={() => handleViewHistory(item.id)}
              className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"
          >
              <History size={12} /> History
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

   {/* ================= PI FORM MODAL ================= */}
      {isPiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><FileText size={16}/> Generate Proforma Invoice</h2>
              <button onClick={() => setIsPiModalOpen(false)} className="hover:text-red-300"><X size={18}/></button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Client Selection & Editable Auto-fill */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Select Client (Auto-fill)</label>
                  <select 
                    className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500" 
                    onChange={(e) => {
                      handleClientSelect(e.target.value);
                      // Update manual input if client is selected, otherwise allow free typing
                      if(!e.target.value) setPiForm({...piForm, clientName: ""});
                    }}
                  >
                    <option value="">-- Choose Client --</option>
                    {CLIENT_DB.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Client Name (Editable)</label>
                  <input 
                    type="text" 
                    value={piForm.clientName} 
                    onChange={e => setPiForm({...piForm, clientName: e.target.value})} 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500"
                    placeholder="Enter or edit client name"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">GSTIN</label>
                  <input 
                    type="text" 
                    value={piForm.gstin} 
                    onChange={e => setPiForm({...piForm, gstin: e.target.value})} 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500"
                    placeholder="Enter GSTIN"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">State</label>
                  <select 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500" 
                    value={piForm.state} 
                    onChange={e => setPiForm({...piForm, state: e.target.value})}
                  >
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Address</label>
                  <textarea 
                    value={piForm.address} 
                    onChange={e => setPiForm({...piForm, address: e.target.value})} 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500 h-16 resize-none"
                    placeholder="Enter full address"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Pincode</label>
                  <input 
                    type="text" 
                    value={piForm.pincode}
                    placeholder="Enter Pincode" 
                    onChange={e => setPiForm({...piForm, pincode: e.target.value})} 
                    className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div></div> {/* Empty div to maintain grid layout */}
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">From Date</label>
                  <input type="date" value={piForm.fromDate} onChange={e => setPiForm({...piForm, fromDate: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">To Date</label>
                  <input type="date" value={piForm.toDate} onChange={e => setPiForm({...piForm, toDate: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
              </div>

              {/* Editable Candidates Preview inside Modal */}
              <div className="mt-4">
                <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-2 border-b pb-1">Candidate Details (Editable)</h4>
                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border-b border-r">Candidate Name</th>
                        <th className="p-2 border-b border-r">Role</th>
                        <th className="p-2 border-b border-r w-32">CTC (₹)</th>
                        <th className="p-2 border-b w-24">Billing %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {piForm.candidates.map(c => (
                        <tr key={c.id}>
                          <td className="p-1 border-r">
                            <input 
                              type="text" 
                              value={c.name} 
                              onChange={e => {
                                const newCands = piForm.candidates.map(cand => cand.id === c.id ? {...cand, name: e.target.value} : cand);
                                setPiForm({...piForm, candidates: newCands});
                              }}
                              className="w-full p-1.5 outline-none font-bold bg-transparent focus:bg-blue-50 rounded"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <input 
                              type="text" 
                              value={c.role} 
                              onChange={e => {
                                const newCands = piForm.candidates.map(cand => cand.id === c.id ? {...cand, role: e.target.value} : cand);
                                setPiForm({...piForm, candidates: newCands});
                              }}
                              className="w-full p-1.5 outline-none bg-transparent focus:bg-blue-50 rounded"
                            />
                          </td>
                          <td className="p-1 border-r">
                            <input 
                              type="number" 
                              value={c.ctc} 
                              onChange={e => {
                                const newCands = piForm.candidates.map(cand => cand.id === c.id ? {...cand, ctc: Number(e.target.value)} : cand);
                                setPiForm({...piForm, candidates: newCands});
                              }}
                              className="w-full p-1.5 outline-none bg-transparent focus:bg-blue-50 rounded text-right"
                            />
                          </td>
                          <td className="p-1">
                            <input 
                              type="number" 
                              step="0.01"
                              value={c.billingPercent} 
                              onChange={e => {
                                const newCands = piForm.candidates.map(cand => cand.id === c.id ? {...cand, billingPercent: Number(e.target.value)} : cand);
                                setPiForm({...piForm, candidates: newCands});
                              }}
                              className="w-full p-1.5 outline-none font-bold text-emerald-600 bg-transparent focus:bg-blue-50 rounded text-center"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button 
                onClick={handleGeneratePI} 
                disabled={!piForm.clientName} 
                className="w-full bg-emerald-600 text-white font-black uppercase tracking-widest p-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 mt-4 transition-colors"
              >
                Generate Invoice Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= GENERATED PI PRINT VIEW ================= */}
    {/* ================= GENERATED PI PRINT VIEW ================= */}
      {generatedPi && (
        <div id="preview-container" ref={previewRef} className="w-[210mm] mx-auto mt-12 bg-white shadow-2xl print:shadow-none print:m-0 print:w-full print:max-w-full">
            
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center print:hidden rounded-t-lg">
              <span className="text-xs font-black uppercase text-gray-400 flex items-center gap-2"><FileCheck size={16} className="text-emerald-500"/> Proforma Invoice Preview</span>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition">
                  <Printer size={14}/> Print / Save PDF
                </button>
                <button onClick={() => setGeneratedPi(null)} className="bg-white border p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><X size={16}/></button>
              </div>
            </div>

            <div className="p-4 text-black flex flex-col"> 
              
              {/* --- Header --- */}
              <div className="border-b-4 border-[#103c7f] pb-1 mb-8">
                
                {/* --- 2. Details and Logos below the heading --- */}
                <div className="flex justify-between items-start">
                  
                  {/* Left side */}
                  <div className="flex items-center gap-2">
                    <img src="/Savvi-Logo.png" alt="Savvi Logo" className="h-30 w-auto object-contain" />
                    <div className="text-[11px] font-bold leading-tight text-gray-600 uppercase border-l-2 border-gray-200 pl-5 py-2">
                      <p className="text-black text-sm mb-1">{COMPANY_DATA.name}</p>
                      <p>{COMPANY_DATA.address}</p>
                      <p>EMAIL: {COMPANY_DATA.email}</p>
                      <p className="text-black mt-1">GSTIN: {COMPANY_DATA.gstin}</p>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex flex-col items-end text-right mt-1"> 
                    <div className="flex flex-col items-end mb-3">
                      <img src="/maven-logo.png" alt="Maven Logo" className="h-8 w-auto object-contain" />
                    </div>
                    <div className="text-xs space-y-1.5">
                      {/* Heading removed from here and moved to the top */}
                      <p><b>PI NO:</b> {generatedPi.invoiceNo}</p>
                      <p><b>DATE:</b> {generatedPi.date}</p>
                      {generatedPi.fromDate && <p><b>FROM:</b> {generatedPi.fromDate} <span className="mx-1">|</span> <b>TO:</b> {generatedPi.toDate}</p>}
                    </div>
                  </div>
                  {/*heading*/}
                  
                </div>
                {/* --- 1. Centered Heading at the top --- */}
                <h1 className="text-center text-3xl font-black uppercase mb-0 text-[#103c7f] tracking-tight w-full">
                  Proforma Invoice
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
                        <span className="flex-1 font-black uppercase">{generatedPi.clientName || generatedPi.customer?.name}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Address:</span>
                        <span className="flex-1 font-medium whitespace-pre-line">{generatedPi.address || generatedPi.customer?.address}</span>
                      </p>
                      <p className="flex items-start">
                        <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">State:</span>
                        <span className="flex-1 font-bold">{generatedPi.state || generatedPi.customer?.state}</span>
                      </p>
                      {(generatedPi.pincode || generatedPi.customer?.pincode) && (
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Pincode:</span>
                          <span className="flex-1 font-bold">{generatedPi.pincode || generatedPi.customer?.pincode}</span>
                        </p>
                      )}
                      {(generatedPi.gstin || generatedPi.customer?.gstin) && (
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">GSTIN:</span>
                          <span className="flex-1 font-bold">{generatedPi.gstin || generatedPi.customer?.gstin}</span>
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
                
                {/* --- NEW: CANDIDATE DETAILS TABLE --- */}
                <div className="mb-6">
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

                {/* --- EXISTING SERVICE TABLE (Single Row) --- */}
                <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest mb-2">Service Details</h4>
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
                <div className="flex flex-row justify-between items-end pt-6 mt-auto">
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

              <div className="mt-12 flex justify-between items-start">
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

              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                   Powered by <span className="text-[#103c7f]">SAVVI SALES & SERVICES PVT LTD</span>
                 </p>
              </div>
            </div>
        </div>
      )}
      
     {/* Global Print Styles (Strict Mode to fix alignment issues) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* 1. Hide EVERYTHING by default */
          body * {
            visibility: hidden !important;
          }

          /* 2. Show ONLY the invoice container and its children */
          #preview-container, #preview-container * {
            visibility: visible !important;
          }

          /* 3. Position the invoice strictly at the top left of the physical paper */
          #preview-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important; /* Strict A4 Width */
            /* min-height: 297mm !important; */
            box-shadow: none !important;
          }

          /* 4. Reset html/body to prevent scrollbars or offset */
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            overflow: visible !important;
          }

          /* 5. Physical Paper Setup */
          @page { 
            size: A4 portrait; 
            margin: 0mm !important; /* Zero margin from the printer side */
          }

          /* 6. Ensure colors print */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }

          /* 7. Explicitly hide Tailwind classes that might interfere */
          .print\\:hidden { display: none !important; }
        }
      `}} />


    </div>
  );
}
