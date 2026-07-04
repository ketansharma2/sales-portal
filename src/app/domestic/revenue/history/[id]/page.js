"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, User, Building2, Briefcase, Calendar, 
  IndianRupee, Phone, Mail, Clock, FileText, CreditCard, 
  Eye, Plus, X, Save, Edit, Users, PhoneCall, CheckCircle, AlertCircle,
  FileCheck, Download, Printer, ExternalLink, Award
} from "lucide-react";

import { useParams, useRouter } from 'next/navigation';
import * as API from '@/lib/api-client';
export default function DomesticCandidateHistoryPage() {
  const params = useParams();
  const router = useRouter();
  
   // 1. Basic States
   const [loading, setLoading] = useState(true);
   const [data, setData] = useState({ candidate_history: [], client_history: [], payment_history: [], retention_history: [] });

    // 2. UI & Modal States
    const [isEditingCRMData, setIsEditingCRMData] = useState(false);
    const [isEditingRevenue, setIsEditingRevenue] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalType, setModalType] = useState(""); 
    const [kycFiles, setKycFiles] = useState([]);
   const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  
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

  // 4. Form States
  const [mainForm, setMainForm] = useState({ 
      entry_date: "", crm_name: "", tl_name: "", entered_by_rc: "",
      payment_from: "", client_name: "", candidate_name: "", position: "",
      client_email: "", client_mobile: "", candidate_email: "", candidate_mobile: "", 
      offer_salary: "", payment_terms: "", joining_date: "", payment_days: "",
      retention_month: "", retention_amount: "",retention_amount_crm: ""
  });
  
   const [revenueForm, setRevenueForm] = useState({
       base_invoice: "",
       total_with_gst: "",
       payment_due_date: "",
       payment_follow_up: "" ,
       retention_with_gst: "",
       pi_date: "",
       retention_amount: "",
       retention_target_date: "",
       retention_status: "In Progress"
   });

   const [candForm, setCandForm] = useState({ followup_date: "", next_followup_date: "", conversation: "", candidate_status: "Working" });
   const [clientForm, setClientForm] = useState({ followup_date: "", next_followup_date: "", conversation: "" });
   const [payForm, setPayForm] = useState({ date: "", amount_received: "", payment_status: "Pending", remark: "" });
   const [retForm, setRetForm] = useState({ date: "", next_followup_date: "", retention_status: "In Progress", remark: "" });
   
   const [isSavingCandidate, setIsSavingCandidate] = useState(false);
   const [isSavingClient, setIsSavingClient] = useState(false);
   const [isSavingPayment, setIsSavingPayment] = useState(false);
   const [isSavingRetention, setIsSavingRetention] = useState(false);

     // --- REAL DATA FETCHING (Exact same pattern as corporate) ---
     const fetchData = async () => {
       if (!params?.id) return;
       setLoading(true);

       try {
         const session = JSON.parse(localStorage.getItem('session') || '{}');
         const token = session.access_token;

         // Fetch revenue record by ID (using history route with query param, same as corporate)
         const response = await API.apiGet(`/api/domestic/revenue/history?revenue_id=${params.id}`);


         const result = await response.json();

         if (response.ok && result.success && result.data) {
           const record = result.data;

           // Set main form data
           setMainForm({
               entry_date: record.sent_date || '',
               crm_name: record.crm_name || '',
               tl_name: record.tl_name || '',
               entered_by_rc: record.rc_name || '',
               payment_from: record.payment_from || '',
               client_name: record.client_name || '',
               candidate_name: record.candidate_name || '',
               position: record.profile || '',
               client_email: record.client_email || '',
               client_mobile: record.client_mobile || '',
               candidate_email: record.candidate_email || '',
               candidate_mobile: record.candidate_mobile || '',
               offer_salary: record.offer_salary ? String(record.offer_salary).replace(/,/g, '') : '',
               payment_terms: record.terms ? String(record.terms).replace('%', '') : '',
               joining_date: record.joining_date || '',
               payment_days: record.payment_days ? String(record.payment_days) : '',
               retention_month: record.retention_month ? String(record.retention_month) : '',
               retention_amount: record.retention_amount ? String(record.retention_amount) : '',
                retention_amount_crm: record.retention_amount_crm ? String(record.retention_amount_crm) : ''
           });

           // Set revenue form
           setRevenueForm({
               base_invoice: record.base_invoice || '',
               total_with_gst: record.total_with_gst || '',
               retention_with_gst: record.retention_with_gst || '',
               payment_due_date: record.payment_due_date || '',
               payment_follow_up: record.payment_follow_up || '',
               pi_date: record.pi_date || '',
               retention_amount: record.retention_amount || '',
               retention_target_date: record.retention_target_date || '',
               retention_status: record.retention_status || 'In Progress'
           });

           // Set basic data
           const uiData = {
               ...record,
               position: record.profile,
               rc_name: record.rc_name || '',
               tl_name: record.tl_name || '',
               candidate_status: record.candidate_status || 'Working',
               kyc_doc: record.kyc_doc || [],
               candidate_history: [],
               client_history: [],
               payment_history: [],
               retention_history: []
           };

           setData(uiData);

           // Fetch all track histories in parallel (exact same as corporate + retention)
           try {
             const session2 = JSON.parse(localStorage.getItem('session') || '{}');
             const token2 = session2.access_token;

             const [candidateRes, clientRes, paymentRes, retentionRes] = await Promise.all([
    API.apiGet(`/api/domestic/revenue/candidate-track?revenue_id=${params.id}`),
    API.apiGet(`/api/domestic/revenue/client-track?revenue_id=${params.id}`),
    API.apiGet(`/api/domestic/revenue/payment-track?revenue_id=${params.id}`),
    API.apiGet(`/api/domestic/revenue/retention-track?revenue_id=${params.id}`)
]);

             const [candidateResult, clientResult, paymentResult, retentionResult] = await Promise.all([
               candidateRes.ok ? candidateRes.json() : Promise.resolve({ success: false, data: [] }),
               clientRes.ok ? clientRes.json() : Promise.resolve({ success: false, data: [] }),
               paymentRes.ok ? paymentRes.json() : Promise.resolve({ success: false, data: [] }),
               retentionRes.ok ? retentionRes.json() : Promise.resolve({ success: false, data: [] })
             ]);

             setData(prev => ({
               ...prev,
               candidate_history: candidateResult.success ? candidateResult.data.map(t => ({
                 id: t.track_id || t.id,
                 followup_date: t.date,
                 next_followup_date: t.next_follow_up || '',
                 conversation: t.remarks || '',
                 candidate_status: t.candidate_status || '',
                 loggedBy: t.loggedBy || 'Unknown',
                 created_at: t.created_at
               })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [],
               client_history: clientResult.success ? clientResult.data.map(t => ({
                 id: t.track_id || t.id,
                 followup_date: t.date,
                 next_followup_date: t.next_follow_up || '',
                 conversation: t.remarks || '',
                 loggedBy: t.loggedBy || 'Unknown',
                 created_at: t.created_at
               })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [],
               payment_history: paymentResult.success ? paymentResult.data.map(t => ({
                 id: t.track_id || t.id,
                 date: t.date,
                 amount_received: t.amount_received || 0,
                 payment_status: t.payment_status || '',
                 remark: t.remarks || '',
                 loggedBy: t.loggedBy || 'Unknown',
                 created_at: t.created_at
               })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [],
               retention_history: retentionResult.success ? retentionResult.data.map(t => ({
                 id: t.revenue_id || t.id,
                 date: t.date,
                 next_followup_date: t.next_follow_up || '',
                 retention_status: t.retention_status || '',
                 remark: t.remarks || '',
                 loggedBy: t.loggedBy || 'Unknown',
                 created_at: t.created_at
               })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []
             }));

           } catch (trackErr) {
             console.error('Failed to fetch track histories:', trackErr);
           }

         }
       } catch (error) {
         console.error('Error fetching domestic revenue detail:', error);
         setData({ candidate_history: [], client_history: [], payment_history: [], retention_history: [] });
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       if (!params?.id) return;
       fetchData();
     }, [params.id]);

  // --- HANDLERS ---
  const handleOpenModal = (type) => {
      setModalType(type);
      const today = new Date().toISOString().split('T')[0];
      if (type === 'candidate') setCandForm({ followup_date: today, next_followup_date: "", conversation: "", candidate_status: "Working" });
      if (type === 'client') setClientForm({ followup_date: today, next_followup_date: "", conversation: "" });
      if (type === 'payment') setPayForm({ date: today, amount_received: "", payment_status: "Pending", remark: "" });
      if (type === 'retention') setRetForm({ date: today, next_followup_date: "", retention_status: "In Progress", remark: "" }); 
      setIsModalOpen(true);
  };

   const handleBaseInvoiceChange = (val) => {
       const baseNum = parseInt(val) || 0;
       const gstNum = Math.round(baseNum * 0.18);
       const totalNum = baseNum + gstNum;
       setRevenueForm(prev => ({ 
           ...prev, 
           base_invoice: val, 
           total_with_gst: totalNum > 0 ? totalNum.toString() : "" 
       }));
   };
   
   const handleRetentionAmountChange = (val) => {
       const baseNum = parseInt(val) || 0;
       const gstNum = Math.round(baseNum * 0.18);
       const totalNum = baseNum + gstNum;
       setRevenueForm(prev => ({ 
           ...prev, 
           retention_amount: val, 
           retention_with_gst: totalNum > 0 ? totalNum.toString() : "" 
       }));
   };

   // DUMMY SAVE - CRM
    const handleSaveCRMDetails = async () => {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;

        try {
            const res = await API.apiPut(`/api/domestic/revenue/history`, {
    revenue_id: params.id,
    ...mainForm
});

            const result = await res.json();

            if (res.ok && result.success) {
                setIsEditingCRMData(false);
                await fetchData(); // refresh
            } else {
                alert('Failed to update CRM details: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error updating CRM details');
        }
    };

    const handleSaveRevenueDetails = async () => {
        

        try {
            const res = await API.apiPut(`/api/domestic/revenue/history`, {
    revenue_id: params.id,
    ...revenueForm
});

            const result = await res.json();

            if (res.ok && result.success) {
                setIsEditingRevenue(false);
                await fetchData(); // refresh
            } else {
                alert('Failed to update revenue details: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error updating revenue details');
        }
    };

   // DUMMY SAVE - LOGS
    const handleSaveLog = async () => {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const token = session.access_token;
        const revenue_id = params.id;

        let endpoint = '';
        let body = { revenue_id };

        if (modalType === 'candidate') {
            setIsSavingCandidate(true);
            endpoint = '/api/domestic/revenue/candidate-track';
            body = {
                ...body,
                date: candForm.followup_date,
                next_follow_up: candForm.next_followup_date,
                candidate_status: candForm.candidate_status,
                remarks: candForm.conversation
            };
        } else if (modalType === 'client') {
            setIsSavingClient(true);
            endpoint = '/api/domestic/revenue/client-track';
            body = {
                ...body,
                date: clientForm.followup_date,
                next_follow_up: clientForm.next_followup_date,
                remarks: clientForm.conversation
            };
        } else if (modalType === 'payment') {
            setIsSavingPayment(true);
            endpoint = '/api/domestic/revenue/payment-track';
            body = {
                ...body,
                date: payForm.date,
                amount_received: payForm.amount_received,
                payment_status: payForm.payment_status,
                remarks: payForm.remark
            };
        } else if (modalType === 'retention') {
            setIsSavingRetention(true);
            endpoint = '/api/domestic/revenue/retention-track';
            body = {
                ...body,
                date: retForm.date,
                next_followup_date: retForm.next_followup_date,
                retention_status: retForm.retention_status,
                remark: retForm.remark
            };
        }

        try {
           let res;
if (modalType === 'candidate') {
    res = await API.apiPost(endpoint, body);
} else if (modalType === 'client') {
    res = await API.apiPost(endpoint, body);
} else if (modalType === 'payment') {
    res = await API.apiPost(endpoint, body);
} else if (modalType === 'retention') {
    res = await API.apiPost(endpoint, body);
}

            const result = await res.json();

            if (res.ok && result.success) {
                setIsModalOpen(false);
                // Refresh all data (exact same as corporate pattern)
                await fetchData();
            } else {
                alert(`Failed to save ${modalType} log: ${result.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Save log error:', err);
            alert(`Error saving ${modalType} log`);
        } finally {
            setIsSavingCandidate(false);
            setIsSavingClient(false);
            setIsSavingPayment(false);
            setIsSavingRetention(false);
        }
    };

  // Calculate total received from history logs
  const totalReceived = data?.payment_history?.reduce((acc, curr) => acc + (parseInt(curr.amount_received) || 0), 0) || 0;
  const totalExpected = parseInt(revenueForm.total_with_gst) || 0;
  const remainingBalance = totalExpected - totalReceived;

   if (loading) {
     return (
       <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-[#103c7f]">
         <div className="w-12 h-12 border-4 border-blue-200 border-t-[#103c7f] rounded-full animate-spin mb-4"></div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-2 pb-20 relative hide-on-print">
      
       {/* --- TOP NAVIGATION --- */}
       <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#103c7f] transition-colors font-bold text-sm mb-2 w-fit">
         <ArrowLeft size={16} /> Back to Directory
       </button>

      {/* --- HEADER: PROFILE CARD (COMPACT) --- */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 mb-2 relative overflow-hidden">
           <div className="absolute -right-20 -top-20 w-48 h-48 bg-blue-50 rounded-full opacity-50 pointer-events-none"></div>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                       <User size={20} />
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
       <div className="mb-2">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 mt-2 gap-4">
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
          
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              
                {/* CARD 1: TEAM & SOURCE (Always Read-Only) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col hover:border-blue-300 transition-colors group opacity-75">
                    <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={16} /></div>
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Team & Source</h4>
                        <span className="ml-auto text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">View Only</span>
                    </div>
                    <div className="space-y-3 flex-1">
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Entry Date</label>
                            <p className="text-sm font-bold text-gray-800">{mainForm.entry_date || "N/A"}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">CRM Name</label>
                            <p className="text-sm font-bold text-gray-800">{mainForm.crm_name || "N/A"}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">TL Name</label>
                            <p className="text-sm font-bold text-gray-800">{mainForm.tl_name || "N/A"}</p>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">RC Name</label>
                            <p className="text-sm font-bold text-gray-800">{mainForm.entered_by_rc || "N/A"}</p>
                        </div>
                    </div>
                </div>

              {/* CARD 2: ENTITY DETAILS */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col hover:border-purple-300 transition-colors group">
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col hover:border-orange-300 transition-colors group">
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
                          {isEditingCRMData ? <input type="text" value={mainForm.client_mobile} onChange={e => setMainForm({...mainForm, client_mobile: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-orange-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.client_mobile || "N/A"}</p>}
                      </div>
                      <div className="pt-1 border-t border-gray-100">
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 mt-1 block">Candidate Email</label>
                          {isEditingCRMData ? <input type="email" value={mainForm.candidate_email} onChange={e => setMainForm({...mainForm, candidate_email: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white"/> : <p className="text-sm font-bold text-gray-800 break-all">{mainForm.candidate_email || "N/A"}</p>}
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Candidate Phone</label>
                          {isEditingCRMData ? <input type="text" value={mainForm.candidate_mobile} onChange={e => setMainForm({...mainForm, candidate_mobile: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.candidate_mobile || "N/A"}</p>}
                      </div>
                  </div>
              </div>

            {/* CARD 4: COMMERCIALS & DATES (CRM Part) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col hover:border-emerald-300 transition-colors group">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-gray-100 pb-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Clock size={16} /></div>
                      <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Joining Specs</h4>
                  </div>
                  <div className="space-y-3 flex-1">
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Annual Salary</label>
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
                              {isEditingCRMData ? (
                                  <input 
                                      type="date" 
                                      value={mainForm.joining_date}
                                      onChange={(e) => setMainForm({...mainForm, joining_date: e.target.value})}
                                      className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 bg-white"
                                  />
                              ) : (
                                  <p className="text-sm font-bold text-gray-800">{mainForm.joining_date || "N/A"}</p>
                              )}
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Payment Days</label>
                              {isEditingCRMData ? <input type="number" value={mainForm.payment_days} onChange={e => setMainForm({...mainForm, payment_days: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 bg-white"/> : <p className="text-sm font-bold text-gray-800">{mainForm.payment_days ? `${mainForm.payment_days} Days` : "N/A"}</p>}
                          </div>
                      </div>

                      {/* --- NEW: RETENTION FIELDS --- */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 mt-1">
                          <div>
                              <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 block">Retention Month</label>
                              {isEditingCRMData ? (
                                  <input type="number" placeholder="e.g. 3" value={mainForm.retention_month} onChange={e => setMainForm({...mainForm, retention_month: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-blue-500 bg-white"/>
                              ) : (
                                  <p className="text-sm font-bold text-gray-800">{mainForm.retention_month ? `${mainForm.retention_month} Months` : "N/A"}</p>
                              )}
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 block">Retention Amt (₹)</label>
                              {isEditingCRMData ? (
                                  <input type="number" placeholder="0" value={mainForm.retention_amount} onChange={e => setMainForm({...mainForm, retention_amount: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs font-bold text-gray-700 outline-none focus:border-blue-500 bg-white"/>
                              ) : (
                                  <p className="text-sm font-bold text-blue-700 font-mono">₹ {mainForm.retention_amount_crm || "0"}</p>
                              )}
                          </div>
                      </div>

                      <div className="pt-2">
                           <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">KYC Documents</label>
                           <button onClick={() => {
                               const files = data.kyc_doc
                               if (files) {
                                 // Handle both string (single file) and array formats
                                 const filesArray = Array.isArray(files) ? files : (files ? [files] : [])
                                 if (filesArray.length > 0) {
                                   setKycFiles(filesArray)
                                   setIsKycModalOpen(true)
                                 } else {
                                   alert('No KYC documents uploaded')
                                 }
                               } else {
                                 alert('No KYC documents uploaded')
                               }
                             }} className="bg-blue-50 hover:bg-blue-100 text-[#103c7f] border border-blue-200 w-full py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                               <Eye size={12} /> View Uploaded Docs
                           </button>
                       </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- NEW SECTION: REVENUE & INVOICING DESK --- */}
      <div className="mb-3 bg-indigo-50/50 rounded-2xl border border-indigo-200 p-3 shadow-sm">
      {/* --- PAYMENT BALANCE TRACKER --- */}
      <div className="flex flex-wrap gap-4 mb-4 bg-white/50 p-2 rounded-xl border border-indigo-100 shadow-inner">
          <div className="flex-1 min-w-[120px]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Invoice Value</p>
              <p className="text-sm font-black text-gray-800 italic">₹ {totalExpected.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex-1 min-w-[120px]">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Base Received</p>
              <p className="text-sm font-black text-emerald-600">₹ {totalReceived.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex-1 min-w-[120px] bg-red-50 p-2 rounded-lg border border-red-100">
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Base Balance</p>
              <p className="text-base font-black text-red-600 animate-pulse">₹ {remainingBalance.toLocaleString('en-IN')}</p>
          </div>
      </div>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-4">
               <div>
                   <h2 className="text-lg font-black text-indigo-900 uppercase tracking-tight flex items-center gap-2">
                       <IndianRupee size={20} className="text-indigo-600" /> Revenue & Invoicing Desk
                   </h2>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Managed by Finance/Revenue Team</p>
               </div>
               <div className="flex items-center gap-2">
                   {isEditingRevenue ? (
                       <button 
                           onClick={handleSaveRevenueDetails} 
                           className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm shrink-0 animate-pulse"
                       >
                           <Save size={14}/> Save Invoicing Info
                       </button>
                   ) : (
                       <button 
                           onClick={() => setIsEditingRevenue(true)} 
                           className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2 shadow-sm shrink-0"
                       >
                           <Edit size={14}/> Edit Invoicing Details
                       </button>
                   )}
               </div>
           </div>

           {/* --- BASE PAYMENT SECTION --- */}
           <div className="mb-4 p-4 border border-indigo-100 rounded-xl bg-white">
             <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3 border-b border-indigo-50 pb-2">Base Payment Details</h4>
             <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                 <div>
                     <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Base Invoice (₹)</label>
                     {isEditingRevenue ? (
                         <input 
                             type="number" 
                             value={revenueForm.base_invoice} 
                             onChange={e => handleBaseInvoiceChange(e.target.value)} 
                             placeholder="0.00" 
                             className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-black text-[#103c7f] outline-none focus:border-indigo-500 bg-white shadow-sm"
                         />
                     ) : (
                         <p className="text-sm font-black text-gray-800 bg-white/50 px-2.5 py-2 rounded-lg border border-gray-200 shadow-sm">₹ {revenueForm.base_invoice || "0"}</p>
                     )}
                 </div>
                 <div>
                      <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Total with 18% GST (₹)</label>
                      {isEditingRevenue ? (
                          <input 
                              type="number" 
                              value={revenueForm.total_with_gst || ""} 
                              onChange={e => setRevenueForm({...revenueForm, total_with_gst: e.target.value})} 
                              placeholder="0.00" 
                              className="w-full border border-emerald-200 p-2.5 rounded-lg text-sm font-black text-emerald-700 outline-none focus:border-emerald-500 bg-white shadow-sm"
                          />
                      ) : (
                          <p className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-200 shadow-sm">₹ {revenueForm.total_with_gst || "0"}</p>
                      )}
                  </div>
                  <div>
                      <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Payment Due Date</label>
                      {isEditingRevenue ? (
                          <input 
                              type="date" 
                              value={revenueForm.payment_due_date} 
                              onChange={e => setRevenueForm({...revenueForm, payment_due_date: e.target.value})} 
                              className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white shadow-sm"
                          />
                      ) : (
                          <p className="text-sm font-bold text-gray-800 bg-white/50 px-2.5 py-2.5 rounded-lg border border-gray-200 shadow-sm">{revenueForm.payment_due_date || "N/A"}</p>
                      )}
                  </div>
                  <div>
                      <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Payment Follow-up</label>
                      {isEditingRevenue ? (
                          <input 
                              type="date" 
                              value={revenueForm.payment_follow_up || ""} 
                              onChange={e => setRevenueForm({...revenueForm, payment_follow_up: e.target.value})} 
                              className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white shadow-sm"
                          />
                      ) : (
                          <p className="text-sm font-bold text-gray-800 bg-white/50 px-2.5 py-2.5 rounded-lg border border-gray-200 shadow-sm">{revenueForm.payment_follow_up || "N/A"}</p>
                      )}
                  </div>
                  <div>
                      <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">PI Date</label>
                      {isEditingRevenue ? (
                          <input 
                              type="date" 
                              value={revenueForm.pi_date} 
                              onChange={e => setRevenueForm({...revenueForm, pi_date: e.target.value})} 
                              className="w-full border border-indigo-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-white shadow-sm"
                          />
                      ) : (
                          <p className="text-sm font-bold text-gray-800 bg-white/50 px-2.5 py-2.5 rounded-lg border border-gray-200 shadow-sm">{revenueForm.pi_date || "N/A"}</p>
                      )}
                  </div>
             </div>
           </div>

          {/* --- NEW: RETENTION PAYMENT SECTION --- */}
           <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/50 shadow-inner">
             <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-3 border-b border-blue-100 pb-2 flex items-center gap-2">
               <Award size={14}/> Retention Bonus Details
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                 
                 {/* Retention Amount */}
                 <div>
                     <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Retention Amount (₹)</label>
                     {isEditingRevenue ? (
                         <input 
                             type="number" 
                             value={revenueForm.retention_amount} 
                             onChange={e => handleRetentionAmountChange(e.target.value)} 
                             placeholder="0.00" 
                             className="w-full border border-blue-200 p-2.5 rounded-lg text-sm font-black text-[#103c7f] outline-none focus:border-blue-500 bg-white shadow-sm"
                         />
                     ) : (
                         <p className="text-sm font-black text-gray-800 bg-white/50 px-2.5 py-2 rounded-lg border border-gray-200 shadow-sm">₹ {revenueForm.retention_amount || "0"}</p>
                     )}
                 </div>

                 {/* NEW: Total with GST (Editable) */}
                 <div>
                     <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Total with 18% GST (₹)</label>
                     {isEditingRevenue ? (
                         <input 
                             type="number" 
                             value={revenueForm.retention_with_gst || ""} 
                             onChange={e => setRevenueForm({...revenueForm, retention_with_gst: e.target.value})} 
                             placeholder="0.00" 
                             className="w-full border border-emerald-200 p-2.5 rounded-lg text-sm font-black text-emerald-700 outline-none focus:border-emerald-500 bg-white shadow-sm"
                         />
                     ) : (
                         <p className="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-2 rounded-lg border border-emerald-200 shadow-sm">₹ {revenueForm.retention_with_gst || "0"}</p>
                     )}
                 </div>

                  {/* Target Date */}
                  <div>
                      <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Target Date</label>
                      {isEditingRevenue ? (
                          <input 
                              type="date" 
                              value={revenueForm.retention_target_date} 
                              onChange={e => setRevenueForm({...revenueForm, retention_target_date: e.target.value})} 
                              className="w-full border border-blue-200 p-2.5 rounded-lg text-sm font-bold text-gray-700 outline-none focus:border-blue-500 bg-white shadow-sm"
                          />
                      ) : (
                          <p className="text-sm font-bold text-gray-800 bg-white/50 px-2.5 py-2.5 rounded-lg border border-gray-200 shadow-sm">{revenueForm.retention_target_date || "N/A"}</p>
                      )}
                  </div>

                  {/* Retention Status */}
                  <div>
                      <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Retention Status</label>
                     
                          <span className={`inline-block px-3 py-2 rounded-lg text-sm font-black uppercase border shadow-sm w-full ${
                              revenueForm.retention_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                              revenueForm.retention_status === 'Invoice Sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              revenueForm.retention_status === 'Eligible' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                              revenueForm.retention_status === 'Missed' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-slate-50 text-slate-600 border-slate-200' 
                          }`}>
                              {revenueForm.retention_status || "In Progress"}
                          </span>
                     
                  </div>
             </div>
           </div>
      </div>
      
      {/* --- SECTION 2: THE FOUR TIMELINES --- */}
      <h2 className="text-lg font-black text-[#103c7f] uppercase tracking-tight mb-2">Lifecycle Action Center</h2>
      
     <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6">
         
         {/* 1. CANDIDATE HISTORY */}
         <div className="bg-emerald-50/30 rounded-2xl border border-emerald-200 shadow-sm overflow-hidden flex flex-col">
             <div className="bg-emerald-100 px-4 py-3 border-b border-emerald-200 flex justify-between items-center shrink-0">
                 <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2"><User size={16}/> Candidate Track</h3>
                 <button onClick={() => handleOpenModal('candidate')} className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
             </div>
             <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                  {data?.candidate_history?.map((log, idx) => (
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
                             {log.next_followup_date && (
                                 <p className="text-[9px] font-black text-emerald-600 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded">
                                     <Clock size={10}/> Next: {log.next_followup_date}
                                 </p>
                             )}
                         </div>
                     </div>
                  ))}
                    {(data?.candidate_history || []).length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No candidate logs.</p>}
             </div>
         </div>
 
         {/* 2. CLIENT HISTORY */}
         <div className="bg-indigo-50/30 rounded-2xl border border-indigo-200 shadow-sm overflow-hidden flex flex-col">
             <div className="bg-indigo-100 px-4 py-3 border-b border-indigo-200 flex justify-between items-center shrink-0">
                 <h3 className="text-sm font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2"><Building2 size={16}/> Client Track</h3>
                 <button onClick={() => handleOpenModal('client')} className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
             </div>
             <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                 {data?.client_history?.map((log, idx) => (
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
                             {log.next_followup_date && (
                                 <p className="text-[9px] font-black text-indigo-600 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded">
                                     <Clock size={10}/> Next: {log.next_followup_date}
                                 </p>
                             )}
                         </div>
                     </div>
                 ))}
                   {(data?.client_history || []).length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No client logs.</p>}
             </div>
         </div>
 
         {/* 3. BASE PAYMENT HISTORY */}
         <div className="bg-orange-50/30 rounded-2xl border border-orange-200 shadow-sm overflow-hidden flex flex-col">
             <div className="bg-orange-100 px-4 py-3 border-b border-orange-200 flex justify-between items-center shrink-0">
                 <h3 className="text-sm font-black text-orange-800 uppercase tracking-widest flex items-center gap-2"><CreditCard size={16}/> Payment Track</h3>
                 <button onClick={() => handleOpenModal('payment')} className="bg-orange-600 hover:bg-orange-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
             </div>
             <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                 {data?.payment_history?.map((log, idx) => (
                     <div key={idx} className="bg-white p-2.5 rounded-lg border border-orange-100 shadow-sm relative">
                         
                         <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-1.5">
                             <span className="text-[11px] font-black text-gray-800 flex items-center gap-1">
                                 <Calendar size={12} className="text-orange-500"/> {log.date}
                             </span>
                             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${log.payment_status === 'Received' || log.payment_status === 'Partial Payment' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}`}>
                                 {log.payment_status}
                             </span>
                         </div>
                         
                         <div className="mb-2.5">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Amount Received</p>
                             <p className="text-sm font-mono font-black text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1 w-fit shadow-sm">
                                 <IndianRupee size={12}/> {log.amount_received || 0}
                             </p>
                         </div>
 
                         <p className="text-[11px] font-medium text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100 mb-2 leading-relaxed">
                             {log.remark}
                         </p>
                         
                         <div className="flex justify-between items-center mt-1">
                         </div>
                     </div>
                 ))}
                   {(data?.payment_history || []).length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No payment logs.</p>}
             </div>
         </div>

         {/* 4. NEW: RETENTION TRACK HISTORY */}
         <div className="bg-blue-50/30 rounded-2xl border border-blue-200 shadow-sm overflow-hidden flex flex-col">
             <div className="bg-blue-100 px-4 py-3 border-b border-blue-200 flex justify-between items-center shrink-0">
                 <h3 className="text-sm font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><Award size={16}/> Retention Track</h3>
                 <button onClick={() => handleOpenModal('retention')} className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded-lg shadow-sm transition-colors" title="Add Log"><Plus size={14}/></button>
             </div>
             <div className="p-3 space-y-2.5 overflow-y-auto max-h-[500px] custom-scrollbar flex-1">
                 {data?.retention_history?.map((log, idx) => (
                     <div key={idx} className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-sm relative">
                         
                         <div className="flex justify-between items-center mb-2 border-b border-gray-50 pb-1.5">
                             <span className="text-[11px] font-black text-gray-800 flex items-center gap-1">
                                 <Calendar size={12} className="text-blue-500"/> {log.date}
                             </span>
                             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                 log.retention_status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                 log.retention_status === 'Missed' ? 'bg-red-50 text-red-700 border-red-100' :
                                 'bg-blue-50 text-blue-700 border-blue-100'
                             }`}>
                                 {log.retention_status}
                             </span>
                         </div>
 
                         <p className="text-[11px] font-medium text-gray-700 bg-gray-50/50 p-2 rounded border border-gray-100 mb-2 leading-relaxed">
                             {log.remark}
                         </p>
                         
                         <div className="flex justify-between items-center mt-1">
                             {log.next_followup_date && (
                                 <p className="text-[9px] font-black text-blue-600 flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded">
                                     <Clock size={10}/> Next: {log.next_followup_date}
                                 </p>
                             )}
                         </div>
                     </div>
                 ))}
                   {(data?.retention_history || []).length === 0 && <p className="text-center text-[11px] text-gray-400 font-bold py-4 uppercase tracking-widest">No retention logs.</p>}
             </div>
         </div>
 
       </div>
 
     {/* --- UNIFIED MODAL (Candidate, Client, Payment, Retention Logs) --- */}
       {isModalOpen && (
         <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                 
                 {/* Modal Header */}
                 <div className={`p-3 flex justify-between items-center text-white ${
                     modalType === 'candidate' ? 'bg-emerald-600' : 
                     modalType === 'client' ? 'bg-indigo-600' : 
                     modalType === 'retention' ? 'bg-blue-600' : 'bg-orange-600'
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
                                     <option value="Joined">Joined</option>
                                     <option value="Terminate">Terminate </option>
                                     <option value="Working">Working </option>
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
                                         <option value="Cancelled">Cancelled</option>
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

                     {/* --- RETENTION FORM (NEW) --- */}
                     {modalType === 'retention' && (
                         <>
                             <div className="grid grid-cols-2 gap-3">
                                 <div>
                                     <label className="text-[9px] font-bold text-gray-500 uppercase">Log Date</label>
                                     <input type="date" value={retForm.date} onChange={e => setRetForm({...retForm, date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-blue-500 bg-gray-50"/>
                                 </div>
                                 <div>
                                     <label className="text-[9px] font-bold text-gray-500 uppercase">Next Follow-up</label>
                                     <input type="date" value={retForm.next_followup_date} onChange={e => setRetForm({...retForm, next_followup_date: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-blue-500 bg-gray-50"/>
                                 </div>
                             </div>
                             <div>
                                 <label className="text-[9px] font-bold text-gray-500 uppercase">Retention Status</label>
                                 <select value={retForm.retention_status} onChange={e => setRetForm({...retForm, retention_status: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-blue-500 bg-gray-50 cursor-pointer">
                                     <option value="In Progress">In Progress</option>
                                     <option value="Eligible">Eligible</option>
                                     <option value="Invoice Sent">Invoice Sent</option>
                                     <option value="Received">Received</option>
                                     <option value="Missed">Missed/Forfeited</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="text-[9px] font-bold text-gray-500 uppercase">Remark</label>
                                 <textarea rows="3" placeholder="Notes on retention..." value={retForm.remark} onChange={e => setRetForm({...retForm, remark: e.target.value})} className="w-full border border-gray-200 p-2 rounded-md text-xs outline-none focus:border-blue-500 bg-gray-50 resize-none"></textarea>
                             </div>
                         </>
                     )}

                      <div className="pt-3 mt-1 border-t border-gray-100">
                          <button 
                            onClick={handleSaveLog} 
                            disabled={isSavingCandidate || isSavingClient || isSavingPayment || isSavingRetention}
                            className={`w-full py-2.5 rounded-lg font-black uppercase tracking-widest text-white shadow-sm flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-70 ${
                              modalType === 'candidate' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                              modalType === 'client' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                              modalType === 'retention' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'
                            }`}
                          >
                             {(isSavingCandidate || isSavingClient || isSavingPayment || isSavingRetention) ? 'Saving...' : <><Save size={14}/> Save Log</>}
                          </button>
                      </div>

                 </div>
             </div>
         </div>
       )}

       {/* ================= KYC DOCUMENTS MODAL ================= */}
       {isKycModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
             <div className="bg-[#103c7f] text-white p-4 flex justify-between items-center shrink-0">
               <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                 <FileText size={16} /> KYC Documents
               </h2>
               <button onClick={() => setIsKycModalOpen(false)} className="hover:text-red-300 transition-colors">
                 <X size={18} />
               </button>
             </div>
             <div className="p-5 overflow-y-auto max-h-[calc(85vh-60px)] custom-scrollbar">
                {(kycFiles || []).length > 0 ? (
                 <div className="space-y-3">
                    {(kycFiles || []).map((fileUrl, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group bg-gray-50">
                       <div className="flex items-center gap-3 min-w-0">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                           <FileText size={18} />
                         </div>
                         <div className="min-w-0">
                           <p className="text-xs font-bold text-gray-800 truncate" title={fileUrl}>
                             Document {idx + 1}
                           </p>
                           <p className="text-[10px] text-gray-500 truncate" title={fileUrl}>
                             {fileUrl.length > 50 ? fileUrl.substring(0, 50) + '...' : fileUrl}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         <a 
                           href={fileUrl} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                           title="View Document"
                         >
                           <Eye size={12} /> View
                         </a>
                         <a 
                           href={fileUrl} 
                           download
                           className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                           title="Download Document"
                         >
                           <Download size={12} /> Download
                         </a>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-10 text-gray-400">
                   <FileText size={32} className="mx-auto mb-3 opacity-20" />
                   <p className="text-sm font-bold text-gray-600">No KYC documents</p>
                   <p className="text-xs">This record does not have any KYC files uploaded.</p>
                 </div>
               )}
             </div>
           </div>
         </div>
       )}
      </div>

    );
  }