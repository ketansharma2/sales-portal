"use client";
import { useState, useEffect } from "react";
import {
  Search, Phone, Filter, X, Save, Plus, Eye,
  Calendar, MapPin, ListFilter,ArrowRight,Send,Lock,Edit,Award,Users,Briefcase
} from "lucide-react";

export default function LeadsTablePage() {
  
  // --- MOCK DATA --- (will be replaced by API data)
  const initialLeads = [];

  const [leads, setLeads] = useState(initialLeads);
  const [allLeads, setAllLeads] = useState(initialLeads);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState("");
  const [managerName, setManagerName] = useState("Manager");

   const [newLeadData, setNewLeadData] = useState({
     company: '',
     category: '',
     state: '',
     location: '',
     emp_count: '1 - 10',
     reference: '',
     sourcing_date: '',
     startup: '',
     district_city: ''
   });

   const [interactionData, setInteractionData] = useState({
     date: new Date().toISOString().split('T')[0],
     status: '',
     sub_status: '',
     remarks: '',
     next_follow_up: '',
     contact_person: '',
     contact_no: '',
     email: '',
     franchise_status: ''
   });

   const [interactions, setInteractions] = useState([]);
   const [suggestions, setSuggestions] = useState({ persons: [], nos: [], emails: [] });

   const [districtsList, setDistrictsList] = useState([]);

   // --- FULL LISTS ---
   const [indianStates, setIndianStates] = useState([]);
   const [stateDistrictData, setStateDistrictData] = useState({});

   const industryCategories = [
     "Information Technology (IT)", "Finance & Banking", "Healthcare", "Education", "Manufacturing",
     "Construction & Real Estate", "Retail & Consumer Goods", "Travel & Hospitality", "Energy & Utilities",
     "Media & Communications", "Transportation & Logistics", "Agriculture", "Automotive",
     "Telecommunications", "Pharmaceuticals", "Textiles", "Mining", "Non-Profit / NGO", "Government / Public Sector",
     "Consulting", "Legal Services", "Marketing & Advertising", "Insurance", "Entertainment", "Other"
   ];
   const employeeCounts = [
     "1 - 10",
     "11 - 50",
     "51 - 200",
     "201 - 500",
     "501 - 1000",
     "1001 - 5000",
     "5000 +"
   ];



      const fetchLeads = async () => {
        try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch('/api/corporate/leadgen/leads', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            // Normalize and store leads - API now returns contact_person, contact_no, email directly from latest interaction
            const normalized = data.data.map(item => ({
              ...item,
              contact_person: item.contact_person || item.contactPerson || '',
              contact_no: item.contact_no || item.contactNo || item.phone || item.mobile || '',
              phone: item.phone || item.contact_no || item.contactNo || item.mobile || '',
              email: item.email || item.contact_email || item.contactEmail || ''
            }));

            setAllLeads(normalized);
          }
        } catch (error) {
          console.error('Failed to fetch leads:', error);
        } finally {
          setLoading(false);
        }
      };

    const fetchInteractions = async (clientId) => {
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        const response = await fetch(`/api/corporate/leadgen/interaction?client_id=${clientId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setInteractions(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch interactions:', error);
      }
    };

    const fetchStateDistrictData = async () => {
      try {
        const response = await fetch('/India-State-District.json');
        const data = await response.json();
        setStateDistrictData(data);
        setIndianStates(Object.keys(data));
      } catch (error) {
        console.error('Failed to fetch state district data:', error);
        setStateDistrictData({});
        setIndianStates([]);
      }
    };

    const fetchDistricts = (stateName) => {
      if (!stateName) {
        setDistrictsList([]);
        return;
      }
      const districts = stateDistrictData[stateName] || [];
      setDistrictsList(districts);
    };

     const fetchManagerName = async () => {
       try {
         const session = JSON.parse(localStorage.getItem('session') || '{}');
         const response = await fetch('/api/corporate/leadgen/send-to-manager', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${session.access_token}`
           },
           body: JSON.stringify({ client_id: 0 }) // Just to get manager info
         });
         const data = await response.json();
         if (data.success && data.data?.managerName) {
           setManagerName(data.data.managerName);
         }
       } catch (error) {
         console.error('Failed to fetch manager name:', error);
       }
     };

   useEffect(() => {
      const init = async () => {
        await fetchStateDistrictData();
        await fetchLeads();
        await fetchManagerName();
        // Check for search query param
        const urlParams = new URLSearchParams(window.location.search);
        const searchCompany = urlParams.get('search');
        if (searchCompany) {
          handleFilterChange("company", searchCompany);
        }
      };
      init();
    }, []);

     // Fetch suggestions when adding interaction
     useEffect(() => {
       const fetchSuggestions = async () => {
         if (!selectedLead?.id || modalType !== 'add') return;
         try {
           const session = JSON.parse(localStorage.getItem('session') || '{}');
           const response = await fetch(`/api/corporate/leadgen/interaction?client_id=${selectedLead.id}`, {
             headers: {
               'Authorization': `Bearer ${session.access_token}`
             }
           });
           const data = await response.json();
           if (data.success) {
             const persons = [...new Set(data.data.map(i => i.contact_person).filter(Boolean))];
             const nos = [...new Set(data.data.map(i => i.contact_no).filter(Boolean))];
             const emails = [...new Set(data.data.map(i => i.email).filter(Boolean))];
             setSuggestions({ persons, nos, emails });
           }
         } catch (error) {
           console.error('Failed to fetch suggestions');
         }
       };
       fetchSuggestions();
     }, [selectedLead, modalType]);

     // Apply filters whenever allLeads changes (to preserve filters after data refresh)
     useEffect(() => {
       // Only apply filters if we have data (not empty)
       if (allLeads.length > 0) {
         applyCurrentFilters();
       }
     }, [allLeads]);

    // --- FILTER STATE ---
    const [filters, setFilters] = useState({
      fromDate: "",
      toDate: "",
      company: "",
      location: "",
      status: "All",
      subStatus: "All",
      franchiseStatus: "All",
      startup: "All"
    });

   // --- REAL-TIME FILTER LOGIC ---
   const handleFilterChange = (key, value) => {
     const newFilters = { ...filters, [key]: value };
     setFilters(newFilters);

     // Filter Logic
     const filtered = allLeads.filter(lead => {
       // 1. Date Range Check (with null safety)
       const leadDateStr = lead.sourcingDate || '';
       const leadDate = leadDateStr ? new Date(leadDateStr) : null;
       const from = newFilters.fromDate ? new Date(newFilters.fromDate) : null;
       const to = newFilters.toDate ? new Date(newFilters.toDate) : null;

       const isAfterFrom = from && leadDate ? leadDate >= from : true;
       const isBeforeTo = to && leadDate ? leadDate <= to : true;

        // 2. Text Matching (with null safety)
        const matchCompany = newFilters.company === '' ||
          ((lead.company || '').toLowerCase().includes(newFilters.company.toLowerCase()) ||
           (lead.contact_person || '').toLowerCase().includes(newFilters.company.toLowerCase()));
        const matchLocation = newFilters.location === '' ||
          ((lead.district_city || '') + ' ' + (lead.state || '') + ' ' + (lead.location || '')).toLowerCase().includes(newFilters.location.toLowerCase());

         // 3. Dropdown Matching (with null safety)
         const matchStatus = newFilters.status === "All" ||
           ((lead.status || '').trim().toLowerCase() === (newFilters.status || '').trim().toLowerCase());
         const matchSubStatus = newFilters.subStatus === "All" || ((lead.subStatus || '').trim().toLowerCase()) === (newFilters.subStatus || '').trim().toLowerCase();
         const matchFranchiseStatus = newFilters.franchiseStatus === "All" || ((lead.franchiseStatus || '').trim().toLowerCase()) === (newFilters.franchiseStatus || '').trim().toLowerCase();
         const matchStartup = newFilters.startup === "All" || ((lead.startup || '').trim().toLowerCase()) === (newFilters.startup || '').trim().toLowerCase();

        return isAfterFrom && isBeforeTo && matchCompany && matchLocation && matchStatus && matchSubStatus && matchFranchiseStatus && matchStartup;
     });

     setLeads(filtered);
   };

   // --- APPLY CURRENT FILTERS TO ALL LEADS ---
   const applyCurrentFilters = () => {
     const filtered = allLeads.filter(lead => {
       // 1. Date Range Check (with null safety)
       const leadDateStr = lead.sourcingDate || '';
       const leadDate = leadDateStr ? new Date(leadDateStr) : null;
       const from = filters.fromDate ? new Date(filters.fromDate) : null;
       const to = filters.toDate ? new Date(filters.toDate) : null;

       const isAfterFrom = from && leadDate ? leadDate >= from : true;
       const isBeforeTo = to && leadDate ? leadDate <= to : true;

        // 2. Text Matching (with null safety)
        const matchCompany = filters.company === '' ||
          ((lead.company || '').toLowerCase().includes(filters.company.toLowerCase()) ||
           (lead.contact_person || '').toLowerCase().includes(filters.company.toLowerCase()));
        const matchLocation = filters.location === '' ||
          ((lead.district_city || '') + ' ' + (lead.state || '') + ' ' + (lead.location || '')).toLowerCase().includes(filters.location.toLowerCase());

         // 3. Dropdown Matching (with null safety)
         const matchStatus = filters.status === "All" ||
           ((lead.status || '').trim().toLowerCase() === (filters.status || '').trim().toLowerCase());
         const matchSubStatus = filters.subStatus === "All" || ((lead.subStatus || '').trim().toLowerCase()) === (filters.subStatus || '').trim().toLowerCase();
         const matchFranchiseStatus = filters.franchiseStatus === "All" || ((lead.franchiseStatus || '').trim().toLowerCase()) === (filters.franchiseStatus || '').trim().toLowerCase();
         const matchStartup = filters.startup === "All" || ((lead.startup || '').trim().toLowerCase()) === (filters.startup || '').trim().toLowerCase();

        return isAfterFrom && isBeforeTo && matchCompany && matchLocation && matchStatus && matchSubStatus && matchFranchiseStatus && matchStartup;
     });

     setLeads(filtered);
   };

    // --- CLEAR ALL FILTERS ---
    const clearAllFilters = () => {
      setFilters({
        fromDate: "",
        toDate: "",
        company: "",
        location: "",
        status: "All",
        subStatus: "All",
        franchiseStatus: "All",
        startup: "All"
      });
      setLeads(allLeads);
    };

    const handleAction = async (lead, type) => {
     setSelectedLead(lead);
     setModalType(type);
     setIsFormOpen(true);
     
     if (type === 'view') {
       await fetchInteractions(lead.id);
     }

     // --- NEW CODE: Pre-fill data for Edit ---
     if (type === 'edit') {
       setNewLeadData({
         company: lead.company || '',
         category: lead.category || '',
         state: lead.state || '',
         location: lead.location || '',
         // Map the table's camelCase keys to the form's snake_case keys
         emp_count: lead.empCount || '1 - 10',
         reference: lead.reference || '',
         sourcing_date: lead.sourcingDate || '',
         startup: lead.startup || '',
         district_city: lead.districtCity || ''
       });
     }
   };

   const handleCreateNew = () => {
     setSelectedLead(null); // No selected lead yet
     setModalType("create");
     setIsFormOpen(true);
      // Reset form data to ensure clean slate for new lead
      setNewLeadData({
        company: '',
        category: '',
        state: '',
        location: '',
        emp_count: '1 - 10',
        reference: '',
        sourcing_date: '',
        startup: '',
        district_city: ''
      });
   };

   const handleSaveOnly = async () => {
     try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       const response = await fetch('/api/corporate/leadgen/leadscreation', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session.access_token}`
         },
         body: JSON.stringify(newLeadData)
       });
       const data = await response.json();
       if (data.success) {
         setIsFormOpen(false);
         setNewLeadData({ company: '', category: '', state: '', location: '', emp_count: '1 - 10', reference: '', sourcing_date: '', startup: '', district_city: '' });
         fetchLeads();
       } else {
         alert('Failed to save lead');
       }
     } catch (error) {
       console.error('Failed to save lead:', error);
     }
   };

   const handleSaveAndFollowup = async () => {
     try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       const response = await fetch('/api/corporate/leadgen/leads', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session.access_token}`
         },
         body: JSON.stringify(newLeadData)
       });
       const data = await response.json();
       if (data.success) {
          setSelectedLead({
            id: data.data.client_id,
            company: data.data.company,
            category: data.data.category,
            state: data.data.state,
            location: data.data.location,
            empCount: data.data.emp_count,
            reference: data.data.reference,
            sourcingDate: data.data.sourcing_date,
            status: 'New',
            subStatus: 'New Lead'
          });
          setModalType("add");
          setNewLeadData({ company: '', category: '', state: '', location: '', emp_count: '1 - 10', reference: '', sourcing_date: '', startup: '', district_city: '' });
         fetchLeads();
       } else {
         alert('Failed to save lead');
       }
     } catch (error) {
       console.error('Failed to save lead:', error);
     }
   };

   const handleUpdateLead = async () => {
     try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       // Assuming you use PUT or PATCH for updates. Adjust the method/URL if your API is different.
       const response = await fetch('/api/corporate/leadgen/leads', { 
         method: 'PUT', 
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session.access_token}`
         },
         body: JSON.stringify({
           client_id: selectedLead.id, // We need the ID to know which lead to update
           ...newLeadData
         })
       });
       const data = await response.json();
       if (data.success) {
         setIsFormOpen(false);
         setNewLeadData({ company: '', category: '', state: '', location: '', emp_count: '1 - 10', reference: '', sourcing_date: '', startup: '', district_city: '' });
         fetchLeads(); // Refresh table
       } else {
         alert('Failed to update lead');
       }
     } catch (error) {
       console.error('Failed to update lead:', error);
     }
   };
   const handleSaveInteraction = async () => {
     try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       const response = await fetch('/api/corporate/leadgen/interaction', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session.access_token}`
         },
         body: JSON.stringify({
           client_id: selectedLead.id,
           ...interactionData
         })
       });
       const data = await response.json();
       if (data.success) {
         setIsFormOpen(false);
         setInteractionData({ date: new Date().toISOString().split('T')[0], status: '', sub_status: '', remarks: '', next_follow_up: '', contact_person: '', contact_no: '', email: '', franchise_status: '' });
         fetchLeads(); // Refresh the leads list to update latest interaction
       } else {
         alert('Failed to save interaction');
       }
     } catch (error) {
       console.error('Failed to save interaction:', error);
     }
   };
   return (
       <div className="p-2 h-screen flex flex-col font-['Calibri'] bg-gray-50">
       
       {/* 1. HEADER & ACTIONS */}
 <div className="flex justify-between items-center mb-2 px-2 mt-1">
           <div>
           <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">Leads Database</h1>
           <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
             Manage & Track Client Interactions
             <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
               {leads.length} rows
             </span>
           </p>
         </div>
         <button onClick={handleCreateNew} className="bg-[#103c7f] hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
            <Plus size={18} /> Add New Lead
         </button>
       </div>

        {/* 2. FILTERS BAR (Real-time, No Button) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-row flex-nowrap gap-3 items-end overflow-x-auto whitespace-nowrap">
          
          {/* Filter 1: From Date */}
          <div className="flex-shrink-0 w-36">
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
          <div className="flex-shrink-0 w-36">
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
          <div className="flex-shrink-0 w-48">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Company/Contact Person</label>
             <div className="relative">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
               <input
                 type="text"
                 placeholder="Type name..."
                 value={filters.company}
                 className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none"
                 onChange={(e) => handleFilterChange("company", e.target.value)}
               />
             </div>
          </div>

          {/* Filter 4: Location (State/City) */}
          <div className="flex-shrink-0 w-48">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Location / State</label>
             <div className="relative">
               <MapPin className="absolute left-3 top-2.5 text-gray-400" size={14} />
               <input
                 type="text"
                 placeholder="Delhi, Okhla..."
                 value={filters.location}
                 className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none"
                 onChange={(e) => handleFilterChange("location", e.target.value)}
               />
             </div>
          </div>

          {/* Filter 5: Status */}
          <div className="flex-shrink-0 w-36">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
             <div className="relative">
               <ListFilter className="absolute left-3 top-2.5 text-gray-400" size={14} />
               <select
                 className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none appearance-none cursor-pointer"
                 onChange={(e) => handleFilterChange("status", e.target.value)}
               >
                 <option>All</option>
                 <option>Interested</option>
                 <option>Not Interested</option>
                 <option>Not Picked</option>
                 <option>Onboard</option>
                 <option>Call Later</option>
                 <option>New</option>
               </select>
             </div>
          </div>

          {/* Filter 6: Sub-Status */}
          <div className="flex-shrink-0 w-48">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Sub-Status</label>
             <div className="relative">
               <Filter className="absolute left-3 top-2.5 text-gray-400" size={14} />
               <select
                 className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none appearance-none cursor-pointer"
                 onChange={(e) => handleFilterChange("subStatus", e.target.value)}
               >
                 <option>All</option>
                 <option>2nd time not picked</option>
                 <option>Contract Share</option>
                 <option>Enough Vendor Empanelment</option>
                 <option>Hiring Sealed</option>
                 <option>Manager Ask</option>
                 <option>Meeting Align</option>
                 <option>Misaligned T&C</option>
                 <option>Not Right Person</option>
                 <option>Official Mail Ask</option>
                 <option>Reference Ask</option>
                 <option>Self Hiring</option>
                 <option>Ready To Visit</option>
                 <option>Callback</option>
                 <option>NA</option>
                 <option>New Lead</option>
               </select>
             </div>
          </div>

           {/* Filter 7: Franchise Status */}
           <div className="flex-shrink-0 w-48">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Franchise Status</label>
              <div className="relative">
                <Award className="absolute left-3 top-2.5 text-gray-400" size={14} />
                <select
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none appearance-none cursor-pointer"
                  onChange={(e) => handleFilterChange("franchiseStatus", e.target.value)}
                >
                  <option>All</option>
                  <option>Application Form Share</option>
                  <option>No Franchise Discuss</option>
                  <option>Not Interested</option>
                  <option>Will Think About It</option>
                  <option>Form Filled</option>
                  <option>Form Not Filled</option>
                </select>
              </div>
           </div>

            {/* Filter 8: Startup */}
            <div className="flex-shrink-0 w-32">
               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Startup</label>
               <div className="relative">
                 <select
                   className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:border-[#103c7f] outline-none appearance-none cursor-pointer"
                   onChange={(e) => handleFilterChange("startup", e.target.value)}
                 >
                   <option>All</option>
                   <option>Yes</option>
                   <option>No</option>
                 </select>
               </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex-shrink-0">
               <button
                 onClick={clearAllFilters}
                 className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
               >
                 <X size={14} /> Clear Filters
               </button>
            </div>

         </div>

       {/* 3. THE TABLE */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-x-auto overflow-y-auto">
   <table className="w-full table-auto border-collapse text-center">
     
     {/* --- HEADER --- */}
     <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20">
       <tr>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Sourcing Date</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Company Name</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Category</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">City/State</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Contact Person</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Contact Info</th>
         
         {/* MERGED COLUMN: Latest Follow-up & Remarks */}
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Latest Interaction</th>
         
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Next Followup</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Status</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Sub-Status</th>
         <th className="px-2 py-2 border-r border-blue-800 whitespace-nowrap">Franchise Status</th>
         <th className="px-2 py-2 text-center bg-[#0d316a] sticky right-0 z-30">Action</th>
       </tr>
     </thead>

     {/* --- BODY --- */}
     <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
   {loading ? (
     <tr key="loading">
       <td colSpan="12" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
         Loading leads...
       </td>
     </tr>
   ) : leads.length > 0 ? (
    leads.map((lead, index) => {

      // 1. CHECK IF ROW IS LOCKED (Sent to Manager)
  const isLocked = lead.isSubmitted;
      return (
        <tr
          key={index}
          className="border-b border-gray-100 transition group hover:bg-blue-50/40"
        >
          
          <td className="px-2 py-2 border-r border-gray-100">{lead.sourcingDate}</td>
         <td className="px-2 py-2 border-r border-gray-100 font-bold text-[#103c7f] text-left min-w-[200px] max-w-[280px]">
   <div className="flex items-center justify-start gap-2 pl-2">
     
     {/* 1. Startup Badge (Fixed at Start) */}
     {(
       lead?.startup === true ||
       String(lead?.startup).toLowerCase() === 'yes' ||
       String(lead?.startup) === '1' ||
       String(lead?.startup).toLowerCase() === 'true'
     ) && (
       <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-green-200 shrink-0" title="Startup">
         S
       </span>
     )}

     {/* 2. Company Name */}
     <span className="truncate">{lead.company}</span>
     
   </div>
 </td>
         <td className="px-2 py-2 border-r border-gray-100">{lead.category}</td>
         <td className="px-2 py-2 border-r border-gray-100">{lead.district_city ? `${lead.district_city}, ` : ''}{lead.state}</td>

         {/* Contact Person */}
         <td className="px-2 py-2 border-r border-gray-100 font-bold text-gray-600">{lead.contact_person || '-'}</td>

         {/* Contact Info (Phone + Email) */}
         <td className="px-2 py-2 border-r border-gray-100 text-left">
            <div className="flex flex-col gap-0.5">
               <span className="font-mono font-bold text-gray-700 text-[10px] flex items-center gap-1">
                  {(lead.contact_no || lead.phone) ? (
                    <a href={`tel:${lead.contact_no || lead.phone}`} className="no-underline">📞 {lead.contact_no || lead.phone}</a>
                  ) : '-'}
               </span>
               <span className="text-[9px] text-blue-500 lowercase truncate max-w-[140px]" title={lead.email}>
                  {lead.email ? (<a href={`mailto:${lead.email}`} className="underline">{lead.email}</a>) : '-'}
               </span>
            </div>
         </td>
         
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
         
         <td className="px-2 py-2 border-r border-gray-100 text-center">
           {/* STATUS BADGE: Purple if Locked */}
           <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border inline-block ${
             isLocked ? 'bg-purple-100 text-purple-700 border-purple-200' :
             lead.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' :
             lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
             'bg-gray-50 text-gray-600 border-gray-200'
           }`}>
             {lead.status}
           </span>
         </td>
         <td className="px-2 py-2 border-r border-gray-100">{lead.subStatus}</td>
         <td className="px-2 py-2 border-r border-gray-100">{lead.franchiseStatus}</td>

         {/* Action Column */}
         <td className="px-2 py-2 text-center sticky right-0 bg-white group-hover:bg-blue-50/30 border-l border-gray-200 z-10 whitespace-nowrap">
           {isLocked ? (
              <div className="flex items-center justify-center gap-1 text-gray-400 font-bold text-[10px] bg-gray-50 py-1 px-2 rounded border border-gray-100">
                 <Lock size={12} /> Sent
              </div>
           ) : (
              <div className="flex items-center justify-center gap-1">
   {/* View Button */}
   <button onClick={() => handleAction(lead, 'view')} className="p-1 text-gray-500 hover:text-[#103c7f] hover:bg-blue-100 rounded tooltip">
     <Eye size={16} />
   </button>

   {/* Edit Button (Orange Theme) */}
   <button onClick={() => handleAction(lead, 'edit')} className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-bold shadow-sm">
     <Edit size={16} />
   </button>

   {/* Phone Button */}
   <button onClick={() => handleAction(lead, 'add')} className="p-1 bg-[#a1db40] text-[#103c7f] rounded hover:bg-[#8cc430] font-bold shadow-sm">
     <Phone size={16} />
   </button>

   {/* Send Button */}
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
     <tr key="no-data">
       <td colSpan="12" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
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
                {(modalType === 'create' || modalType === 'edit') && (
                  <div className="space-y-4">
                      {/* Row 1: Company & Category */}
                      <div className="grid grid-cols-3 gap-4">
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Company Name <span className="text-red-500">*</span></label>
                              <input type="text" placeholder="Enter full name" value={newLeadData.company} onChange={(e) => setNewLeadData({...newLeadData, company: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none" />
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                              <select value={newLeadData.category} onChange={(e) => setNewLeadData({...newLeadData, category: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                                  <option>Select Category...</option>
                                  {industryCategories.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Sourcing Date</label>
                              <input type="date" value={newLeadData.sourcing_date} onChange={(e) => setNewLeadData({...newLeadData, sourcing_date: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none" />
                          </div>
                      </div>

                       {/* Row 2: State, District/City & Emp Count */}
                       <div className="grid grid-cols-3 gap-4">
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase">State</label>
                               <select value={newLeadData.state} onChange={(e) => {
                                 const selectedState = e.target.value;
                                 setNewLeadData({...newLeadData, state: selectedState, district_city: ''});
                                 fetchDistricts(selectedState);
                               }} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                                   <option>Select State...</option>
                                   {indianStates.map((state, idx) => (
                                     <option key={idx} value={state}>{state}</option>
                                   ))}
                               </select>
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase">District/City</label>
                               <select value={newLeadData.district_city} onChange={(e) => setNewLeadData({...newLeadData, district_city: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none" disabled={!newLeadData.state}>
                                   <option value="">Select District/City</option>
                                   {districtsList.map((district, idx) => (
                                     <option key={idx} value={district}>{district}</option>
                                   ))}
                               </select>
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase">Employee Count</label>
                               <select
                                 value={newLeadData.emp_count}
                                 onChange={(e) => setNewLeadData({...newLeadData, emp_count: e.target.value})}
                                 className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                               >
                                   <option value="">Select Count...</option>
                                   {employeeCounts.map((count, idx) => (
                                     <option key={idx} value={count}>{count}</option>
                                   ))}
                               </select>
                           </div>
                       </div>

                       {/* Row 3: Location (Area) */}
                       <div>
                           <label className="text-[10px] font-bold text-gray-400 uppercase">Location / Area</label>
                           <textarea value={newLeadData.location} onChange={(e) => setNewLeadData({...newLeadData, location: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 h-16 resize-none focus:border-[#103c7f] outline-none" placeholder="E.g., Okhla Phase 3, Near Crown Plaza..."></textarea>
                       </div>

                       {/* Row 4: Reference & Startup */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase">Reference / Source</label>
                               <input type="text" placeholder="LinkedIn, Google, Cold Call..." value={newLeadData.reference} onChange={(e) => setNewLeadData({...newLeadData, reference: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none" />
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-400 uppercase">Startup</label>
                               <select value={newLeadData.startup} onChange={(e) => setNewLeadData({...newLeadData, startup: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                                   <option value="">Select Option</option>
                                   <option value="Yes">Yes</option>
                                   <option value="No">No</option>
                               </select>
                           </div>
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

         {/* Row 1: Interaction Date */}
         <div>
           <label className="text-[10px] font-bold text-gray-500 uppercase">Interaction Date</label>
           <input
             type="date"
             value={interactionData.date}
             onChange={(e) => setInteractionData({...interactionData, date: e.target.value})}
             className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none font-medium"
           />
         </div>

          {/* Row 2: Contact Person, Phone, Email */}
          <div className="grid grid-cols-3 gap-4">
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Person</label>
               <input
                 type="text"
                 placeholder="Enter name"
                 value={interactionData.contact_person}
                 onChange={(e) => setInteractionData({...interactionData, contact_person: e.target.value})}
                 className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                 list="persons"
               />
               <datalist id="persons">
                 {suggestions.persons.map(p => <option key={p} value={p} />)}
               </datalist>
             </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">Phone</label>
               <input
                 type="tel"
                 placeholder="Enter phone number"
                 value={interactionData.contact_no}
                 onChange={(e) => setInteractionData({...interactionData, contact_no: e.target.value})}
                 className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                 list="nos"
               />
               <datalist id="nos">
                 {suggestions.nos.map(n => <option key={n} value={n} />)}
               </datalist>
             </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">Email</label>
               <input
                 type="email"
                 placeholder="Enter email"
                 value={interactionData.email}
                 onChange={(e) => setInteractionData({...interactionData, email: e.target.value})}
                 className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                 list="emails"
               />
               <datalist id="emails">
                 {suggestions.emails.map(e => <option key={e} value={e} />)}
               </datalist>
             </div>
          </div>

          {/* Row 3: Status & Sub-Status */}
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">New Status</label>
               <select value={interactionData.status} onChange={(e) => setInteractionData({...interactionData, status: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                 <option value="">Select Status</option>
                 <option>Interested</option>
                 <option>Not Interested</option>
                 <option>Not Picked</option>
                 <option>Onboard</option>
                 <option>Call Later</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-gray-500 uppercase">Sub-Status</label>
               <select value={interactionData.sub_status} onChange={(e) => setInteractionData({...interactionData, sub_status: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                 <option value="">Select Sub-Status</option>
                 <option>2nd time not picked</option>
                 <option>Contract Share</option>
                 <option>Enough Vendor Empanelment</option>
                 <option>Hiring Sealed</option>
                 <option>Manager Ask</option>
                 <option>Meeting Align</option>
                 <option>Misaligned T&C</option>
                 <option>Not Right Person</option>
                 <option>Official Mail Ask</option>
                 <option>Reference Ask</option>
                 <option>Self Hiring</option>
                 <option>Ready To Visit</option>
                 <option>Callback</option>
                 <option>NA</option>
               </select>
             </div>
          </div>

          {/* Row 4: Franchise Status & Remarks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Franchise Status</label>
              <select value={interactionData.franchise_status} onChange={(e) => setInteractionData({...interactionData, franchise_status: e.target.value})} className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none">
                <option value="">Select Franchise Status</option>
                <option>Application Form Share</option>
                <option>No Franchise Discuss</option>
                <option>Not Interested</option>
                <option>Will Think About It</option>
                <option>Form Filled</option>
                <option>Form Not Filled</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Remarks (Conversation Details)</label>
              <textarea
                value={interactionData.remarks}
                onChange={(e) => setInteractionData({...interactionData, remarks: e.target.value})}
                className="w-full border border-gray-300 rounded p-3 text-sm mt-1 h-20 focus:border-[#103c7f] outline-none resize-none placeholder:text-gray-300"
                placeholder="Client kya bola? Mention key points..."
              ></textarea>
            </div>
          </div>

         {/* Row 5: Next Follow-up */}
         <div>
           <label className="text-[10px] font-bold text-gray-500 uppercase text-orange-600">Next Follow-up Date</label>
           <input type="date" value={interactionData.next_follow_up} onChange={(e) => setInteractionData({...interactionData, next_follow_up: e.target.value})} className="w-full border border-orange-200 bg-orange-50/30 rounded p-2 text-sm mt-1 focus:border-orange-500 outline-none font-bold text-gray-700" />
         </div>

      </div>
    </div>
  )} 
  
  {modalType === 'view' && (
    <div className="flex flex-col h-full max-h-[80vh] font-['Calibri']">
       
      
  {/* 1. HEADER: DETAILED COMPANY PROFILE */}
     <div className="bg-gray-50 border-b border-gray-200 p-5">
       
       <div className="flex items-center gap-6">
         
         {/* A. Company Name & Startup Badge */}
         <div className="shrink-0 min-w-[200px]">
            <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none truncate max-w-[250px]" title={selectedLead.company}>
              {selectedLead.company}
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Company Profile
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                 (selectedLead?.startup === true || String(selectedLead?.startup).toLowerCase() === 'yes' || String(selectedLead?.startup) === '1' || String(selectedLead?.startup).toLowerCase() === 'true')
                   ? 'bg-orange-50 text-orange-700 border-orange-100' 
                   : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                 Startup: {(selectedLead?.startup === true || String(selectedLead?.startup).toLowerCase() === 'yes' || String(selectedLead?.startup) === '1' || String(selectedLead?.startup).toLowerCase() === 'true') ? 'Yes' : 'No'}
              </span>
            </div>
         </div>

         {/* Vertical Separator */}
         <div className="h-10 w-px bg-gray-300 shrink-0"></div>

         {/* B. Details Strip (Horizontal Scrollable) */}
         <div className="flex items-center gap-8 flex-1 overflow-x-auto custom-scrollbar pb-1">
            
            {/* 1. Sourcing Date */}
            <div className="flex flex-col min-w-fit">
               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourced Date</label>
               <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                  <Calendar size={13} className="text-gray-500 shrink-0"/>
                  <span className="font-mono">{selectedLead.sourcingDate || 'N/A'}</span>
               </div>
            </div>

            {/* 2. Category */}
            <div className="flex flex-col min-w-fit">
               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
               <span className="bg-blue-100 text-[#103c7f] text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-200 uppercase tracking-wide w-fit">
                 {selectedLead.category || 'General'}
               </span>
            </div>

            {/* 3. City / State */}
            <div className="flex flex-col min-w-fit">
               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">City / State</label>
               <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                  <MapPin size={13} className="text-blue-500 shrink-0"/>
                  <span className="truncate">
                     {selectedLead.city ? `${selectedLead.city}, ` : ''}{selectedLead.state}
                  </span>
               </div>
            </div>

            {/* 4. Location */}
            <div className="flex flex-col min-w-fit max-w-[150px]">
               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</label>
               <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                  <MapPin size={13} className="text-orange-500 shrink-0"/>
                  <span className="truncate" title={selectedLead.location}>
                     {selectedLead.location || 'N/A'}
                  </span>
               </div>
            </div>

            {/* 5. Emp Count */}
            <div className="flex flex-col min-w-fit">
               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employees</label>
               <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                  <Users size={13} className="text-green-600 shrink-0"/>
                  <span>{selectedLead.empCount || '-'}</span>
               </div>
            </div>

            {/* 6. Reference */}
            <div className="flex flex-col min-w-fit max-w-[120px]">
               <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reference</label>
               <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
                  <Briefcase size={13} className="text-purple-500 shrink-0"/> 
                  <span className="truncate" title={selectedLead.reference}>{selectedLead.reference || '-'}</span>
               </div>
            </div>

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
                 <th className="p-4 border-b border-gray-100">Franchise Status</th>
                 <th className="p-4 border-b border-gray-100">Next Follow-up Date</th>
               </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-50">
               {interactions.length > 0 ? interactions.map((interaction, index) => (
                  <tr key={index} className={`hover:bg-blue-50/30 transition duration-150 group ${index > 0 ? 'opacity-75 grayscale hover:grayscale-0' : ''}`}>
                     <td className="p-4">
                        {interaction.date ? (
                          <>
                            <div className="font-bold text-[#103c7f] text-sm">{new Date(interaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{new Date(interaction.date).getFullYear()}</div>
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">N/A</div>
                        )}
                     </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                          {interaction.contact_person ? interaction.contact_person.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{interaction.contact_person || 'N/A'}</div>
                          <div className="text-[10px] text-gray-400 font-medium">Contact</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {interaction.contact_no && <span className="font-mono text-gray-600 bg-gray-50 px-1.5 rounded w-fit">{interaction.contact_no}</span>}
                        {interaction.email && <span className="text-[10px] text-blue-500 font-medium lowercase">{interaction.email}</span>}
                        {!interaction.contact_no && !interaction.email && <span className="text-gray-400">No contact info</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition">
                        "{interaction.remarks || 'No remarks'}"
                      </p>
                    </td>
                    <td className="p-4">
                       <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-bold w-20 text-center ${interaction.status === 'Interested' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                       {interaction.status}
                       <span className="text-[8px] opacity-70 font-normal mt-0.5">{interaction.sub_status}</span>
                       </span>
                       </td>
                       <td className="p-4">
                       <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-center bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                       {interaction.franchise_status || 'N/A'}
                       </span>
                       </td>
                       <td className="p-4">
                       <div className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100 text-center w-fit">
                       {interaction.next_follow_up ? new Date(interaction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
                       </div>
                       </td>
                  </tr>
               )) : (
                 <tr>
                   <td colSpan="6" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
                     No interactions found
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
  {/* === MODE 4: SEND TO MANAGER (Body Content) === */}
  {modalType === 'send_to_manager' && (
    <div className="flex flex-col items-center justify-center py-2 px-2 text-center">
        <p className="text-sm text-gray-500 leading-relaxed max-w-[80%] mx-auto">
          Are you sure you want to send 
          <span className="font-bold text-[#103c7f] block my-1 text-base">
            {selectedLead?.company}
          </span>
         to Manager <span className="font-bold text-purple-600">({managerName})</span> ? 
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
           <button onClick={handleSaveOnly} className="px-5 py-2 bg-white border border-[#103c7f] text-[#103c7f] rounded-lg font-bold text-sm shadow-sm hover:bg-blue-50">
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
         <button onClick={handleSaveInteraction} className="bg-[#103c7f] hover:bg-blue-900 text-white px-2 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
           <Save size={16} /> Save Record
         </button>
       )}

       {/* 4. Button for SEND TO MANAGER Mode (ONLY ONE BUTTON) */}
    {modalType === 'send_to_manager' && (
       <button
         onClick={async () => {
           try {
             const session = JSON.parse(localStorage.getItem('session') || '{}');
             const response = await fetch('/api/corporate/leadgen/send-to-manager', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${session.access_token}`
               },
               body: JSON.stringify({ client_id: selectedLead.id })
             });
             const data = await response.json();
             if (data.success) {
               const updatedLeads = leads.map(l =>
                  l.id === selectedLead.id
                  ? { ...l, isSubmitted: true }
                  : l
               );
               setLeads(updatedLeads);
               setIsFormOpen(false);
             } else {
               alert('Failed to send to manager');
             }
           } catch (error) {
             console.error('Failed to send to manager:', error);
           }
         }}
         className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 flex items-center gap-2 transition transform active:scale-95"
       >
         <Send size={16} /> Yes, Confirm
       </button>
    )}
    {/* 5. Button for EDIT Mode */}
       {modalType === 'edit' && (
         <button 
           onClick={handleUpdateLead} 
           className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2"
         >
           <Edit size={16} /> Update Details
         </button>
       )}
    </div>
    </div>

            </div>
        
        )}

      </div>
    );
  }

  