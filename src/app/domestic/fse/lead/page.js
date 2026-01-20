"use client";
import { useState, useEffect } from "react";
import { 
  Pencil, Plus, X, Search, Loader2, Eye, Star,
  Calendar, Phone, MapPin, User, Building2, CheckCircle,
  ArrowRight, MessageSquarePlus, Mail, Zap,CalendarOff,
  HistoryIcon
} from "lucide-react";

export default function LeadsMasterPage() {
  const [mounted, setMounted] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Naya state
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [nonFieldDays, setNonFieldDays] = useState([]);

  // Filters State (Robust Initialization)
  const [filters, setFilters] = useState({ 
    company: '', 
    category: '', 
    locationSearch: '', 
    statusSearch: '', 
    subStatusSearch: '',
    projection: '',
    status: '' ,
    clientType: '',
    fromDate: '', // New
    toDate: ''    // New
  });

  useEffect(() => { setMounted(true); }, []);

  // Robust Dependency Array
  useEffect(() => {
    if (mounted) fetchLeads();
  }, [mounted, filters.company, filters.category, filters.status, filters.locationSearch, filters.statusSearch, filters.subStatusSearch, filters.projection, filters.clientType, filters.fromDate, filters.toDate, showAll]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      // 1. Prepare Query Params for Real API (Good for robustness)
      const queryParams = new URLSearchParams();
      if (filters.company) queryParams.append('company', filters.company);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.locationSearch) queryParams.append('location', filters.locationSearch);
      if (filters.statusSearch) queryParams.append('status', filters.statusSearch);
      if (filters.projection) queryParams.append('projection', filters.projection);
      if (filters.subStatusSearch) queryParams.append('sub_status', filters.subStatusSearch);
      if (filters.clientType) queryParams.append('client_type', filters.clientType);
      
      // 👇 DATE FILTERS (Agar pehle miss ho gaye the toh ye bhi zaroori hain)
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      const limit = showAll ? 10000 : 100;
      queryParams.append('limit', limit);

      // REAL API CALL
      const response = await fetch(`/api/domestic/fse/lead?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
        setTotalLeads(data.data.length); // This is the fetched count, not total
        if (showAll) {
          console.log('Loaded all records. Total count:', data.data.length);
        }
      }
      setLoading(false);
      
      // 2. MOCK DATA LOGIC (Commented out for real API)
      // setTimeout(() => {
      //    const mockData = [
      //        { sourcing_date: '2024-01-20', company: 'Tech Corp', category: 'IT', location: 'Noida', state: 'UP', client_type: 'Premium', remarks: 'Meeting was good, need to follow up next week.', status: 'Interested', sub_status: 'In Process', projection: 'MP > 50' },
      //        { sourcing_date: '2024-01-22', company: 'Build Well', category: 'Real Estate', location: 'Gurgaon', state: 'Haryana', client_type: 'Standard', remarks: 'Not interested right now.', status: 'Not Interested', sub_status: 'Low Budget', projection: 'Not Projected' }
      //    ];

      //    // Apply client-side filtering to the mock data
      //    const filteredData = mockData.filter(lead => {
      //       const matchCompany = lead.company.toLowerCase().includes(filters.company.toLowerCase());
      //       const matchCategory = filters.category ? lead.category === filters.category : true;
      //       const matchLocation = lead.location.toLowerCase().includes(filters.locationSearch.toLowerCase()) || lead.state.toLowerCase().includes(filters.locationSearch.toLowerCase());
      //       const matchStatus = filters.statusSearch ? lead.status === filters.statusSearch : true;
      //       const matchProjection = filters.projection ? lead.projection === filters.projection : true;

      //       return matchCompany && matchCategory && matchLocation && matchStatus && matchProjection;
      //    });

      //    setLeads(filteredData);
      //    setLoading(false);
      // }, 500);

    } catch (err) {
      setError('Failed to load leads');
      setLoading(false);
    }
  };

  const saveLead = async (formData, openFollowup = false) => {
    try {
      setSaving(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const isEdit = !!formData.client_id;

      const response = await fetch('/api/domestic/fse/lead', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert(isEdit ? 'Client record updated successfully' : 'Client record created successfully');
        fetchLeads();
        if (openFollowup) {
          setSelectedLead(data.data);
          setIsFollowUpModalOpen(true);
          setIsModalOpen(false);
        } else if (isEdit) {
          setIsEditModalOpen(false);
        } else {
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      alert('Error saving data');
    } finally {
      setSaving(false);
    }
  };

  const saveInteraction = async (formData) => {
    try {
      setSaving(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      const response = await fetch('/api/domestic/fse/lead/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        alert('Interaction record created successfully');
        fetchLeads(); // refresh to update latest interaction
        setIsFollowUpModalOpen(false);
      }
    } catch (err) {
      alert('Error saving interaction');
    } finally {
      setSaving(false);
    }
  };
  // 👇 ADD THIS FUNCTION (Missing)
  const handleSaveLeave = async (date, reason, remarks) => { // <--- Added remarks here
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}');
      const response = await fetch('/api/domestic/fse/non-working', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ date, reason })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Marked ${date} as Non-Visit.\nReason: ${reason}\nRemarks: ${remarks}`);
        setNonFieldDays(prev => [...prev, date]);
        setIsLeaveModalOpen(false);
      } else {
        alert('Failed to save non-visit day: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving non-visit day:', error);
      alert('Error saving non-visit day. Please try again.');
    }
  };


  if (!mounted) return null;

  const dropdowns = {
    categoryList: ["Architect/ID", "Banquet", "Club/Store","Hospitality","IT","Multi Media","Non-IT","Real estate","Trading","Retail", "Manufacturing"],
statesList: [
      "Andaman and Nicobar Islands",
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chandigarh",
      "Chhattisgarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Delhi",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jammu and Kashmir",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Ladakh",
      "Lakshadweep",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Puducherry",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal"
    ],
        empCountList: ["1-10", "11-50", "51-100", "101-200", "201-500", "500+"],
    statusList: ["Interested", "Not Interested", "Onboarded", "Not Picked", "Reached Out"],
    subStatusList: ["Blue Collar", "Call Back", "In Process", "Low Budget", "Proposal Shared", "Ready to Sign" , "Not Ready to Sign"],
    projectionList: ["WP > 50", "WP < 50", "MP > 50", "MP < 50", "Not Projected"]
  };

  return (
    // h-[100dvh] ensures full height on mobile browsers with address bars
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden font-['Calibri'] p-1 md:p-2 bg-[#f8fafc]">
      
     {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4">
        
        {/* LEFT: TITLE & COUNT */}
        <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
          <h1 className="text-2xl md:text-3xl font-black text-[#103c7f] uppercase italic tracking-tight whitespace-nowrap shrink-0">
  Leads Master Database
</h1>
          
          {/* ROW COUNTER BADGE */}
          <span className="bg-blue-50 border border-blue-100 text-[#103c7f] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
            {totalLeads} Records Found
          </span>
        </div>

        {/* RIGHT: FILTERS & BUTTON GROUP */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          {/* COMPACT DATE RANGE PICKER */}
          <div className="flex items-center bg-white px-2 py-1.5 rounded-2xl border border-gray-200 shadow-sm gap-2">
            
            <div className="relative">
              <input 
                type="date" 
                value={filters.fromDate}
                onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                className="w-[110px] px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-1 focus:ring-blue-100 cursor-pointer"
              />
            </div>

            <span className="text-gray-300 font-bold text-xs">-</span>

            <div className="relative">
              <input 
                type="date" 
                value={filters.toDate}
                onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                className="w-[110px] px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-1 focus:ring-blue-100 cursor-pointer"
              />
            </div>

            {(filters.fromDate || filters.toDate) && (
              <button 
                onClick={() => setFilters({...filters, fromDate: '', toDate: ''})}
                className="p-1 hover:bg-red-50 text-red-400 rounded-full transition"
                title="Clear Dates"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 👇 NEW: MARK NON-FIELD DAY BUTTON (Added Here) */}
          <button 
            onClick={() => setIsLeaveModalOpen(true)}
            className="bg-white text-orange-600 border border-orange-200 px-4 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-orange-50 transition-all shadow-sm uppercase italic text-xs active:scale-95 whitespace-nowrap"
            title="Mark Absent or Office Work"
          >
            <CalendarOff size={18} strokeWidth={2.5} /> Non-Visit Day
          </button>

          {/* ADD BUTTON */}
          <button 
            onClick={() => { setSelectedLead(null); setIsViewMode(false); setIsModalOpen(true); }}
            className="bg-[#103c7f] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 uppercase italic text-xs active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} strokeWidth={3} /> Add New Client
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4  border border-gray-100 shadow-sm mb-2 w-full shrink-0 overflow-x-auto custom-scrollbar rounded-none">
        <div className="grid grid-cols-12 gap-2 items-center min-w-[850px]">
          
          {/* 1. COMPANY */}
          <div className="col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
            <input 
              type="text" 
              placeholder="COMPANY..." 
              value={filters.company || ''} 
              onChange={(e) => setFilters({...filters, company: e.target.value})}
              className="w-full pl-9 pr-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 uppercase transition-all"
            />
          </div>

          {/* 2. CATEGORY */}
          <div className="col-span-1">
            <select 
              value={filters.category || ''} 
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] uppercase outline-none cursor-pointer focus:ring-2 focus:ring-blue-100 appearance-none"
            >
              <option value="">CATEGORY</option>
              {dropdowns.categoryList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 3. LOCATION */}
          <div className="col-span-2 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
            <input 
              type="text" 
              placeholder="STATE / LOCATION..." 
              value={filters.locationSearch || ''} 
              onChange={(e) => setFilters({...filters, locationSearch: e.target.value})}
              className="w-full pl-9 pr-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300 uppercase transition-all"
            />
          </div>

          {/* 4. STATUS */}
          <div className="col-span-2">
            <select 
              value={filters.statusSearch || ''} 
              onChange={(e) => setFilters({...filters, statusSearch: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] uppercase outline-none cursor-pointer focus:ring-2 focus:ring-blue-100 appearance-none"
            >
              <option value="">STATUS</option>
              <optgroup label="MAIN STATUS" className="text-[#103c7f]">
                {dropdowns.statusList.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              {/* <optgroup label="SUB-STATUS" className="text-orange-600">
                {dropdowns.subStatusList.map(ss => <option key={ss} value={ss}>{ss}</option>)}
              </optgroup> */}
            </select>
          </div>

          <div className="col-span-2">
            <select 
              value={filters.subStatusSearch || ''} 
              onChange={(e) => setFilters({...filters, subStatusSearch: e.target.value})} 
              className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none"
            >
              <option value="">SUB-STATUS</option>
              {dropdowns.subStatusList.map(ss => <option key={ss} value={ss}>{ss}</option>)}
            </select>
          </div>

          <div className="col-span-2">
            <select 
              value={filters.clientType || ''} 
              onChange={(e) => setFilters({...filters, clientType: e.target.value})} 
              className="w-full px-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] uppercase outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none"
            >
              <option value="">CLIENT TYPE</option>
              <option value="Standard">STANDARD</option>
              <option value="Premium">PREMIUM</option>
            </select>
          </div>

          {/* 5. PROJECTION */}
          <div className="col-span-1">
            <select 
              value={filters.projection || ''} 
              onChange={(e) => setFilters({...filters, projection: e.target.value})}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-[10px] font-bold text-[#103c7f] uppercase outline-none cursor-pointer focus:ring-2 focus:ring-blue-100 appearance-none"
            >
              <option value="">PROJECTION</option>
              {dropdowns.projectionList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

        </div>
      </div>

     {/* TABLE AREA - Compact, Clean, Scrollable */}
      <div className="bg-white border border-gray-100  flex-1 overflow-hidden shadow-sm relative z-0 flex flex-col mt-1 rounded-none">
        <div className="w-full h-full overflow-auto custom-scrollbar">
          <table className="min-w-[1100px] text-left text-xs border-collapse relative table-fixed">      
            
            {/* STICKY HEADER */}
            <thead className="sticky top-0 z-20 bg-[#103c7f] text-white font-bold uppercase tracking-widest text-[10px] shadow-md">
              
              {/* Level 1: Group Headers */}
              <tr className="border-b border-white/10">
                <th colSpan="3" className="px-4 py-2 text-center border-r border-white/10 bg-[#0d3269]">
                  Basic Information
                </th>
                <th colSpan="5" className="px-4 py-2 text-center border-r border-white/10 bg-[#0d3269]">
                  Latest Interaction
                </th>
                <th rowSpan="2" className="px-4 py-2 text-center bg-[#103c7f] min-w-[130px] sticky right-0 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.1)]">
                  Action
                </th>
              </tr>

              {/* Level 2: Column Headers */}
              <tr>
                <th className="px-4 py-3 border-r border-white/10 min-w-[100px] whitespace-nowrap">Sourcing Date</th>
                <th className="px-4 py-3 border-r border-white/10 min-w-[220px]">Company & Category</th>
                <th className="px-4 py-3 border-r border-white/10 min-w-[160px]">Location & State</th>
                
                <th className="px-4 py-3 border-r border-white/10 min-w-[120px] bg-[#15468f] whitespace-nowrap">Followup Date</th>
                {/* REMARKS: Wider width */}
                <th className="px-4 py-3 border-r border-white/10 min-w-[350px] bg-[#15468f]">Latest Remarks</th>
                <th className="px-4 py-3 border-r border-white/10 min-w-[120px] bg-[#15468f] whitespace-nowrap">Next Followup</th>
                <th className="px-4 py-3 border-r border-white/10 min-w-[160px] bg-[#15468f]">Status & Sub-status</th>
                <th className="px-4 py-3 border-r border-white/10 min-w-[120px] bg-[#15468f]">Projection</th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#103c7f] opacity-50" size={32}/>
                    <p className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Records...</p>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-24 text-center text-gray-400 font-bold uppercase italic tracking-wider bg-gray-50/30">
                    No records found
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors duration-150 group border-b border-gray-100 last:border-0">
                    
                    {/* Sourcing Date */}
                    <td className="px-4 py-2.5 text-gray-600 font-semibold whitespace-nowrap text-[11px]">
                      {lead.sourcing_date}
                    </td>

                    {/* Company & Category */}
                    <td className="px-4 py-2.5 ">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#103c7f] text-sm uppercase tracking-tight truncate max-w-[180px]" title={lead.company_name}>
                            {lead.company_name}
                          </span>
                          {/* LOGIC UNCHANGED FOR STARS */}
                          <Star 
                            size={14} 
                            strokeWidth={lead.client_type === 'Premium' ? 0 : 2.5}
                            fill={lead.client_type === 'Premium' ? '#EAB308' : '#3B82F6'} 
                            className={lead.client_type === 'Premium' ? 'text-yellow-500 shrink-0' : 'text-blue-500 shrink-0'} 
                          />
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {lead.category || 'NO CATEGORY'}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-2.5 text-gray-700 font-medium ">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-gray-400"/>
                        <span className="truncate max-w-[140px] text-[11px]" title={`${lead.location}, ${lead.state}`}>
                          {lead.location}, {lead.state}
                        </span>
                      </div>
                    </td>

                    {/* Followup Date */}
                    <td className="px-4 py-2.5 text-gray-500 font-semibold italic whitespace-nowrap text-[11px]">
                      {lead.latest_contact_date || '--'}
                    </td>

                    {/* REMARKS: Handling Long Text with line-clamp */}
                    <td className="px-4 py-2.5 min-w-[350px]">
                      <p className="text-gray-600 text-[11px] font-medium leading-snug line-clamp-2 hover:line-clamp-none transition-all cursor-default" title={lead.remarks}>
                        {lead.remarks || <span className="text-gray-300 italic">No remarks available</span>}
                      </p>
                    </td>

                    {/* Next Followup */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {lead.next_follow_up ? (
                        <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-bold text-[10px] border border-orange-100">
                          {lead.next_follow_up}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold">--</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="font-black text-[#103c7f] uppercase text-[10px] tracking-wide">
                          {lead.status || 'NO STATUS'}
                        </span>
                        <span className="text-[9px] font-semibold text-gray-500 truncate max-w-[120px]">
                          {lead.sub_status || '--'}
                        </span>
                      </div>
                    </td>

                    {/* Projection */}
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase border whitespace-nowrap ${
                        lead.projection && lead.projection.includes('>') 
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {lead.projection || 'N/A'}
                      </span>
                    </td>

                    {/* ACTIONS - STICKY RIGHT */}
                    <td className="px-3 py-2.5 sticky right-0 bg-white group-hover:bg-blue-50/40 transition-colors border-l border-gray-100 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => { setSelectedLead(lead); setIsFullViewOpen(true); }} 
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:shadow-md transition-all border border-green-100 active:scale-95" 
                          title="Full View"
                        >
                          <Eye size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => { setSelectedLead(lead); setIsFollowUpModalOpen(true); }} 
                          className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 hover:shadow-md transition-all border border-orange-100 active:scale-95" 
                          title="Add Follow-up"
                        >
                          <MessageSquarePlus size={14} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => { setSelectedLead(lead); setIsEditModalOpen(true); }} 
                          className="p-1.5 bg-blue-50 text-[#103c7f] rounded-lg hover:bg-blue-100 hover:shadow-md transition-all border border-blue-100 active:scale-95" 
                          title="Edit Details"
                        >
                          <Pencil size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* VIEW MORE BUTTON INSIDE TABLE */}
            {!showAll && totalLeads > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="9" className="text-center py-6 bg-gray-50/30">
                    <button
                      onClick={() => {
                        console.log('Viewing all records. Current count:', totalLeads);
                        setShowAll(true);
                      }}
                      className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-full font-bold text-xs hover:bg-gray-50 hover:text-[#103c7f] hover:border-blue-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 mx-auto"
                    >
                      View All Records <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* SINGLE FORM MODAL */}
      {isModalOpen && (
        <LeadModal 
          lead={selectedLead} 
          isViewMode={isViewMode} 
          onSave={saveLead} 
          onClose={() => setIsModalOpen(false)} 
          saving={saving}
          {...dropdowns}
        />
      )}

      {/* DEDICATED FOLLOW-UP MODAL */}
      {isFollowUpModalOpen && (
        <FollowUpModal
          lead={selectedLead}
          onClose={() => setIsFollowUpModalOpen(false)}
          onSave={saveInteraction}
          saving={saving}
          statusList={dropdowns.statusList}
        />
      )}
      {isEditModalOpen && (
  <EditLeadModal 
    lead={selectedLead} 
    onUpdate={saveLead} // SaveLead function ID check karke apne aap Update karega
    onClose={() => setIsEditModalOpen(false)} 
    saving={saving}
    {...dropdowns}
  />
)}
{/* 👇 ADD THIS BLOCK (Missing) */}
      {isLeaveModalOpen && (
        <LeaveModal 
          onClose={() => setIsLeaveModalOpen(false)} 
          onSave={handleSaveLeave} 
        />
      )}
{isFullViewOpen && (
  <ClientFullViewModal 
    lead={selectedLead} 
    onClose={() => setIsFullViewOpen(false)} 
  />
)}

    </div>
  );
}

function LeadModal({ lead, isViewMode, onSave, onClose, saving, ...lists }) {
  const [formData, setFormData] = useState({
    sourcing_date: '', company: '', client_type: 'Standard', category: '', state: '',
    location: '', employee_count: '', reference: '', contact_mode: 'Visit'
  });

  // Check: Are we editing? (Agar ID hai toh Edit hai)
  const isEditing = !!lead?.client_id;

  useEffect(() => {
    setFormData({
      client_id: lead?.client_id || null,
      sourcing_date: lead?.sourcing_date || new Date().toISOString().split('T')[0],
      company: lead?.company_name || '',
      client_type: lead?.client_type || 'Standard',
      category: lead?.category || '',
      state: lead?.state || '',
      location: lead?.location || '',
      employee_count: lead?.emp_count || '',
      reference: lead?.reference || '',
      contact_mode: lead?.contact_mode || 'Visit'
    });
  }, [lead]);

  const updateField = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  const inputStyle = `w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#103c7f]/20 transition shadow-sm disabled:bg-gray-50 disabled:text-gray-500`;

  return (
    <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 font-['Calibri']">
      <div className="bg-white rounded-[2rem] shadow-2xl w-[100%] md:w-full max-w-5xl max-h-[90dvh] overflow-hidden flex flex-col border border-white/50">
        
        {/* HEADER */}
        <div className="px-6 md:px-10 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg md:text-xl font-black text-[#103c7f] uppercase italic tracking-tight flex flex-col">
              <span>
                {isViewMode 
                  ? 'View Sourcing Details' 
                  : (isEditing ? 'Update Client Record' : 'Add New Client')}
              </span>
              {(isEditing || isViewMode) && (
                <span className="text-[10px] text-gray-400 tracking-widest mt-0.5">
                  Target: <span className="text-orange-600 font-bold">{lead?.company_name}</span>
                </span>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 transition rounded-full text-gray-400"><X size={24}/></button>
        </div>

        {/* FORM CONTENT */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sourcing Date</label>
              <input type="date" disabled={isViewMode} value={formData.sourcing_date} onChange={e => updateField('sourcing_date', e.target.value)} className={inputStyle} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
              <input type="text" disabled={isViewMode} value={formData.company} onChange={e => updateField('company', e.target.value)} className={inputStyle} placeholder="Enter company..." />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Type</label>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                {['Standard', 'Premium'].map(t => (
                  <button key={t} type="button" disabled={isViewMode} onClick={() => updateField('client_type', t)} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition ${formData.client_type === t ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400'} disabled:opacity-60 disabled:cursor-not-allowed`}>{t === 'Premium' ? 'Premium ⭐' : t}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <select disabled={isViewMode} value={formData.category} onChange={e => updateField('category', e.target.value)} className={inputStyle}>
                <option value="">Select Category</option>
                {lists.categoryList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
              <select disabled={isViewMode} value={formData.state} onChange={e => updateField('state', e.target.value)} className={inputStyle}>
                <option value="">Select State</option>
                {lists.statesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
              <input type="text" disabled={isViewMode} value={formData.location} onChange={e => updateField('location', e.target.value)} className={inputStyle} placeholder="Area..." />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sourcing Mode</label>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                {['Call', 'Visit'].map(m => (
                  <button key={m} type="button" disabled={isViewMode} onClick={() => updateField('contact_mode', m)} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition ${formData.contact_mode === m ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400'} disabled:opacity-60 disabled:cursor-not-allowed`}>{m}</button>
                ))}
              </div>
      
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee Count</label>
              <select disabled={isViewMode} value={formData.employee_count} onChange={e => updateField('employee_count', e.target.value)} className={inputStyle}>
                <option value="">Select Range</option>
                {lists.empCountList.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference</label>
              <input type="text" disabled={isViewMode} value={formData.reference} onChange={e => updateField('reference', e.target.value)} className={inputStyle} placeholder="LinkedIn, Referral, etc." />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {!isViewMode && (
            <div className="pt-6 flex flex-col md:flex-row gap-4 border-t mt-6">
              
              {/* 1. CANCEL */}
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-3.5 font-bold text-gray-400 uppercase text-xs hover:bg-gray-100 transition rounded-2xl"
              >
                Cancel
              </button>

              {/* 2. OPTION A: SAVE & CLOSE */}
              <button 
                type="button" 
                onClick={() => onSave(formData, false)} // False = Close after save
                disabled={saving || !formData.company} 
                className={`flex-1 py-3.5 border-2 ${isEditing ? 'border-orange-500 text-orange-600 hover:bg-orange-50' : 'border-[#103c7f] text-[#103c7f] hover:bg-blue-50'} rounded-2xl font-black uppercase text-xs transition active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2`}
              >
                {saving && <Loader2 className="animate-spin" size={16}/>}
                {/* YAHAN LOGIC HAI: Editing hai to 'Update & Close', nahi to 'Save & Close' */}
                {isEditing ? 'Update & Close' : 'Save & Close'}
              </button>

              {/* 3. OPTION B: SAVE & CONTINUE (Sirf New Entry ke liye) */}
              {!isEditing && (
                <button 
                  type="button" 
                  onClick={() => onSave(formData, true)} // True = Open Followup after save
                  className="flex-1 py-3.5 bg-[#103c7f] text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-900/20 active:scale-95 transition flex items-center justify-center gap-2 hover:bg-blue-900"
                >
                  Save & Add Follow-up <ArrowRight size={16}/>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FollowUpModal({ lead, onClose, onSave, saving, statusList }) {
   const [formData, setFormData] = useState({
     ...lead,
     contact_person: lead?.contact_person || '',
     contact_no: lead?.contact_no || '',
     email: lead?.email || '',
     latest_contact_mode: 'Call',
     latest_contact_date: new Date().toISOString().split('T')[0],
     remarks: '',
     next_follow_up: '',
     status: lead?.status || '',
     sub_status: lead?.sub_status || '',
     projection: lead?.projection || ''
   });

   const [suggestions, setSuggestions] = useState({ persons: [], nos: [], emails: [] });

  const subStatusList = ["Blue Collar", "Call Back", "In Process", "Low Budget", "Proposal Shared", "Ready to Sign","Not Ready to Sign"];
  const projectionList = ["WP > 50", "WP < 50", "MP > 50", "MP < 50", "Not Projected"];

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!lead?.client_id) return;
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch(`/api/domestic/fse/lead/interaction?client_id=${lead.client_id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        if (data.success) {
          const persons = [...new Set(data.data.map(i => i.contact_person).filter(Boolean))];
          const nos = [...new Set(data.data.map(i => i.contact_no).filter(Boolean))];
          const emails = [...new Set(data.data.map(i => i.email).filter(Boolean))];
          setSuggestions({ persons, nos, emails });
        }
      } catch (err) {
        console.error('Failed to fetch suggestions');
      }
    };
    fetchSuggestions();
  }, [lead]);

  const updateField = (f, v) => setFormData(p => ({ ...p, [f]: v }));

  // Consistent Styling
  const inputStyle = `w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#103c7f]/20 transition shadow-sm`;

  return (
    <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 font-['Calibri']">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90dvh] overflow-hidden flex flex-col border border-white/50">
        
        {/* HEADER */}
        <div className="px-6 md:px-10 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-[#103c7f] uppercase italic tracking-tight flex items-center gap-2">
              <HistoryIcon size={22} strokeWidth={2.5} /> Interaction Details
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-1">
              Logging for: <span className="text-orange-600">{lead?.company_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 transition rounded-full text-gray-400"><X size={24}/></button>
        </div>

        {/* FORM CONTENT (Perfect 2-Column Grid) */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
            
            {/* 1. Contact Person */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Person</label>
              <input type="text" value={formData.contact_person} onChange={e => updateField('contact_person', e.target.value)} className={inputStyle} placeholder="Name..." list="persons" />
              <datalist id="persons">
                {suggestions.persons.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            {/* 2. Contact No */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact No.</label>
              <input type="tel" value={formData.contact_no} onChange={e => updateField('contact_no', e.target.value)} className={inputStyle} placeholder="10 digit..." list="nos" />
              <datalist id="nos">
                {suggestions.nos.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>

            {/* 3. Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                className={inputStyle}
                placeholder="client@email.com"
                list="emails"
              />
              <datalist id="emails">
                {suggestions.emails.map(e => <option key={e} value={e} />)}
              </datalist>
            </div>

            {/* 4. Interaction Mode */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Interaction Mode</label>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                {['Call', 'Visit'].map(m => (
                  <button 
                    key={m} 
                    type="button" 
                    onClick={() => updateField('latest_contact_mode', m)} 
                    className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition ${formData.latest_contact_mode === m ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Date of Follow-up */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Follow-up</label>
              <input type="date" value={formData.latest_contact_date} onChange={e => updateField('latest_contact_date', e.target.value)} className={inputStyle} />
            </div>

            {/* 6. Next Follow-up Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Next Follow-up Date</label>
              <input 
                type="date" 
                value={formData.next_follow_up} 
                onChange={e => updateField('next_follow_up', e.target.value)} 
                className={`${inputStyle} bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-200`} 
              />
            </div>

            {/* 7. Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
              <select value={formData.status} onChange={e => updateField('status', e.target.value)} className={inputStyle}>
                <option value="">Select Status</option>
                {statusList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* 8. Sub-Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sub-Status</label>
              <select value={formData.sub_status} onChange={e => updateField('sub_status', e.target.value)} className={inputStyle}>
                <option value="">Select Sub-Status</option>
                {subStatusList.map(ss => <option key={ss} value={ss}>{ss}</option>)}
              </select>
            </div>

            {/* 9. Projection (Dropdown Now) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Projection</label>
              <select value={formData.projection} onChange={e => updateField('projection', e.target.value)} className={inputStyle}>
                <option value="">Select Projection</option>
                {projectionList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 10. Remarks (Single Column Now) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Remarks</label>
              <input 
                type="text" 
                value={formData.remarks} 
                onChange={e => updateField('remarks', e.target.value)} 
                className={inputStyle} 
                placeholder="Meeting summary..."
              />
            </div>

          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-6 flex flex-col md:flex-row gap-4 border-t mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3.5 font-bold text-gray-400 uppercase text-xs hover:bg-gray-100 transition rounded-2xl"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => onSave(formData)}
              disabled={saving}
              className="flex-1 py-3.5 bg-[#103c7f] text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-900/20 active:scale-95 transition flex items-center justify-center gap-2 hover:bg-blue-900 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={18} strokeWidth={2.5}/>}
              Save Interaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditLeadModal({ lead, onUpdate, onClose, saving, ...lists }) {
  // State initialize with existing lead data directly
  const [formData, setFormData] = useState({
    client_id: lead?.client_id || null,
    sourcing_date: lead?.sourcing_date || '',
    company: lead?.company_name || '',
    client_type: lead?.client_type || 'Standard',
    category: lead?.category || '',
    state: lead?.state || '',
    location: lead?.location || '',
    employee_count: lead?.emp_count || '',
    reference: lead?.reference || '',
    contact_mode: lead?.contact_mode || 'Visit'
  });

  const updateField = (f, v) => setFormData(p => ({ ...p, [f]: v }));
  
  // Same style as LeadModal
  const inputStyle = `w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#103c7f]/20 transition shadow-sm`;

  return (
    <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 font-['Calibri']">
      <div className="bg-white rounded-[2rem] shadow-2xl w-[100%] md:w-full max-w-5xl max-h-[90dvh] overflow-hidden flex flex-col border border-white/50">
        
        {/* HEADER */}
        <div className="px-6 md:px-10 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-[#103c7f] uppercase italic tracking-tight">
              Update Client Record
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-1">
              Editing: <span className="text-orange-600">{lead?.company_name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 transition rounded-full text-gray-400"><X size={24}/></button>
        </div>

        {/* FORM CONTENT (Same fields as LeadModal) */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 md:gap-y-6">
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sourcing Date</label>
              <input type="date" value={formData.sourcing_date} onChange={e => updateField('sourcing_date', e.target.value)} className={inputStyle} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company Name</label>
              <input type="text" value={formData.company} onChange={e => updateField('company', e.target.value)} className={inputStyle} />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client Type</label>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                {['Standard', 'Premium'].map(t => (
                  <button key={t} type="button" onClick={() => updateField('client_type', t)} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition ${formData.client_type === t ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400'}`}>{t === 'Premium' ? 'Premium ⭐' : t}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
              <select value={formData.category} onChange={e => updateField('category', e.target.value)} className={inputStyle}>
                <option value="">Select Category</option>
                {lists.categoryList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
              <select value={formData.state} onChange={e => updateField('state', e.target.value)} className={inputStyle}>
                <option value="">Select State</option>
                {lists.statesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
              <input type="text" value={formData.location} onChange={e => updateField('location', e.target.value)} className={inputStyle} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sourcing Mode</label>
              <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                {['Call', 'Visit'].map(m => (
                  <button key={m} type="button" onClick={() => updateField('contact_mode', m)} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase transition ${formData.contact_mode === m ? 'bg-[#103c7f] text-white shadow-md' : 'text-gray-400'}`}>{m}</button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee Count</label>
              <select value={formData.employee_count} onChange={e => updateField('employee_count', e.target.value)} className={inputStyle}>
                <option value="">Select Range</option>
                {lists.empCountList.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reference</label>
              <input type="text" value={formData.reference} onChange={e => updateField('reference', e.target.value)} className={inputStyle} />
            </div>
          </div>

          {/* ACTION BUTTONS (Only Update Logic) - Fixed Alignment */}
          <div className="pt-6 flex flex-col md:flex-row gap-4 border-t mt-6">
            
            {/* CANCEL BUTTON */}
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 font-bold text-gray-400 uppercase text-xs hover:bg-gray-100 transition rounded-2xl border border-transparent hover:border-gray-200"
            >
              Cancel
            </button>

            {/* UPDATE CLIENT BUTTON */}
            <button 
              type="button" 
              onClick={() => onUpdate(formData)} 
              disabled={saving} 
              className="flex-1 py-3 bg-[#103c7f] text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-900/20 active:scale-95 transition flex items-center justify-center gap-2 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={18} strokeWidth={2.5}/>}
              Update Client Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientFullViewModal({ lead, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!lead?.client_id) {
        setHistory([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch(`/api/domestic/fse/lead/interaction?client_id=${lead.client_id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        if (data.success) {
          setHistory(data.data);
        } else {
          setHistory([]);
        }
      } catch (err) {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInteractions();
  }, [lead]);

  // Helper for Compact Basic Info
  const StatCard = ({ icon: Icon, label, value, colorClass = "bg-blue-50 text-[#103c7f]" }) => (
    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm min-w-[160px] flex-1">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        {Icon && <Icon size={18} strokeWidth={2.5} />}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-black text-gray-800 truncate max-w-[140px]" title={value}>{value || '--'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#103c7f]/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 md:p-6 font-['Calibri']">
      <div className="bg-[#f8fafc] rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95dvh] overflow-hidden flex flex-col border border-white/50">
        
        {/* 1. HEADER */}
        <div className="px-8 py-6 bg-white border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building2 size={24} className="text-[#103c7f]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[#103c7f] uppercase italic tracking-tight leading-none">
                  {lead?.company_name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    <MapPin size={10} /> {lead?.location}, {lead?.state}
                  </span>
                  {lead?.client_type === 'Premium' && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1 border border-yellow-200">
                      <Star size={9} fill="currentColor" /> Premium Client
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition hover:text-red-500">
            <X size={26}/>
          </button>
        </div>

        {/* SCROLLABLE CONTENT (Main Modal Body) */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-8 space-y-6">
          
          {/* 2. BASIC INFO STRIP */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Sourcing Date" value={lead?.sourcing_date} icon={Calendar} />
            <StatCard label="Category" value={lead?.category} icon={Zap} />
            <StatCard label="Sourcing Mode" value={lead?.sourcing_mode} icon={Phone} />
            <StatCard label="Emp Count" value={lead?.emp_count} icon={User} />
            <StatCard label="Reference" value={lead?.reference} icon={MessageSquarePlus} />
            <StatCard label="Current Status" value={lead?.status} icon={CheckCircle} colorClass="bg-green-50 text-green-600"/>
          </div>

          {/* 3. INTERACTION HISTORY TABLE */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            
            {/* Table Header Strip */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black text-[#103c7f] uppercase tracking-widest flex items-center gap-2">
                <HistoryIcon size={18}/> Interaction Timeline
              </h3>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                Total Interactions: {history.length}
              </span>
            </div>
            
            {/* SCROLLABLE TABLE CONTAINER 
                - max-h-[300px]: Restricts height to approx 3 rows + header.
                - overflow-y-auto: Enables vertical scrolling.
            */}
            <div className="overflow-x-auto overflow-y-auto max-h-[320px] custom-scrollbar relative">
              <table className="w-full text-left text-[12px]">
                {/* Sticky Header: Scrolls content behind it */}
                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-400 font-black uppercase tracking-wider border-b border-gray-100 shadow-sm">
                  <tr>
                    <th className="px-4 py-4 w-[13%]">Date & Mode</th>
                    <th className="px-4 py-4 w-[14%]">Contact Person</th>
                    <th className="px-4 py-4 w-[35%]">Discussion Remarks</th>
                    <th className="px-4 py-4 w-[13%]">Next Followup</th>
                    <th className="px-4 py-4 w-[15%]">Status & Sub-status</th>
                    <th className="px-4 py-4 w-[10%] text-right">Projection</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-50 bg-white">
                  {loading ? (
                    <tr><td colSpan="6" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#103c7f]" size={24}/></td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-gray-400 font-bold italic">No history available</td></tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.interaction_id} className="hover:bg-blue-50/30 transition group">
                        
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-[#103c7f] text-sm">{item.contact_date}</span>
                            <span className={`w-fit px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide border ${item.contact_mode === 'Visit' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                              {item.contact_mode}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700 text-sm">{item.contact_person}</span>
                            <div className="flex flex-col mt-1 text-gray-400 text-[10px] font-medium space-y-0.5">
                              {item.contact_no !== 'N/A' && <span className="flex items-center gap-1"><Phone size={10}/> {item.contact_no}</span>}
                              {item.email !== 'N/A' && <span className="flex items-center gap-1"><Mail size={10}/> {item.email}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                           <p className="text-gray-600 font-medium leading-relaxed" title={item.remarks}>
                             {item.remarks}
                           </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg w-fit text-xs border border-orange-100">
                               {item.next_follow_up}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-[#103c7f] text-[11px] uppercase">
                              {item.status}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                              {item.sub_status || '--'}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top text-right">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-[9px] font-bold text-gray-600 border border-gray-200">
                            {item.projection}
                          </span>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function LeaveModal({ onClose, onSave }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [reason, setReason] = useState('Office Work');
  const [remarks, setRemarks] = useState(''); // New State for Remarks

  const reasons = [
    "Office Work", 
    "Training / Meeting", 
    "Leave / Absent", 
    "Public Holiday", 
    "Vehicle Breakdown", 
    "Rain / Bad Weather",
    "Other"
  ];

  return (
    <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-['Calibri']">
      <div className="bg-white rounded-[1.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/50 animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-black text-[#103c7f] uppercase italic tracking-tight flex items-center gap-2">
            <CalendarOff size={20} className="text-orange-600"/> Mark Non-Visit Day
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition">
            <X size={20}/>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          
          {/* Info Alert */}
          <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded-xl border border-blue-100 flex gap-2 items-start">
            <div className="mt-0.5">ℹ️</div>
            <p className="font-medium leading-relaxed">
              This date will be excluded from your <strong>Working Days</strong> count. Your <strong>Average Visit</strong> score will remain accurate.
            </p>
          </div>

          {/* 1. Date Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#103c7f] outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
            />
          </div>

          {/* 2. Reason Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Non-Visit</label>
            <div className="relative">
              <select 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none transition-all"
              >
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* 3. Remarks (NEW ADDITION) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Additional Remarks (Optional)</label>
            <textarea 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved by HOD, Bike repair shop location..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none h-20"
            />
          </div>

        </div>

        {/* FOOTER BUTTONS */}
        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 font-bold text-gray-400 uppercase text-xs hover:bg-gray-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            // Updated to pass remarks
            onClick={() => onSave(date, reason, remarks)} 
            className="flex-1 py-3 bg-[#103c7f] text-white font-black uppercase text-xs rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-900 transition active:scale-95 flex justify-center items-center gap-2"
          >
            <CheckCircle size={16} strokeWidth={2.5} /> Confirm
          </button>
        </div>

      </div>
    </div>
  );
}