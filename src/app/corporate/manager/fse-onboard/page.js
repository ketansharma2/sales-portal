"use client";
import { useState, useEffect } from "react";
import { 
  Eye, Search, Users
} from "lucide-react";

export default function FseOnboardPage() {
  // --- STATE ---
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    company: "",
    location: "",
    status: "All",
    subStatus: "All",
    sourcedBy: "All Agents"
  });

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MOCK DATA ---
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLeads([
        { id: 1, date: "14-02-2024", sourcedBy: "Amit Kumar", client: "Sharma General Store", location: "Sec 18, Noida", remark: "Documents collected, verification pending", status: "Pending" },
        { id: 2, date: "12-02-2024", sourcedBy: "Rahul Singh", client: "Tech Solutions", location: "Indirapuram, GZB", remark: "Interested in premium plan", status: "Verified" },
        { id: 3, date: "10-02-2024", sourcedBy: "Vikram Malhotra", client: "Urban Cafe", location: "Hauz Khas, Delhi", remark: "Shop closed on visit", status: "Rejected" },
        { id: 4, date: "09-02-2024", sourcedBy: "Amit Kumar", client: "Gupta Traders", location: "Laxmi Nagar, Delhi", remark: "Follow up required on Monday", status: "Pending" },
        { id: 5, date: "08-02-2024", sourcedBy: "Rahul Singh", client: "Daily Needs", location: "Sec 62, Noida", remark: "Onboarding successful", status: "Verified" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // --- FILTER LOGIC ---
  const filteredLeads = leads.filter(lead => {
    return (
      (filters.company === "" || lead.client.toLowerCase().includes(filters.company.toLowerCase())) &&
      (filters.location === "" || lead.location.toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.sourcedBy === "All Agents" || lead.sourcedBy === filters.sourcedBy) &&
      (filters.status === "All" || lead.status === filters.status)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-6">
      
      {/* 1. PAGE HEADER (Added Before Filters) */}
      <div className="mb-6">
         <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
            <Users size={26} /> FSE Onboard List
         </h1>
         <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide ml-1">
            Manage and track all onboarded leads
         </p>
      </div>

      {/* 2. FILTER SECTION (Strictly One Row) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 overflow-x-auto">
        <div className="flex items-end gap-3 min-w-max">
            
            {/* From Date */}
            <div className="w-[130px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From</label>
                <input 
                  type="date" 
                  name="from"
                  value={filters.from}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"
                />
            </div>

            {/* To Date */}
            <div className="w-[130px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To</label>
                <input 
                  type="date" 
                  name="to"
                  value={filters.to}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"
                />
            </div>

            {/* Company Search (Flexible Width) */}
            <div className="w-[200px] flex-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Company</label>
                <div className="relative">
                    <input 
                      type="text" 
                      name="company"
                      placeholder="Name..."
                      value={filters.company}
                      onChange={handleFilterChange}
                      className="w-full pl-7 bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"
                    />
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                </div>
            </div>

            {/* Location Search */}
            <div className="w-[150px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Loc / State</label>
                <input 
                  type="text" 
                  name="location"
                  placeholder="Delhi..."
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none focus:border-blue-300"
                />
            </div>

            {/* Status Dropdown */}
            <div className="w-[120px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                <select 
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer"
                >
                    <option value="All">All</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Sub-Status Dropdown */}
            <div className="w-[120px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sub-Status</label>
                <select 
                  name="subStatus"
                  value={filters.subStatus}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer"
                >
                    <option value="All">All</option>
                    <option value="New">New</option>
                    <option value="Follow Up">Follow Up</option>
                </select>
            </div>

            {/* Sourced By Dropdown */}
            <div className="w-[160px]">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sourced By</label>
                <select 
                  name="sourcedBy"
                  value={filters.sourcedBy}
                  onChange={handleFilterChange}
                  className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer"
                >
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
                     <th className="px-6 py-4 whitespace-nowrap">Arrived Date</th>
                     <th className="px-6 py-4 border-l border-blue-800 whitespace-nowrap">Sourced By</th>
                     <th className="px-6 py-4 border-l border-blue-800 whitespace-nowrap">Client Name</th>
                     <th className="px-6 py-4 border-l border-blue-800 whitespace-nowrap">Location & State</th>
                     <th className="px-6 py-4 border-l border-blue-800 whitespace-nowrap w-1/4">Latest Remark</th>
                     <th className="px-6 py-4 border-l border-blue-800 text-center whitespace-nowrap">Status</th>
                     <th className="px-6 py-4 border-l border-blue-800 text-center whitespace-nowrap">Action</th>
                  </tr>
               </thead>
               
               <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {loading ? (
                     <tr><td colSpan="7" className="py-12 text-center text-gray-400">Loading data...</td></tr>
                  ) : filteredLeads.length === 0 ? (
                     <tr>
                        <td colSpan="7" className="py-16 text-center">
                           <div className="flex flex-col items-center justify-center text-gray-300">
                              <Search size={40} className="mb-2 opacity-50"/>
                              <p className="text-sm font-bold uppercase tracking-widest">No Pending Leads Found</p>
                           </div>
                        </td>
                     </tr>
                  ) : (
                     filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">{lead.date}</td>
                           <td className="px-6 py-4 whitespace-nowrap font-bold text-[#103c7f]">{lead.sourcedBy}</td>
                           <td className="px-6 py-4 whitespace-nowrap">{lead.client}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-gray-500">{lead.location}</td>
                           <td className="px-6 py-4 text-gray-500 italic truncate max-w-xs">"{lead.remark}"</td>
                           <td className="px-6 py-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                 lead.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                 lead.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                 'bg-red-100 text-red-700'
                              }`}>
                                 {lead.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <button className="p-1.5 text-blue-600 bg-blue-50 hover:bg-[#103c7f] hover:text-white rounded transition-colors shadow-sm" title="View Details">
                                 <Eye size={16}/>
                              </button>
                           </td>
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