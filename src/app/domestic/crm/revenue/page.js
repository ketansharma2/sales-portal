"use client";
import { useState } from "react";
import { 
  ArrowLeft, FileText, Download, CheckCircle, Clock, AlertCircle, Plus, 
  Search, Filter, Calendar, User, Mail, Briefcase, IndianRupee, ShieldCheck, Eye, Edit, Save, X
} from "lucide-react";

export default function RevenuePage() {
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'add', 'edit', 'followup'
  const [selectedRecord, setSelectedRecord] = useState(null);

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
      payment_outcome: "Expected",
      base_invoice: "",
      with_gst: "",
      kyc_doc: "pending",
      account_email: "",
      recruiter_name: ""
  };

  const [formData, setFormData] = useState(initialForm);

  // --- MOCK DATA ---
  const [revenueData, setRevenueData] = useState([
    { 
      id: 1, 
      candidate_name: "Rohan Das", 
      client_name: "TechCorp Solutions", 
      position: "Java Developer",
      offer_salary: "12,00,000",
      payment_terms: "8.33%",
      payment_days: "30 Days",
      candidate_status: "Joined",
      joining_date: "2026-01-15",
      payment_client_follow_date: "2026-02-15",
      payment_outcome: "Expected",
      base_invoice: "1,00,000",
      with_gst: "1,18,000",
      kyc_doc: "uploaded",
      account_email: "accounts@techcorp.com",
      recruiter_name: "Amit Kumar"
    },
    { 
      id: 2, 
      candidate_name: "Priya Sharma", 
      client_name: "Global Logistics", 
      position: "HR Manager",
      offer_salary: "8,00,000",
      payment_terms: "Fixed",
      payment_days: "45 Days",
      candidate_status: "Terminated",
      joining_date: "2026-01-01",
      payment_client_follow_date: "2026-02-15",
      payment_outcome: "Disputed",
      base_invoice: "50,000",
      with_gst: "59,000", 
      kyc_doc: "pending",
      account_email: "finance@global.com",
      recruiter_name: "Sarah Johnson"
    }
  ]);

  const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
  ];

  // --- HANDLERS ---

  // Open Modal
  const handleOpenModal = (type, record = null) => {
      setModalType(type);
      if (type === 'edit' && record) {
          setFormData(record);
      } else if (type === 'add') {
          setFormData({ ...initialForm, id: Date.now() }); // Generate temp ID
      } else if (type === 'followup' && record) {
          setSelectedRecord(record);
      }
      setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedRecord(null);
      setFormData(initialForm);
  };

  // Save Data (Add or Edit)
  const handleSave = () => {
      if (modalType === 'add') {
          setRevenueData([formData, ...revenueData]);
      } else if (modalType === 'edit') {
          setRevenueData(revenueData.map(item => item.id === formData.id ? formData : item));
      }
      handleCloseModal();
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
                     <th className="p-3 border-r border-blue-800 whitespace-nowrap text-center w-28">Candidate Status</th>
                     {/* ACTION HEADER */}
                     <th className="p-3 text-center bg-[#0d316a] sticky right-0 z-20 w-32">Action</th>
                  </tr>
               </thead>

               {/* --- BODY --- */}
               <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
                  {filteredData.length > 0 ? (
                      filteredData.map((item, index) => (
                     <tr key={item.id} className="hover:bg-blue-50/20 transition group">
                        
                        <td className="p-3 border-r border-gray-100 text-center font-bold text-gray-500">{index + 1}</td>

                        {/* Candidate */}
                        <td className="p-3 border-r border-gray-100">
                           <div className="flex flex-col gap-1">
                              <span className="font-bold text-[#103c7f] text-sm flex items-center gap-1.5"><User size={12}/> {item.candidate_name}</span>
                              <span className="text-[10px] text-gray-500 flex items-center gap-1.5"><Briefcase size={12}/> {item.position}</span>
                              <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded w-fit border border-gray-200 mt-1">By: {item.recruiter_name}</span>
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
                              <span className="font-black text-green-700 text-sm">₹ {item.with_gst}</span>
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
                                 <Calendar size={12} className="text-blue-500"/> {item.payment_client_follow_date}
                              </div>
                           </div>
                        </td>

                        {/* KYC */}
                        <td className="p-3 border-r border-gray-100 text-center">
                           {item.kyc_doc === 'uploaded' ? (
                              <button className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition mx-auto" title="View Documents">
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
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{item.payment_outcome}</span>
                           </div>
                        </td>

                        {/* ACTION COLUMN (Sticky Right) */}
                        <td className="p-3 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                           <div className="flex items-center justify-center gap-2">
                               {/* Edit Button */}
                               <button 
                                onClick={() => handleOpenModal('edit', item)}
                                className="p-1.5 text-gray-500 hover:text-[#103c7f] bg-gray-50 border border-gray-200 rounded transition hover:shadow-sm" 
                                title="Edit Record"
                               >
                                   <Edit size={14} />
                               </button>
                               
                               {/* See Followup Button */}
                               <button 
                                onClick={() => handleOpenModal('followup', item)}
                                className="p-1.5 text-gray-500 hover:text-orange-600 bg-gray-50 border border-gray-200 rounded transition hover:shadow-sm" 
                                title="See Candidate Followup"
                               >
                                   <Clock size={14} />
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
                modalType === 'followup' ? 'max-w-lg' : 'max-w-4xl'
            }`}>
                
                {/* Modal Header */}
                <div className="bg-[#103c7f] p-3 flex justify-between items-center text-white shadow-md">
                    <h3 className="font-bold text-md uppercase tracking-wide flex items-center gap-2">
                        {modalType === 'add' && <><Plus size={18}/> Add New Revenue Record</>}
                        {modalType === 'edit' && <><Edit size={18}/> Edit Revenue Record</>}
                        {modalType === 'followup' && <><Clock size={18}/> Candidate Follow-up Details</>}
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
                                <input type="text" value={formData.recruiter_name} onChange={(e) => setFormData({...formData, recruiter_name: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none" placeholder="Sourced by"/>
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
                                <label className="text-[10px] font-bold text-green-600 uppercase block mb-1">Total (With GST)</label>
                                <input type="text" value={formData.with_gst} onChange={(e) => setFormData({...formData, with_gst: e.target.value})} className="w-full border border-green-200 bg-green-50 rounded p-2 text-sm focus:border-green-500 outline-none font-bold" placeholder="Amount + 18%"/>
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
                                    onChange={(e) => {
                                        // In a real app, you would handle the file upload here
                                        // For this UI demo, we just set the status to 'uploaded'
                                        setFormData({...formData, kyc_doc: 'uploaded'});
                                    }} 
                                    className="w-full border border-gray-300 rounded p-1.5 text-sm focus:border-[#103c7f] outline-none bg-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#103c7f] hover:file:bg-blue-100 cursor-pointer"
                                />
                                <p className="text-[9px] text-gray-400 mt-1 italic">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
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

                {/* --- FOLLOW-UP MODAL --- 
                {modalType === 'followup' && selectedRecord && (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-full text-[#103c7f]"><Clock size={24}/></div>
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{selectedRecord.client_name}</h4>
                                <p className="text-xs text-gray-500 font-bold uppercase">Candidate: {selectedRecord.candidate_name}</p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase">Payment Due Date</span>
                                <span className="text-sm font-black text-orange-600 font-mono">{selectedRecord.payment_client_follow_date}</span>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase">Latest Remarks</p>
                                <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-600 italic">
                                    "Payment is processed from client side, expected to hit account by next Monday."
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase">Account Email</span>
                                <span className="text-sm font-bold text-blue-600">{selectedRecord.account_email}</span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={handleCloseModal} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition">Close</button>
                        </div>
                    </div>
                )}*/}

            </div>
        </div>
      )}

    </div>
  );
}