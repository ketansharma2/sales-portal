"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, User, Building2, Briefcase, Calendar, 
  IndianRupee, Phone, Mail, Clock, FileText, CreditCard, 
  Eye, Plus, X, Save, Edit, Users, PhoneCall, CheckCircle, AlertCircle,
  FileCheck, Download, Printer
} from "lucide-react";

import { useParams, useRouter } from 'next/navigation';

export default function CandidateHistoryPage() {
  const params = useParams();
  const router = useRouter();
  
  // 1. Basic States
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  // 2. UI & Modal States
  const [isEditingCRMData, setIsEditingCRMData] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); 
  const [kycFiles, setKycFiles] = useState([]);
  
  // 3. PI Modal States
  const [isPiModalOpen, setIsPiModalOpen] = useState(false);
  const [isViewPiModalOpen, setIsViewPiModalOpen] = useState(false);
  const [piData, setPiData] = useState(null);
  
  const [piForm, setPiForm] = useState({
      invoice_no: `PI-2026-${Math.floor(Math.random() * 1000)}`,
      pi_date: new Date().toISOString().split('T')[0],
      bill_to: "",
      description: "Recruitment Services for",
      hsn_code: "998519"
  });

  // 4. Form States (YAHAN HAI mainForm)
  const [mainForm, setMainForm] = useState({ 
      entry_date: "", crm_name: "", tl_name: "", entered_by_rc: "",
      payment_from: "", client_name: "", candidate_name: "", position: "",
      client_email: "", client_phone: "", candidate_email: "", candidate_phone: "", 
      offer_salary: "", payment_terms: "", joining_date: "", payment_days: "",
  });
  
  const [revenueForm, setRevenueForm] = useState({
      base_invoice: "", total_amount: "", payment_due_date: "", payment_followup_date: "" , pi_date: "" // Naya field add kiya
  });

  const [candForm, setCandForm] = useState({ followup_date: "", next_followup_date: "", conversation: "", candidate_status: "Working" });
  const [clientForm, setClientForm] = useState({ followup_date: "", next_followup_date: "", conversation: "" });
  const [payForm, setPayForm] = useState({ date: "", amount_received: "", payment_status: "Pending", remark: "" });

  useEffect(() => {
    if (!params?.id) return;
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      const mockDossier = {
        id: params.id,
        candidate_name: "Amit Verma",
        position: "Frontend Developer",
        candidate_phone: "+91 9876543210",
        candidate_email: "amit@example.com",
        candidate_status: "Working",
        client_name: "TechNova Solutions",
        client_phone: "+91 8888888888",
        client_email: "finance@technova.com",
        entry_date: "2026-04-10",
        joining_date: "2026-04-15",
        entered_by_rc: "Pooja Singh",
        tl_name: "Vikram Sharma",
        crm_name: "Neha Gupta",
        payment_from: "Client",
        offer_salary: "12,00,000",
        payment_terms: "8.33",
        payment_days: "30",
        base_invoice: "1,00,000",
        gst_amount: "18,000",
        total_amount: "1,18,000",
        payment_status: "Invoice Sent",
        payment_due_date: "2026-05-15",
        payment_followup_date: "2026-05-10",
        kyc_documents: 2,
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

        // Track 3: Payment History (By Finance/Revenue Team)
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
      
      setMainForm({
          entry_date: mockDossier.entry_date || "", crm_name: mockDossier.crm_name || "", tl_name: mockDossier.tl_name || "", entered_by_rc: mockDossier.entered_by_rc || "",
          payment_from: mockDossier.payment_from || "", client_name: mockDossier.client_name || "", candidate_name: mockDossier.candidate_name || "", position: mockDossier.position || "",
          client_email: mockDossier.client_email || "", client_phone: mockDossier.client_phone || "", candidate_email: mockDossier.candidate_email || "", candidate_phone: mockDossier.candidate_phone || "",
          offer_salary: mockDossier.offer_salary ? mockDossier.offer_salary.replace(/,/g, '') : "", payment_terms: mockDossier.payment_terms ? mockDossier.payment_terms.replace('%', '') : "", joining_date: mockDossier.joining_date || "", payment_days: mockDossier.payment_days ? mockDossier.payment_days.replace(' Days', '') : "",
      });

      // Revenue form should start completely blank for the Revenue user to fill
      setRevenueForm({
          base_invoice: "",
          total_amount: "",
          payment_due_date: "",
          payment_followup_date: ""
      });

      setLoading(false);
    };
    fetchData();
  }, [params.id]);

  // --- HANDLERS ---
  const handleOpenModal = (type) => {
      setModalType(type);
      const today = new Date().toISOString().split('T')[0];
      if (type === 'candidate') setCandForm({ followup_date: today, next_followup_date: "", conversation: "", candidate_status: "Working" });
      if (type === 'client') setClientForm({ followup_date: today, next_followup_date: "", conversation: "" });
      if (type === 'payment') setPayForm({ date: today, amount_received: "", payment_status: "Pending", remark: "" });
      setIsModalOpen(true);
  };

  const handleBaseInvoiceChange = (val) => {
      const baseNum = parseInt(val) || 0;
      const gstNum = baseNum * 0.18;
      const totalNum = baseNum + gstNum;
      setRevenueForm(prev => ({ 
          ...prev, 
          base_invoice: val, 
          total_amount: totalNum > 0 ? totalNum.toString() : "" 
      }));
  };

  const handleSaveCRMDetails = () => {
      // Toggle edit mode off
      setIsEditingCRMData(false);
      alert("CRM Details Updated Successfully!");
      // Logic to save to backend would go here
  };

  const handleSaveRevenueDetails = () => {
      alert("Revenue Financials Saved Successfully!");
  };

  const handleSaveLog = () => {
      const updatedData = { ...data };
      const userName = "Current User";
      if (modalType === 'candidate') {
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

  const handleOpenPIModal = () => {
      setPiForm(prev => ({
          ...prev,
          bill_to: mainForm.client_name,
          pi_date: revenueForm.pi_date || new Date().toISOString().split('T')[0], // Bahar wali date pick karega
          description: `Recruitment Services for ${mainForm.position} (${mainForm.candidate_name})`
      }));
      setIsPiModalOpen(true);
  };

  const handleGeneratePI = () => {
      setPiData({
          ...piForm,
          base_amount: revenueForm.base_invoice,
          total_amount: revenueForm.total_amount
      });
      setIsPiModalOpen(false);
      alert("Proforma Invoice Generated!");
  };

  const handlePrintPI = async () => {
    try {
      const [{ jsPDF }] = await Promise.all([import('jspdf')]);
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(16, 60, 127);
      doc.text("PROFORMA INVOICE", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Recruitment Services", 105, 28, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Date: ${piData.pi_date}`, 150, 40);
      doc.text(`Invoice No: ${piData.invoice_no}`, 150, 48);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Bill To:", 20, 60);
      doc.setTextColor(0);
      doc.text(piData.bill_to || "", 20, 68);
      
      doc.setTextColor(100);
      doc.text("Description", 20, 85);
      doc.text("HSN/SAC", 130, 85);
      doc.text("Amount", 170, 85);
      
      doc.setDrawColor(200);
      doc.line(20, 90, 190, 90);
      
      doc.setTextColor(0);
      doc.text(piData.description || "", 20, 100);
      doc.text(piData.hsn_code || "", 130, 100);
      doc.text(`₹ ${piData.base_amount || 0}`, 170, 100);
      
      doc.line(20, 110, 190, 110);
      
      doc.text("Subtotal:", 140, 120);
      doc.text(`₹ ${piData.base_amount || 0}`, 170, 120);
      
      doc.text("IGST (18%):", 140, 128);
      const baseAmount = parseInt(piData.base_amount?.replace(/,/g,'') || 0);
      doc.text(`₹ ${(baseAmount * 0.18).toLocaleString('en-IN')}`, 170, 128);
      
      doc.setFontSize(12);
      doc.setTextColor(16, 60, 127);
      doc.text("Total:", 140, 140);
      doc.text(`₹ ${piData.total_amount || 0}`, 170, 140);
      
      doc.save(`PI-${piData.invoice_no}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    }
  };
  // Calculate total received from history logs
const totalReceived = data?.payment_history?.reduce((acc, curr) => 
    acc + (parseInt(curr.amount_received) || 0), 0) || 0;

const totalExpected = parseInt(revenueForm.total_amount) || 0;
const remainingBalance = totalExpected - totalReceived;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-[#103c7f]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#103c7f] rounded-full animate-spin mb-4"></div>
      </div>
    );
  }
  
  if (!data) return <div className="p-6 text-center text-red-500 font-bold">Error: Record not found.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-4 md:p-6 pb-20 relative hide-on-print">
      
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
          </div>
      </div>
      
      {/* --- SECTION 1: CRM PROVIDED DATA (TOGGLEABLE CARDS) --- */}
      <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 mt-2 gap-4">
              <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
                  <FileText size={20} className="text-blue-500" /> CRM Submitted Details
              </h2>
              
              {/* EDIT / SAVE TOGGLE BUTTON */}
              {isEditingCRMData ? (
                  <button 
                      onClick={handleSaveCRMDetails} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-md shrink-0 animate-pulse"
                  >
                      <Save size={14}/> Save Updates
                  </button>
              ) : (
                  <button 
                      onClick={() => setIsEditingCRMData(true)} 
                      className="bg-white border-2 border-[#103c7f] text-[#103c7f] hover:bg-[#103c7f] hover:text-white px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm shrink-0"
                  >
                      <Edit size={14}/> Edit CRM Details
                  </button>
              )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* CARD 1: TEAM & SOURCE */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-blue-300 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Team & Source</h4>
                  </div>
                  <div className="space-y-3 flex-1">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Entry Date</label>
                          {isEditingCRMData ? <input type="date" value={mainForm.entry_date} onChange={e => setMainForm({...mainForm, entry_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.entry_date || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">CRM Name</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.crm_name} onChange={e => setMainForm({...mainForm, crm_name: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.crm_name || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">TL Name</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.tl_name} onChange={e => setMainForm({...mainForm, tl_name: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.tl_name || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">RC Name</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.entered_by_rc} onChange={e => setMainForm({...mainForm, entered_by_rc: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.entered_by_rc || "N/A"}</p>}
                      </div>
                  </div>
              </div>

              {/* CARD 2: ENTITY DETAILS */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-purple-300 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Briefcase size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Entity Details</h4>
                  </div>
                  <div className="space-y-3 flex-1">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Payment From</label>
                          {isEditingCRMData ? 
                              <select value={mainForm.payment_from} onChange={e => setMainForm({...mainForm, payment_from: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-purple-500 bg-white">
                                  <option value="">Select</option>
                                  <option value="Client">Client</option>
                                  <option value="Candidate">Candidate</option>
                              </select> 
                          : <p className="text-sm font-bold text-gray-800">{mainForm.payment_from || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Client Name</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.client_name} onChange={e => setMainForm({...mainForm, client_name: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-purple-500 bg-white"/> : <p className="text-sm font-bold text-[#103c7f]">{mainForm.client_name || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Candidate Name</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.candidate_name} onChange={e => setMainForm({...mainForm, candidate_name: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-purple-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.candidate_name || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Profile / Position</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.position} onChange={e => setMainForm({...mainForm, position: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-purple-500 bg-white"/> : <p className="text-sm font-bold text-gray-600">{mainForm.position || "N/A"}</p>}
                      </div>
                  </div>
              </div>

              {/* CARD 3: CONTACT INFO */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-orange-300 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><PhoneCall size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Contact Info</h4>
                  </div>
                  <div className="space-y-3 flex-1">
                      <div>
                          <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 block">Client Email</label>
                          {isEditingCRMData ? <input type="email" value={mainForm.client_email} onChange={e => setMainForm({...mainForm, client_email: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-orange-500 bg-white"/> : <p className="text-sm font-bold text-gray-800 break-all">{mainForm.client_email || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 block">Client Phone</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.client_phone} onChange={e => setMainForm({...mainForm, client_phone: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-orange-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.client_phone || "N/A"}</p>}
                      </div>
                      <div className="pt-1 border-t border-gray-100">
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 mt-1 block">Candidate Email</label>
                          {isEditingCRMData ? <input type="email" value={mainForm.candidate_email} onChange={e => setMainForm({...mainForm, candidate_email: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white"/> : <p className="text-sm font-bold text-gray-800 break-all">{mainForm.candidate_email || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Candidate Phone</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.candidate_phone} onChange={e => setMainForm({...mainForm, candidate_phone: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.candidate_phone || "N/A"}</p>}
                      </div>
                  </div>
              </div>

              {/* CARD 4: COMMERCIALS & DATES (CRM Part) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col hover:border-emerald-300 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Clock size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Onboarding Specs</h4>
                  </div>
                  <div className="space-y-3 flex-1">
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Offer Salary</label>
                              {isEditingCRMData ? <input type="number" value={mainForm.offer_salary} onChange={e => setMainForm({...mainForm, offer_salary: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 bg-white"/> : <p className="text-sm font-bold text-emerald-700 font-mono">₹ {mainForm.offer_salary || "0"}</p>}
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Terms (%)</label>
                              {isEditingCRMData ? <input type="text" value={mainForm.payment_terms} onChange={e => setMainForm({...mainForm, payment_terms: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.payment_terms ? `${mainForm.payment_terms}%` : "0%"}</p>}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Joining Date</label>
                              {isEditingCRMData ? <input type="date" value={mainForm.joining_date} onChange={e => setMainForm({...mainForm, joining_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.joining_date || "N/A"}</p>}
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Payment Days</label>
                              {isEditingCRMData ? <input type="number" value={mainForm.payment_days} onChange={e => setMainForm({...mainForm, payment_days: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.payment_days ? `${mainForm.payment_days} Days` : "N/A"}</p>}
                          </div>
                      </div>
                      <div className="pt-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">KYC Documents</label>
                          <button onClick={() => alert("View KYC Docs Logic")} className="bg-blue-50 hover:bg-blue-100 text-[#103c7f] border border-blue-200 w-full py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                              <Eye size={12} /> View Uploaded Docs
                          </button>
                      </div>
                  </div>
              </div>

          </div>
      </div>

      {/* --- NEW SECTION: REVENUE & INVOICING DESK --- */}
      <div className="mb-10 bg-indigo-50/50 rounded-2xl border border-indigo-200 p-5 shadow-sm">
      {/* --- PAYMENT BALANCE TRACKER --- */}
<div className="flex flex-wrap gap-4 mb-6 bg-white/50 p-4 rounded-xl border border-indigo-100 shadow-inner">
    <div className="flex-1 min-w-[120px]">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Invoice Value</p>
        <p className="text-sm font-black text-gray-800 italic">₹ {totalExpected.toLocaleString('en-IN')}</p>
    </div>
    <div className="flex-1 min-w-[120px]">
        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Received</p>
        <p className="text-sm font-black text-emerald-600">₹ {totalReceived.toLocaleString('en-IN')}</p>
    </div>
    <div className="flex-1 min-w-[120px] bg-red-50 p-2 rounded-lg border border-red-100">
        <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Remaining Balance</p>
        <p className="text-base font-black text-red-600 animate-pulse">₹ {remainingBalance.toLocaleString('en-IN')}</p>
    </div>
</div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
              <div>
                  <h2 className="text-lg font-black text-indigo-900 uppercase tracking-tight flex items-center gap-2">
                      <IndianRupee size={20} className="text-indigo-600" /> Revenue & Invoicing Desk
                  </h2>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Managed by Finance/Revenue Team</p>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={handleSaveRevenueDetails} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm">
                      <Save size={14}/> Save Invoicing Info
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Base Invoice (₹)</label>
                  <input type="number" value={revenueForm.base_invoice} onChange={e => handleBaseInvoiceChange(e.target.value)} placeholder="0.00" className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-black text-[#103c7f] outline-none focus:border-indigo-500 bg-white shadow-sm"/>
              </div>
              <div>
                  <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Total with 18% GST (₹)</label>
                  <input type="number" value={revenueForm.total_amount} readOnly placeholder="0.00" className="w-full border border-emerald-200 p-2.5 rounded-lg text-sm font-black text-emerald-700 outline-none bg-emerald-50 cursor-not-allowed shadow-sm"/>
              </div>
              <div>
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Payment Due Date</label>
                  <input type="date" value={revenueForm.payment_due_date} onChange={e => setRevenueForm({...revenueForm, payment_due_date: e.target.value})} className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white shadow-sm"/>
              </div>
              <div>
                  <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Payment Follow-up</label>
                  <input type="date" value={revenueForm.payment_followup_date} onChange={e => setRevenueForm({...revenueForm, payment_followup_date: e.target.value})} className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white shadow-sm"/>
              </div>
              {/* PI Date - Ab ye editable hai */}
              <div className="flex items-center gap-2">
                  <div className="flex-1">
                      <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">PI Date</label>
                      <input 
                        type="date" 
                        value={revenueForm.pi_date} 
                        onChange={e => setRevenueForm({...revenueForm, pi_date: e.target.value})} 
                        className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white shadow-sm"
                      />
                  </div>
              </div>
          </div>

          {/* PI Action Row */}
          <div className="mt-5 pt-4 border-t border-indigo-100 flex flex-wrap gap-3">
              {!piData ? (
                  <button onClick={handleOpenPIModal} className="bg-white border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-600 hover:text-white px-5 py-2.5 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm">
                      <FileCheck size={14} /> Create Proforma Invoice (PI)
                  </button>
              ) : (
                  <>
                      <button onClick={() => setIsPiModalOpen(true)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm">
                          <Edit size={14} /> Edit PI
                      </button>
                     <button 
      onClick={() => setIsViewPiModalOpen(true)} 
      className="bg-indigo-100 border border-indigo-200 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm"
  >
      <Eye size={14} /> View Generated PI
  </button>
                  </>
              )}
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

    {/* --- PI CREATION MODAL --- */}
      {isPiModalOpen && (
          <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 hide-on-print">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 bg-indigo-600 flex justify-between items-center text-white">
                      <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                          <FileCheck size={16}/> {piData ? "Edit Proforma Invoice" : "Generate Proforma Invoice"}
                      </h3>
                      <button onClick={() => setIsPiModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Invoice No.</label>
                              <input type="text" value={piForm.invoice_no} onChange={e => setPiForm({...piForm, invoice_no: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-gray-50"/>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">PI Date</label>
                              <input type="date" value={piForm.pi_date} onChange={e => setPiForm({...piForm, pi_date: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm font-bold outline-none focus:border-indigo-500 bg-gray-50"/>
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Bill To (Client Name/Address)</label>
                          <textarea rows="2" value={piForm.bill_to} onChange={e => setPiForm({...piForm, bill_to: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 bg-gray-50 resize-none"></textarea>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Item Description</label>
                          <textarea rows="2" value={piForm.description} onChange={e => setPiForm({...piForm, description: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm outline-none focus:border-indigo-500 bg-gray-50 resize-none"></textarea>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Amount</p>
                              <p className="text-sm font-bold text-gray-800">₹ {revenueForm.base_invoice || "0"}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total (18% GST)</p>
                              <p className="text-lg font-black text-emerald-700">₹ {revenueForm.total_amount || "0"}</p>
                          </div>
                      </div>
                      <button onClick={handleGeneratePI} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-md mt-4">
                          Generate & Save PI
                      </button>
                  </div>
              </div>
          </div>
      )}

     {/* --- GENERATED PI PREVIEW MODAL --- */}
      {isViewPiModalOpen && piData && (
          <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4 hide-on-print">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                  
                  {/* Modal Toolbar / Header */}
                  <div className="bg-gray-100 p-3 border-b border-gray-200 flex justify-between items-center shrink-0 hide-on-print">
                      <h3 className="font-bold text-gray-700 uppercase tracking-widest text-xs flex items-center gap-2">
                          <FileCheck size={14} className="text-emerald-600"/> Document Preview
                      </h3>
                      <div className="flex items-center gap-3">
                          <button onClick={handlePrintPI} className="bg-[#103c7f] text-white px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-blue-800 transition">
                              <Download size={14}/> Download PDF
                          </button>
                          <button onClick={() => setIsViewPiModalOpen(false)} className="text-gray-500 hover:text-red-500 p-1 rounded-full transition-colors bg-white border border-gray-200 shadow-sm">
                              <X size={16}/>
                          </button>
                      </div>
                  </div>
                  
                  {/* Actual Invoice Body (Scrollable inside modal) */}
                  <div className="p-10 bg-white text-gray-800 overflow-y-auto custom-scrollbar printable-area flex-1">
                      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                          <div>
                              <h1 className="text-4xl font-black text-[#103c7f] tracking-tighter mb-1">PROFORMA INVOICE</h1>
                              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Recruitment Services</p>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-bold"><span className="text-gray-500 mr-2">Date:</span> {piData.pi_date}</p>
                              <p className="text-sm font-bold mt-1"><span className="text-gray-500 mr-2">Invoice No:</span> {piData.invoice_no}</p>
                          </div>
                      </div>
                      
                      <div className="mb-8">
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bill To:</p>
                          <p className="text-sm font-bold whitespace-pre-line">{piData.bill_to}</p>
                      </div>

                      <table className="w-full text-left border-collapse mb-8">
                          <thead className="bg-gray-100 border-y border-gray-300">
                              <tr>
                                  <th className="p-3 text-xs font-black text-gray-600 uppercase tracking-widest">Description</th>
                                  <th className="p-3 text-xs font-black text-gray-600 uppercase tracking-widest text-center">HSN/SAC</th>
                                  <th className="p-3 text-xs font-black text-gray-600 uppercase tracking-widest text-right">Amount (₹)</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr className="border-b border-gray-200">
                                  <td className="p-4 text-sm font-medium whitespace-pre-line">{piData.description}</td>
                                  <td className="p-4 text-sm text-center">{piData.hsn_code}</td>
                                  <td className="p-4 text-sm font-bold text-right">{piData.base_amount}</td>
                              </tr>
                          </tbody>
                      </table>

                      <div className="flex justify-end">
                          <div className="w-64 space-y-3">
                              <div className="flex justify-between text-sm">
                                  <span className="font-bold text-gray-500">Subtotal:</span>
                                  <span className="font-bold">₹ {piData.base_amount}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="font-bold text-gray-500">IGST (18%):</span>
                                  <span className="font-bold">₹ {(parseInt(piData.base_amount.replace(/,/g,'')) * 0.18).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-lg font-black border-t-2 border-gray-800 pt-2 mt-2">
                                  <span>Total:</span>
                                  <span>₹ {piData.total_amount}</span>
                              </div>
                          </div>
                      </div>

                      <div className="mt-16 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
                          <p>This is a computer generated proforma invoice and does not require a physical signature.</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

    {/* Print CSS helper injected safely */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
            /* 1. Hide everything by default */
            body * { 
                visibility: hidden; 
            }
            
            /* 2. Hide specific UI elements */
            .hide-on-print { 
                display: none !important; 
            }

            /* 3. Make only the printable area visible */
            .printable-area, .printable-area * { 
                visibility: visible; 
            }

            /* 4. Position the printable area at the absolute top-left of the paper */
            .printable-area { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                margin: 0; 
                padding: 0; 
                box-shadow: none; 
                border: none;
            }

            /* 5. Force background colors to print (Required for headers/tables) */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Optional: Remove margins from the page to fit better */
            @page {
                margin: 1cm;
            }
        }
      `}} />



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
                        <button onClick={handleSaveLog} className={`w-full py-2.5 rounded-lg font-black uppercase tracking-widest text-white shadow-sm flex items-center justify-center gap-2 text-xs transition-colors ${
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