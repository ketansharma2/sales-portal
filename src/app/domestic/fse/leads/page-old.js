"use client";
import { useState, useEffect } from "react";
import { Pencil, Plus, X, Search, Filter } from "lucide-react";

export default function LeadsList() {
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // 1. HYDRATION FIX
  useEffect(() => { setMounted(true); }, []);

  // --- 2. MODAL FUNCTIONS (FIXED) ---
  const openEditModal = (lead) => {
    setSelectedLead(lead); // Row ka data form mein bhar dega
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedLead(null); // Form khali rakhega
    setIsModalOpen(true);
  };

  // --- DROPDOWN LISTS ---
 const categoryList = ["Industrial", "IT / Service", "Retail", "Manufacturing"];

const statesList = [
  "Delhi", "Haryana", "UP", "Maharashtra",
  "Punjab", "Gujarat", "Karnataka"
];

const empCountList = ["1-50", "51-200", "201-500", "500+"];

const projectionList = ["WP > 50", "WP < 50", "MP > 50", "MP < 50"];

const statusList = ["Interested", "Not Interested", "Onboarded"];

// ✅ NEW: SUB STATUS DROPDOWN LIST
const subStatusList = [
  "Blue Collar",
  "Call Back",
  "In Process",
  "Low Budget",
  "Medicant",
  "Not ready to sign",
  "Proposal Shared",
  "Right Person Founded"
];

  // --- DUMMY DATA SYNCED WITH HEADERS ---
  const [leads] = useState([
  { 
    id: 1, 
    company: "Sample Enterprise Ltd", 
    sourcingDate: "2025-12-21", 
    category: "Industrial", 
    state: "Haryana",
    location: "Gurugram", 
    empCount: "51-200",
    contactPerson: "Rahul Sharma",
    contactNo: "9876543210", 
    email: "rahul@sample.com",
    callVisit: "Visit",
    latestMode: "Call",
    dateOfCall: "2025-12-20",
    latestCallDate: "2025-12-19",
    remarks: "Follow up soon",
    reference: "Direct",
    nextFollowup: "2025-12-25",
    status: "Interested", 
    subStatus: "In Progress",
    projection: "WP > 50"
  },
  { 
    id: 2, 
    company: "TechNova Solutions", 
    sourcingDate: "2025-12-22", 
    category: "IT / Service", 
    state: "Maharashtra",
    location: "Pune", 
    empCount: "201-500",
    contactPerson: "Anita Verma",
    contactNo: "9123456780", 
    email: "anita@technova.com",
    callVisit: "Call",
    latestMode: "Phone Call",
    dateOfCall: "2025-12-21",
    latestCallDate: "2025-12-21",
    remarks: "Positive discussion",
    reference: "LinkedIn",
    nextFollowup: "2025-12-28",
    status: "Interested", 
    subStatus: "Call-Back",
    projection: "MP > 50"
  }
]);

  if (!mounted) return null;

  return (
<div className="w-full h-screen flex flex-col overflow-hidden font-['Calibri']">
      
      {/* 3. HEADER SECTION */}
      <div className="flex items-center gap-8 mb-6 pr-4">
        <div>
          <h1 className="text-2xl font-black text-[#103c7f] tracking-tight uppercase italic leading-none">Leads Master Database</h1>
          <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-1.5 flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-[#a1db40] rounded-full animate-pulse shadow-[0_0_5px_#a1db40]"></span> Field Operations Portal
          </p>
        </div>
        <button onClick={openAddModal} className="bg-[#a1db40] text-[#103c7f] px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg uppercase italic text-[11px]">
          <Plus size={18} strokeWidth={4} /> ADD NEW CLIENT
        </button>
      </div>

      {/* 4. FILTER BAR: No Apply button, all inputs are filters */}
<div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm mb-6 w-full shrink-0">
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
    
    {/* 1. Company Filter */}
    <input 
      type="text" 
      placeholder="COMPANY..." 
      className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none placeholder:text-gray-300" 
    />

    {/* 2. Category Filter */}
    <select className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none">
      <option>CATEGORY</option>
      {categoryList.map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    {/* 3. State Filter */}
    <select className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none">
      <option>STATE</option>
      {statesList.map(s => <option key={s} value={s}>{s}</option>)}
    </select>

    {/* 4. Date Filter */}
    <input 
      type="date" 
      className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none" 
    />

    {/* 5. Status Filter */}
    <select className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none">
      <option>STATUS</option>
      {statusList.map(st => <option key={st} value={st}>{st}</option>)}
    </select>

    {/* 6. Location Filter */}
    <input 
      type="text" 
      placeholder="LOCATION..." 
      className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none placeholder:text-gray-300" 
    />

    {/* 7. Projection Filter (Replacing Apply Button) */}
    <select className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-[#103c7f] outline-none cursor-pointer appearance-none">
  <option>PROJECTION</option>
  {projectionList.map(p => (
    <option key={p} value={p}>{p}</option>
  ))}
</select>

  </div>
</div>

   
{/* 5. LEADS TABLE */}
<div className="bg-white border border-[#103c7f]/20 rounded-xl shadow-md flex-1 min-h-0">
  <div className="w-full h-full overflow-x-auto overflow-y-auto">

    <table className="min-w-[3200px] text-[11px] border-collapse">

      {/* ===== TABLE HEADER (THEME COLOR) ===== */}
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
        {leads.length === 0 ? (
          <tr>
            <td colSpan={20} className="text-center py-10 text-gray-400 font-bold">
              No records found
            </td>
          </tr>
        ) : (
          leads.map((lead, index) => (
            <tr
              key={lead.id}
              className={`
                border-b
                ${index % 2 === 0 ? "bg-white" : "bg-[#103c7f]/5"}
                hover:bg-[#a1db40]/20 transition
              `}
            >
              <td className="px-3 py-2">{lead.sourcingDate}</td>
              <td className="px-3 py-2 font-bold text-[#103c7f]">{lead.company}</td>
              <td className="px-3 py-2">{lead.category}</td>
              <td className="px-3 py-2">{lead.state}</td>
              <td className="px-3 py-2">{lead.location}</td>
              <td className="px-3 py-2">{lead.empCount}</td>
              <td className="px-3 py-2">{lead.contactPerson}</td>
              <td className="px-3 py-2">{lead.contactNo}</td>
              <td className="px-3 py-2 text-blue-700 underline">
                {lead.email}
              </td>
              <td className="px-3 py-2">{lead.callVisit}</td>
              <td className="px-3 py-2">{lead.latestMode}</td>
              <td className="px-3 py-2">{lead.dateOfCall}</td>
              <td className="px-3 py-2">{lead.latestCallDate}</td>
              <td className="px-3 py-2 max-w-[200px] truncate">
                {lead.remarks}
              </td>
              <td className="px-3 py-2">{lead.reference}</td>
              <td className="px-3 py-2 font-bold text-gray-800">
  {lead.nextFollowup}
</td>

              {/* ===== STATUS BADGE ===== */}
              <td className="px-3 py-2">
                <span className="px-2 py-1 rounded-full text-[10px] font-black bg-[#a1db40]/20 text-[#103c7f]">
                  {lead.status}
                </span>
              </td>

              <td className="px-3 py-2">{lead.subStatus}</td>
              <td className="px-3 py-2 font-bold">{lead.projection}</td>

              {/* ===== ACTION BUTTON ===== */}
              <td className="px-3 py-2">
                <button
                  onClick={() => openEditModal(lead)}
                  className="p-1.5 bg-[#103c7f] text-white rounded-lg hover:bg-[#a1db40] hover:text-[#103c7f] transition"
                >
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>

    </table>

  </div>
</div>



      {/* 5. TABLE SECTION WITH FROZEN COLUMNS 
      <div className="bg-white shadow-xl shadow-gray-200/40 rounded-[24px] border border-gray-100 overflow-hidden w-full">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
          <table className="min-w-[3200px] border-collapse text-left table-fixed">
            <thead className="bg-gray-50/80 border-b text-[9px] uppercase font-black text-gray-400 tracking-wider">
              <tr>
                <th className="w-[60px] px-3 py-3 sticky left-0 bg-gray-50 z-40 border-r text-center">Edit</th>
                <th className="w-[240px] px-3 py-3 sticky left-[60px] bg-gray-50 z-40 border-r shadow-md text-[#103c7f]">COMPANY</th>
                <th className="w-[150px] px-3 py-3">SOURCING DATE</th>
                <th className="w-[120px] px-3 py-3">CATEGORY</th>
                <th className="w-[120px] px-3 py-3">STATE</th>
                <th className="w-[200px] px-3 py-3">LOCATION</th>
                <th className="w-[140px] px-3 py-3">EMPLOYEE COUNT</th>
                <th className="w-[150px] px-3 py-3">CONTACT PERSON</th>
                <th className="w-[140px] px-3 py-3">CONTACT NO.</th>
                <th className="w-[200px] px-3 py-3">EMAIL</th>
                <th className="w-[120px] px-3 py-3">CALL/ VISIT</th>
                <th className="w-[180px] px-3 py-3">LATEST MODE OF CONTACT</th>
                <th className="w-[150px] px-3 py-3">DATE OF CALL/ VISIT</th>
                <th className="w-[180px] px-3 py-3">LATEST DATE OF CALLING/ VISIT</th>
                <th className="w-[200px] px-3 py-3">REMARKS</th>
                <th className="w-[120px] px-3 py-3">REFERENCE</th>
                <th className="w-[150px] px-3 py-3 text-orange-600 italic">NEXT FOLLOWUP DATE</th>
                <th className="w-[140px] px-3 py-3">STATUS</th>
                <th className="w-[120px] px-3 py-3">SUB STATUS</th>
                <th className="w-[120px] px-3 py-3">Projection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px] font-medium italic">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/20 transition-all whitespace-nowrap group">
                  <td className="px-3 py-2 sticky left-0 bg-white z-30 border-r text-center group-hover:bg-blue-50/10 transition-colors">
                    <button onClick={() => openEditModal(lead)} className="text-[#103c7f] hover:text-[#a1db40] p-1.5 rounded-md bg-gray-50 shadow-sm transition-all"><Pencil size={12} /></button>
                  </td>
                  <td className="px-3 py-2 sticky left-[60px] bg-white z-30 border-r font-black text-[#103c7f] not-italic group-hover:bg-blue-50/10 truncate">{lead.company}</td>
                  <td className="px-3 py-2 not-italic font-bold text-gray-500 tabular-nums">{lead.sourcingDate}</td>
                  <td className="px-3 py-2"><span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">{lead.category}</span></td>
                  <td className="px-3 py-2 not-italic">{lead.state}</td>
                  <td className="px-3 py-2 text-gray-400 truncate">{lead.location}</td>
                  <td className="px-3 py-2 not-italic">{lead.empCount}</td>
                  <td className="px-3 py-2 not-italic font-bold text-gray-600">{lead.contactPerson}</td>
                  <td className="px-3 py-2 tabular-nums not-italic font-bold text-gray-600">{lead.contactNo}</td>
                  <td className="px-3 py-2 text-blue-500 underline not-italic">{lead.email}</td>
                  <td className="px-3 py-2 text-gray-400 font-bold uppercase text-[9px]">{lead.callVisit}</td>
                  <td className="px-3 py-2 text-gray-400 font-bold uppercase text-[9px]">{lead.latestMode}</td>
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{lead.dateOfCall}</td>
                  <td className="px-3 py-2 text-gray-400 tabular-nums">{lead.latestCallDate}</td>
                  <td className="px-3 py-2 text-gray-400 truncate max-w-[200px]">{lead.remarks}</td>
                  <td className="px-3 py-2 text-gray-300 font-black uppercase text-[8px] not-italic">{lead.reference}</td>
                  <td className="px-3 py-2 text-orange-600 font-black tabular-nums not-italic">{lead.nextFollowup}</td>
                  <td className="px-3 py-2 not-italic"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border border-blue-100">{lead.status}</span></td>
                  <td className="px-3 py-2 text-gray-300 font-black uppercase text-[8px] not-italic">{lead.subStatus}</td>
                  <td className="px-3 py-2 font-black text-green-700 uppercase italic text-[9px] not-italic">{lead.projection}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>*/}

      {/* 6. MODAL: EDIT & ADD CLIENT (Integrated) */}
{/* 6. MODAL: EDIT & ADD CLIENT */}
{isModalOpen && (
  <div className="fixed inset-0 bg-[#103c7f]/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">

    <div className="bg-white rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto relative">

      {/* HEADER */}
      <div className="sticky top-0 bg-white px-10 py-6 border-b flex justify-between items-center z-10">
        <h2 className="text-xl font-black text-[#103c7f] uppercase italic tracking-tight">
          {selectedLead ? `Update Record : ${selectedLead.company}` : "New Client Registration"}
        </h2>
        <button
          onClick={() => setIsModalOpen(false)}
          className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 transition"
        >
          <X size={22} />
        </button>
      </div>

      {/* FORM */}
      <form
        onSubmit={(e) => e.preventDefault()}
        className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6"
      >

        {/* COMMON FIELD STYLE */}
        {/** Sourcing Date **/}
        <div className="flex flex-col gap-1">
          <label className="form-label">Sourcing Date</label>
          <input type="date" defaultValue={selectedLead?.sourcingDate} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Company</label>
          <input type="text" defaultValue={selectedLead?.company} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Category</label>
          <select defaultValue={selectedLead?.category} className="form-select">
            {categoryList.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">State</label>
          <select defaultValue={selectedLead?.state} className="form-select">
            {statesList.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Location</label>
          <input type="text" defaultValue={selectedLead?.location} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Employee Count</label>
          <select defaultValue={selectedLead?.empCount} className="form-select">
            {empCountList.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Contact Person</label>
          <input type="text" defaultValue={selectedLead?.contactPerson} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Contact No.</label>
          <input type="tel" defaultValue={selectedLead?.contactNo} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Email</label>
          <input type="email" defaultValue={selectedLead?.email} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Call / Visit</label>
          <select defaultValue={selectedLead?.callVisit} className="form-select">
            <option>Call</option>
            <option>Visit</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Latest Mode</label>
          <select className="form-select">
            <option>Call</option>
            <option>Visit</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Date of Call / Visit</label>
          <input type="date" defaultValue={selectedLead?.dateOfCall} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Latest Date</label>
          <input type="date" defaultValue={selectedLead?.latestCallDate} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Reference</label>
          <input type="text" defaultValue={selectedLead?.reference} className="form-input" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Next Followup</label>
          <input
            type="date"
            defaultValue={selectedLead?.nextFollowup}
            className="form-input bg-orange-50 border-orange-200 text-orange-700"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Status</label>
          <select defaultValue={selectedLead?.status} className="form-select">
            {statusList.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Sub Status</label>
          <select defaultValue={selectedLead?.subStatus} className="form-select">
            {subStatusList.map(ss => <option key={ss}>{ss}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label">Projection</label>
          <select defaultValue={selectedLead?.projection} className="form-select">
            {projectionList.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* REMARKS */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-1">
          <label className="form-label">Remarks</label>
          <textarea
            rows="3"
            defaultValue={selectedLead?.remarks}
            className="form-input resize-none"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-6 mt-4 border-t">
  <button
    type="button"
    onClick={() => setIsModalOpen(false)}
    // py-4 ko py-2.5 kiya aur text-xs add kiya
    className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
  >
    Cancel
  </button>
  <button
    type="submit"
    // font-black ko font-bold kiya aur py-2.5 use kiya
    className="flex-1 bg-[#103c7f] text-white py-2.5 rounded-xl font-bold uppercase italic text-xs tracking-widest hover:bg-[#1a4da1] shadow-lg active:scale-95 transition-all"
  >
    {selectedLead ? "Update Record" : "Save Record"}
  </button>
</div>

      </form>
    </div>
  </div>
)}

    </div>
  );
}