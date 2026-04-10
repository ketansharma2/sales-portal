"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Building2, Briefcase, Calendar, 
  IndianRupee, Phone, Mail, ShieldCheck, Clock, 
  FileText, CreditCard, Eye, Plus, X, Save, Edit
} from "lucide-react";

export default function CandidateHistoryPage({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasBasicDetails = data !== null;

  // --- MOCK DROPDOWN DATA ---
  const mockCandidates = ["Amit Verma", "Sneha Patil", "Ravi Teja", "Kiran Rao", "Priya Sharma"];
  const mockClients = ["TechNova Solutions", "Global Finance", "Urban Builders", "Apex Retail", "Stellar Jobs"];

  // --- MODAL STATES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [kycFiles, setKycFiles] = useState([]); // Multiple KYC files ke liye state
  
  // Forms States
  const [mainForm, setMainForm] = useState({ 
      candidate_name: "", client_name: "", candidate_phone: "", account_email: "", 
      offer_salary: "", payment_terms: "", base_invoice: "", 
      payment_due_date: "", payment_followup_date: "" 
  });
  const [candForm, setCandForm] = useState({ followup_date: "", next_followup_date: "", conversation: "", candidate_status: "Working" });
  const [clientForm, setClientForm] = useState({ followup_date: "", next_followup_date: "", conversation: "" });
  const [payForm, setPayForm] = useState({ date: "", amount_received: "", payment_status: "Pending", remark: "" });
  // --- MOCK DATA FETCH SIMULATION ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockDossier = {
        id: id,
        candidate_name: "Amit Verma",
        position: "Frontend Developer",
        candidate_phone: "+91 9876543210",
        candidate_status: "Working",
        client_name: "TechNova Solutions",
        account_email: "finance@technova.com",
        entry_date: "2026-04-10",
        joining_date: "2026-04-15",
        entered_by_rc: "Pooja Singh",
        tl_name: "Vikram Sharma",
        crm_name: "Neha Gupta",
        offer_salary: "12,00,000",
        payment_terms: "8.33%",
        payment_days: "30 Days",
        base_invoice: "1,00,000",
        gst_amount: "18,000",
        total_amount: "1,18,000",
        payment_status: "Invoice Sent",
        payment_due_date: "2026-05-15",
        kyc_documents: 2,

        // Updated Structure as per your request
       // Track 1: Candidate History (By Recruiter/TL)
        candidate_history: [
          { followup_date: "2026-05-20", next_followup_date: "2026-06-20", conversation: "One month completion check-in. Amit is performing very well and has integrated into the frontend team smoothly.", candidate_status: "Working", loggedBy: "Pooja Singh" },
          { followup_date: "2026-04-20", next_followup_date: "2026-05-20", conversation: "Candidate is settling in well. Reached office on time and completed induction.", candidate_status: "Working", loggedBy: "Pooja Singh" },
          { followup_date: "2026-04-15", next_followup_date: "2026-04-20", conversation: "First day completed successfully. IT assets assigned.", candidate_status: "Working", loggedBy: "Pooja Singh" },
          { followup_date: "2026-04-14", next_followup_date: "2026-04-15", conversation: "Called to remind about joining documents and reporting time for tomorrow.", candidate_status: "Pending Join", loggedBy: "Vikram Sharma" },
          { followup_date: "2026-04-05", next_followup_date: "2026-04-14", conversation: "All exit formalities from previous employer completed.", candidate_status: "Pending Join", loggedBy: "Pooja Singh" },
          { followup_date: "2026-03-25", next_followup_date: "2026-04-05", conversation: "Regular notice period check-in. Serving notice smoothly without issues.", candidate_status: "Pending Join", loggedBy: "Pooja Singh" },
          { followup_date: "2026-03-10", next_followup_date: "2026-03-25", conversation: "Offer accepted. Expected joining date finalized for 15th April.", candidate_status: "Pending Join", loggedBy: "Vikram Sharma" }
        ],

        // Track 2: Client History (By CRM)
        client_history: [
          { followup_date: "2026-05-15", next_followup_date: "2026-05-20", conversation: "Spoke to Finance Head. They promised to process the invoice by next week.", loggedBy: "Neha Gupta" },
          { followup_date: "2026-05-01", next_followup_date: "2026-05-15", conversation: "Followed up on invoice. HR confirmed it is in queue for approval.", loggedBy: "Neha Gupta" },
          { followup_date: "2026-04-18", next_followup_date: "2026-05-01", conversation: "Checked with Hiring Manager. They are happy with Amit's first week.", loggedBy: "Neha Gupta" },
          { followup_date: "2026-04-15", next_followup_date: "2026-04-18", conversation: "HR confirmed candidate has reported and collected the laptop.", loggedBy: "Neha Gupta" },
          { followup_date: "2026-04-10", next_followup_date: "2026-04-15", conversation: "Background check cleared. Seating arranged for joining day.", loggedBy: "Neha Gupta" },
          { followup_date: "2026-04-01", next_followup_date: "2026-04-10", conversation: "Initiated BGV process with external agency.", loggedBy: "Neha Gupta" },
          { followup_date: "2026-03-10", next_followup_date: "2026-04-01", conversation: "Offer released to Amit as per client's approval.", loggedBy: "Neha Gupta" }
        ],

        // Track 3: Payment History (By Finance)
        payment_history: [
          { date: "2026-05-18", amount_received: "50000", payment_status: "Partial Payment", remark: "Received partial payment via NEFT. Remainder promised next week.", loggedBy: "Finance System" },
          { date: "2026-05-16", amount_received: "0", payment_status: "Pending", remark: "Payment overdue. Sent reminder email with late fee clause details.", loggedBy: "Finance System" },
          { date: "2026-05-10", amount_received: "0", payment_status: "Pending", remark: "Automated reminder sent 5 days before due date.", loggedBy: "Finance System" },
          { date: "2026-05-02", amount_received: "0", payment_status: "Invoice Sent", remark: "Client acknowledged the invoice. Pushed to their internal accounting system.", loggedBy: "Finance System" },
          { date: "2026-04-20", amount_received: "0", payment_status: "Invoice Sent", remark: "Hard copy of invoice dispatched via courier.", loggedBy: "Finance System" },
          { date: "2026-04-16", amount_received: "0", payment_status: "Invoice Sent", remark: "Invoice #INV-2026-042 generated and sent to finance@technova.com", loggedBy: "Finance System" }
        ]
      };

      setData(mockDossier);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // --- HANDLERS ---
 const handleOpenModal = (type) => {
      setModalType(type);
      const today = new Date().toISOString().split('T')[0];
      
      if (type === 'edit') {
          setMainForm({
              candidate_name: data.candidate_name || "",
              client_name: data.client_name || "",
              candidate_phone: data.candidate_phone || "",
              account_email: data.account_email || "",
              offer_salary: data.offer_salary ? data.offer_salary.replace(/,/g, '') : "",
              payment_terms: data.payment_terms || "",
              base_invoice: data.base_invoice ? data.base_invoice.replace(/,/g, '') : "",
              payment_due_date: data.payment_due_date || "",
              payment_followup_date: data.client_history?.[0]?.next_followup_date || "" // Taking from client track
          });
          setKycFiles([]); // Reset files on open
      }
      if (type === 'candidate') setCandForm({ followup_date: today, next_followup_date: "", conversation: "", candidate_status: "Working" });
      if (type === 'client') setClientForm({ followup_date: today, next_followup_date: "", conversation: "" });
      if (type === 'payment') setPayForm({ date: today, amount_received: "", payment_status: "Pending", remark: "" });
      
      setIsModalOpen(true);
  };

  const handleSaveMock = () => {
      const updatedData = { ...data };
      const userName = "Current User (Mock)";

      if (modalType === 'edit') {
          // Auto Calculate GST and Total
          const baseNum = parseInt(mainForm.base_invoice) || 0;
          const gstNum = baseNum * 0.18;
          const totalNum = baseNum + gstNum;

          updatedData.candidate_name = mainForm.candidate_name;
          updatedData.client_name = mainForm.client_name;
          updatedData.candidate_phone = mainForm.candidate_phone;
          updatedData.account_email = mainForm.account_email;
          updatedData.offer_salary = parseInt(mainForm.offer_salary || 0).toLocaleString('en-IN');
          updatedData.payment_terms = mainForm.payment_terms;
          updatedData.base_invoice = baseNum.toLocaleString('en-IN');
          updatedData.gst_amount = gstNum.toLocaleString('en-IN');
          updatedData.total_amount = totalNum.toLocaleString('en-IN');
          updatedData.payment_due_date = mainForm.payment_due_date;
          
          // KYC Upload simulation (just adding count for mock)
          if(kycFiles.length > 0) {
              updatedData.kyc_documents = (updatedData.kyc_documents || 0) + kycFiles.length;
          }
      }
      else if (modalType === 'candidate') {
          updatedData.candidate_history.unshift({ ...candForm, loggedBy: userName });
          updatedData.candidate_status = candForm.candidate_status;
      } else if (modalType === 'client') {
          updatedData.client_history.unshift({ ...clientForm, loggedBy: userName });
      } else if (modalType === 'payment') {
          updatedData.payment_history.unshift({ ...payForm, loggedBy: userName });
          updatedData.payment_status = payForm.payment_status;
      }

      setData(updatedData);
      setIsModalOpen(false);
  };

  // Multiple File Handler
  const handleKycUpload = (files) => {
      if (files && files.length > 0) {
          setKycFiles(Array.from(files));
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-[#103c7f]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#103c7f] rounded-full animate-spin mb-4"></div>
        <p className="font-bold uppercase tracking-widest text-sm">Loading Dossier...</p>
      </div>
    );
  }
  if (!data) return <div className="p-6 text-center text-red-500 font-bold">Error: Record not found.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20 relative">
      
      {/* --- TOP NAVIGATION --- */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#103c7f] transition-colors font-bold text-sm mb-6 w-fit">
        <ArrowLeft size={16} /> Back to Directory
      </button>

     {/* --- HEADER: PROFILE CARD (COMPACT) --- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-48 h-48 bg-blue-50 rounded-full opacity-50 pointer-events-none"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                      <User size={24} />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{data.candidate_name}</h1>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-gray-500">
                          <span className="flex items-center gap-1"><Briefcase size={12}/> {data.position}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1 text-[#103c7f]"><Building2 size={12}/> {data.client_name}</span>
                      </div>
                  </div>
              </div>
              <div className="flex flex-row gap-2 w-full md:w-auto">
                  <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center justify-center min-w-[100px] ${data.candidate_status === 'Working' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-0.5">Candidate</span>
                      <span className="font-black text-xs uppercase">{data.candidate_status}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center justify-center min-w-[100px] ${data.payment_status === 'Received' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : data.payment_status === 'Invoice Sent' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-0.5">Payment</span>
                      <span className="font-black text-xs uppercase">{data.payment_status}</span>
                  </div>
              </div>
          </div>
      </div>
     
    {/* --- SECTION 1: PAYMENT & BASIC DETAILS --- */}
    {/* --- SECTION 1: PAYMENT & BASIC DETAILS (SPLIT CARDS) --- */}
      <div className="mb-8">
          <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-tight mb-4 mt-2">Payment & Basic Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* Card 1: Billing Contact */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-blue-200 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><User size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Billing Contact</h4>
                  </div>
                  <div className="space-y-4 flex-1">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment From</p>
                          <p className="text-sm font-bold text-gray-800">{data.payment_from || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Email</p>
                          <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> {data.account_email || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                          <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {data.phone_number || 'N/A'}</p>
                      </div>
                  </div>
              </div>

              {/* Card 2: Commercials */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-purple-200 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors"><Briefcase size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Commercials</h4>
                  </div>
                  <div className="space-y-4 flex-1">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Offer Salary</p>
                          <p className="text-sm font-bold text-gray-800">₹ {data.offer_salary || '0'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Terms</p>
                          <p className="text-sm font-bold text-gray-800">{data.payment_terms || '-'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">KYC Documents</p>
                          <button className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 w-fit mt-0.5">
                              <Eye size={12}/> View ({data.kyc_documents || 0})
                          </button>
                      </div>
                  </div>
              </div>

              {/* Card 3: Invoicing & Balance */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col relative overflow-hidden hover:border-green-200 transition-colors group">
                  <div className="absolute -bottom-4 -right-4 p-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                      <IndianRupee size={100} />
                  </div>
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3 relative z-10">
                      <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors"><FileText size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Invoice Status</h4>
                  </div>
                  <div className="space-y-4 flex-1 relative z-10">
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Base Invoice</p>
                              <p className="text-sm font-mono font-bold text-gray-600">₹ {data.base_invoice || '0'}</p>
                          </div>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total (With GST)</p>
                          <p className="text-base font-mono font-black text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 inline-block">₹ {data.total_amount || '0'}</p>
                      </div>
                      <div className="pt-2">
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Remaining Balance</p>
                          <p className="text-lg font-mono font-black text-red-600">
                              ₹ {data.total_amount ? (parseInt(data.total_amount.replace(/,/g, '')) - data.payment_history.reduce((acc, curr) => acc + parseInt(curr.amount_received || 0), 0)).toLocaleString('en-IN') : '0'}
                          </p>
                      </div>
                  </div>
              </div>

              {/* Card 4: Schedule */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-orange-200 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors"><Calendar size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Schedule</h4>
                  </div>
                  <div className="space-y-4 flex-1">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Joining Date</p>
                          <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Briefcase size={12} className="text-blue-500"/> {data.joining_date || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Due Date</p>
                          <p className="text-sm font-bold text-orange-600 flex items-center gap-1.5"><Clock size={12}/> {data.payment_due_date || 'N/A'}</p>
                      </div>
                      <div className="pt-2">
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Payment Follow-up</p>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 inline-flex items-center gap-2 mt-0.5">
                              <Calendar size={14} className="text-indigo-600"/>
                              <span className="text-sm font-black text-indigo-800">{data.payment_followup_date || 'N/A'}</span>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </div>
      {/* --- SECTION 2: THE THREE TIMELINES --- */}
      <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-tight mb-4 mt-8">Lifecycle Action Center</h2>
      
     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. CANDIDATE HISTORY */}
          <div className="bg-emerald-50/30 rounded-2xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-emerald-100 px-4 py-3 border-b border-emerald-200 flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2"><User size={16}/> Candidate Track</h3>
                  <button onClick={() => handleOpenModal('candidate')} className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
              </div>
              <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                  {data.candidate_history.map((log, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-sm relative">
                          <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[11px] font-black text-gray-800 flex items-center gap-1">
                                  <Calendar size={12} className="text-emerald-500"/> {log.followup_date}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${log.candidate_status === 'Working' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                  {log.candidate_status}
                              </span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100 mb-2 leading-relaxed">
                              {log.conversation}
                          </p>
                          <div className="flex justify-between items-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">By: {log.loggedBy}</p>
                              {log.next_followup_date && (
                                  <p className="text-[9px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                                      <Clock size={10}/> Next: {log.next_followup_date}
                                  </p>
                              )}
                          </div>
                      </div>
                  ))}
                  {data.candidate_history.length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No candidate logs.</p>}
              </div>
          </div>

          {/* 2. CLIENT HISTORY */}
          <div className="bg-indigo-50/30 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200 flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2"><Building2 size={16}/> Client Track</h3>
                  <button onClick={() => handleOpenModal('client')} className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
              </div>
              <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                  {data.client_history.map((log, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm relative">
                          <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[11px] font-black text-gray-800 flex items-center gap-1">
                                  <Calendar size={12} className="text-indigo-500"/> {log.followup_date}
                              </span>
                          </div>
                          <p className="text-[11px] font-medium text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100 mb-2 leading-relaxed">
                              {log.conversation}
                          </p>
                          <div className="flex justify-between items-center">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">By: {log.loggedBy}</p>
                              {log.next_followup_date && (
                                  <p className="text-[9px] font-black text-indigo-600 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded">
                                      <Clock size={10}/> Next: {log.next_followup_date}
                                  </p>
                              )}
                          </div>
                      </div>
                  ))}
                  {data.client_history.length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No client logs.</p>}
              </div>
          </div>

         {/* 3. PAYMENT HISTORY */}
          <div className="bg-orange-50/30 rounded-2xl border border-orange-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-orange-100 px-4 py-3 border-b border-orange-200 flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest flex items-center gap-2"><CreditCard size={16}/> Payment Track</h3>
                  <button onClick={() => handleOpenModal('payment')} className="bg-orange-600 hover:bg-orange-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
              </div>
              <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                  {data.payment_history.map((log, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-orange-100 shadow-sm relative">
                          
                          {/* TOP ROW: Date & Status */}
                          <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-1.5">
                              <span className="text-[11px] font-black text-gray-800 flex items-center gap-1">
                                  <Calendar size={12} className="text-orange-500"/> {log.date}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${log.payment_status === 'Received' || log.payment_status === 'Partial Payment' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                  {log.payment_status}
                              </span>
                          </div>
                          
                          {/* MIDDLE: Amount Highlight */}
                          <div className="mb-2.5">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount Received</p>
                              <p className="text-sm font-mono font-black text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1 w-fit shadow-sm">
                                  <IndianRupee size={12}/> {log.amount_received || 0}
                              </p>
                          </div>

                          {/* BOTTOM: Remarks & Logged By */}
                          <p className="text-[11px] font-medium text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100 mb-2 leading-relaxed">
                              {log.remark}
                          </p>
                          
                          <div className="flex justify-between items-center mt-1">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">By: {log.loggedBy}</p>
                          </div>
                          
                      </div>
                  ))}
                  {data.payment_history.length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No payment logs.</p>}
              </div>
          </div>

      </div>

    {/* --- UNIFIED MODAL (Candidate, Client, Payment Logs) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className={`p-3 flex justify-between items-center text-white ${
                    modalType === 'candidate' ? 'bg-emerald-600' : modalType === 'client' ? 'bg-indigo-600' : 'bg-orange-600'
                }`}>
                    <h3 className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                        <Plus size={14}/> Add {modalType} Log
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={16}/></button>
                </div>

                <div className="p-4 space-y-3 max-h-[85vh] overflow-y-auto custom-scrollbar">

                    {/* --- CANDIDATE FORM --- */}
                    {modalType === 'candidate' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Follow-up Date</label>
                                    <input type="date" value={candForm.followup_date} onChange={e => setCandForm({...candForm, followup_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-emerald-500 bg-gray-50"/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Next Follow-up</label>
                                    <input type="date" value={candForm.next_followup_date} onChange={e => setCandForm({...candForm, next_followup_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-emerald-500 bg-gray-50"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Candidate Status</label>
                                <select value={candForm.candidate_status} onChange={e => setCandForm({...candForm, candidate_status: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-emerald-500 bg-gray-50 cursor-pointer">
                                    <option value="Working">Working</option>
                                    <option value="Warning">Warning</option>
                                    <option value="Absconded">Absconded</option>
                                    <option value="Resigned">Resigned</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Conversation / Remarks</label>
                                <textarea rows="3" placeholder="Enter conversation details..." value={candForm.conversation} onChange={e => setCandForm({...candForm, conversation: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-emerald-500 bg-gray-50 resize-none"></textarea>
                            </div>
                        </>
                    )}

                    {/* --- CLIENT FORM --- */}
                    {modalType === 'client' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Follow-up Date</label>
                                    <input type="date" value={clientForm.followup_date} onChange={e => setClientForm({...clientForm, followup_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-indigo-500 bg-gray-50"/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Next Follow-up</label>
                                    <input type="date" value={clientForm.next_followup_date} onChange={e => setClientForm({...clientForm, next_followup_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-indigo-500 bg-gray-50"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Conversation / Remarks</label>
                                <textarea rows="3" placeholder="Enter client discussion..." value={clientForm.conversation} onChange={e => setClientForm({...clientForm, conversation: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-indigo-500 bg-gray-50 resize-none"></textarea>
                            </div>
                        </>
                    )}

                    {/* --- PAYMENT FORM --- */}
                    {modalType === 'payment' && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Date</label>
                                    <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-orange-500 bg-gray-50"/>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase">Payment Status</label>
                                    <select value={payForm.payment_status} onChange={e => setPayForm({...payForm, payment_status: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-orange-500 bg-gray-50 cursor-pointer">
                                        <option value="Pending">Pending</option>
                                        <option value="Invoice Sent">Invoice Sent</option>
                                        <option value="Partial Payment">Partial Payment</option>
                                        <option value="Received">Received</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Amount Received</label>
                                <input type="number" placeholder="₹ Amount" value={payForm.amount_received} onChange={e => setPayForm({...payForm, amount_received: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-orange-500 bg-gray-50"/>
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-gray-500 uppercase">Remark</label>
                                <textarea rows="3" placeholder="Reference No., Bank Name, etc." value={payForm.remark} onChange={e => setPayForm({...payForm, remark: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-orange-500 bg-gray-50 resize-none"></textarea>
                            </div>
                        </>
                    )}

                    <div className="pt-3 mt-1 border-t border-gray-100">
                        <button onClick={handleSaveMock} className={`w-full py-2.5 rounded-lg font-black uppercase tracking-widest text-white shadow-sm flex items-center justify-center gap-2 text-xs transition-colors ${
                            modalType === 'candidate' ? 'bg-emerald-600 hover:bg-emerald-700' : modalType === 'client' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-600 hover:bg-orange-700'
                        }`}>
                            <Save size={14}/> Save Log
                        </button>
                    </div>

                </div>
            </div>
        </div>
      )}
    </div>
  );
}