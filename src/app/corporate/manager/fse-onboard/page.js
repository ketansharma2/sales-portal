"use client";
import { useState, useEffect } from "react";
import { 
  Eye, Search, Users, Truck, MapPin, Phone, Mail, 
  CalendarDays, Database, ListChecks, ArrowRightCircle, CheckCircle,
  X, Calendar, Briefcase, User, ArrowRightCircle as ArrowRightCircleIcon
} from "lucide-react";

export default function FseOnboardPage() {
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('onboard'); // 'onboard' or 'database'
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalType, setModalType] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deliveryUser, setDeliveryUser] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

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

  // --- MOCK DATA ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLeads([
        { 
          id: 1, 
          fseName: "Amit Kumar", sentDate: "14-02-2024", clientType: "Premium",
          sourcingDate: "10-01-2024", sourcingMode: "Cold Call", category: "Retail", projection: "High",
          company: "Sharma General Store", location: "Sec 18", state: "Noida", city: "Noida",
          name: "Mr. Sharma", email: "sharma@gmail.com", phone: "9876543210",
          followupDate: "16-02-2024", mode: "Visit",
          remark: "Documents collected, verification pending", 
          status: "Pending", subStatus: "Verification",
          empCount: "10-50", reference: "LinkedIn", startup: "No",
          interactions: [
            { date: "2024-02-10", person: "Mr. Sharma", phone: "9876543210", email: "sharma@gmail.com", remarks: "Initial discussion about premium plan. Interested.", status: "Pending", subStatus: "Verification", nextFollowUp: "2024-02-16", mode: "Visit", user_name: "Amit Kumar" }
          ]
        },
        { 
          id: 2, 
          fseName: "Rahul Singh", sentDate: "12-02-2024", clientType: "Standard",
          sourcingDate: "05-02-2024", sourcingMode: "Referral", category: "IT", projection: "Medium",
          company: "Tech Solutions", location: "Indirapuram", state: "Ghaziabad", city: "Ghaziabad",
          name: "Rajesh Gupta", email: "raj@techsol.com", phone: "9988776655",
          followupDate: "15-02-2024", mode: "Call",
          remark: "Interested in premium plan", 
          status: "Verified", subStatus: "Ready",
          empCount: "50-100", reference: "Client Ref", startup: "Yes",
          interactions: [
            { date: "2024-02-12", person: "Rajesh", phone: "9988776655", remarks: "Agreed to terms.", status: "Verified", subStatus: "Ready", nextFollowUp: "2024-02-15", mode: "Call", user_name: "Rahul Singh" }
          ]
        },
        { 
          id: 3, 
          fseName: "Vikram Malhotra", sentDate: "10-02-2024", clientType: "Standard",
          sourcingDate: "01-02-2024", sourcingMode: "Walk-in", category: "Hospitality", projection: "Low",
          company: "Urban Cafe", location: "Hauz Khas", state: "Delhi", city: "Delhi",
          name: "Simran Kaur", email: "simran@cafe.com", phone: "8877665544",
          followupDate: "18-02-2024", mode: "Visit",
          remark: "Shop closed on visit", 
          status: "Rejected", subStatus: "Closed",
          empCount: "5-10", reference: "Walk-in", startup: "No",
          interactions: []
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
      const lead = leads.find(l => l.id === id);
      if(!lead) return;

      setSelectedLead(lead);
      setModalType(action); // 'view' or 'delivery'
      setIsFormOpen(true);
  };

  const submitHandover = () => {
      alert(`Handover to ${deliveryUser}: ${selectedLead.company}\nNote: ${deliveryNote}`);
      setIsFormOpen(false);
      setDeliveryUser("");
      setDeliveryNote("");
      setSelectedLead(null);
      setModalType(null);
  };

  // Consistent Styling for View Modal
  const inputStyle = `w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#103c7f]/20 transition shadow-sm disabled:bg-gray-50 disabled:text-gray-500`;

  // --- FILTER LOGIC ---
  const filteredLeads = leads.filter(lead => {
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
                           
                           {activeTab === 'onboard' && (
                               <>
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-[#103c7f]">{lead.fseName}</span>
                                           <span className="text-[10px] text-gray-400 font-bold">{lead.sentDate}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-800">{lead.company}</span>
                                           <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded w-fit uppercase font-bold mt-0.5">{lead.clientType}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-700">{lead.location}</span>
                                           <span className="text-[10px] text-gray-400 uppercase tracking-wide">{lead.state}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col gap-0.5">
                                           <span className="font-bold text-gray-700">{lead.name}</span>
                                           <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone size={10}/> {lead.phone}</span>
                                           <span className="text-[10px] text-blue-500 flex items-center gap-1"><Mail size={10}/> {lead.email}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-orange-600">{lead.followupDate}</span>
                                           <span className="text-[10px] text-gray-400 uppercase font-bold">{lead.mode}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 text-gray-500 italic truncate max-w-xs" title={lead.remark}>
                                       "{lead.remark}"
                                   </td>

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

                           {activeTab === 'database' && (
                               <>
                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-600">{lead.sourcingDate}</span>
                                           <span className="text-[10px] text-gray-400 font-bold uppercase">{lead.sourcingMode}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-[#103c7f]">{lead.company}</span>
                                           <span className="text-[10px] text-gray-400 uppercase tracking-wide">{lead.category}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-gray-700">{lead.location}</span>
                                           <span className="text-[10px] text-gray-400 uppercase tracking-wide">{lead.state}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col gap-0.5">
                                           <span className="font-bold text-gray-700">{lead.name}</span>
                                           <span className="text-[10px] text-gray-500 flex items-center gap-1"><Phone size={10}/> {lead.phone}</span>
                                           <span className="text-[10px] text-blue-500 flex items-center gap-1"><Mail size={10}/> {lead.email}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                       <div className="flex flex-col">
                                           <span className="font-bold text-orange-600">{lead.followupDate}</span>
                                           <span className="text-[10px] text-gray-400 uppercase font-bold">{lead.mode}</span>
                                       </div>
                                   </td>

                                   <td className="px-6 py-4 border-r border-gray-100 text-gray-500 italic truncate max-w-xs" title={lead.remark}>
                                       "{lead.remark}"
                                   </td>

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

                                   <td className="px-6 py-4 border-r border-gray-100 text-center">
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                           lead.projection === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                           lead.projection === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                           'bg-gray-50 text-gray-500 border-gray-200'
                                       }`}>
                                           {lead.projection || 'N/A'}
                                       </span>
                                   </td>

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

      {/* --- PASS TO DELIVERY MODAL --- */}
      {isFormOpen && modalType === "delivery" && selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                  <div className="p-6">
                      {/* Blue Header Box */}
                      <div className="flex items-center gap-3 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <div className="bg-blue-200 text-[#103c7f] p-2 rounded-full">
                              <Truck size={24} />
                          </div>
                          <div>
                              <h4 className="font-bold text-[#103c7f] text-lg leading-none">{selectedLead.company}</h4>
                              <p className="text-xs text-gray-500 uppercase font-bold mt-1">Passing to Delivery Operations</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {/* Manager Select */}
                          <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assign to Delivery Manager</label>
                              <select 
                                  value={deliveryUser} 
                                  onChange={(e) => setDeliveryUser(e.target.value)} 
                                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#103c7f] focus:ring-1 focus:ring-[#103c7f]"
                              >
                                  <option value="">Select Manager...</option>
                                  <option value="dm1">Suresh (IT Delivery)</option>
                                  <option value="dm2">Anita (Non-IT Delivery)</option>
                              </select>
                          </div>

                          {/* Remarks Textarea */}
                          
                      </div>

                      {/* Footer Buttons */}
                      <div className="mt-8 flex justify-end gap-3">
                          <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Cancel</button>
                          <button 
                              onClick={submitHandover} 
                              disabled={!deliveryUser}
                              className="bg-[#103c7f] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-900 transition flex items-center gap-2"
                          >
                              <CheckCircle size={18} /> Confirm Handover
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- VIEW LEAD MODAL (VIEW ONLY) --- */}
      {isFormOpen && modalType === "view" && selectedLead && (
          <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 font-['Calibri']">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90dvh] h-auto flex flex-col overflow-hidden border border-white/50">
                  
                  {/* 1. Header (Company Name & Location) */}
                  <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-start bg-white">
                      <div className="flex gap-4 items-center">
                          <div className="p-3 bg-blue-50 text-[#103c7f] rounded-xl border border-blue-100">
                              <Briefcase size={24} />
                          </div>
                          <div>
                              <h2 className="text-2xl font-black text-[#103c7f] italic uppercase tracking-tight">{selectedLead.company}</h2>
                              <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                                  <MapPin size={12} /> {selectedLead.location}
                              </div>
                          </div>
                      </div>
                      <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                          <X size={24} />
                      </button>
                  </div>

                  {/* 2. Top Info Cards (Horizontal Strip) */}
                  <div className="px-8 py-6 bg-gray-50/50">
                      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                          {/* Card 1: Sourcing Date */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Calendar size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sourcing Date</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.sourcingDate}</p>
                              </div>
                          </div>
                          {/* Card 2: Category */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Briefcase size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Category</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.category}</p>
                              </div>
                          </div>
                          {/* Card 3: Sourcing Mode */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Phone size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Sourcing Mode</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.sourcingMode}</p>
                              </div>
                          </div>
                          {/* Card 4: Emp Count */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Users size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Emp Count</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.empCount}</p>
                              </div>
                          </div>
                          {/* Card 5: Reference */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Database size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Reference</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.reference}</p>
                              </div>
                          </div>
                          {/* Card 6: Current Status */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-green-50 p-2 rounded-lg text-green-600"><CheckCircle size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Current Status</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.status}</p>
                              </div>
                          </div>
                          {/* Card 7: Projection */}
                          <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                              <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><ArrowRightCircleIcon size={18}/></div>
                              <div>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Projection</p>
                                  <p className="text-xs font-bold text-gray-800">{selectedLead.projection}</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* 3. Interaction Timeline Section */}
                  <div className="flex-1 bg-white p-6 overflow-hidden flex flex-col">
                      <div className="border border-gray-200 rounded-[1.5rem] flex-1 flex flex-col overflow-hidden shadow-sm">
                          
                          {/* Timeline Header */}
                          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                              <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                                  <CalendarDays size={18}/> Interaction Timeline
                              </h3>
                              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                  Total Interactions: {selectedLead.interactions?.length || 0}
                              </span>
                          </div>

                          {/* Timeline Table Header */}
                          <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              <div className="col-span-2">Date & Mode</div>
                              <div className="col-span-2">Contact Person</div>
                              <div className="col-span-4">Discussion Remarks</div>
                              <div className="col-span-2">Next Followup</div>
                              <div className="col-span-2 text-center">Status & Sub-Status</div>
                          </div>

                          {/* Timeline Body (Scrollable) */}
                          <div className="overflow-y-auto flex-1 p-0">
                              {selectedLead.interactions && selectedLead.interactions.length > 0 ? (
                                  selectedLead.interactions.map((interaction, idx) => (
                                      <div key={idx} className="grid grid-cols-12 px-6 py-5 border-b border-gray-50 hover:bg-blue-50/20 transition group items-start">
                                          
                                          {/* Date & Mode */}
                                          <div className="col-span-2">
                                              <p className="text-sm font-black text-[#103c7f] mb-1">{interaction.date}</p>
                                              <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-purple-100 inline-block">
                                                  {interaction.mode || 'CALL'}
                                              </span>
                                          </div>

                                          {/* Contact Person */}
                                          <div className="col-span-2 pr-2">
                                              <p className="text-xs font-bold text-gray-800 capitalize mb-1">{interaction.person}</p>
                                              <p className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={10}/> {interaction.phone}</p>
                                              {interaction.email && <p className="text-[10px] text-gray-400 flex items-center gap-1 truncate"><Mail size={10}/> {interaction.email}</p>}
                                          </div>

                                          {/* Discussion Remarks */}
                                          <div className="col-span-4 pr-4">
                                              <p className="text-xs text-gray-600 leading-relaxed">
                                                  {interaction.remarks}
                                              </p>
                                          </div>

                                          {/* Next Followup */}
                                          <div className="col-span-2">
                                              {interaction.nextFollowUp ? (
                                                  <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-lg text-[11px] font-bold uppercase inline-block font-mono">
                                                      {interaction.nextFollowUp}
                                                  </span>
                                              ) : <span className="text-gray-300 text-xs">-</span>}
                                          </div>

                                          {/* Status & Action */}
                                          <div className="col-span-2 flex justify-between items-center pl-2">
                                              <div className="flex flex-col">
                                                  <span className="text-[10px] font-black text-[#103c7f] uppercase">{interaction.status}</span>
                                                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded w-fit mt-1 font-bold">{interaction.subStatus}</span>
                                              </div>
                                          </div>

                                      </div>
                                  ))
                              ) : (
                                  <div className="px-6 py-12 text-center text-gray-400">
                                      <p className="text-sm font-bold uppercase tracking-widest">No Interactions Found</p>
                                  </div>
                              )}
                          </div>

                      </div>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
}
