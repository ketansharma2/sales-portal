"use client";
import { useState, useEffect } from "react";
import {
  Search, Filter, Eye, UserPlus, Truck,
  MapPin, X, CheckCircle, Calendar, Phone, Mail, CalendarDays, CheckSquare
} from "lucide-react";
import { supabase } from '@/lib/supabase';

export default function ManagerLeadsPage() {
  
   const getWeekNumber = (dateString) => {
     if (!dateString) return null;
     const date = new Date(dateString);
     return Math.ceil(date.getDate() / 7);
   };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourcedByOptions, setSourcedByOptions] = useState([]);
  const [fseOptions, setFseOptions] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
        console.log('API called');
        try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch('/api/domestic/manager/leads', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const data = await response.json();
          console.log('API response:', data);
          const leadsArray = Array.isArray(data.leads) ? data.leads : [];
          const fseTeam = data.fseTeam || [];
          setLeads(leadsArray);
          setFilteredLeads(leadsArray);
          const uniqueSourcedBy = [...new Set(leadsArray.map(l => l.sourcedBy))];
          setSourcedByOptions(uniqueSourcedBy);
          setFseOptions(fseTeam.map(f => ({ id: f.user_id, name: f.name })));
          if (fseTeam.length > 0) {
            setAssignFseName(fseTeam[0].name);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
    fetchLeads();
  }, []);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState(""); 
  const [assignFseName, setAssignFseName] = useState("");
  const [visitDate, setVisitDate] = useState("");

  // --- FILTER STATE ---
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    company: "",
    location: "",
    status: "All",
    subStatus: "All",
    sourcedBy: "All"
  });

  // --- REAL-TIME FILTER LOGIC ---
  useEffect(() => {
    let result = leads;

    if (filters.fromDate) {
        result = result.filter(l => {
          if (!l.arrivedDate) return false;
          const [day, month, year] = l.arrivedDate.split('/');
          const arrivedDate = new Date(`${year}-${month}-${day}`);
          return arrivedDate >= new Date(filters.fromDate);
        });
    }
    if (filters.toDate) {
        result = result.filter(l => {
          if (!l.arrivedDate) return false;
          const [day, month, year] = l.arrivedDate.split('/');
          const arrivedDate = new Date(`${year}-${month}-${day}`);
          return arrivedDate <= new Date(filters.toDate);
        });
    }
    if (filters.company) {
        result = result.filter(l => l.company.toLowerCase().includes(filters.company.toLowerCase()));
    }
    if (filters.location) {
        result = result.filter(l =>
            l.location.toLowerCase().includes(filters.location.toLowerCase()) ||
            l.state.toLowerCase().includes(filters.location.toLowerCase())
        );
    }
    if (filters.status !== "All") {
        result = result.filter(l => l.status === filters.status);
    }
    if (filters.subStatus !== "All") {
        result = result.filter(l => l.sub_status === filters.subStatus);
    }
    if (filters.sourcedBy !== "All") {
        result = result.filter(l => l.sourcedBy === filters.sourcedBy);
    }

    setFilteredLeads(result);

  }, [filters, leads]);


  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- ACTIONS ---
  const handleAction = (lead, type) => {
    setSelectedLead(lead);
    setModalType(type);
    setIsFormOpen(true);
  };

  const handleConfirmAction = async () => {
    if (modalType === 'assign_fse') {
      const fse = fseOptions.find(f => f.name === assignFseName);
      if (!fse || !visitDate) {
        alert('Please select FSE and visit date');
        return;
      }
      try {
        const response = await fetch('/api/domestic/manager/leads/assign-fse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            client_id: selectedLead.id,
            fse_id: fse.id,
            date: visitDate
          })
        });
        if (!response.ok) {
          throw new Error('Failed to assign FSE');
        }
        // Update local state
        const updatedLeads = leads.map(l => {
          if (l.id === selectedLead.id) {
            return {
              ...l,
              isProcessed: true,
              actionType: 'FSE',
              assignedTo: assignFseName,
              assignedDate: new Date().toISOString().split('T')[0],
              visitStatus: 'Pending Visit'
            };
          }
          return l;
        });
        setLeads(updatedLeads);
        setFilteredLeads(updatedLeads);
        setIsFormOpen(false);
      } catch (error) {
        console.error(error);
        alert('Error assigning FSE');
      }
    } else {
      // For pass_delivery, keep the local update
      const updatedLeads = leads.map(l => {
        if (l.id === selectedLead.id) {
          return {
            ...l,
            isProcessed: true,
            actionType: 'DELIVERY'
          };
        }
        return l;
      });
      setLeads(updatedLeads);
      setFilteredLeads(updatedLeads);
      setIsFormOpen(false);
    }
  };

  return (
    <div className="p-4 h-screen flex flex-col font-['Calibri'] bg-gray-50/50">
      
      {/* 1. HEADER */}
      <div className="mb-4 flex flex-col gap-1">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Sourced Leads Review</h1>
         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Assign FSE or Move to Delivery</p>
      </div>

      {/* 2. FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 grid grid-cols-7 gap-3 items-end">
         
         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">From</label>
            <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition" 
                onChange={(e) => handleFilterChange("fromDate", e.target.value)} />
         </div>

         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">To</label>
            <input type="date" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition" 
                onChange={(e) => handleFilterChange("toDate", e.target.value)} />
         </div>

         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Company</label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <input type="text" placeholder="Name..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition"
                    onChange={(e) => handleFilterChange("company", e.target.value)} />
            </div>
         </div>

         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Loc / State</label>
            <input type="text" placeholder="Delhi..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition"
                onChange={(e) => handleFilterChange("location", e.target.value)} />
         </div>

         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition cursor-pointer"
                onChange={(e) => handleFilterChange("status", e.target.value)}>
               <option value="All">All</option>
               <option>Sent to Manager</option>
               <option>Interested</option>
               <option>Onboard</option>
            </select>
         </div>

         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sub-Status</label>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition cursor-pointer"
                onChange={(e) => handleFilterChange("subStatus", e.target.value)}>
               <option value="All">All</option>
               <option>Pending Approval</option>
               <option>Ready for Onboard</option>
            </select>
         </div>

         <div className="col-span-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sourced By</label>
            <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition cursor-pointer"
                onChange={(e) => handleFilterChange("sourcedBy", e.target.value)}>
               <option value="All">All Agents</option>
               {sourcedByOptions.map(name => (
                 <option key={name} value={name}>{name}</option>
               ))}
            </select>
         </div>

      </div>

      {/* 3. TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-x-auto overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500 font-bold uppercase tracking-widest">Loading leads...</div>
          </div>
        ) : (
        <table className="w-full table-auto border-collapse text-left">
          
          {/* HEADER */}
          <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap w-28">Arrived Date</th>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap w-40">Sourced By</th>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[200px]">Client Name</th>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap w-40">Location & State</th>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[250px]">Latest Remark</th>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap w-40 text-center">Status</th>
              <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap w-32 text-center">Weekly Plan</th>
              <th className="px-4 py-3 text-center bg-[#0d316a] sticky right-0 z-20 min-w-[150px]">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/50 transition duration-150 group">
                  
                  <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-gray-600 font-bold">{lead.arrivedDate}</td>

                  <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#103c7f] flex items-center justify-center font-bold text-[10px]">
                           {lead.sourcedBy.charAt(0)}
                        </div>
                        <span>{lead.sourcedBy}</span>
                     </div>
                  </td>

                  <td className="px-4 py-3 border-r border-gray-100 font-bold text-[#103c7f] text-sm whitespace-nowrap">{lead.company}</td>
                  
                  <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                     <div className="font-bold text-gray-700">{lead.location}</div>
                     <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{lead.state}</div>
                  </td>

                  <td className="px-4 py-3 border-r border-gray-100 max-w-[250px]">
                     <p className="italic text-gray-500 truncate" title={lead.latestRemark}>"{lead.latestRemark}"</p>
                  </td>

                  <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-center">
                     <div className="flex flex-col items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                           lead.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' :
                           lead.status === 'Onboard' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                           'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                           {lead.status}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{lead.subStatus}</span>
                     </div>
                  </td>
                  {/* 👉 UPDATED COLUMN: Weekly Plan + FSE Status */}
                  <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-center">
                     {lead.assignedDate && lead.actionType === 'FSE' ? (
                        <div className="flex flex-col items-center gap-1.5">
                           
                           {/* 1. Date & Week */}
                           <div className="flex items-center gap-2">
                              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                                 W{getWeekNumber(lead.assignedDate)}
                              </span>
                              <span className="text-[10px] text-gray-600 font-bold">
                                 {formatDate(lead.assignedDate)}
                              </span>
                           </div>

                           {/* 2. Visit Status (from FSE) */}
                           {lead.visitStatus ? (
                             <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase flex items-center gap-1 ${
                               lead.visitStatus === 'visited' ? 'bg-green-50 text-green-700 border-green-200' :
                               lead.visitStatus === 'rescheduled' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                               lead.visitStatus === 'not_visited' ? 'bg-red-50 text-red-700 border-red-200' :
                               'bg-gray-50 text-gray-500 border-gray-200'
                             }`}>
                               {lead.visitStatus === 'visited' && <CheckSquare size={10}/>}
                               {lead.visitStatus === 'rescheduled' && <CalendarDays size={10}/>}
                               {lead.visitStatus === 'not_visited' && '✗'}
                               {lead.visitStatus}
                             </span>
                           ) : (
                             <span className="text-[9px] text-gray-400 italic">Pending</span>
                           )}

                        </div>
                     ) : (
                        <span className="text-gray-300 font-bold">-</span>
                     )}
                  </td>

                  {/* ACTIONS COLUMN */}
<td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-50/20 border-l border-gray-200 z-10 whitespace-nowrap shadow-[-4px_0px_8px_-4px_rgba(0,0,0,0.05)]">
  
  {/* Check if processed (Locked) */}
  {lead.isProcessed ? (
     <div className="flex items-center justify-center gap-2">
        {/* 1. View Button (Always visible) */}
        <button 
          onClick={() => handleAction(lead, 'view')} 
          className="p-2 text-gray-400 hover:text-[#103c7f] bg-gray-50 rounded-lg border border-gray-100 transition shadow-sm"
        >
          <Eye size={16} />
        </button>

        {/* 2. Status Label (Instead of Actions) */}
        <div className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 ${
           lead.actionType === 'DELIVERY' 
           ? 'bg-green-50 text-green-700 border-green-200' 
           : 'bg-indigo-50 text-indigo-700 border-indigo-200'
        }`}>
           {lead.actionType === 'DELIVERY' ? (
              <> <Truck size={12} /> Sent to Delivery </>
           ) : (
              <> <UserPlus size={12} /> {lead.assignedTo?.split('(')[0] || 'Assigned'} </>
           )}
        </div>
     </div>
  ) : (
     // Normal Buttons (If NOT processed)
     <div className="flex items-center justify-center gap-3">
        <button onClick={() => handleAction(lead, 'view')} className="p-2 text-gray-500 hover:text-[#103c7f] hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition shadow-sm tooltip">
          <Eye size={16} />
        </button>
        <button onClick={() => handleAction(lead, 'assign_fse')} className="p-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-sm" title="Assign FSE">
          <UserPlus size={16} />
        </button>
        <button onClick={() => handleAction(lead, 'pass_delivery')} className="p-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition shadow-sm" title="Pass to Delivery">
          <Truck size={16} />
        </button>
     </div>
  )}
</td>

                </tr>
              ))
            ) : (
               <tr><td colSpan="8" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">No pending leads found</td></tr>
            )}
          </tbody>
        </table>
        )}
      </div>

      {/* --- MODALS --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-2">
          <div className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white ${
             modalType === 'view' ? 'max-w-5xl' : 'max-w-md'
          }`}>
            
            {/* Header */}
            <div className="bg-[#103c7f] p-2 flex justify-between items-center text-white shadow-md">
               <h3 className="font-bold text-lg uppercase tracking-wide">
                  {modalType === 'view' ? 'Lead Overview & History' : 
                   modalType === 'assign_fse' ? 'Assign Field Executive' : 
                   'Pass to Delivery'}
               </h3>
               <button onClick={() => setIsFormOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={20} /></button>
            </div>

            {/* === CONTENT: VIEW MODE === */}
            {modalType === 'view' && selectedLead && (
               <div className="flex flex-col h-full bg-white">
                  
                  {/* 1. TOP SECTION: Header & Overview */}
                  <div className="p-4 border-b border-gray-100 pb-2">
                     
                     {/* Company Header */}
                     <div className="flex justify-between items-start mb-5">
                        <div>
                           <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none mb-2">
                              {selectedLead.company}
                           </h2>
                           <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                                 {selectedLead.category}
                              </span>
                              <span className="flex items-center gap-1">
                                 <MapPin size={14} className="text-gray-400"/> 
                                 {selectedLead.location}, {selectedLead.state}
                              </span>
                           </div>
                        </div>
                        
                        
                     </div>

                     {/* Details Grid */}
                     <div className="grid grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200/60">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourced By</span>
                           <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[9px]">
                                 {selectedLead.sourcedBy.charAt(0)}
                              </div>
                              <span className="font-bold text-gray-800 text-sm">{selectedLead.sourcedBy}</span>
                           </div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourcing Date</span>
                           <span className="font-bold text-gray-800 text-sm font-mono">{selectedLead.sourcingDate}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Emp. Count</span>
                           <span className="font-bold text-gray-800 text-sm">{selectedLead.empCount}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reference</span>
                           <span className="font-bold text-gray-800 text-sm">{selectedLead.reference}</span>
                        </div>
                     </div>
                  </div>

                  {/* 2. BOTTOM SECTION: History Table */}
                  <div className="flex-1 p-4 bg-white flex flex-col min-h-0">
                     <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[#103c7f] font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> LeadGen Interaction History
                        </h4>
                     </div>
                     
                     <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 shadow-sm">
                        <div className="overflow-y-auto h-68 custom-scrollbar"> 
                           <table className="w-full text-left border-collapse">
                              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                                 <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Contact Person</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Contact Info</th>
                                    <th className="px-6 py-4 w-1/3 min-w-[200px]">Remarks</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Sub-Status</th>
                                 </tr>
                              </thead>
                              <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                                 {selectedLead.interactions && selectedLead.interactions.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/30 transition duration-150">
                                       
                                       {/* Date */}
                                       <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">{log.date}</td>
                                       
                                       {/* Contact Person (Avatar + Name + Role) */}
                                       <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex items-center gap-3">
                                             <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shadow-sm border border-purple-200">
                                                {log.person.charAt(0) + (log.person.split(' ')[1]?.[0] || '')}
                                             </div>
                                             <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-sm">{log.person}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wide">{log.role || 'N/A'}</span>
                                             </div>
                                          </div>
                                       </td>

                                       {/* Contact Info (Phone + Email) */}
                                       <td className="px-6 py-4 whitespace-nowrap">
                                          <div className="flex flex-col gap-1.5">
                                             {log.phone && (
                                                <span className="flex items-center gap-2 text-gray-600 font-bold bg-gray-50 px-2 py-0.5 rounded w-fit border border-gray-100">
                                                   <Phone size={10} className="text-gray-400"/> {log.phone}
                                                </span>
                                             )}
                                             {log.email && (
                                                <span className="flex items-center gap-2 text-blue-500 hover:text-blue-700 cursor-pointer font-medium">
                                                   <Mail size={10} /> {log.email}
                                                </span>
                                             )}
                                          </div>
                                       </td>

                                       {/* Remarks */}
                                       <td className="px-6 py-4 italic text-gray-500 leading-relaxed">"{log.remarks}"</td>
                                       
                                       {/* Status */}
                                       <td className="px-6 py-4 whitespace-nowrap">
                                          <span className="bg-gray-100 border border-gray-200 px-2.5 py-1 rounded text-[10px] font-bold text-gray-600 uppercase">
                                             {log.status}
                                          </span>
                                       </td>
                                       
                                       {/* Sub-Status */}
                                       <td className="px-6 py-4 whitespace-nowrap">{log.subStatus}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* === CONTENT: ASSIGN FSE === */}
            {modalType === 'assign_fse' && (
               <div className="p-6">
                  <p className="text-xs text-gray-500 mb-5 font-medium bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                     Assigning FSE for <strong className="text-indigo-900">{selectedLead.company}</strong>.
                  </p>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select FSE</label>
                           <select value={assignFseName} onChange={(e) => setAssignFseName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mt-1 outline-none focus:border-[#103c7f] focus:ring-1 focus:ring-[#103c7f] transition bg-white">
                              {fseOptions.map(f => (
                                <option key={f.id} value={f.name}>{f.name}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visit Date</label>
                           <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm mt-1 outline-none focus:border-[#103c7f] focus:ring-1 focus:ring-[#103c7f] transition text-gray-700 font-bold" />
                        </div>
                     </div>
                     
                    
                  </div>
                  
                  <button onClick={handleConfirmAction} className="w-full mt-6 bg-[#103c7f] hover:bg-blue-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 transition transform active:scale-95">
                     <UserPlus size={18} /> Confirm Schedule
                  </button>
               </div>
            )}

            {/* === CONTENT: PASS TO DELIVERY === */}
            {modalType === 'pass_delivery' && (
               <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="bg-green-50 p-5 rounded-full text-green-600 mb-5 shadow-sm animate-in zoom-in duration-300">
                     <Truck size={40} />
                  </div>
                  <h3 className="text-xl font-black text-gray-800">Move to Delivery?</h3>
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-xs">
                     You are moving <strong className="text-green-700">{selectedLead.company}</strong> directly to the Delivery Team for onboarding. 
                  </p>
                  <div className="bg-orange-50 text-orange-700 text-xs font-bold px-4 py-2 rounded-lg mt-4 border border-orange-100">
                     ⚠️ Ensure payment & agreement terms are discussed.
                  </div>
                  <button onClick={handleConfirmAction} className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 flex justify-center items-center gap-2 transition transform active:scale-95">
                     <CheckCircle size={18} /> Confirm Handover
                  </button>
               </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}