"use client";
import { useState, useEffect } from "react";
import { 
  Search, Phone, Filter, X, Save, Plus, Eye, 
  Calendar, MapPin, ListFilter,ArrowRight,Send,Lock
} from "lucide-react";

export default function LeadsTablePage() {
  
  // --- MOCK DATA ---
  const initialLeads = [
    { 
      id: 101, 
      sourcingDate: "2024-01-01", // YYYY-MM-DD format for better filtering
      company: "Tech Solutions Pvt Ltd", 
      category: "IT Services",
      state: "Delhi",
      location: "Okhla Ph-3",
      empCount: "50-100",
      reference: "LinkedIn",
      firstFollowup: "02-Jan-24 ",
      latestFollowup: "05-Jan-24 ",
      remarks: "Interested, asked for proposal",
      nextFollowup: "08-Jan-2024",
      status: "Interested",
      subStatus: "Proposal Sent"
    },
    { 
      id: 102, 
      sourcingDate: "2024-01-03",
      company: "BuildWell Constructions", 
      category: "Real Estate",
      state: "Haryana",
      location: "Gurgaon Sec-44",
      empCount: "100-500",
      reference: "Cold Call",
      firstFollowup: "03-Jan-24 ",
      latestFollowup: "04-Jan-24 ",
      remarks: "Manager not available",
      nextFollowup: "07-Jan-2024",
      status: "New",
      subStatus: "Callback"
    },
  ];

  const [leads, setLeads] = useState(initialLeads);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState("");
  

  // --- FILTER STATE ---
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    company: "",
    location: "",
    status: "All Status",
    subStatus: "All"
  });

  // --- REAL-TIME FILTER LOGIC ---
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Filter Logic
    const filtered = initialLeads.filter(lead => {
      // 1. Date Range Check
      const leadDate = new Date(lead.sourcingDate);
      const from = newFilters.fromDate ? new Date(newFilters.fromDate) : null;
      const to = newFilters.toDate ? new Date(newFilters.toDate) : null;
      
      const isAfterFrom = from ? leadDate >= from : true;
      const isBeforeTo = to ? leadDate <= to : true;

      // 2. Text Matching
      const matchCompany = lead.company.toLowerCase().includes(newFilters.company.toLowerCase());
      const matchLocation = (lead.location + lead.state).toLowerCase().includes(newFilters.location.toLowerCase());
      
      // 3. Dropdown Matching
      const matchStatus = newFilters.status === "All Status" || lead.status === newFilters.status;
      const matchSubStatus = newFilters.subStatus === "All" || lead.subStatus === newFilters.subStatus;

      return isAfterFrom && isBeforeTo && matchCompany && matchLocation && matchStatus && matchSubStatus;
    });

    setLeads(filtered);
  };

  const handleAction = (lead, type) => {
    setSelectedLead(lead);
    setModalType(type);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedLead(null); // No selected lead yet
    setModalType("create");
    setIsFormOpen(true);
  };

  const handleSaveAndFollowup = () => {
    // 1. Logic to Save the new lead to DB would go here
    const newMockLead = { 
        id: 999, 
        company: "New Company Corp", // In real app, get from form state
        status: "New" 
    }; 
    
    // 2. Select this new lead
    setSelectedLead(newMockLead);
    
    // 3. Switch Modal View to 'add' (Followup Mode) immediately
    setModalType("add");
  };
  return (
      <div className="p-2 h-screen flex flex-col font-['Calibri'] bg-gray-50">
      
      {/* 1. HEADER & ACTIONS */}
<div className="flex justify-between items-center mb-2 px-2 mt-1">
          <div>
          <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Leads Database</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Manage & Track Client Interactions</p>
        </div>
        <button onClick={handleCreateNew} className="bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
           <Plus size={18} /> Add New Lead
        </button>
      </div>

      {/* 2. FILTERS BAR (Real-time, No Button) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 grid grid-cols-6 gap-3 items-end">
         
         {/* Filter 1: From Date */}
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">From Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none" 
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
              />
            </div>
         </div>

         {/* Filter 2: To Date */}
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">To Date</label>
            <div className="relative">
              <input 
                type="date" 
                className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none" 
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
              />
            </div>
         </div>

         {/* Filter 3: Company Name */}
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Company</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Type name..." 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none" 
                onChange={(e) => handleFilterChange("company", e.target.value)}
              />
            </div>
         </div>

         {/* Filter 4: Location (State/City) */}
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Location / State</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Delhi, Okhla..." 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none" 
                onChange={(e) => handleFilterChange("location", e.target.value)}
              />
            </div>
         </div>

         {/* Filter 5: Status */}
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
            <div className="relative">
              <ListFilter className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <select 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none appearance-none cursor-pointer"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option>All Status</option>
                <option>New</option>
                <option>Interested</option>
                <option>Rejected</option>
              </select>
            </div>
         </div>

         {/* Filter 6: Sub-Status */}
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sub-Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <select 
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none appearance-none cursor-pointer"
                onChange={(e) => handleFilterChange("subStatus", e.target.value)}
              >
                <option>All</option>
                <option>Call Later</option>
                <option>Meeting Aligned</option>
                <option>Proposal Sent</option>
                <option>Callback</option>
              </select>
            </div>
         </div>

      </div>

      {/* 3. THE TABLE */}
      {/* 3. THE TABLE */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-x-auto overflow-y-auto">
  <table className="w-full table-auto border-collapse text-center">
    
    {/* --- HEADER --- */}
    <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10">
      <tr>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Sourcing Date</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Company Name</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Category</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">State</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Location</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Emp. Count</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Reference</th>
        
        {/* MERGED COLUMN: Latest Follow-up & Remarks */}
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Latest Interaction</th>
        
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Next Followup</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Status</th>
        <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Sub-Status</th>
        <th className="px-2 py-2 text-center bg-[#0d316a] sticky right-0 z-20">Action</th>
      </tr>
    </thead>

    {/* --- BODY --- */}
   <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
  {leads.length > 0 ? (
    leads.map((lead) => {
      
      // 1. CHECK IF ROW IS LOCKED (Sent to Manager)
const isLocked = lead.isSubmitted;
      return (
        <tr 
          key={lead.id} 
          // 👉 CHANGE 2: ClassName update karein (Row freeze karne ke liye)
          className={`border-b border-gray-100 transition group ${
            isLocked 
            ? 'bg-gray-100/60 grayscale pointer-events-none select-none' 
            : 'hover:bg-blue-50/40'
          }`}
        >
          
          <td className="px-2 py-2 border-r border-gray-100">{lead.sourcingDate}</td>
          <td className="px-2 py-2 border-r border-gray-100 font-bold text-[#103c7f]">{lead.company}</td>
          <td className="px-2 py-2 border-r border-gray-100">{lead.category}</td>
          <td className="px-2 py-2 border-r border-gray-100">{lead.state}</td>
          <td className="px-2 py-2 border-r border-gray-100">{lead.location}</td>
          <td className="px-2 py-2 border-r border-gray-100">{lead.empCount}</td>
          <td className="px-2 py-2 border-r border-gray-100">{lead.reference}</td>
          
          {/* MERGED CELL CONTENT */}
          <td className="px-2 py-2 border-r border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[#103c7f] text-[10px] bg-blue-50 px-1.5 rounded w-fit">
                {lead.latestFollowup}
              </span>
              <span className="text-gray-600 italic truncate max-w-[200px]" title={lead.remarks}>
                "{lead.remarks}"
              </span>
            </div>
          </td>

          <td className="px-2 py-2 border-r border-gray-100 font-bold text-orange-600">{lead.nextFollowup}</td>
          
          <td className="px-2 py-2 border-r border-gray-100">
            {/* 3. STATUS BADGE: Purple if Locked */}
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border block w-fit ${
              isLocked ? 'bg-purple-100 text-purple-700 border-purple-200' :
              lead.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' :
              lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
              {lead.status}
            </span>
          </td>
          <td className="px-2 py-2 border-r border-gray-100">{lead.subStatus}</td>
          
         {/* 👉 CHANGE 3: Action Column ko update karein */}
          <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-blue-50/30 border-l border-gray-200 z-10 whitespace-nowrap">
            {isLocked ? (
               // Agar Locked hai to ye dikhega
               <div className="flex items-center justify-center gap-1 text-gray-400 font-bold text-[10px] bg-gray-50 py-1 px-2 rounded border border-gray-100">
                  <Lock size={12} /> Sent
               </div>
            ) : (
               // Agar nahi hai to purane buttons dikhenge
               <div className="flex items-center justify-center gap-1">
                  <button onClick={() => handleAction(lead, 'view')} className="p-1 text-gray-500 hover:text-[#103c7f] hover:bg-blue-100 rounded tooltip">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleAction(lead, 'add')} className="p-1 bg-[#a1db40] text-[#103c7f] rounded hover:bg-[#8cc430] font-bold shadow-sm">
                    <Phone size={16} />
                  </button>
                  <button onClick={() => handleAction(lead, 'send_to_manager')} className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-bold shadow-sm">
                    <Send size={16} />
                  </button>
               </div>
            )}
          </td>

        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="13" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
        No records match your filters
      </td>
    </tr>
  )}
</tbody>
  </table>
</div>

      {/* 4. MODAL SYSTEM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
<div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white ${
             modalType === 'view' ? 'max-w-5xl' :           // View Mode: Sabse Bada
             modalType === 'create' ? 'max-w-2xl' :         // Create Mode: Medium
             modalType === 'send_to_manager' ? 'max-w-sm' : // Send to Manager: Sabse Chhota (Popup)
             'max-w-lg'                                     // Add Interaction: Standard
          }`}>            
            {/* Modal Header */}
            <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wide">
                  {modalType === 'create' ? 'Sourcing New Lead' : 
                   modalType === 'add' ? 'Add Interaction' : 'Lead Details'}
                </h3>
                {selectedLead && (
                    <p className="text-xs opacity-70 font-mono mt-1">{selectedLead.company}</p>
                )}
              </div>
              <button onClick={() => setIsFormOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* === MODE 1: CREATE NEW LEAD FORM === */}
              {modalType === 'create' && (
                <div className="space-y-4">
                    {/* Row 1: Company & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Company Name <span className="text-red-500">*</span></label>
                            <input type="text" placeholder="Enter full name" className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                            <select className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                                <option>Select Category...</option>
                                <option>IT Services</option>
                                <option>Manufacturing</option>
                                <option>Real Estate</option>
                                <option>Logistics</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: State & Emp Count */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">State</label>
                            <select className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                                <option>Select State...</option>
                                <option>Delhi</option>
                                <option>Haryana</option>
                                <option>Uttar Pradesh</option>
                                <option>Maharashtra</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Employee Count</label>
                            <select className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                                <option>1 - 10</option>
                                <option>11 - 50</option>
                                <option>50 - 200</option>
                                <option>200 +</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Location (Area) */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Location / Area</label>
                        <textarea className="w-full border border-gray-300 rounded p-2 text-sm mt-1 h-16 resize-none focus:border-[#103c7f] outline-none" placeholder="E.g., Okhla Phase 3, Near Crown Plaza..."></textarea>
                    </div>

                    {/* Row 4: Reference */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Reference / Source</label>
                        <input type="text" placeholder="LinkedIn, Google, Cold Call..." className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none" />
                    </div>
                </div>
              )}


             {/* === MODE 2: ADD FOLLOW-UP FORM (Context + Input) === */}
{modalType === 'add' && (
  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 font-['Calibri']">
    
    {/* 1. PREVIOUS CONTEXT (Auto-filled / Read Only) */}
    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-start">
       <div className="w-3/4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
             Last Interaction ({selectedLead?.latestFollowup})
          </p>
          <p className="text-xs text-gray-700 italic border-l-2 border-blue-200 pl-2">
             "{selectedLead?.remarks || "No previous remarks"}"
          </p>
       </div>
       <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Status</p>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
             selectedLead?.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' : 
             'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
             {selectedLead?.status}
          </span>
       </div>
    </div>

    {/* 2. INPUT FORM */}
    <div className="space-y-3 pt-2">
       
       {/* Row 1: Interaction Date (Jis din baat hui) */}
       <div>
         <label className="text-[10px] font-bold text-gray-500 uppercase">Interaction Date</label>
         <input 
           type="date" 
           defaultValue={new Date().toISOString().split('T')[0]} // Default to Today
           className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none font-medium" 
         />
       </div>

       {/* Row 2: Status & Sub-Status */}
       <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">New Status</label>
            <select className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
              <option>Interested</option>
              <option>Not Interested</option>
              <option>Call Later</option>
              <option>Ringing</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase">Sub-Status</label>
            <select className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
              <option>Ready To Visit</option>
              <option>Onboard</option>
              <option>Callback</option>
              <option>Quotation Sent</option>
              <option>NA</option>
            </select>
          </div>
       </div>

       {/* Row 3: Remarks */}
       <div>
         <label className="text-[10px] font-bold text-gray-500 uppercase">Remarks (Conversation Details)</label>
         <textarea 
           className="w-full border border-gray-300 rounded p-3 text-sm mt-1 h-20 focus:border-[#103c7f] outline-none resize-none placeholder:text-gray-300"
           placeholder="Client kya bola? Mention key points..."
         ></textarea>
       </div>

       {/* Row 4: Next Follow-up */}
       <div>
         <label className="text-[10px] font-bold text-gray-500 uppercase text-orange-600">Next Follow-up Date</label>
         <input type="date" className="w-full border border-orange-200 bg-orange-50/30 rounded p-2 text-sm mt-1 focus:border-orange-500 outline-none font-bold text-gray-700" />
       </div>

    </div>
  </div>
)}
{/* === MODE 3: VIEW MODE (Modern UI) === */}
{modalType === 'view' && (
  <div className="flex flex-col h-full max-h-[80vh] font-['Calibri']">
    
    {/* 1. HEADER: COMPANY PROFILE (Clean & Minimal) */}
    <div className="flex items-center gap-5 p-1 mb-6">
      
      {/* Name & Location */}
      <div>
        <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none">
          {selectedLead.company}
        </h2>
        <div className="flex items-center gap-2 mt-1.5 text-gray-500 font-bold text-xs uppercase tracking-wider">
          <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-gray-600">
             <MapPin size={10} /> {selectedLead.location}, {selectedLead.state}
          </span>
        </div>
      </div>
    </div>

    {/* 2. INTERACTION HISTORY (Modern Table) */}
    <div className="flex-1 overflow-hidden flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm">
      
      {/* Table Title */}
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
        <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span> Interaction History
        </h4>
      </div>
      
<div className="overflow-y-auto h-[350px] border-t border-gray-100 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 shadow-sm">
             <tr>
               <th className="p-4 border-b border-gray-100">Follow-up Date</th>
               <th className="p-4 border-b border-gray-100">Contact Person</th>
               <th className="p-4 border-b border-gray-100">Contact Info</th>
               <th className="p-4 border-b border-gray-100 w-1/3">Remarks</th>
               <th className="p-4 border-b border-gray-100">Status</th>
               <th className="p-4 border-b border-gray-100">Next Follow-up Date</th>
             </tr>
          </thead>
          <tbody className="text-xs divide-y divide-gray-50">
             
             {/* ROW 1: Latest Interaction */}
             <tr className="hover:bg-blue-50/30 transition duration-150 group">
                <td className="p-4">
                   <div className="font-bold text-[#103c7f] text-sm">05 Jan</div>
                   <div className="text-[10px] text-gray-400 font-medium">2024</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                      AK
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{selectedLead.person || "Amit Kumar"}</div>
                      <div className="text-[10px] text-gray-400 font-medium">Manager</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-gray-600 bg-gray-50 px-1.5 rounded w-fit">{selectedLead.phone}</span>
                    <span className="text-[10px] text-blue-500 font-medium lowercase">amit@example.com</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition">
                    "{selectedLead.remarks}"
                  </p>
                </td>
                <td className="p-4">
                   <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-bold w-20 text-center ${
                      selectedLead.status === 'Interested' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'
                   }`}>
                     {selectedLead.status}
                     <span className="text-[8px] opacity-70 font-normal mt-0.5">{selectedLead.subStatus}</span>
                   </span>
                </td>
                <td className="p-4">
                   <div className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100 text-center w-fit">
                      {selectedLead.nextFollowup}
                   </div>
                </td>
             </tr>

             {/* ROW 2: Historical Data (Faded) */}
             <tr className="hover:bg-gray-50 transition duration-150 opacity-75 grayscale hover:grayscale-0">
                <td className="p-4">
                   <div className="font-bold text-gray-500 text-sm">02 Jan</div>
                   <div className="text-[10px] text-gray-400 font-medium">2024</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                      FD
                    </div>
                    <div>
                      <div className="font-bold text-gray-600">Front Desk</div>
                      <div className="text-[10px] text-gray-400 font-medium">Reception</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-gray-500 bg-gray-50 px-1.5 rounded w-fit">011-4567890</span>
                    <span className="text-[10px] text-blue-400 font-medium lowercase">info@example.com</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-gray-500 italic">
                    "Called landline, asked to share profile on email."
                  </p>
                </td>
                <td className="p-4">
                   <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 w-20 text-center">
                     New
                   </span>
                </td>
                <td className="p-4">
                   <div className="text-gray-400 font-bold text-xs">
                      05-Jan-24
                   </div>
                </td>
             </tr>
             {/* ROW 2: Historical Data (Faded) */}
             <tr className="hover:bg-gray-50 transition duration-150 opacity-75 grayscale hover:grayscale-0">
                <td className="p-4">
                   <div className="font-bold text-gray-500 text-sm">02 Jan</div>
                   <div className="text-[10px] text-gray-400 font-medium">2024</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                      FD
                    </div>
                    <div>
                      <div className="font-bold text-gray-600">Front Desk</div>
                      <div className="text-[10px] text-gray-400 font-medium">Reception</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-gray-500 bg-gray-50 px-1.5 rounded w-fit">011-4567890</span>
                    <span className="text-[10px] text-blue-400 font-medium lowercase">info@example.com</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-gray-500 italic">
                    "Called landline, asked to share profile on email."
                  </p>
                </td>
                <td className="p-4">
                   <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 w-20 text-center">
                     New
                   </span>
                </td>
                <td className="p-4">
                   <div className="text-gray-400 font-bold text-xs">
                      05-Jan-24
                   </div>
                </td>
             </tr>
             {/* ROW 2: Historical Data (Faded) */}
             <tr className="hover:bg-gray-50 transition duration-150 opacity-75 grayscale hover:grayscale-0">
                <td className="p-4">
                   <div className="font-bold text-gray-500 text-sm">02 Jan</div>
                   <div className="text-[10px] text-gray-400 font-medium">2024</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                      FD
                    </div>
                    <div>
                      <div className="font-bold text-gray-600">Front Desk</div>
                      <div className="text-[10px] text-gray-400 font-medium">Reception</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-gray-500 bg-gray-50 px-1.5 rounded w-fit">011-4567890</span>
                    <span className="text-[10px] text-blue-400 font-medium lowercase">info@example.com</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-gray-500 italic">
                    "Called landline, asked to share profile on email."
                  </p>
                </td>
                <td className="p-4">
                   <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 w-20 text-center">
                     New
                   </span>
                </td>
                <td className="p-4">
                   <div className="text-gray-400 font-bold text-xs">
                      05-Jan-24
                   </div>
                </td>
             </tr>
             {/* ROW 2: Historical Data (Faded) */}
             <tr className="hover:bg-gray-50 transition duration-150 opacity-75 grayscale hover:grayscale-0">
                <td className="p-4">
                   <div className="font-bold text-gray-500 text-sm">02 Jan</div>
                   <div className="text-[10px] text-gray-400 font-medium">2024</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-[10px]">
                      FD
                    </div>
                    <div>
                      <div className="font-bold text-gray-600">Front Desk</div>
                      <div className="text-[10px] text-gray-400 font-medium">Reception</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-gray-500 bg-gray-50 px-1.5 rounded w-fit">011-4567890</span>
                    <span className="text-[10px] text-blue-400 font-medium lowercase">info@example.com</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-gray-500 italic">
                    "Called landline, asked to share profile on email."
                  </p>
                </td>
                <td className="p-4">
                   <span className="inline-block px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 w-20 text-center">
                     New
                   </span>
                </td>
                <td className="p-4">
                   <div className="text-gray-400 font-bold text-xs">
                      05-Jan-24
                   </div>
                </td>
             </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
{/* === MODE 4: SEND TO MANAGER (Body Content) === */}
{modalType === 'send_to_manager' && (
  <div className="flex flex-col items-center justify-center py-2 px-2 text-center">
     
    

     {/* 2. Heading */}
     

     {/* 3. Text Data */}
     <p className="text-sm text-gray-500 leading-relaxed max-w-[80%] mx-auto">
        Are you sure you want to send 
        <span className="font-bold text-[#103c7f] block my-1 text-base">
          {selectedLead?.company}
        </span>
       to Manager ? 
       This will lock the lead.
     </p>

  </div>
)}

            </div>

{/* MODAL FOOTER */}
<div className={`p-4 bg-gray-50 border-t flex gap-3 ${modalType === 'send_to_manager' ? 'justify-center' : 'justify-end'}`}>

   {/* 1. Standard Cancel (Show for everyone EXCEPT 'send_to_manager') */}
   {modalType !== 'send_to_manager' && (
     <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 text-sm">
       Cancel
     </button>
   )}

   {/* 2. Buttons for CREATE Mode */}
   {modalType === 'create' && (
     <>
       <button className="px-5 py-2 bg-white border border-[#103c7f] text-[#103c7f] rounded-lg font-bold text-sm shadow-sm hover:bg-blue-50">
         Save Only
       </button>
       <button 
         onClick={handleSaveAndFollowup}
         className="bg-[#a1db40] hover:bg-[#8cc430] text-[#103c7f] px-5 py-2 rounded-lg font-black text-sm shadow-sm flex items-center gap-2"
       >
         Save & Add Follow-up <ArrowRight size={16} />
       </button>
     </>
   )}

   {/* 3. Button for ADD FOLLOWUP Mode */}
   {modalType === 'add' && (
     <button className="bg-[#103c7f] hover:bg-blue-900 text-white px-2 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
       <Save size={16} /> Save Record
     </button>
   )}

   {/* 4. Button for SEND TO MANAGER Mode (ONLY ONE BUTTON) */}
   {/* === MODE 4: SEND TO MANAGER (Footer Button Only) === */}
{modalType === 'send_to_manager' && (
   <button 
     onClick={() => {
        // 1. Update State: Set 'isSubmitted' to true
        const updatedLeads = leads.map(l => 
           l.id === selectedLead.id 
           ? { ...l, isSubmitted: true } 
           : l
        );
        setLeads(updatedLeads);

        // 2. Close Modal
        setIsFormOpen(false);
     }}
     // Button Style: Centered, Purple
     className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 flex items-center gap-2 transition transform active:scale-95"
   >
     <Send size={16} /> Yes, Confirm
   </button>
)}
</div>
</div>

          </div>
      
      )}

    </div>
  );
}