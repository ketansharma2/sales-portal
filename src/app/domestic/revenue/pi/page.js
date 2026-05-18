"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, Filter, Plus, FileText, Calendar, 
  Building2, User, Eye, Edit, FileCheck, CheckCircle, Clock, X, Save, Printer, Download
} from "lucide-react";

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

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// --- DUMMY DB DATA (For Dropdowns) ---
const DUMMY_CLIENTS = [
  { id: "C1", name: "Tech Mahindra", gstin: "27AABBCC1234D1Z", state: "Maharashtra", address: "Pune IT Park", pincode: "411057" },
  { id: "C2", name: "Infosys", gstin: "29BBCCDD1234E1Z", state: "Karnataka", address: "Electronic City", pincode: "560100" },
  { id: "C3", name: "Wipro", gstin: "36CCDDEE1234F1Z", state: "Telangana", address: "DLF Cyber City", pincode: "500081" }
];

const DUMMY_CANDIDATES = [
  { id: "Can1", client_id: "C1", name: "Amit Sharma", role: "Java Dev", ctc: 540000 },
  { id: "Can2", client_id: "C1", name: "Pooja Hegde", role: "UI Designer", ctc: 480000 },
  { id: "Can3", client_id: "C2", name: "Vikash Kumar", role: "Frontend", ctc: 720000 },
  { id: "Can4", client_id: "C3", name: "Riya Sharma", role: "Sales Manager", ctc: 624000 },
];

