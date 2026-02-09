"use client";
import { useState, useEffect } from "react";
import { 
  Eye, Search, Users, Truck, MapPin, Phone, Mail, 
  CalendarDays, Database, ListChecks, ArrowRightCircle 
} from "lucide-react";

export default function FseOnboardPage() {
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('onboard'); // 'onboard' or 'database'
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    company: "",
    location: "",
    status: "All",
    subStatus: "All",
    sourcedBy: "All Agents"
  });

  // --- MOCK DATA (Structure adapted for both views) ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLeads([
        { 
          id: 1, 
          // Onboard Specific
          fseName: "Amit Kumar", sentDate: "14-02-2024", clientType: "Premium",
          // Database Specific
          sourcingDate: "10-01-2024", sourcingMode: "Cold Call", category: "Retail", projection: "High",
          // Common
          company: "Sharma General Store", location: "Sec 18", state: "Noida",
          name: "Mr. Sharma", email: "sharma@gmail.com", phone: "9876543210",
          followupDate: "16-02-2024", mode: "Visit",
          remark: "Documents collected, verification pending", 
          status: "Pending", subStatus: "Verification"
        },
        { 
          id: 2, 
          fseName: "Rahul Singh", sentDate: "12-02-2024", clientType: "Standard",
          sourcingDate: "05-02-2024", sourcingMode: "Referral", category: "IT", projection: "Medium",
          company: "Tech Solutions", location: "Indirapuram", state: "Ghaziabad",
          name: "Rajesh Gupta", email: "raj@techsol.com", phone: "9988776655",
          followupDate: "15-02-2024", mode: "Call",
          remark: "Interested in premium plan", 
          status: "Verified", subStatus: "Ready"
        },
        { 
          id: 3, 
          fseName: "Vikram Malhotra", sentDate: "10-02-2024", clientType: "Standard",
          sourcingDate: "01-02-2024", sourcingMode: "Walk-in", category: "Hospitality", projection: "Low",
          company: "Urban Cafe", location: "Hauz Khas", state: "Delhi",
          name: "Simran Kaur", email: "simran@cafe.com", phone: "8877665544",
          followupDate: "18-02-2024", mode: "Visit",
          remark: "Shop closed on visit", 
          status: "Rejected", subStatus: "Closed"
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleAction = (id, action) => {
      alert(`${action} triggered for ID: ${id}`);
  };

  // --- FILTER LOGIC ---
  const filteredLeads = leads.filter(lead => {
    // 1. Tab Logic: You can add specific logic here if 'onboard' tab shows different data subset than 'database'
    // For now, assuming same data pool, just different columns
    // if (activeTab === 'onboard' && lead.status === 'Rejected') return false; 

    // 2. Filter Inputs
    return (
      (filters.company === "" || lead.company.toLowerCase().includes(filters.company.toLowerCase())) &&
      (filters.location === "" || lead.location.toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.sourcedBy === "All Agents" || lead.fseName === filters.sourcedBy) &&
      (filters.status === "All" || lead.status === filters.status)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2">
      
      {/* 1. PAGE HEADER & TABS */}
      <div className="mb-3 flex justify-between items-end">
         
         {/* Title */}
         <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
               <Users size={26} /> FSE Overview
            </h1>
           
         </div>

         {/* Tabs */}
         <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 gap-1">
              <button 
                onClick={() => setActiveTab('onboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'onboard' 
                    ? 'bg-[#103c7f] text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                  <ListChecks size={16} /> FSE Onboard
              </button>
              <button 
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === 'database' 
                    ? 'bg-[#103c7f] text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                  <Database size={16} /> All Database
              </button>
          </div>
      </div>

      {/* 2. FILTER SECTION */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-3 overflow-x-auto">
        <div className="flex items-end gap-3 min-w-max">
            
            <div className="w-[130px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
                <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"/>
            </div>

            <div className="w-[130px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To</label>
                <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"/>
            </div>

            <div className="w-[200px] flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company</label>
                <div className="relative">
                    <input type="text" name="company" placeholder="Name..." value={filters.company} onChange={handleFilterChange} className="w-full pl-7 bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"/>
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                </div>
            </div>

            <div className="w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Loc / State</label>
                <input type="text" name="location" placeholder="Delhi..." value={filters.location} onChange={handleFilterChange} className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none focus:border-blue-300"/>
            </div>

            <div className="w-[120px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer">
                    <option value="All">All</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            <div className="w-[120px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sub-Status</label>
                <select name="subStatus" value={filters.subStatus} onChange={handleFilterChange} className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer">
                    <option value="All">All</option>
                    <option value="New">New</option>
                    <option value="Ready">Ready</option>
                </select>
            </div>

            <div className="w-[160px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">FSE / Sourced By</label>
                <select name="sourcedBy" value={filters.sourcedBy} onChange={handleFilterChange} className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer">
                    <option value="All Agents">All Agents</option>
                    <option value="Amit Kumar">Amit Kumar</option>
                    <option value="Rahul Singh">Rahul Singh</option>
                    <option value="Vikram Malhotra">Vikram Malhotra</option>
                </select>
            </div>

        </div>
      </div>

      {/* 3. TABLE SECTION */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-[#103c7f] text-white text-[11px] font-bold uppercase tracking-wide">
                     {/* Dynamic Headers based on Tab */}
                     {activeTab === 'onboard' ? (
                        <>
                            <th className="px-6 py-4 whitespace-nowrap border-r border-blue-800">FSE Name & Sent Date</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">Company & Type</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">State & Location</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">LatestContact Info</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">Latest Followup</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap w-1/4">Remarks</th>
                            <th className="px-6 py-4 border-r border-blue-800 text-center whitespace-nowrap">Status / Sub-Status</th>
                            <th className="px-6 py-4 text-center whitespace-nowrap bg-[#0d316a] sticky right-0 z-20">Action</th>
                        </>
                     ) : (
                        <>
                            <th className="px-6 py-4 whitespace-nowrap border-r border-blue-800">Sourcing Date & Mode</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">Company & Category</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">State & Location</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">Latest Contact Info</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">Followup date & Mode</th>
                            <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap w-1/4">Remarks</th>
                            <th className="px-6 py-4 border-r border-blue-800 text-center whitespace-nowrap">Status / Sub-Status</th>
                            <th className="px-6 py-4 border-r border-blue-800 text-center whitespace-nowrap">Projection</th>
                            <th className="px-6 py-4 text-center whitespace-nowrap bg-[#0d316a] sticky right-0 z-20">Action</th>
                        </>
                     )}
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {loading ? (
                     <tr><td colSpan={activeTab === 'onboard' ? 8 : 9} className="py-12 text-center text-gray-400">Loading data...</td></tr>
                  ) : filteredLeads.length === 0 ? (
                     <tr>
                        <td colSpan={activeTab === 'onboard' ? 8 : 9} className="py-16 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-300">
                              <Search size={40} className="mb-2 opacity-50"/>
                              <p className="text-sm font-bold uppercase tracking-widest">No Leads Found</p>
                           </div>
                        </td>
                     </tr>
                  ) : (
                     filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                           
                           {/* === ONBOARD TAB COLUMNS (8 Cols) === */}
                           {activeTab === 'onboard' && (
                               <>
                                   {/* 1. FSE Name & Sent Date */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-[#103c7f]">{lead.fseName}</span>
                                           <span className="text-[10px] text-gray-400 font-bold">{lead.sentDate}</span>
                                       </div>
                                   </td>

                                   {/* 2. Company & Client Type */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-800">{lead.company}</span>
                                           <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded w-fit uppercase font-bold mt-0.5">{lead.clientType}</span>
                                       </div>
                                   </td>

                                   {/* 3. State & Location */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-700">{lead.location}</span>
                                           <span className="text-[10px] text-gray-400 uppercase tracking-wide">{lead.state}</span>
                                       </div>
                                   </td>

                                   {/* 4. Contact Info */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col gap-0.5">
                                           <span className="font-bold text-gray-700">{lead.name}</span>
                                           <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone size={10}/> {lead.phone}</span>
                                           <span className="text-[10px] text-blue-500 flex items-center gap-1"><Mail size={10}/> {lead.email}</span>
                                       </div>
                                   </td>

                                   {/* 5. Followup & Mode */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-orange-600">{lead.followupDate}</span>
                                           <span className="text-[10px] text-gray-400 uppercase font-bold">{lead.mode}</span>
                                       </div>
                                   </td>

                                   {/* 6. Remarks */}
                                   <td className="px-6 py-4 border-r border-gray-100 text-gray-500 italic truncate max-w-xs" title={lead.remark}>
                                       "{lead.remark}"
                                   </td>

                                   {/* 7. Status & Substatus */}
                                   <td className="px-6 py-4 border-r border-gray-100 text-center">
                                       <div className="flex flex-col items-center gap-1">
                                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                               lead.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' :
                                               lead.status === 'Pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                               'bg-red-50 text-red-700 border border-red-200'
                                           }`}>
                                               {lead.status}
                                           </span>
                                           <span className="text-[10px] text-gray-400 font-bold uppercase">({lead.subStatus})</span>
                                       </div>
                                   </td>

                                   {/* 8. Actions (View, Sent to Delivery) */}
                                   <td className="px-6 py-4 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_10px_rgba(0,0,0,0.05)]">
                                       <div className="flex items-center justify-center gap-2">
                                           <button onClick={() => handleAction(lead.id, 'view')} className="p-1.5 text-gray-500 bg-white border border-gray-200 hover:text-blue-600 hover:border-blue-200 rounded transition-colors shadow-sm" title="View Details">
                                               <Eye size={16}/>
                                           </button>
                                           <button onClick={() => handleAction(lead.id, 'delivery')} className="p-1.5 text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 rounded transition-colors shadow-sm" title="Sent to Delivery">
                                               <Truck size={16}/>
                                           </button>
                                       </div>
                                   </td>
                               </>
                           )}

                           {/* === DATABASE TAB COLUMNS (9 Cols) === */}
                           {activeTab === 'database' && (
                               <>
                                   {/* 1. Sourcing Date & Mode */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-600">{lead.sourcingDate}</span>
                                           <span className="text-[10px] text-gray-400 font-bold uppercase">{lead.sourcingMode}</span>
                                       </div>
                                   </td>

                                   {/* 2. Company & Category */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-[#103c7f]">{lead.company}</span>
                                           <span className="text-[10px] text-gray-400 uppercase tracking-wide">{lead.category}</span>
                                       </div>
                                   </td>

                                   {/* 3. State & Location */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-700">{lead.location}</span>
                                           <span className="text-[10px] text-gray-400 uppercase tracking-wide">{lead.state}</span>
                                       </div>
                                   </td>

                                   {/* 4. Latest Contact Info */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col gap-0.5">
                                           <span className="font-bold text-gray-700">{lead.name}</span>
                                           <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone size={10}/> {lead.phone}</span>
                                           <span className="text-[10px] text-blue-500 flex items-center gap-1"><Mail size={10}/> {lead.email}</span>
                                       </div>
                                   </td>

                                   {/* 5. Followup & Mode */}
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-orange-600">{lead.followupDate}</span>
                                           <span className="text-[10px] text-gray-400 uppercase font-bold">{lead.mode}</span>
                                       </div>
                                   </td>

                                   {/* 6. Remarks */}
                                   <td className="px-6 py-4 border-r border-gray-100 text-gray-500 italic truncate max-w-xs" title={lead.remark}>
                                       "{lead.remark}"
                                   </td>

                                   {/* 7. Status & Substatus */}
                                   <td className="px-6 py-4 border-r border-gray-100 text-center">
                                       <div className="flex flex-col items-center gap-1">
                                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                               lead.status === 'Verified' ? 'bg-green-50 text-green-700 border border-green-200' :
                                               lead.status === 'Pending' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                               'bg-red-50 text-red-700 border border-red-200'
                                           }`}>
                                               {lead.status}
                                           </span>
                                           <span className="text-[10px] text-gray-400 font-bold uppercase">({lead.subStatus})</span>
                                       </div>
                                   </td>

                                   {/* 8. Projection */}
                                   <td className="px-6 py-4 border-r border-gray-100 text-center">
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                           lead.projection === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                           lead.projection === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                           'bg-gray-50 text-gray-500 border-gray-200'
                                       }`}>
                                           {lead.projection || 'N/A'}
                                       </span>
                                   </td>

                                   {/* 9. Action (View Only) */}
                                   <td className="px-6 py-4 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_10px_rgba(0,0,0,0.05)]">
                                       <button onClick={() => handleAction(lead.id, 'view')} className="p-1.5 text-gray-500 bg-white border border-gray-200 hover:text-blue-600 hover:border-blue-200 rounded transition-colors shadow-sm" title="View Details">
                                           <Eye size={16}/>
                                       </button>
                                   </td>
                               </>
                           )}

                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
}