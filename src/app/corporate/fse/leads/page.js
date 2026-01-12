"use client";
import { useState, useEffect } from "react";
import { 
  Pencil, Plus, X, Search, Filter, Loader2, Eye, Star,
  History, Calendar, Phone, MapPin, User, Mail, Building2, ArrowRight 
} from "lucide-react";

export default function LeadsList() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false); // View Mode State
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [viewAll, setViewAll] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    company: '',
    category: '',
    state: '',
    status: '',
    location: '',
    projection: '',
    fromDate: '',
    toDate: ''
  });

  // 1. HYDRATION FIX
  useEffect(() => { setMounted(true); }, []);

  // 2. CHECK AUTH
  useEffect(() => {
    if (mounted) {
      const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('session') || '{}') : {};
      if (!session.access_token) {
        // window.location.href = '/'; 
        return;
      }
    }
  }, [mounted]);

  // 3. FETCH LEADS ON MOUNT
  useEffect(() => {
    if (mounted) {
      fetchLeads();
    }
  }, [mounted]);

  // 4. REFETCH WHEN NON-DATE FILTERS CHANGE
  useEffect(() => {
    if (mounted) {
      fetchLeads();
    }
  }, [filters.company, filters.category, filters.state, filters.status, filters.location, filters.projection, mounted]);

  const fetchLeads = async (all = false) => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      let url = '/api/corporate/fse/clients';
      if (!all) {
        // Default to current and last month
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        url += `?limit=100&date_from=${lastMonthStart}&date_op=gte`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setLeads(data.data);
        if (all) setViewAll(true);
      } else {
        // setError(data.error);
      }
    } catch (err) {
      setError('Network error while fetching leads');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 3. SAVE LEAD FUNCTION
  const saveLead = async (formData) => {
    try {
      setSaving(true);
      setError(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const session = JSON.parse(localStorage.getItem('session') || '{}');

      const isEdit = !!selectedLead;
      const url = '/api/corporate/fse/clients';
      const method = isEdit ? 'PUT' : 'POST';
      
      const payload = isEdit 
        ? { client_id: selectedLead.client_id, ...formData }
        : { ...formData, user_id: user.user_id };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert('Successfully added new client');
        if (isEdit) {
          setLeads(prev => prev.map(lead =>
            lead.client_id === selectedLead.client_id ? data.data : lead
          ));
        } else {
          setLeads(prev => [data.data, ...prev]);
        }
        setIsModalOpen(false);
        setSelectedLead(null);
      } else {
        alert('Failed to save lead: ' + (data.error || 'Unknown error'));
        setError(data.error || 'Failed to save lead');
      }
    } catch (err) {
      alert('Network error while saving lead');
      setError('Network error while saving lead');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  // 4. FILTER LEADS FUNCTION
  const getFilteredLeads = () => {
    return leads.filter(lead => {
      const leadDate = new Date(lead.latest_contact_date);
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      const dateMatch = (!fromDate || leadDate >= fromDate) && (!toDate || leadDate <= toDate);

      return (
        dateMatch &&
        (!filters.company || lead.company.toLowerCase().includes(filters.company.toLowerCase())) &&
        (!filters.category || lead.category === filters.category) &&
        (!filters.state || lead.state === filters.state) &&
        (!filters.status || lead.status === filters.status) &&
        (!filters.location || lead.location.toLowerCase().includes(filters.location.toLowerCase())) &&
        (!filters.projection || lead.projection === filters.projection)
      );
    });
  };

  // 5. UPDATE FILTERS
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // --- 6. MODAL FUNCTIONS ---
  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const openViewModal = (lead) => {
    setSelectedLead(lead);
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedLead(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  // --- 7. FORM SUBMIT HANDLER ---
  const handleFormSubmit = (formData) => {
    saveLead(formData);
  };

  // --- DROPDOWN LISTS ---
  const dropdowns = {
    categoryList: ["Architect/ID", "Banquet", "Club/Store","Hospitality","IT","Multi Media","Non-IT","Real estate","Trading","Retail", "Manufacturing"],
    statesList: [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Chandigarh", 
      "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", 
      "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
      "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
      "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ],
    empCountList: [
      "1-10",          // Micro / Startup
      "11-50",         // Small
      "51-100",        // Medium - Lower
      "101-200",       // Medium - Upper
      "201-500",       // Large
      "501-1000",      // Corporate
      "1000-5000",     // Enterprise
      "5000+"          // Conglomerate
    ],
    projectionList: ["WP > 50", "WP < 50", "MP > 50", "MP < 50","Not Projected"],
    statusList: ["Interested", "Not Interested", "Onboarded","Not Picked","Reached Out","Wrong Person"],
    subStatusList: ["Blue Collar", "Call Back", "In Process", "Low Budget", "Medicant", "Not ready to sign", "Proposal Shared", "Right Person Founded"],
    clientTypeList: ["Standard", "Premium"]
  };

  if (!mounted) return null;

  const filteredLeads = getFilteredLeads();

  return (
<div className="w-full h-screen flex flex-col overflow-auto font-['Calibri'] p-2 bg-[#f8fafc]">
      {/* 8. HEADER SECTION */}
<div className="flex justify-between items-center mb-5 shrink-0">
  <div>
    <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">Leads Master Database</h1>
    <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-1.5 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span> Field Operations Portal
    </p>
  </div>
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <input type="date" value={filters.fromDate} onChange={(e) => updateFilter('fromDate', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none" placeholder="From Date" />
      <span className="text-gray-400">-</span>
      <input type="date" value={filters.toDate} onChange={(e) => updateFilter('toDate', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none" placeholder="To Date" />
      {filters.fromDate && filters.toDate && <button onClick={() => { updateFilter('fromDate', ''); updateFilter('toDate', ''); }} className="p-2 text-gray-400 hover:text-[#103c7f] hover:bg-blue-50 rounded-lg transition-all" title="Clear Date Filters"><X size={16} /></button>}
      <span className="text-[10px] font-bold text-gray-400">(Applied on latest date)</span>
    </div>
    <button
      onClick={openAddModal}
      disabled={saving}
      className="bg-[#a1db40] text-[#103c7f] px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg uppercase italic text-[11px] disabled:opacity-50"
    >
      <Plus size={18} strokeWidth={4} /> ADD NEW CLIENT
    </button>
  </div>
</div>

      {/* 9. FILTER BAR */}
      <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm mb-4 w-full shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <input type="text" placeholder="COMPANY..." value={filters.company} onChange={(e) => updateFilter('company', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none placeholder:text-gray-300" />
          <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none"><option value="">CATEGORY</option>{dropdowns.categoryList.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select value={filters.state} onChange={(e) => updateFilter('state', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none"><option value="">STATE</option>{dropdowns.statesList.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none"><option value="">STATUS</option>{dropdowns.statusList.map(st => <option key={st} value={st}>{st}</option>)}</select>
          <input type="text" placeholder="LOCATION..." value={filters.location} onChange={(e) => updateFilter('location', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none placeholder:text-gray-300" />
          <select value={filters.projection} onChange={(e) => updateFilter('projection', e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none"><option value="">PROJECTION</option>{dropdowns.projectionList.map(p => <option key={p} value={p}>{p}</option>)}</select>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* 10. LEADS TABLE */}
      <div className="bg-white border border-[#103c7f]/20 rounded-xl shadow-md flex-1 min-h-0 mb-18">
        <div className="w-full h-full overflow-x-auto overflow-y-auto pb-4">

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#103c7f]" size={32} />
              <span className="ml-2 text-gray-600">Loading leads...</span>
            </div>
          ) : (
            <>
              <table className="min-w-[3200px] text-[11px] border-collapse">

                {/* ===== TABLE HEADER ===== */}
                <thead className="sticky top-0 z-30 bg-[#103c7f] border-b border-[#103c7f]">
                  <tr className="uppercase text-white font-black tracking-widest">
                    {[
                      "Sourcing Date","Company","Category","State","Location",
                      "Employee Count","Contact Person","Contact No.","Email",
                      "Call / Visit","Latest Mode",
                      "Date of Call / Visit","Latest Date",
                      "Remarks","Reference","Next Followup",
                      "Status","Sub Status","Projection","Action"
                    ].map(h => (
                      <th key={h} className="px-3 py-3 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* ===== TABLE BODY ===== */}
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={20} className="text-center py-10 text-gray-400 font-bold">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead, index) => (
                      <tr
                        key={lead.client_id || lead.id}
                        className={`
                          border-b
                          ${index % 2 === 0 ? "bg-white" : "bg-[#103c7f]/5"}
                          hover:bg-[#a1db40]/20 transition
                        `}
                      >
                        <td className="px-3 py-2">{lead.sourcing_date}</td>

                        {/* COMPANY WITH STAR LOGIC */}
                        <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                               <span className="font-bold text-[#103c7f]">{lead.company}</span>
                               {lead.client_type === 'Premium' && (
                                 <Star size={10} className="fill-[#103c7f] text-[#103c7f]" />
                               )}
                            </div>
                        </td>

                        <td className="px-3 py-2">{lead.category}</td>
                        <td className="px-3 py-2">{lead.state}</td>
                        <td className="px-3 py-2">{lead.location}</td>

                        {/* Removed Client Type Data Column Here */}

                        <td className="px-3 py-2">{lead.employee_count}</td>
                        <td className="px-3 py-2">{lead.contact_person}</td>
                        <td className="px-3 py-2">{lead.contact_no}</td>
                        <td className="px-3 py-2 text-blue-700 underline">
                          {lead.email}
                        </td>
                        <td className="px-3 py-2">{lead.contact_mode}</td>
                        <td className="px-3 py-2">{lead.latest_contact_mode}</td>
                        <td className="px-3 py-2">{lead.contact_date}</td>
                        <td className="px-3 py-2">{lead.latest_contact_date}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">
                          {lead.remarks}
                        </td>
                        <td className="px-3 py-2">{lead.reference}</td>
                        <td className="px-3 py-2 font-bold text-gray-800">
                          {lead.next_follow_up}
                        </td>

                        {/* ===== STATUS BADGE ===== */}
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 rounded-full text-[10px] font-black bg-[#a1db40]/20 text-[#103c7f]">
                            {lead.status}
                          </span>
                        </td>

                        <td className="px-3 py-2">{lead.sub_status}</td>
                        <td className="px-3 py-2 font-bold">{lead.projection}</td>

                        {/* ===== ACTION COLUMN ===== */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openViewModal(lead)}
                              className="p-1.5 bg-blue-50 text-[#103c7f] rounded-lg hover:bg-blue-100 border border-blue-100 transition-all shadow-sm"
                              title="View Full Details"
                            >
                              <Eye size={14} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 bg-[#103c7f] text-white rounded-lg hover:bg-[#a1db40] hover:text-[#103c7f] transition-all shadow-sm"
                              title="Edit Record"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>

              {/* VIEW MORE BUTTON */}
              {!viewAll && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => fetchLeads(true)}
                    disabled={saving || loading}
                    className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg uppercase italic text-[11px] disabled:opacity-50"
                  >
                    VIEW MORE
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* 11. MODAL: ADD/EDIT CLIENT */}
      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          isViewMode={isViewMode}
          onSave={handleFormSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          saving={saving}
          {...dropdowns}
        />
      )}

    </div>
  );
}

// Separate Modal Component
function LeadModal({ lead, isViewMode, onSave, onClose, saving, ...lists }) {
  const [formData, setFormData] = useState({
    sourcing_date: lead?.sourcing_date || new Date().toISOString().split('T')[0],
    company: lead?.company || '',
    client_type: lead?.client_type || '',
    category: lead?.category || '',
    state: lead?.state || '',
    location: lead?.location || '',
    employee_count: lead?.employee_count || '',
    contact_person: lead?.contact_person || '',
    contact_no: lead?.contact_no || '',
    email: lead?.email || '',
    contact_mode: lead?.contact_mode || 'Call',
    latest_contact_mode: lead?.latest_contact_mode || 'Call',
    contact_date: lead?.contact_date || new Date().toISOString().split('T')[0],
    latest_contact_date: lead?.latest_contact_date || new Date().toISOString().split('T')[0],
    reference: lead?.reference || '',
    next_follow_up: lead?.next_follow_up || '',
    status: lead?.status || '',
    sub_status: lead?.sub_status || '',
    projection: lead?.projection || 'Not Projected',
    remarks: lead?.remarks || ''
  });

  // Mock History Logic for View Mode
  const interactionHistory = [
    { id: 1, date: "24 Dec 2025", type: "Visit", outcome: "Proposal Shared", notes: "Met HR Manager, they need 50 staff next month." },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if(!isViewMode) onSave(formData);
  };

  const updateField = (field, value) => {
    if(!isViewMode) setFormData(prev => ({ ...prev, [field]: value }));
  };

  const inputClass = `w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#103c7f]/30 focus:border-[#103c7f] transition ${isViewMode ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100' : ''}`;

  // --- VIEW MODE RENDER ---
  if (isViewMode) {
    return (
      <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-['Calibri']">
        <div className="bg-[#f8fafc] rounded-[24px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-start shrink-0">
             <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase">{lead?.company}</h2>
                   {lead?.client_type === 'Premium' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 border border-yellow-200"><Star size={10} className="fill-yellow-600"/> Premium</span>}
                </div>
                <p className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-2"><MapPin size={12} /> {lead?.location}, {lead?.state}</p>
             </div>
             <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-500 transition"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                   <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Client Details</h3>
                      <div className="flex items-start gap-3"><div className="bg-blue-50 p-2 rounded-lg text-[#103c7f]"><User size={16}/></div><div><p className="text-[10px] font-bold text-gray-400 uppercase">Contact Person</p><p className="text-sm font-bold text-gray-800">{lead?.contact_person}</p></div></div>
                      <div className="flex items-start gap-3"><div className="bg-blue-50 p-2 rounded-lg text-[#103c7f]"><Phone size={16}/></div><div><p className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</p><p className="text-sm font-bold text-gray-800">{lead?.contact_no}</p></div></div>
                      <div className="flex items-start gap-3"><div className="bg-blue-50 p-2 rounded-lg text-[#103c7f]"><Building2 size={16}/></div><div><p className="text-[10px] font-bold text-gray-400 uppercase">Type</p><p className="text-sm font-bold text-gray-800">{lead?.client_type}</p></div></div>
                   </div>
                </div>
                <div className="md:col-span-2">
                   <div className="flex items-center gap-3 mb-6"><History size={20} className="text-[#103c7f]" /><h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Activity Log</h3></div>
                   <div className="space-y-6 pl-2">
                      {interactionHistory.map((log, idx) => (
                         <div key={log.id} className="relative flex gap-6 group">
                            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-2 bg-blue-50 border-blue-200 text-blue-600 z-10"><Calendar size={16}/></div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-1"><p className="font-bold text-[#103c7f] text-xs">{log.outcome}</p><p className="text-[10px] text-gray-400">{log.date}</p><p className="text-xs text-gray-600 mt-1 italic">"{log.notes}"</p></div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // --- EDIT MODE RENDER ---
  return (
    <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto relative border border-white/50">

        {/* HEADER */}
        <div className="sticky top-0 bg-white/95 backdrop-blur px-10 py-6 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-black text-[#103c7f] uppercase italic tracking-tight">
            {lead ? `Update Record : ${lead.company}` : "New Client Registration"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Sourcing Date</label>
            <input type="date" value={formData.sourcing_date} onChange={(e) => updateField('sourcing_date', e.target.value)} className={inputClass} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Company</label>
            <input type="text" value={formData.company} onChange={(e) => updateField('company', e.target.value)} className={inputClass} required />
          </div>

          {/* CLIENT TYPE DROPDOWN */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Client Type</label>
            <select value={formData.client_type} onChange={(e) => updateField('client_type', e.target.value)} className={inputClass} required>
              <option value="">Select Client Type</option>
              {lists.clientTypeList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Category</label>
            <select value={formData.category} onChange={(e) => updateField('category', e.target.value)} className={inputClass} required>
              <option value="">Select Category</option>
              {lists.categoryList.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">State</label>
            <select value={formData.state} onChange={(e) => updateField('state', e.target.value)} className={inputClass} required>
              <option value="">Select State</option>
              {lists.statesList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Location</label>
            <input type="text" value={formData.location} onChange={(e) => updateField('location', e.target.value)} className={inputClass} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Employee Count</label>
            <select value={formData.employee_count} onChange={(e) => updateField('employee_count', e.target.value)} className={inputClass} required>
              <option value="">Select Count</option>
              {lists.empCountList.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Contact Person</label>
            <input type="text" value={formData.contact_person} onChange={(e) => updateField('contact_person', e.target.value)} className={inputClass} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Contact No.</label>
            <input type="tel" value={formData.contact_no} onChange={(e) => updateField('contact_no', e.target.value)} className={inputClass} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Call / Visit</label>
            <select value={formData.contact_mode} onChange={(e) => updateField('contact_mode', e.target.value)} className={inputClass}>
              <option value="Call">Call</option>
              <option value="Visit">Visit</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Latest Mode</label>
            <select value={formData.latest_contact_mode} onChange={(e) => updateField('latest_contact_mode', e.target.value)} className={inputClass}>
              <option value="Call">Call</option>
              <option value="Visit">Visit</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Date of Call / Visit</label>
            <input type="date" value={formData.contact_date} onChange={(e) => updateField('contact_date', e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Latest Date</label>
            <input type="date" value={formData.latest_contact_date} onChange={(e) => updateField('latest_contact_date', e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Reference</label>
            <input type="text" value={formData.reference} onChange={(e) => updateField('reference', e.target.value)} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Next Followup</label>
            <input type="date" value={formData.next_follow_up} onChange={(e) => updateField('next_follow_up', e.target.value)} className={`${inputClass} bg-orange-50 border-orange-200 text-orange-700`} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Status</label>
            <select value={formData.status} onChange={(e) => updateField('status', e.target.value)} className={inputClass} required>
              <option value="">Select status</option>
              {lists.statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Sub Status</label>
            <select value={formData.sub_status} onChange={(e) => updateField('sub_status', e.target.value)} className={inputClass}>
              <option value="">Select Sub status</option>
              {lists.subStatusList.map(ss => <option key={ss} value={ss}>{ss}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Projection</label>
            <select value={formData.projection} onChange={(e) => updateField('projection', e.target.value)} className={inputClass}>
              <option value="">Select Projection</option>
              {lists.projectionList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wide text-gray-500 ml-1">Remarks</label>
            <textarea
              rows="3"
              value={formData.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Additional notes..."
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-6 mt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#103c7f] text-white py-2.5 rounded-xl font-bold uppercase italic text-xs tracking-widest hover:bg-[#1a4da1] shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {lead ? "Update Record" : "Save Record"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}