export default function DomesticInvoicingPanel() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const previewRef = useRef(null);

  // --- DUMMY DATA FOR INVOICE DESK ---
  const [invoices, setInvoices] = useState([
    {
      id: 1, pi_no: "SAVVI/PI/20260510/0101", client_name: "Tech Mahindra", candidate_names: "Amit Sharma (Java Dev)",
      pi_date: "2026-05-10", due_date: "2026-05-25", taxable_amount: 45000, total_amount: 53100, status: "Pending", has_final_invoice: false,
      address: "Pune IT Park, Phase 1", state: "Maharashtra", gstin: "27AABBCC1234D1Z", pincode: "411057",
      candidates: [{ id: 1, candidate_id: "Can1", name: "Amit Sharma", role: "Java Dev", ctc: 540000, billingPercent: 8.33 }]
    },
    {
      id: 2, pi_no: "SAVVI/PI/20260415/0085", client_name: "Infosys", candidate_names: "Vikash Kumar (Frontend)",
      pi_date: "2026-04-15", due_date: "2026-04-30", taxable_amount: 60000, total_amount: 70800, status: "Paid", has_final_invoice: true, invoice_no: "SAVVI/INV/20260502/0042",
      address: "Electronic City, Bangalore", state: "Karnataka", gstin: "29BBCCDD1234E1Z", pincode: "560100",
      candidates: [{ id: 2, candidate_id: "Can3", name: "Vikash Kumar", role: "Frontend", ctc: 720000, billingPercent: 8.33 }]
    }
  ]);

  // --- MODAL & FORM STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); 
  const [viewType, setViewType] = useState('PI'); 
  const [activeDoc, setActiveDoc] = useState(null); 

  const [editMode, setEditMode] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  
  const [piForm, setPiForm] = useState({
      invoiceNo: "", selectedClientId: "", clientName: "", address: "", gstin: "", state: "", pincode: "", 
      fromDate: "", toDate: "", candidates: []
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  // --- FILTER LOGIC ---
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.pi_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.candidate_names.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // --- HANDLERS ---
  const handleCreateNewPI = () => {
    setEditMode(false);
    setPiForm({
        invoiceNo: `SAVVI/PI/202605/${Math.floor(Math.random() * 1000)}`,
        selectedClientId: "", clientName: "", address: "", gstin: "", state: "", pincode: "", 
        fromDate: "", toDate: "", 
        candidates: [{ id: Math.random(), candidate_id: "", name: "", role: "", ctc: "", billingPercent: 8.33 }]
    });
    setIsModalOpen(true);
  };

  const handleEditPI = (id) => {
    const inv = invoices.find(i => i.id === id);
    if(inv) {
        setEditMode(true);
        // Map selected client ID based on name for dropdown
        const foundClient = DUMMY_CLIENTS.find(c => c.name === inv.client_name);
        
        setPiForm({
            invoiceNo: inv.pi_no,
            selectedClientId: foundClient ? foundClient.id : "custom",
            clientName: inv.client_name, address: inv.address || "", gstin: inv.gstin || "", state: inv.state || "", pincode: inv.pincode || "", 
            fromDate: "2026-04-01", toDate: "2026-04-30", 
            candidates: inv.candidates || []
        });
        setIsModalOpen(true);
    }
  };

  const handleClientSelect = (clientId) => {
      if(clientId === "custom") {
          setPiForm({...piForm, selectedClientId: "custom", clientName: "", address: "", gstin: "", state: "", pincode: ""});
      } else {
          const client = DUMMY_CLIENTS.find(c => c.id === clientId);
          if(client) {
              setPiForm({...piForm, selectedClientId: clientId, clientName: client.name, address: client.address, gstin: client.gstin, state: client.state, pincode: client.pincode});
          }
      }
  };

  const handleCandidateSelect = (rowId, candidateId) => {
      const cand = DUMMY_CANDIDATES.find(c => c.id === candidateId);
      if(cand) {
          const newCands = piForm.candidates.map(r => r.id === rowId ? { ...r, candidate_id: candidateId, name: cand.name, role: cand.role, ctc: cand.ctc } : r);
          setPiForm({...piForm, candidates: newCands});
      } else if (candidateId === "custom") {
          const newCands = piForm.candidates.map(r => r.id === rowId ? { ...r, candidate_id: "custom", name: "", role: "", ctc: "" } : r);
          setPiForm({...piForm, candidates: newCands});
      }
  };

  const handleAddCandidateRow = () => {
      setPiForm({
          ...piForm, 
          candidates: [...piForm.candidates, { id: Math.random(), candidate_id: "", name: "", role: "", ctc: "", billingPercent: 8.33 }]
      });
  };

  const handleGeneratePI = () => {
      if(!piForm.clientName || !piForm.invoiceNo) {
          alert("Please fill Invoice No and Client Name");
          return;
      }
      setIsGeneratingInvoice(true);
      setTimeout(() => {
          setIsGeneratingInvoice(false);
          setIsModalOpen(false);
          alert(editMode ? "PI Updated Successfully!" : "New PI Generated Successfully!");
      }, 1000);
  };

  const handleViewDocument = (id, type) => {
    const inv = invoices.find(i => i.id === id);
    if(inv) {
        const isInterstate = inv.state && inv.state !== "Haryana";
        const cgst = isInterstate ? 0 : inv.taxable_amount * 0.09;
        const sgst = isInterstate ? 0 : inv.taxable_amount * 0.09;
        const igst = isInterstate ? inv.taxable_amount * 0.18 : 0;
        
        setActiveDoc({
            ...inv, cgst, sgst, igst, amountInWords: numberToWords(Math.round(inv.total_amount))
        });
        setViewType(type);
        setIsViewModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                 <FileText size={24} className="text-blue-500" /> Proforma Invoicing Desk
             </h1>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Domestic PIs and Final Invoices</p>
         </div>
         <button onClick={handleCreateNewPI} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0">
            <Plus size={16}/> Create New PI
         </button>
      </div>

      {/* --- SEARCH & FILTER BAR --- */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
            <div className="relative">
                <input type="text" placeholder="Search by PI No, Client, or Candidate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#103c7f] transition bg-gray-50"/>
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400"><Search size={16} /></div>
            </div>
        </div>
        <div className="w-48 shrink-0">
            <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 pl-3 pr-8 rounded-lg text-sm font-bold shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer">
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><Filter size={14} /></div>
            </div>
        </div>
      </div>

      {/* --- INVOICE TABLE SECTION --- */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-220px)]">
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px] table-fixed">
               <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20 shadow-sm">
                   <tr>
                      <th className="p-3 border-r border-blue-800 text-center w-12">#</th>
                      <th className="p-3 border-r border-blue-800 w-[180px]">PI Number</th> 
                      <th className="p-3 border-r border-blue-800 w-[160px]">Client Name</th>
                      <th className="p-3 border-r border-blue-800 w-[200px]">Candidates Billed</th>
                      <th className="p-3 border-r border-blue-800 text-center w-[110px]">PI Date</th>
                      <th className="p-3 border-r border-blue-800 text-center w-[110px]">Due Date</th>
                      <th className="p-3 border-r border-blue-800 text-right w-[120px]">Total Amt (₹)</th>
                      <th className="p-3 border-r border-blue-800 text-center w-[100px]">Payment Status</th>
                      <th className="p-3 text-center w-[220px]">Action (Docs)</th>
                   </tr>
               </thead>
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr><td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">Loading Invoices...</td></tr>
                  ) : filteredInvoices.length > 0 ? (
                      filteredInvoices.map((inv, index) => (
                      <tr key={inv.id} className="hover:bg-blue-50/30 transition group">
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-400">{index + 1}</td>
                        <td className="p-3 border-r border-gray-100 font-black text-[#103c7f] tracking-wide">{inv.pi_no}</td>
                        <td className="p-3 border-r border-gray-100 align-middle overflow-hidden">
                            <span className="font-bold text-gray-800 flex items-center gap-1.5 w-full" title={inv.client_name}><Building2 size={14} className="text-blue-400 shrink-0"/> <span className="truncate">{inv.client_name}</span></span>
                        </td>
                        <td className="p-3 border-r border-gray-100 align-middle overflow-hidden">
                           <span className="font-bold text-gray-600 flex items-center gap-1.5 w-full" title={inv.candidate_names}><User size={14} className="text-gray-400 shrink-0"/> <span className="truncate">{inv.candidate_names}</span></span>
                        </td>
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className="font-mono text-gray-700 flex items-center justify-center gap-1"><Calendar size={12} className="text-blue-500"/> {inv.pi_date}</span>
                        </td>
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className="font-mono font-bold text-gray-800">{inv.due_date}</span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 border-r border-gray-100 bg-emerald-50/20">₹ {inv.total_amount.toLocaleString('en-IN')}</td>
                        <td className="p-3 border-r border-gray-100 text-center align-middle">
                            <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center gap-1 justify-center w-full truncate ${
                                inv.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-200' : inv.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200' 
                            }`}>
                                {inv.status === 'Paid' && <CheckCircle size={10}/>}
                                {inv.status === 'Overdue' && <Clock size={10}/>}
                                {inv.status}
                            </span>
                        </td>
                        <td className="p-2 text-center bg-white align-middle group-hover:bg-blue-50 transition-colors">
                          <div className="flex items-center justify-center gap-1.5 w-full px-1">
                              <button onClick={() => handleViewDocument(inv.id, 'PI')} className="flex-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1"><Eye size={12} /> View PI</button>
                              <button onClick={() => handleEditPI(inv.id)} disabled={inv.status === 'Paid'} className={`flex-1 border px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 ${inv.status === 'Paid' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}><Edit size={12} /> Edit</button>
                              {inv.has_final_invoice ? (
                                  <button onClick={() => handleViewDocument(inv.id, 'INVOICE')} className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white px-2 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1 animate-in fade-in"><FileCheck size={12} /> Invoice</button>
                              ) : (
                                  <div className="flex-1 text-[9px] text-gray-300 italic font-bold">No Invoice</div>
                              )}
                          </div>
                      </td>
                     </tr>
                  ))
                  ) : (
                      <tr><td colSpan="9" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No Invoices Found</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* ================= PI FORM MODAL (Create / Edit) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
             <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center sticky top-0 z-10">
               <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                 <FileText size={16}/> {editMode ? 'Edit Proforma Invoice' : 'Generate New Proforma Invoice'}
               </h2>
               <button onClick={() => setIsModalOpen(false)} className="hover:text-red-300"><X size={18}/></button>
             </div>
            
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                 
                 {/* NEW: INVOICE NUMBER */}
                 <div className="col-span-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Invoice Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={piForm.invoiceNo} 
                    onChange={e => setPiForm({...piForm, invoiceNo: e.target.value})} 
                    className="w-full border border-indigo-200 p-2.5 rounded text-sm font-black text-[#103c7f] bg-indigo-50 outline-none focus:border-indigo-500"
                    placeholder="e.g. SAVVI/PI/2026/0101"
                  />
                </div>

                {/* SELECT CLIENT OR CUSTOM */}
                <div className="col-span-2 md:col-span-1">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Select Client <span className="text-red-500">*</span></label>
                   <select 
                      className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500 cursor-pointer"
                      value={piForm.selectedClientId}
                      onChange={e => handleClientSelect(e.target.value)}
                   >
                       <option value="">-- Choose Client --</option>
                       {DUMMY_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       <option value="custom">-- Custom (Enter Manually) --</option>
                   </select>
                </div>

                {/* CLIENT NAME (Editable) */}
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Client Name (Editable) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={piForm.clientName} 
                    onChange={e => setPiForm({...piForm, clientName: e.target.value, selectedClientId: "custom"})} 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500"
                    placeholder="Enter Official Client Name"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">GSTIN</label>
                  <input 
                    type="text" 
                    value={piForm.gstin} 
                    onChange={e => setPiForm({...piForm, gstin: e.target.value})} 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500 uppercase"
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
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Pincode</label>
                  <input 
                    type="text" 
                    value={piForm.pincode}
                    placeholder="Enter Pincode" 
                    onChange={e => setPiForm({...piForm, pincode: e.target.value})} 
                    className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"
                  />
                 </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Address</label>
                  <textarea 
                    value={piForm.address} 
                    onChange={e => setPiForm({...piForm, address: e.target.value})} 
                    className="w-full border p-2 rounded text-sm bg-white outline-none focus:border-blue-500 h-16 resize-none"
                    placeholder="Enter full billing address"
                  />
                </div>
              </div>

              {/* CANDIDATE DETAILS (Editable Table) */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-end mb-2 pb-1">
                    <div>
                        <h4 className="text-[10px] font-black text-[#103c7f] uppercase tracking-widest">Candidate Details (Billed Items)</h4>
                        <p className="text-[10px] text-gray-400 mt-1">Select candidate from dropdown to auto-fill role & CTC.</p>
                    </div>
                    <button onClick={handleAddCandidateRow} className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-black uppercase hover:bg-blue-600 hover:text-white transition flex items-center gap-1 border border-blue-200">
                        <Plus size={12}/> Add Candidate Row
                    </button>
                </div>
                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 border-b border-r w-48">Select Candidate</th>
                        <th className="p-2 border-b border-r w-48">Candidate Name (Edit)</th>
                        <th className="p-2 border-b border-r">Role</th>
                        <th className="p-2 border-b border-r w-28">CTC (₹)</th>
                        <th className="p-2 border-b border-r w-20">Billing %</th>
                        <th className="p-2 border-b w-10 text-center">X</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {piForm.candidates.map(c => (
                        <tr key={c.id}>
                          <td className="p-1 border-r">
                             <select 
                                value={c.candidate_id || ""} 
                                onChange={e => handleCandidateSelect(c.id, e.target.value)}
                                className="w-full p-1.5 outline-none bg-transparent cursor-pointer"
                             >
                                <option value="">-- Select --</option>
                                {/* Filter candidates based on selected client */}
                                {DUMMY_CANDIDATES.filter(cand => piForm.selectedClientId ? cand.client_id === piForm.selectedClientId : true).map(cand => (
                                    <option key={cand.id} value={cand.id}>{cand.name}</option>
                                ))}
                                <option value="custom">-- Custom --</option>
                             </select>
                          </td>
                          <td className="p-1 border-r">
                            <input type="text" value={c.name} onChange={e => setPiForm({...piForm, candidates: piForm.candidates.map(cand => cand.id === c.id ? {...cand, name: e.target.value, candidate_id: "custom"} : cand)})} className="w-full p-1.5 outline-none font-bold bg-transparent focus:bg-blue-50 rounded" placeholder="Enter Name"/>
                          </td>
                          <td className="p-1 border-r">
                            <input type="text" value={c.role} onChange={e => setPiForm({...piForm, candidates: piForm.candidates.map(cand => cand.id === c.id ? {...cand, role: e.target.value} : cand)})} className="w-full p-1.5 outline-none bg-transparent focus:bg-blue-50 rounded" placeholder="Job Role"/>
                          </td>
                          <td className="p-1 border-r">
                            <input type="number" value={c.ctc} onChange={e => setPiForm({...piForm, candidates: piForm.candidates.map(cand => cand.id === c.id ? {...cand, ctc: Number(e.target.value)} : cand)})} className="w-full p-1.5 outline-none bg-transparent focus:bg-blue-50 rounded text-right" placeholder="CTC Amount"/>
                          </td>
                          <td className="p-1 border-r">
                            <input type="number" step="0.01" value={c.billingPercent} onChange={e => setPiForm({...piForm, candidates: piForm.candidates.map(cand => cand.id === c.id ? {...cand, billingPercent: Number(e.target.value)} : cand)})} className="w-full p-1.5 outline-none font-bold text-emerald-600 bg-transparent focus:bg-blue-50 rounded text-center"/>
                          </td>
                          <td className="p-1 text-center">
                              <button onClick={() => setPiForm({...piForm, candidates: piForm.candidates.filter(cand => cand.id !== c.id)})} className="text-red-400 hover:text-red-600 p-1"><X size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
                 <div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Billing Period - From</label>
                   <input type="date" value={piForm.fromDate} onChange={e => setPiForm({...piForm, fromDate: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                 </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Billing Period - To</label>
                  <input type="date" value={piForm.toDate} onChange={e => setPiForm({...piForm, toDate: e.target.value})} className="w-full border p-2 rounded text-sm outline-none focus:border-blue-500"/>
                </div>
              </div>

              <button 
                onClick={handleGeneratePI} 
                disabled={isGeneratingInvoice}
                className="w-full bg-emerald-600 text-white font-black uppercase tracking-widest p-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 mt-4 transition-colors flex items-center justify-center gap-2"
              >
                 {isGeneratingInvoice ? (
                   <>
                     <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
                     {editMode ? 'Updating Invoice...' : 'Generating Invoice...'}
                   </>
                 ) : (
                   editMode ? <><Save size={16}/> Update Document</> : <><FileCheck size={16}/> Generate Document</>
                 )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DOCUMENT VIEW MODAL (PI / INVOICE) ================= */}
      {/* ================= DOCUMENT VIEW MODAL (PI / INVOICE) ================= */}
      {isViewModalOpen && activeDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 print:p-0 print:bg-white print:block">
          
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden print:shadow-none print:max-h-none print:w-full print:rounded-none">
            
            {/* Modal Header (Hidden on Print) */}
            <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0 print:hidden">
              <span className="text-xs font-black uppercase flex items-center gap-2">
                <FileCheck size={16} className={viewType === 'INVOICE' ? 'text-amber-400' : 'text-emerald-400'}/> 
                {viewType === 'INVOICE' ? 'Tax Invoice Preview' : 'Proforma Invoice Preview'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="bg-emerald-500 text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-emerald-600 transition">
                  <Printer size={14}/> Print / Save PDF
                </button>
                <button onClick={() => setIsViewModalOpen(false)} className="hover:text-red-300 transition-colors">
                  <X size={20}/>
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area */}
            <div id="preview-container" ref={previewRef} className="overflow-y-auto custom-scrollbar p-6 bg-gray-50 flex-1 print:p-0 print:bg-white print:overflow-visible">
              
              <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-md print:shadow-none p-8 box-border relative flex flex-col">
                
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
                        <p><b>{viewType === 'INVOICE' ? 'INVOICE NO:' : 'PI NO:'}</b> {viewType === 'INVOICE' ? activeDoc.invoice_no : activeDoc.pi_no}</p>
                        <p><b>DATE:</b> {activeDoc.pi_date}</p>
                      </div>
                    </div>
                  </div>
                  <h1 className={`text-center text-3xl font-black uppercase mb-0 tracking-tight w-full ${viewType === 'INVOICE' ? 'text-[#103c7f]' : 'text-gray-700'}`}>
                    {viewType === 'INVOICE' ? 'TAX INVOICE' : 'Proforma Invoice'}
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
                          <span className="flex-1 font-black uppercase">{activeDoc.client_name}</span>
                        </p>
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Address:</span>
                          <span className="flex-1 font-medium whitespace-pre-line">{activeDoc.address || "N/A"}</span>
                        </p>
                        <p className="flex items-start">
                          <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">State:</span>
                          <span className="flex-1 font-bold">{activeDoc.state || "N/A"}</span>
                        </p>
                        {activeDoc.pincode && (
                          <p className="flex items-start">
                            <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">Pincode:</span>
                            <span className="flex-1 font-bold">{activeDoc.pincode}</span>
                          </p>
                        )}
                        {activeDoc.gstin && (
                          <p className="flex items-start">
                            <span className="w-20 text-gray-500 font-bold uppercase tracking-wide">GSTIN:</span>
                            <span className="flex-1 font-bold">{activeDoc.gstin}</span>
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
                        {activeDoc.candidates && activeDoc.candidates.map((c, idx) => {
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

                  {/* --- SERVICE TABLE --- */}
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
                        <td className="p-3 border-r border-gray-300 text-center text-gray-600">998519</td>
                        <td className="p-3 border-r border-gray-300 text-center font-medium">1</td>
                        <td className="p-3 border-r border-gray-300 text-center font-medium">No.</td>
                        <td className="p-3 border-r border-gray-300 text-right text-gray-600 font-medium">
                          ₹{Number(activeDoc.taxable_amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </td>
                        <td className="p-3 text-right font-black text-gray-800">
                          ₹{Number(activeDoc.taxable_amount).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* --- TOTALS --- */}
                  <div className="flex flex-row justify-between items-end pt-6 mt-10">
                    <div className="border-l-4 border-[#103c7f] pl-3 py-1 mb-1 max-w-[55%]">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount in Words</p>
                      <p className="text-xs font-bold italic text-gray-800 leading-relaxed">{activeDoc.amountInWords}</p>
                    </div>

                    <div className="w-72 space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>Taxable Value:</span>
                        <span>₹ {Number(activeDoc.taxable_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>CGST (9%):</span>
                        <span>₹ {Number(activeDoc.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>SGST (9%):</span>
                        <span>₹ {Number(activeDoc.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>IGST (18%):</span>
                        <span>₹ {Number(activeDoc.igst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      
                      {/* ADDED ROUND OFF */}
                      <div className="flex justify-between font-bold text-gray-600 px-2">
                        <span>Round Off:</span>
                        <span>
                           {(Math.round(activeDoc.total_amount) - (activeDoc.taxable_amount + activeDoc.cgst + activeDoc.sgst + activeDoc.igst)).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-lg font-black border-t-2 border-black pt-2 mt-2 px-2 text-[#103c7f]">
                        <span>Grand Total:</span>
                        <span>₹ {Math.round(activeDoc.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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

                {viewType === 'PI' && (
                    <div className="absolute top-1/3 left-1/4 transform -rotate-45 opacity-10 pointer-events-none text-8xl font-black text-gray-400">
                        PROFORMA
                    </div>
                )}
                
                {/* ADDED POWERED BY FOOTER */}
                <div className="mt-auto pt-4 border-t border-gray-200 text-center w-full">
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                     Powered by <span className="text-[#103c7f]">SAVVI SALES & SERVICES PVT LTD</span>
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden !important; }
          #preview-container, #preview-container * { visibility: visible !important; }
          #preview-container {
            position: absolute !important; left: 0 !important; top: 0 !important;
            margin: 0 !important; padding: 0 !important; width: 210mm !important; 
            box-shadow: none !important; background: white !important;
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