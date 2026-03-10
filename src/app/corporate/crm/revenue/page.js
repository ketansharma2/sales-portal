"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, FileText, Download, CheckCircle, Clock, AlertCircle, Plus, 
  Search, Filter, Calendar, User, Mail, Briefcase, IndianRupee, ShieldCheck, Eye, Edit, Save, X, 
  MessageSquarePlus, History, UserSearch // Naye icons
} from "lucide-react";

export default function RevenuePage() {
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add', 'edit', 'followup'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rcUsers, setRcUsers] = useState([]);

  // --- FETCH DATA FROM API ---
  useEffect(() => {
    fetchRevenueData();
    fetchRcUsers();
  }, []);

  const fetchRcUsers = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      
      const response = await fetch('/api/corporate/crm/rc-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRcUsers(result.data || []);
      } else {
        console.error('Failed to fetch RC users:', result.error);
      }
    } catch (error) {
      console.error('Error fetching RC users:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      const response = await fetch('/api/corporate/crm/revenue', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRevenueData(result.data || []);
      } else {
        console.error('Failed to fetch revenue:', result.error);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- INITIAL FORM STATE ---
  const initialForm = {
      id: null,
      candidate_name: "", 
      client_name: "", 
      position: "",
      offer_salary: "",
      payment_terms: "",
      payment_days: "",
      candidate_status: "Joined",
      joining_date: "",
      payment_client_follow_date: "",

      base_invoice: "",
      total_amount: "",
      kyc_link: "",
      account_email: "",

  };

  const [formData, setFormData] = useState(initialForm);
  const [kycFile, setKycFile] = useState(null);

  // Payment Followup Form State
  const [followupForm, setFollowupForm] = useState({
    contact_date: new Date().toISOString().split('T')[0],
    next_follow_up: '',
    remarks: '',
    payment_status: 'Pending'
  });

  // Payment Followup History State
  const [followupHistory, setFollowupHistory] = useState([]);

  // Candidate Followup History State (for TL/Recruiter follow-ups)
  const [candidateFollowupHistory, setCandidateFollowupHistory] = useState([]);

  // Handle KYC file upload
  const handleKycUpload = async (file) => {
    setKycFile(file);
  };

  const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
  ];

  // Helper to convert null/undefined to empty string for form inputs
  const sanitizeFormData = (data) => ({
      id: data?.id || null,
      candidate_name: data?.candidate_name || "",
      client_name: data?.client_name || "",
      position: data?.position || "",
      offer_salary: data?.offer_salary?.toString() || "",
      payment_terms: data?.payment_terms || "",
      payment_days: data?.payment_days?.toString() || "",
      candidate_status: data?.candidate_status || "Joined",
      joining_date: data?.joining_date || "",
      payment_client_follow_date: data?.payment_client_follow_date || data?.payment_due_date || "",
      base_invoice: data?.base_invoice?.toString() || "",
      total_amount: data?.total_amount?.toString() || "",
      kyc_link: data?.kyc_link || "",
      account_email: data?.account_email || "",
      recruiter_id: data?.recruiter_id || ""
  });

  // --- HANDLERS ---

  // Open Modal
  const handleOpenModal = (type, record = null) => {
      setModalType(type);
      if (type === 'edit' && record) {
          setFormData(sanitizeFormData(record));
          setSelectedRecord(record);
      } else if (type === 'add') {
          setFormData({ ...initialForm, id: Date.now() });
      } else if (record) {
          setSelectedRecord(record); 
          
          // If opening candidate followup view, fetch the data
          if (type === 'viewCandidateFollowup' && record.id) {
              fetchCandidateFollowups(record.id);
          }
      }
      setIsModalOpen(true);
  };

  // Fetch Candidate Followups (for TL/Recruiter follow-ups)
  const fetchCandidateFollowups = async (candidateId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      
      const response = await fetch(`/api/corporate/crm/revenue/candidate-followup?candidate_id=${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCandidateFollowupHistory(result.data || []);
      } else {
        console.error('Failed to fetch candidate followups:', result.error);
        setCandidateFollowupHistory([]);
      }
    } catch (error) {
      console.error('Error fetching candidate followups:', error);
      setCandidateFollowupHistory([]);
    }
  };

  // Close Modal
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedRecord(null);
      setFormData(initialForm);
      setKycFile(null);
      setCandidateFollowupHistory([]);
  };

  // Save Data (Add or Edit)
  const handleSave = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      
      // Helper to upload file
      const uploadFile = async (revenueId) => {
        if (!kycFile) return null;
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', kycFile);
        uploadFormData.append('revenue_id', revenueId);
        
        const response = await fetch('/api/corporate/crm/revenue/upload-kyc', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadFormData
        });
        
        const result = await response.json();
        return result;
      };
      
      if (modalType === 'add') {
        // First, create the revenue record
        const response = await fetch('/api/corporate/crm/revenue', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({...formData, kyc_link: ''})
        });
        
        const result = await response.json();
        if (result.success) {
          // If there's a file to upload, upload it
          if (kycFile) {
            await uploadFile(result.data.id);
          }
          fetchRevenueData();
        } else {
          alert('Failed to create: ' + result.error);
          return;
        }
      } else if (modalType === 'edit') {
        const response = await fetch('/api/corporate/crm/revenue', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        if (result.success) {
          // If there's a new file to upload, upload it
          if (kycFile) {
            await uploadFile(formData.id);
          }
          fetchRevenueData();
        } else {
          alert('Failed to update: ' + result.error);
          return;
        }
      }
      setKycFile(null); // Clear file after save
      handleCloseModal();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving data');
    }
  };

  // Save Payment Followup
  const handleSaveFollowup = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const token = session.access_token;
      
      const response = await fetch('/api/corporate/crm/revenue/payment-followup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          revenue_id: selectedRecord?.id,
          contact_date: followupForm.contact_date,
          remarks: followupForm.remarks,
          next_follow_up: followupForm.next_follow_up || null,
          payment_status: followupForm.payment_status
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Payment follow-up saved successfully!');
        setFollowupForm({
          contact_date: new Date().toISOString().split('T')[0],
          next_follow_up: '',
          remarks: '',
          payment_status: 'Pending'
        });
        handleCloseModal();
      } else {
        alert('Failed to save: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving followup:', error);
      alert('Error saving follow-up');
    }
  };

  // Helper function to convert Google Drive links to direct display URLs
  const getDirectLink = (url) => {
    if (!url) return url;
    
    // Check if it's a Google Drive link
    if (url.includes('drive.google.com')) {
      // Extract file ID from various Google Drive URL formats
      let fileId = '';
      
      // Format: https://drive.google.com/file/d/FILE_ID/view...
      const fileMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch && fileMatch[1]) {
        fileId = fileMatch[1];
      }
      
      if (fileId) {
        // Use the direct download URL for images
        // For PDFs, use the preview URL
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    
    return url;
  };

  // Helper to check if URL is a Google Drive link
  const isGoogleDriveLink = (url) => {
    if (!url) return false;
    return url.includes('drive.google.com');
  };

  // Filter Logic
  const filteredData = revenueData.filter(item => {
      const matchesSearch = item.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.client_name.toLowerCase().includes(searchTerm.toLowerCase());
      // Note: Month filtering logic is simplified here. In real app, parse `joining_date`
      const matchesMonth = selectedMonth === "All" ? true : true; 
      return matchesSearch && matchesMonth;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-['Calibri'] p-6">
      
      {/* HEADER & FILTER SECTION */}
      <div className="flex justify-between items-end mb-6">
         <div>
             <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Revenue & Billing Tracker</h1>
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Track Invoices, GST & Payments</p>
         </div>
         
         <div className="flex gap-3">
            
            {/* 1. SEARCH BAR */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search Client or Candidate..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-bold w-64 outline-none focus:border-[#103c7f] transition shadow-sm"
                />
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                    <Search size={14} />
                </div>
            </div>

            {/* 2. MONTH FILTER */}
            <div className="relative">
                <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 pl-4 pr-8 rounded-xl text-xs font-bold uppercase shadow-sm focus:outline-none focus:border-[#103c7f] cursor-pointer"
                >
                    <option value="All">All Months</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <Filter size={12} />
                </div>
            </div>

            {/* 3. ADD BUTTON */}
            <button 
                onClick={() => handleOpenModal('add')}
                className="bg-[#103c7f] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-900 transition shadow-sm"
            >
                <Plus size={16} /> Add Revenue
            </button>

            {/* 4. EXPORT BUTTON */}
          
         </div>
      </div>

      {/* --- REVENUE TABLE CONTAINER --- */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
         
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1600px]">
               
               {/* --- HEADERS --- */}
               <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
                  <tr>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap w-12 text-center">Sr.No</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[180px]">Candidate Details</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[180px]">Client / Account</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[120px]">Offer / Terms</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[100px] text-right">Base Invoice</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[100px] text-right">Total (+GST)</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[120px]">Joining / Due Days</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap min-w-[140px]">Payment Follow-up</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap text-center">KYC Docs</th>
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap text-center w-28">Candidate/Payment Status</th>
                     {/* ACTION HEADER */}
                     <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-32">Action</th>
                  </tr>
               </thead>

               {/* --- BODY --- */}
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {loading ? (
                     <tr>
                       <td colSpan="12" className="p-10 text-center text-gray-400 font-bold uppercase">
                         Loading...
                       </td>
                     </tr>
                   ) : filteredData.length > 0 ? (
                      filteredData.map((item, index) => (
                     <tr key={item.id} className="hover:bg-blue-50/20 transition group">
                        
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-500">{index + 1}</td>

                        {/* Candidate */}
                        <td className="p-3 border-r border-gray-100">
                           <div className="flex flex-col gap-1">
                              <span className="font-bold text-[#103c7f] text-sm flex items-center gap-1.5"><User size={12}/> {item.candidate_name}</span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1.5"><Briefcase size={12}/> {item.position}</span>
                              <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded w-fit border border-gray-200 mt-1">By: {item.recruiter_name || '-'}</span>
                           </div>
                        </td>

                        {/* Client */}
                        <td className="p-3 border-r border-gray-100">
                           <div className="flex flex-col gap-1">
                              <span className="font-bold text-gray-800">{item.client_name}</span>
                              <span className="text-[10px] text-blue-500 flex items-center gap-1.5 truncate max-w-[150px]" title={item.account_email}><Mail size={12}/> {item.account_email}</span>
                           </div>
                        </td>

                        {/* Offer */}
                        <td className="p-3 border-r border-gray-100">
                           <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-gray-700">₹ {item.offer_salary}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Terms: {item.payment_terms}</span>
                           </div>
                        </td>

                        {/* Base Invoice */}
                        <td className="p-3 border-r border-gray-100 text-right font-mono font-bold text-gray-600">₹ {item.base_invoice}</td>

                        {/* GST Invoice */}
                        <td className="p-3 border-r border-gray-100 bg-green-50/30 text-right">
                           <div className="flex flex-col items-end gap-0.5">
                              <span className="font-black text-green-700 text-sm">₹ {item.total_amount}</span>
                              <span className="text-[8px] text-green-600 font-bold uppercase">+18% GST</span>
                           </div>
                        </td>

                        {/* Timeline */}
                        <td className="p-3 border-r border-gray-100">
                           <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5 font-mono text-gray-600"><Calendar size={12}/> {item.joining_date}</span>
                              <span className="flex items-center gap-1.5 text-orange-600 font-bold text-[10px]"><Clock size={12}/> {item.payment_days}</span>
                           </div>
                        </td>

                        {/* Payment Followup */}
                        <td className="p-3 border-r border-gray-100">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</span>
                              <div className="flex items-center gap-1.5 font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 w-fit">
                                 <Calendar size={12} className="text-blue-500"/> {item.next_follow_up || item.payment_due_date}
                              </div>
                           </div>
                        </td>

                        {/* KYC */}
                        <td className="p-3 border-r border-gray-100 text-center">
                           {item.kyc_link ? (
                              <button onClick={() => handleOpenModal('viewKyc', item)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition mx-auto" title="View Documents">
                                 <Eye size={12}/> <span className="text-[9px] font-bold uppercase">View</span>
                              </button>
                           ) : (
                              <span className="text-red-400 text-[9px] font-bold uppercase flex items-center justify-center gap-1"><AlertCircle size={12}/> Pending</span>
                           )}
                        </td>

                        {/* Status */}
                        <td className="p-3 border-r border-gray-100 text-center">
                           <div className="flex flex-col items-center gap-1">
                              <span className={`px-3 py-1 rounded text-[9px] font-black uppercase border w-24 ${
                                 item.candidate_status === 'Joined' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                 {item.candidate_status}
                              </span>
                              {item.latest_payment_status && (
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                  item.latest_payment_status === 'Received' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                                }`}>
                                  {item.latest_payment_status}
                                </span>
                              )}
                           </div>
                        </td>

                        {/* ACTION COLUMN (Sticky Right) */}
                     {/* ACTION COLUMN (Sticky Right) */}
                        <td className="p-3 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)] w-48">
                           <div className="flex items-center justify-center gap-2">
                               
                               {/* 1. Add Client Followup (CRM Only) */}
                               <button 
                               onClick={() => handleOpenModal('addClientFollowup', item)}
                                className="p-1.5 text-white bg-[#103c7f] rounded transition hover:bg-blue-900 shadow-sm" 
                                title="Add Client Follow-up"
                               >
                                   <MessageSquarePlus size={14} />
                               </button>

                               {/* 2. View Client Followup History */}
                               <button 
                                onClick={() => handleOpenModal('viewClientFollowup', item)}
                                className="p-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded transition hover:bg-blue-100" 
                                title="View Client Follow-up History"
                               >
                                   <History size={14} />
                               </button>

                               {/* 3. View Candidate Followup History (Added by TL/Recruiter, viewable by CRM) */}
                               <button 
                                onClick={() => handleOpenModal('viewCandidateFollowup', item)}
                                className="p-1.5 text-purple-600 bg-purple-50 border border-purple-200 rounded transition hover:bg-purple-100" 
                                title="View Candidate Follow-up (By TL/Recruiter)"
                               >
                                   <UserSearch size={14} />
                               </button>

                               {/* 4. Edit Record (Existing) */}
                               <button 
                                onClick={() => handleOpenModal('edit', item)}
                                className="p-1.5 text-gray-500 hover:text-gray-800 bg-gray-50 border border-gray-200 rounded transition hover:bg-gray-100" 
                                title="Edit Revenue Record"
                               >
                                   <Edit size={14} />
                               </button>
                               
                           </div>
                        </td>

                     </tr>
                  ))) : (
                      <tr><td colSpan="12" className="p-10 text-center text-gray-400 font-bold uppercase">No records found</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- MODALS --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            
            <div className={`bg-white rounded-2xl shadow-2xl w-full border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200 ${
                modalType === 'followup' ? 'max-w-lg' : modalType === 'viewKyc' ? 'max-w-5xl' : 'max-w-4xl'
            }`}>
                
                {/* Modal Header */}
                {/* Modal Header */}
                <div className="bg-[#103c7f] p-3 flex justify-between items-center text-white shadow-md shrink-0">
                    <h3 className="font-bold text-md uppercase tracking-wide flex items-center gap-2">
                        {modalType === 'add' && <><Plus size={18}/> Add New Revenue Record</>}
                        {modalType === 'edit' && <><Edit size={18}/> Edit Revenue Record</>}
                        {modalType === 'addClientFollowup' && <><MessageSquarePlus size={18}/> Add Client Follow-up</>}
                        {modalType === 'viewClientFollowup' && <><History size={18}/> Client Follow-up History</>}
                        {modalType === 'viewCandidateFollowup' && <><UserSearch size={18}/> Candidate Follow-up</>}
                        {modalType === 'viewKyc' && <><Eye size={18}/> View KYC Document</>}
                    </h3>
                    <button onClick={handleCloseModal} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={20} /></button>
                </div>

                {/* --- ADD / EDIT FORM --- */}
                {(modalType === 'add' || modalType === 'edit') && (
                    <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-5 font-['Calibri']">
                            
                            {/* Section 1: Basic Info */}
                            <div className="col-span-3 border-b border-gray-100 pb-2 mb-2"><h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Client & Candidate Info</h4></div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Candidate Name</label>
                                <input type="text" value={formData.candidate_name} onChange={(e) => setFormData({...formData, candidate_name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="Enter name"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Client Name</label>
                                <input type="text" value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="Client company"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Position / Role</label>
                                <input type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="Designation"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Recruiter Name</label>
                                <select 
                                  value={formData.recruiter_id || ''} 
                                  onChange={(e) => {
                                    const selectedUser = rcUsers.find(u => u.user_id === e.target.value);
                                    setFormData({
                                      ...formData, 
                                      recruiter_id: e.target.value
                                    });
                                  }} 
                                  className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none bg-white"
                                >
                                  <option value="">Select Recruiter</option>
                                  {rcUsers.map(user => (
                                    <option key={user.user_id} value={user.user_id}>
                                      {user.name}
                                    </option>
                                  ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Account Email</label>
                                <input type="email" value={formData.account_email} onChange={(e) => setFormData({...formData, account_email: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="finance@client.com"/>
                            </div>

                            {/* Section 2: Financials */}
                            <div className="col-span-3 border-b border-gray-100 pb-2 mb-2 mt-2"><h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Financials & Invoice</h4></div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Offer Salary</label>
                                <input type="text" value={formData.offer_salary} onChange={(e) => setFormData({...formData, offer_salary: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="e.g. 12,00,000"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Payment Terms</label>
                                <input type="text" value={formData.payment_terms} onChange={(e) => setFormData({...formData, payment_terms: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="e.g. 8.33%"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Payment Days</label>
                                <input type="text" value={formData.payment_days} onChange={(e) => setFormData({...formData, payment_days: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="e.g. 30 Days"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Base Invoice</label>
                                <input type="text" value={formData.base_invoice} onChange={(e) => setFormData({...formData, base_invoice: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none font-mono" placeholder="Amount without GST"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-green-600 uppercase block mb-1">Total Amount</label>
                                <input type="text" value={formData.total_amount} onChange={(e) => setFormData({...formData, total_amount: e.target.value})} className="w-full border border-green-200 bg-green-50 rounded p-2 text-sm focus:border-green-500 outline-none font-bold" placeholder="Total Amount"/>
                            </div>

                            {/* Section 3: Status & Dates */}
                            <div className="col-span-3 border-b border-gray-100 pb-2 mb-2 mt-2"><h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Status & Timeline</h4></div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Joining Date</label>
                                <input type="date" value={formData.joining_date} onChange={(e) => setFormData({...formData, joining_date: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Payment Due Date</label>
                                <input type="date" value={formData.payment_client_follow_date} onChange={(e) => setFormData({...formData, payment_client_follow_date: e.target.value})} className="w-full border border-orange-200 bg-orange-50 rounded p-2 text-sm focus:border-orange-500 outline-none font-bold"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Candidate Status</label>
                                <select value={formData.candidate_status} onChange={(e) => setFormData({...formData, candidate_status: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none bg-white">
                                    <option value="Joined">Joined</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Upload KYC Document</label>
                                <input 
                                    type="file" 
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            handleKycUpload(file);
                                        }
                                    }} 
                                    className="w-full border border-gray-300 rounded p-1.5 text-sm focus:border-[#103c7f] outline-none bg-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#103c7f] hover:file:bg-blue-100 cursor-pointer"
                                />
                                {kycFile && (
                                    <p className="text-[9px] text-green-600 mt-1">Selected: {kycFile.name}</p>
                                )}
                                {formData.kyc_link && !kycFile && (
                                    <p className="text-[9px] text-blue-600 mt-1">Current file uploaded</p>
                                )}
                                <p className="text-[9px] text-gray-400 mt-1 italic">Supported formats: PDF, JPG, PNG</p>
                            </div>

                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                            <button onClick={handleSave} className="bg-[#103c7f] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-900 transition flex items-center gap-2">
                                <Save size={16}/> Save Record
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 1. ADD CLIENT FOLLOWUP MODAL --- */}
             {/* --- 1. ADD CLIENT FOLLOWUP MODAL --- */}
                {modalType === 'addClientFollowup' && selectedRecord && (
                    <div className="p-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Adding Follow-up for Client:</p>
                            <h4 className="text-lg font-black text-[#103c7f]">{selectedRecord.client_name}</h4>
                            <p className="text-xs font-bold text-gray-600 mt-1">Candidate: <span className="text-gray-800">{selectedRecord.candidate_name}</span></p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-5">
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Follow-up Date</label>
                                <input 
                                  type="date" 
                                  value={followupForm.contact_date}
                                  onChange={(e) => setFollowupForm({...followupForm, contact_date: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#103c7f] outline-none"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Next Follow-up Date</label>
                                <input 
                                  type="date" 
                                  value={followupForm.next_follow_up}
                                  onChange={(e) => setFollowupForm({...followupForm, next_follow_up: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#103c7f] outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Remarks / Conversation</label>
                                <textarea 
                                  rows="3" 
                                  value={followupForm.remarks}
                                  onChange={(e) => setFollowupForm({...followupForm, remarks: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-[#103c7f] outline-none resize-none" 
                                  placeholder="E.g., Spoke to finance team regarding invoice processing..."
                                ></textarea>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Payment Status</label>
                                <select 
                                  value={followupForm.payment_status}
                                  onChange={(e) => setFollowupForm({...followupForm, payment_status: e.target.value})}
                                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#103c7f] outline-none bg-white"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Received">Received</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                            <button onClick={handleSaveFollowup} className="bg-[#103c7f] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-900 transition flex items-center gap-2">
                                <CheckCircle size={16}/> Save Follow-up
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 2. VIEW CLIENT FOLLOWUP HISTORY MODAL --- */}
           {/* --- 2. VIEW CLIENT FOLLOWUP HISTORY MODAL --- */}
                {modalType === 'viewClientFollowup' && selectedRecord && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                            <div>
                                <h4 className="text-lg font-black text-gray-800">{selectedRecord.client_name}</h4>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client Follow-up History</p>
                            </div>
                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black border border-blue-100">CRM DEPT</span>
                        </div>
                        
                        {/* Timeline List (Scrollable Area) */}
                        <div className="space-y-6 pl-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-3">
                            
                            {selectedRecord.followup_history && selectedRecord.followup_history.length > 0 ? (
                                [...selectedRecord.followup_history]
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((followup, index) => (
                                    <div key={followup.created_at || index} className={`relative pl-6 border-l-2 ${index === 0 ? 'border-[#103c7f]' : 'border-gray-200'}`}>
                                        <div className={`absolute w-4 h-4 bg-${index === 0 ? '[#103c7f]' : 'gray-300'} rounded-full -left-[9px] top-0 border-4 border-white shadow-sm flex items-center justify-center`}></div>
                                        
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Follow-up Date: <span className="text-gray-800">{followup.contact_date}</span></p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${followup.payment_status === 'Received' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                                                {followup.payment_status}
                                            </span>
                                        </div>
                                        
                                        <p className="text-sm font-bold text-gray-800 bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-2">
                                            {followup.remarks}
                                        </p>
                                        
                                        {followup.next_follow_up && (
                                            <p className="text-xs text-[#103c7f] font-bold flex items-center gap-1.5">
                                                <Calendar size={12}/> Next Follow-up: {followup.next_follow_up}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm font-bold">No follow-up history available</p>
                                    <p className="text-xs mt-1">Click the + button to add the first follow-up</p>
                                </div>
                            )}

                        </div>

                        <div className="mt-6 text-right pt-4 border-t border-gray-100">
                            <button onClick={handleCloseModal} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 transition">Close</button>
                        </div>
                    </div>
                )}

              {/* --- 3. VIEW CANDIDATE FOLLOWUP HISTORY MODAL (Read Only for CRM) --- */}
                {modalType === 'viewCandidateFollowup' && selectedRecord && (
                    <div className="p-6 bg-gray-50">
                        <div className="bg-purple-100 text-purple-800 p-3 rounded-xl text-xs font-bold mb-5 flex items-center gap-2 border border-purple-200 shadow-sm">
                            <ShieldCheck size={16} className="shrink-0"/>
                            This history is logged by the Recruitment/TL team. CRM can view candidate retention status here.
                        </div>

                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                            <div>
                                <h4 className="text-lg font-black text-[#103c7f]">{selectedRecord.candidate_name}</h4>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{selectedRecord.position}</p>
                            </div>
                        </div>

                        {/* Timeline (Scrollable Area) - Using Real Data from API */}
                        <div className="space-y-6 pl-2 max-h-[45vh] overflow-y-auto custom-scrollbar pr-3">
                            
                            {candidateFollowupHistory && candidateFollowupHistory.length > 0 ? (
                                [...candidateFollowupHistory]
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((hist, idx) => (
                                    <div key={hist.created_at || idx} className={`relative pl-6 border-l-2 ${idx === 0 ? 'border-purple-600' : 'border-purple-300'}`}>
                                        <div className={`absolute w-4 h-4 rounded-full -left-[9px] top-0 border-4 shadow-sm flex items-center justify-center ${idx === 0 ? 'bg-purple-600 border-white' : 'bg-purple-400 border-gray-50 w-3 h-3 -left-[7px] top-1'}`}></div>
                                        
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Follow-up Date: <span className="text-gray-800">{hist.contact_date}</span></p>
                                                {hist.loggedBy && (
                                                    <p className="text-[9px] font-bold text-blue-600 mt-0.5">
                                                            By: {hist.loggedBy}{hist.loggedByRole ? ` (${hist.loggedByRole})` : ''}
                                                        </p>
                                                )}
                                            </div>
                                            
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                                                hist.current_status === 'Working' ? 'bg-green-50 text-green-600 border-green-200' :
                                                hist.current_status === 'Warning' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                hist.current_status === 'Absconded' ? 'bg-red-50 text-red-600 border-red-200' :
                                                hist.current_status === 'Resigned' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                                'bg-blue-50 text-blue-600 border-blue-200'
                                            }`}>
                                                {hist.current_status}
                                            </span>
                                        </div>
                                        
                                        <p className={`text-sm font-bold text-gray-800 p-3 rounded-lg shadow-sm border ${idx === 0 ? 'bg-white border-gray-200' : 'bg-white/60 border-gray-100'}`}>
                                            {hist.remarks}
                                        </p>

                                        {hist.next_follow_up && (
                                            <p className="text-xs text-purple-600 font-bold flex items-center gap-1.5 mt-2">
                                                <Calendar size={12}/> Next Follow-up: {hist.next_follow_up}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-sm font-bold">No candidate follow-up history available</p>
                                    <p className="text-xs mt-1">TL or Recruiter will add follow-ups here</p>
                                </div>
                            )}

                        </div>

                        <div className="mt-6 text-right pt-4 border-t border-gray-200">
                            <button onClick={handleCloseModal} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-300 transition shadow-sm">Close View</button>
                        </div>
                    </div>
                )}

                {/* --- 4. VIEW KYC DOCUMENT MODAL --- */}
                {modalType === 'viewKyc' && selectedRecord && selectedRecord.kyc_link && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                            <div>
                                <h4 className="text-lg font-black text-gray-800">{selectedRecord.candidate_name}</h4>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">KYC Document</p>
                            </div>
                            {isGoogleDriveLink(selectedRecord.kyc_link) && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200 font-bold">
                                    Google Drive
                                </span>
                            )}
                        </div>
                        
                        {/* Document Preview */}
                        <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden" style={{height: '60vh'}}>
                            {selectedRecord.kyc_link.toLowerCase().endsWith('.pdf') || isGoogleDriveLink(selectedRecord.kyc_link) ? (
                                <iframe 
                                    src={isGoogleDriveLink(selectedRecord.kyc_link) 
                                        ? selectedRecord.kyc_link.replace('/view?usp=sharing', '/preview') 
                                        : selectedRecord.kyc_link} 
                                    className="w-full h-full"
                                    title="KYC Document"
                                />
                            ) : (
                                <img 
                                    src={getDirectLink(selectedRecord.kyc_link)} 
                                    alt="KYC Document" 
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>

                        <div className="mt-6 text-right pt-4 border-t border-gray-100">
                            <button onClick={handleCloseModal} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-200 transition">Close</button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      )}

    </div>
  );
}