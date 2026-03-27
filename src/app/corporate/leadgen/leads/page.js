"use client";
import { useState, useEffect } from "react";
import {
  Search, Phone, Filter, X, Save, Plus, Eye,Trash2,
  Calendar, MapPin, ListFilter,ArrowRight,Send,Lock,Edit,Award,Users,Briefcase, Loader2
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingInteraction, setIsSavingInteraction] = useState(false);

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

    const [formErrors, setFormErrors] = useState({});
    const [interactionFormErrors, setInteractionFormErrors] = useState({});


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
   const [editingInteractionId, setEditingInteractionId] = useState(null);
   const [companySuggestions, setCompanySuggestions] = useState([]);
   const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
   const [suggestions, setSuggestions] = useState({ persons: [], nos: [], emails: [] });

    const [districtsList, setDistrictsList] = useState([]);

    // --- FULL LISTS ---
   const [indianStates, setIndianStates] = useState([]);
   const [stateDistrictData, setStateDistrictData] = useState({});    
     // Helper to format date for display (YYYY-MM-DD -> DD MMM YY)
     const formatDateForDisplay = (dateStr) => {
       if (!dateStr) return 'N/A';
       const date = new Date(dateStr);
       if (isNaN(date)) return 'N/A';
       return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
     };

     // Helper to convert date string to Date object for comparison
     // HTML date input returns YYYY-MM-DD format (e.g., "2026-02-09")
     // Creates date at midnight UTC to avoid timezone issues
     const formatDateForCompare = (dateStr) => {
       if (!dateStr) return null;
       // Handle YYYY-MM-DD format (from HTML date input)
       const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
       if (parts) {
         // Create date at midnight UTC to avoid timezone issues
         return new Date(Date.UTC(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3])));
       }
       // Fallback to standard parsing
       const parsed = new Date(dateStr);
       return isNaN(parsed) ? null : parsed;
     };

    const industryCategories = [
     "Information Technology (IT)", "Finance & Banking", "Healthcare", "Education", "Manufacturing",
     "Construction & Real Estate", "Retail & Consumer Goods", "Travel & Hospitality", "Energy & Utilities",
     "Media & Communications", "Transportation & Logistics", "Agriculture", "Automotive",
     "Telecommunications", "Pharmaceuticals", "Textiles", "Mining", "Non-Profit / NGO", "Government / Public Sector",
     "Consulting", "Legal Services", "Marketing & Advertising", "Insurance", "Entertainment","Commerce", "Other"
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

            // Sort by sourcing date (newest first)
            const sortedLeads = [...normalized].sort((a, b) => {
              const dateA = a.sourcingDate ? new Date(a.sourcingDate) : new Date(0);
              const dateB = b.sourcingDate ? new Date(b.sourcingDate) : new Date(0);
              return dateB - dateA; // Descending order (newest first)
            });
            setAllLeads(sortedLeads);
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
      // This function was previously doing validation - now it only fetches data
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

    // Validate form fields for new lead
    const validateNewLeadForm = () => {
      const errors = {};
      
      if (!newLeadData.company?.trim()) {
        errors.company = 'Company Name is required';
      }
      if (!newLeadData.category) {
        errors.category = 'Category is required';
      }
      if (!newLeadData.sourcing_date) {
        errors.sourcing_date = 'Sourcing Date is required';
      }
      if (!newLeadData.state) {
        errors.state = 'State is required';
      }
      if (!newLeadData.startup) {
        errors.startup = 'Startup option is required';
      }
      
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    // Validate form fields for interaction
    const validateInteractionForm = () => {
      const errors = {};
      
      if (!interactionData.date) {
        errors.date = 'Interaction Date is required';
      }
      if (!interactionData.contact_person?.trim()) {
        errors.contact_person = 'Contact Person is required';
      }
      if (!interactionData.contact_no?.trim()) {
        errors.contact_no = 'Phone is required';
      }
      if (!interactionData.status) {
        errors.status = 'Status is required';
      }
      if (!interactionData.sub_status) {
        errors.sub_status = 'Sub-Status is required';
      }
      if (!interactionData.franchise_status) {
        errors.franchise_status = 'Franchise Status is required';
      }
      if (!interactionData.remarks?.trim()) {
        errors.remarks = 'Remarks is required';
      }
      if (!interactionData.next_follow_up) {
        errors.next_follow_up = 'Next Follow-up Date is required';
      }
      
      setInteractionFormErrors(errors);
      return Object.keys(errors).length === 0;
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
         // Check for search query param FIRST (before fetching leads)
         const urlParams = new URLSearchParams(window.location.search);
         const searchCompany = urlParams.get('search');
         if (searchCompany) {
           // Set the filter state directly before fetching leads
           setFilters(prev => ({ ...prev, company: searchCompany }));
         }

         await fetchStateDistrictData();
         await fetchLeads();
         await fetchManagerName();
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

     // Fetch company suggestions when company name changes (for create form)
     useEffect(() => {
       const fetchCompanySuggestions = async () => {
         // Only fetch when modal is open for create mode and company name has at least 2 chars
         if (modalType !== 'create' || !newLeadData.company || newLeadData.company.length < 2) {
           setCompanySuggestions([]);
           setShowCompanySuggestions(false);
           return;
         }

         try {
           const session = JSON.parse(localStorage.getItem('session') || '{}');
           const response = await fetch(`/api/corporate/leadgen/leads?company=${encodeURIComponent(newLeadData.company)}&limit=10`, {
             headers: { 'Authorization': `Bearer ${session.access_token}` }
           });
           const data = await response.json();
           if (data.success && data.data && data.data.length > 0) {
             setCompanySuggestions(data.data);
             setShowCompanySuggestions(data.data.length > 0);
           } else {
             setCompanySuggestions([]);
             setShowCompanySuggestions(false);
           }
         } catch (err) {
           console.error('Failed to fetch company suggestions:', err);
           setCompanySuggestions([]);
           setShowCompanySuggestions(false);
         }
       };

       const debounceTimer = setTimeout(fetchCompanySuggestions, 150);
       return () => clearTimeout(debounceTimer);
     }, [newLeadData.company, modalType]);

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
        // 1. Date Range Check - API now returns YYYY-MM-DD format
        const leadDateStr = lead.latestFollowup || '';
        // Parse lead date at midnight UTC to avoid timezone issues
        const leadDate = leadDateStr ? new Date(leadDateStr + 'T00:00:00Z') : null;
        const from = newFilters.fromDate ? formatDateForCompare(newFilters.fromDate) : null;
        const to = newFilters.toDate ? formatDateForCompare(newFilters.toDate) : null;

        // If date filter is active, only include rows with actual dates
        if (from || to) {
          if (!leadDate) return false;  // Exclude rows with null dates when filter is active
        }

        const isAfterFrom = from && leadDate ? leadDate >= from : true;
        const isBeforeTo = to && leadDate ? leadDate <= to : true;

         // 2. Text Matching (with null safety)
         const matchCompany = newFilters.company === '' ||
           ((lead.company || '').toLowerCase().includes(newFilters.company.toLowerCase()) ||
            (lead.contact_person || '').toLowerCase().includes(newFilters.company.toLowerCase()));
         const matchLocation = newFilters.location === '' ||
           ((lead.district_city || '') + ' ' + (lead.state || '') + ' ' + (lead.location || '')).toLowerCase().includes(newFilters.location.toLowerCase());

          // 3. Dropdown Matching (with null safety)
          // For Contract Share: show clients who have EVER had Contract Share (not just latest)
          const matchStatus = newFilters.status === "All" ||
            ((lead.status || '').trim().toLowerCase() === (newFilters.status || '').trim().toLowerCase());
          const matchSubStatus = newFilters.subStatus === "All" || 
            (newFilters.subStatus === "Contract Share" ? lead.everContractShare : ((lead.subStatus || '').trim().toLowerCase()) === (newFilters.subStatus || '').trim().toLowerCase());
          const matchFranchiseStatus = newFilters.franchiseStatus === "All" || ((lead.franchiseStatus || '').trim().toLowerCase()) === (newFilters.franchiseStatus || '').trim().toLowerCase();
          const matchStartup = newFilters.startup === "All" || ((lead.startup || '').trim().toLowerCase()) === (newFilters.startup || '').trim().toLowerCase();

         return isAfterFrom && isBeforeTo && matchCompany && matchLocation && matchStatus && matchSubStatus && matchFranchiseStatus && matchStartup;
      });

      setLeads(filtered);
    };

   // --- APPLY CURRENT FILTERS TO ALL LEADS ---
    const applyCurrentFilters = () => {
      const filtered = allLeads.filter(lead => {
        // 1. Date Range Check - API now returns YYYY-MM-DD format
        const leadDateStr = lead.latestFollowup || '';
        // Parse lead date at midnight UTC to avoid timezone issues
        const leadDate = leadDateStr ? new Date(leadDateStr + 'T00:00:00Z') : null;
        const from = filters.fromDate ? formatDateForCompare(filters.fromDate) : null;
        const to = filters.toDate ? formatDateForCompare(filters.toDate) : null;

        // If date filter is active, only include rows with actual dates
        if (from || to) {
          if (!leadDate) return false;  // Exclude rows with null dates when filter is active
        }

        const isAfterFrom = from && leadDate ? leadDate >= from : true;
        const isBeforeTo = to && leadDate ? leadDate <= to : true;

        // 2. Text Matching (with null safety)
        const matchCompany = filters.company === '' ||
          ((lead.company || '').toLowerCase().includes(filters.company.toLowerCase()) ||
           (lead.contact_person || '').toLowerCase().includes(filters.company.toLowerCase()));
        const matchLocation = filters.location === '' ||
          ((lead.district_city || '') + ' ' + (lead.state || '') + ' ' + (lead.location || '')).toLowerCase().includes(filters.location.toLowerCase());

         // 3. Dropdown Matching (with null safety)
         // For Contract Share: show clients who have EVER had Contract Share (not just latest)
         const matchStatus = filters.status === "All" ||
           ((lead.status || '').trim().toLowerCase() === (filters.status || '').trim().toLowerCase());
         const matchSubStatus = filters.subStatus === "All" || 
           (filters.subStatus === "Contract Share" ? lead.everContractShare : ((lead.subStatus || '').trim().toLowerCase()) === (filters.subStatus || '').trim().toLowerCase());
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
      // Handle delete action directly without opening modal
      if (type === 'delete') {
        try {
          const session = JSON.parse(localStorage.getItem('session') || '{}');
          const response = await fetch('/api/corporate/leadgen/leads', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ client_id: lead.id })
          });
          const result = await response.json();
          if (result.success) {
            // Remove deleted lead from state
            setLeads(leads.filter(l => l.id !== lead.id));
            setAllLeads(allLeads.filter(l => l.id !== lead.id));
            alert('Lead deleted successfully');
          } else {
            alert(result.error || 'Failed to delete lead');
          }
        } catch (error) {
          console.error('Error deleting lead:', error);
          alert('Failed to delete lead');
        }
        return; // Exit without opening modal
      }

     setSelectedLead(lead);
     setModalType(type);
     setIsFormOpen(true);
     setEditingInteractionId(null); // Reset editing state when opening modal
     
     // Reset interactionData when opening add interaction form
      if (type === 'add') {
        setInteractionData({ date: new Date().toISOString().split('T')[0], status: '', sub_status: '', remarks: '', next_follow_up: '', contact_person: '', contact_no: '', email: '', franchise_status: '' });
        setInteractionFormErrors({}); // Clear validation errors
      }
     
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
      setFormErrors({}); // Clear any previous validation errors
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
      if (!validateNewLeadForm()) {
        return;
      }
      setIsSaving(true);
      try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       
       // Check for duplicate company name
       if (newLeadData.company) {
         try {
           const checkResponse = await fetch(`/api/corporate/leadgen/leads?company=${encodeURIComponent(newLeadData.company)}&limit=100`, {
             headers: { 'Authorization': `Bearer ${session.access_token}` }
           });
           const checkData = await checkResponse.json();
           if (checkData.success && checkData.data && checkData.data.length > 0) {
             const duplicate = checkData.data.find(
               lead => lead.company && lead.company.toLowerCase() === newLeadData.company.toLowerCase()
             );
             if (duplicate) {
               const shouldContinue = confirm(
                 `⚠️ A company with similar name already exists:\n\n` +
                 `"${duplicate.company}"\n` +
                 `Location: ${duplicate.district_city || ''}, ${duplicate.state || ''}\n` +
                 `Status: ${duplicate.status || 'No Status'}\n\n` +
                 `Do you want to continue adding this new client?`
               );
               if (!shouldContinue) {
                 return;
               }
             }
           }
         } catch (err) {
           console.error('Error checking for duplicate company:', err);
         }
       }

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
     } finally {
       setIsSaving(false);
     }
   };

   const handleSaveAndFollowup = async () => {
      if (!validateNewLeadForm()) {
        return;
      }
      setIsSaving(true);
      try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       
       // Check for duplicate company name
       if (newLeadData.company) {
         try {
           const checkResponse = await fetch(`/api/corporate/leadgen/leads?company=${encodeURIComponent(newLeadData.company)}&limit=100`, {
             headers: { 'Authorization': `Bearer ${session.access_token}` }
           });
           const checkData = await checkResponse.json();
           if (checkData.success && checkData.data && checkData.data.length > 0) {
             const duplicate = checkData.data.find(
               lead => lead.company && lead.company.toLowerCase() === newLeadData.company.toLowerCase()
             );
             if (duplicate) {
               const shouldContinue = confirm(
                 `⚠️ A company with similar name already exists:\n\n` +
                 `"${duplicate.company}"\n` +
                 `Location: ${duplicate.district_city || ''}, ${duplicate.state || ''}\n` +
                 `Status: ${duplicate.status || 'No Status'}\n\n` +
                 `Do you want to continue adding this new client?`
               );
               if (!shouldContinue) {
                 return;
               }
             }
           }
         } catch (err) {
           console.error('Error checking for duplicate company:', err);
         }
       }

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
     } finally {
       setIsSaving(false);
     }
   };

   const handleUpdateLead = async () => {
      if (!validateNewLeadForm()) {
        return;
      }
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
       if (!validateInteractionForm()) {
         return;
       }
       setIsSavingInteraction(true);
       try {
       const session = JSON.parse(localStorage.getItem('session') || '{}');
       const method = editingInteractionId ? 'PUT' : 'POST';
       const bodyData = editingInteractionId 
         ? { interaction_id: editingInteractionId, client_id: selectedLead.id, ...interactionData }
         : { client_id: selectedLead.id, ...interactionData };
       
       const response = await fetch('/api/corporate/leadgen/interaction', {
         method: method,
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${session.access_token}`
         },
         body: JSON.stringify(bodyData)
       });
       const data = await response.json();
       if (data.success) {
         setIsFormOpen(false);
         setInteractionData({ date: new Date().toISOString().split('T')[0], status: '', sub_status: '', remarks: '', next_follow_up: '', contact_person: '', contact_no: '', email: '', franchise_status: '' });
         setEditingInteractionId(null);
         fetchLeads(); // Refresh the leads list to update latest interaction
         if (selectedLead?.id) {
           fetchInteractions(selectedLead.id); // Refresh interactions in view modal
         }
       } else {
         alert('Failed to save interaction');
       }
     } catch (error) {
       console.error('Failed to save interaction:', error);
     } finally {
       setIsSavingInteraction(false);
     }
   };
   return (
       <div className="p-1 h-screen flex flex-col font-['Calibri'] bg-gray-50">
       
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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-row flex-nowrap gap-2 items-end overflow-x-auto whitespace-nowrap">
          
          {/* Filter 1: From Date */}
          <div className="flex-shrink-0 w-32">
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
          <div className="flex-shrink-0 w-32">
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
          <div className="flex-shrink-0 w-44">
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
          <div className="flex-shrink-0 w-44">
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
           <div className="flex-shrink-0 w-40">
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
                   <option>Master Union</option>
                 </select>
               </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex-shrink-0">
               <button
                 onClick={clearAllFilters}
                 className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
               >
                 <X size={14} />
               </button>
            </div>

         </div>

      {/* 3. THE TABLE */}
{/* 3. THE TABLE */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
  <table className="w-full table-fixed border-collapse text-center">
    {/* --- HEADER --- */}
    <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20">
      <tr>
        <th className="px-2 py-2 border-r border-blue-800 w-20">Sourcing Date</th>
        <th className="px-2 py-2 border-r border-blue-800 text-left pl-4 w-44">Company Name</th>
        <th className="px-2 py-2 border-r border-blue-800 w-20">Category</th>
        <th className="px-2 py-2 border-r border-blue-800 w-24">City/State</th>
        
        {/* MERGED COLUMN HEADER */}
        <th className="px-2 py-2 border-r border-blue-800 text-left pl-4 w-32">Contact Details</th>
        
        <th className="px-2 py-2 border-r border-blue-800 w-44">Latest Interaction</th>
        <th className="px-2 py-2 border-r border-blue-800 w-20">Next Followup</th>
        <th className="px-2 py-2 border-r border-blue-800 w-20">Status</th>
        <th className="px-2 py-2 border-r border-blue-800 w-28">Sub-Status</th>
        <th className="px-2 py-2 border-r border-blue-800 w-28">Franchise</th>
        
        {/* COMPACT ACTION COLUMN */}
        <th className="px-2 py-2 text-center bg-[#0d316a] sticky right-0 z-30 w-32">Action</th>
      </tr>
    </thead>

    {/* --- BODY --- */}
    <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
      {loading ? (
        <tr key="loading">
          <td colSpan="11" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
            Loading leads...
          </td>
        </tr>
      ) : leads.length > 0 ? (
        leads.map((lead, index) => {
          const isLocked = lead.isSubmitted;
          return (
            <tr key={index} className="border-b border-gray-100 transition group hover:bg-blue-50/40">
              
              <td className="px-1 py-2 border-r border-gray-100 whitespace-nowrap text-[10px]">
                {lead.sourcingDate}
              </td>

              <td className="px-2 py-2 border-r border-gray-100 font-bold text-[#103c7f] text-left">
                <div className="flex items-center justify-start gap-1">
                  {(lead?.startup === true || String(lead?.startup).toLowerCase() === 'yes' || String(lead?.startup) === '1' || String(lead?.startup).toLowerCase() === 'true') && (
                    <span className="bg-green-100 text-green-700 text-[8px] font-black px-1 rounded-full border border-green-200 shrink-0">S</span>
                  )}
                  {String(lead?.startup).toLowerCase() === 'master union' && (
                    <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1 rounded-full border border-purple-200 shrink-0">M</span>
                  )}
                  <span className="truncate block" title={lead.company}>{lead.company}</span>
                </div>
              </td>

              <td className="px-1 py-2 border-r border-gray-100 truncate text-[10px]" title={lead.category}>
                {lead.category}
              </td>

              <td className="px-1 py-2 border-r border-gray-100 text-[10px] truncate" title={`${lead.district_city}, ${lead.state}`}>
                {lead.district_city ? `${lead.district_city}, ` : ''}{lead.state}
              </td>

              {/* MERGED CONTACT DETAILS: Name, Phone, Email */}
              <td className="px-3 py-2 border-r border-gray-100 text-left">
                <div className="flex flex-col leading-tight">
                  <div className="font-bold text-gray-800 truncate text-[11px]">{lead.contact_person || 'N/A'}</div>
                  <div className="flex items-center gap-1 text-[10px]">
                    {(lead.contact_no || lead.phone) ? (
                      <a href={`tel:${lead.contact_no || lead.phone}`} className="font-mono font-bold text-gray-500 hover:text-[#103c7f]">
                        📞{lead.contact_no || lead.phone}
                      </a>
                    ) : <span className="text-gray-400">-</span>}
                  </div>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="text-[9px] text-blue-500 lowercase truncate hover:underline" title={lead.email}>
                      {lead.email}
                    </a>
                  )}
                </div>
              </td>

              <td className="px-1 py-2 border-r border-gray-100">
                <div className="flex flex-col gap-0.5 items-center">
                  <span className="font-bold text-[#103c7f] text-[9px] bg-blue-50 px-1 rounded border border-blue-100">
                    {formatDateForDisplay(lead.latestFollowup)}
                  </span>
                  <span className="text-gray-500 italic truncate w-full px-1 text-[10px]" title={lead.remarks}>
                    "{lead.remarks}"
                  </span>
                </div>
              </td>

              <td className="px-1 py-2 border-r border-gray-100 font-bold text-orange-600 text-[10px]">
                {formatDateForDisplay(lead.nextFollowup)}
              </td>
              
              <td className="px-1 py-2 border-r border-gray-100 text-center">
                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold border inline-block ${
                  isLocked ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  lead.status === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' :
                  lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  {lead.status}
                </span>
              </td>

              <td className="px-1 py-2 border-r border-gray-100 truncate text-[10px]" title={lead.subStatus}>
                {lead.subStatus}
              </td>

              <td className="px-1 py-2 border-r border-gray-100 truncate text-[10px]" title={lead.franchiseStatus}>
                {lead.franchiseStatus}
              </td>

              {/* ACTION COLUMN: Sticky Right & Compact */}
              <td className="px-1 py-2 text-center sticky right-0 bg-white group-hover:bg-[#f1f5f9] border-l border-gray-200 z-10 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {isLocked ? (
                    <div className="flex items-center justify-center gap-1 text-gray-400 font-bold text-[9px] bg-gray-50 py-0.5 px-1.5 rounded border border-gray-100">
                      <Lock size={10} /> Sent
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleAction(lead, 'view')} className="p-1 text-gray-500 hover:text-[#103c7f] hover:bg-blue-100 rounded transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleAction(lead, 'edit')} className="p-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleAction(lead, 'add')} className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" title="Interaction">
                        <Phone size={14} />
                      </button>
                      <button onClick={() => handleAction(lead, 'send_to_manager')} className="p-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors" title="Send">
                        <Send size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => {
                      if(window.confirm("Are you sure you want to delete this lead?")) {
                        handleAction(lead, 'delete');
                      }
                    }} 
                    className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" 
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>

            </tr>
          );
        })
      ) : (
        <tr key="no-data">
          <td colSpan="11" className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest">
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
    <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-white ${modalType === 'view' ? 'max-h-[90vh]' : ''}`}>            
              {/* Modal Header */}
              <div className="bg-[#103c7f] p-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-bold text-lg uppercase tracking-wide">
                    {modalType === 'create' ? 'Sourcing New Lead' : 
                     modalType === 'add' ? (editingInteractionId ? 'Edit Interaction' : 'Add Interaction') : 'Lead Details'}
                  </h3>
                  {modalType === 'create' && (
                    <p className="text-xs text-red-500 font-bold mt-1 bg-white p-1">Kindly fill all the required fields marked with an asterisk (*)</p>
                  )}
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
                          <div className="relative">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Company Name <span className="text-red-500">*</span></label>
                              <input type="text" placeholder="Enter full name" value={newLeadData.company} onChange={(e) => { setNewLeadData({...newLeadData, company: e.target.value}); setShowCompanySuggestions(true); }} onBlur={() => setTimeout(() => setShowCompanySuggestions(false), 200)} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${formErrors.company ? 'border-red-500 focus:border-red-500' : 'border-gray-300'}`} />
                              {formErrors.company && <p className="text-red-500 text-xs mt-1">{formErrors.company}</p>}
                              {showCompanySuggestions && companySuggestions.length > 0 && modalType === 'create' && (
                                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                  {companySuggestions.map((suggestion) => (
                                    <div
                                      key={suggestion.id}
                                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                      onClick={() => {
                                        setNewLeadData({...newLeadData, company: suggestion.company});
                                        setShowCompanySuggestions(false);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-[#103c7f] text-sm">{suggestion.company}</span>
                                        <span className="text-[10px] text-gray-400">{suggestion.district_city}, {suggestion.state}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                          suggestion.status === 'Onboard' ? 'bg-green-100 text-green-700' :
                                          suggestion.status === 'Interested' ? 'bg-blue-100 text-blue-700' :
                                          suggestion.status === 'Not Interested' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {suggestion.status || 'No Status'}
                                        </span>
                                        <span className="text-[9px] text-gray-400">{suggestion.category || ''}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Category <span className="text-red-500">*</span></label>
                              <select value={newLeadData.category} onChange={(e) => setNewLeadData({...newLeadData, category: e.target.value})} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${formErrors.category ? 'border-red-500' : 'border-gray-300'}`}>
                                  <option value="">Select Category...</option>
                                  {industryCategories.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                  ))}
                              </select>
                              {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Sourcing Date <span className="text-red-500">*</span></label>
                              <input type="date" value={newLeadData.sourcing_date} onChange={(e) => setNewLeadData({...newLeadData, sourcing_date: e.target.value})} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${formErrors.sourcing_date ? 'border-red-500' : 'border-gray-300'}`} />
                              {formErrors.sourcing_date && <p className="text-red-500 text-xs mt-1">{formErrors.sourcing_date}</p>}
                          </div>
                      </div>

                       {/* Row 2: State, District/City & Emp Count */}
                       <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">State <span className="text-red-500">*</span></label>
                                <select value={newLeadData.state} onChange={(e) => {
                                  const selectedState = e.target.value;
                                  setNewLeadData({...newLeadData, state: selectedState, district_city: ''});
                                  fetchDistricts(selectedState);
                                }} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${formErrors.state ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value="">Select State...</option>
                                    {indianStates.map((state, idx) => (
                                      <option key={idx} value={state}>{state}</option>
                                    ))}
                                </select>
                                {formErrors.state && <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>}
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
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Startup <span className="text-red-500">*</span></label>
                                <select value={newLeadData.startup} onChange={(e) => setNewLeadData({...newLeadData, startup: e.target.value})} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${formErrors.startup ? 'border-red-500' : 'border-gray-300'}`}>
                                    <option value="">Select Option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                    <option value="Master Union">Master Union</option>
                                </select>
                                {formErrors.startup && <p className="text-red-500 text-xs mt-1">{formErrors.startup}</p>}
                            </div>
                       </div>
                  </div>
                )}


                {/* === MODE 2: ADD FOLLOW-UP FORM (Context + Input) === */}
  {modalType === 'add' && (
  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300 font-['Calibri']">
    
    {/* 1. INPUT FORM */}
    <div className="space-y-4 pt-2">

      {/* Row 1: Interaction Date & Contact Person */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Interaction Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={interactionData.date}
            onChange={(e) => setInteractionData({...interactionData, date: e.target.value})}
            className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none font-medium ${interactionFormErrors.date ? 'border-red-500' : 'border-gray-300'}`}
          />
          {interactionFormErrors.date && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.date}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Person <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="Enter name"
            value={interactionData.contact_person}
            onChange={(e) => setInteractionData({...interactionData, contact_person: e.target.value})}
            className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${interactionFormErrors.contact_person ? 'border-red-500' : 'border-gray-300'}`}
            list="persons"
          />
          {interactionFormErrors.contact_person && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.contact_person}</p>}
          <datalist id="persons">
            {suggestions.persons.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>
      </div>

      {/* Row 2: Phone & Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Phone <span className="text-red-500">*</span></label>
          <input
            type="tel"
            placeholder="Enter phone number"
            value={interactionData.contact_no}
            onChange={(e) => setInteractionData({...interactionData, contact_no: e.target.value})}
            className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${interactionFormErrors.contact_no ? 'border-red-500' : 'border-gray-300'}`}
            list="nos"
          />
          {interactionFormErrors.contact_no && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.contact_no}</p>}
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
          <label className="text-[10px] font-bold text-gray-500 uppercase">New Status <span className="text-red-500">*</span></label>
          <select value={interactionData.status} onChange={(e) => setInteractionData({...interactionData, status: e.target.value})} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${interactionFormErrors.status ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="">Select Status</option>
            <option>Interested</option>
            <option>Not Interested</option>
            <option>Not Picked</option>
            <option>Onboard</option>
            <option>Call Later</option>
          </select>
          {interactionFormErrors.status && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.status}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Sub-Status <span className="text-red-500">*</span></label>
          <select value={interactionData.sub_status} onChange={(e) => setInteractionData({...interactionData, sub_status: e.target.value})} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${interactionFormErrors.sub_status ? 'border-red-500' : 'border-gray-300'}`}>
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
            <option>Onboard Process</option>
            <option>NA</option>
          </select>
          {interactionFormErrors.sub_status && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.sub_status}</p>}
        </div>
      </div>

      {/* Row 4: Franchise Status & Next Follow-up Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase">Franchise Status <span className="text-red-500">*</span></label>
          <select value={interactionData.franchise_status} onChange={(e) => setInteractionData({...interactionData, franchise_status: e.target.value})} className={`w-full border rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none ${interactionFormErrors.franchise_status ? 'border-red-500' : 'border-gray-300'}`}>
            <option value="">Select Franchise Status</option>
            <option>Application Form Share</option>
            <option>No Franchise Discuss</option>
            <option>Not Interested</option>
            <option>Will Think About It</option>
            <option>Form Filled</option>
            <option>Form Not Filled</option>
          </select>
          {interactionFormErrors.franchise_status && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.franchise_status}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase text-orange-600">Next Follow-up Date <span className="text-red-500">*</span></label>
          <input 
            type="date" 
            value={interactionData.next_follow_up} 
            onChange={(e) => setInteractionData({...interactionData, next_follow_up: e.target.value})} 
            className={`w-full border rounded p-2 text-sm mt-1 focus:border-orange-500 outline-none font-bold text-gray-700 ${interactionFormErrors.next_follow_up ? 'border-red-500' : 'border-orange-200'}`} 
          />
          {interactionFormErrors.next_follow_up && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.next_follow_up}</p>}
        </div>
      </div>

      {/* Row 5: Remarks (Full Width for details) */}
      <div>
        <label className="text-[10px] font-bold text-gray-500 uppercase">Remarks (Conversation Details) <span className="text-red-500">*</span></label>
        <textarea
          value={interactionData.remarks}
          onChange={(e) => setInteractionData({...interactionData, remarks: e.target.value})}
          className={`w-full border rounded p-3 text-sm mt-1 h-24 focus:border-[#103c7f] outline-none resize-none placeholder:text-gray-300 ${interactionFormErrors.remarks ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Client kya bola? Mention key points..."
        ></textarea>
        {interactionFormErrors.remarks && <p className="text-red-500 text-xs mt-1">{interactionFormErrors.remarks}</p>}
      </div>

    </div>
  </div>
)}
  
 {modalType === 'view' && (
  <div className="flex flex-col h-full max-h-[85vh] font-['Calibri'] bg-white rounded-2xl overflow-hidden shadow-2xl">
    
    {/* 1. HEADER: DETAILED COMPANY PROFILE */}
    <div className="bg-gray-50 border-b border-gray-200 p-5">
      <div className="flex items-center gap-6">
        {/* A. Company Name & Startup Badge */}
        <div className="shrink-0 min-w-[200px]">
          <h2 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none truncate max-w-[250px]" title={selectedLead.company}>
            {selectedLead.company}
          </h2>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Profile</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
              (selectedLead?.startup === true || String(selectedLead?.startup).toLowerCase() === 'yes' || String(selectedLead?.startup) === '1' || String(selectedLead?.startup).toLowerCase() === 'true')
                ? 'bg-orange-50 text-orange-700 border-orange-100' 
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
              Startup: {selectedLead?.startup || 'N/A'}
            </span>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="h-10 w-px bg-gray-300 shrink-0"></div>

        {/* B. Details Strip (Horizontal Scrollable) */}
        <div className="flex items-center gap-8 flex-1 overflow-x-auto custom-scrollbar pb-1">
          {/* Sourcing Date */}
          <div className="flex flex-col min-w-fit">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sourced Date</label>
            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
              <Calendar size={13} className="text-gray-500 shrink-0"/>
              <span className="font-mono">{selectedLead?.latestFollowup || 'N/A'}</span>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col min-w-fit">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
            <span className="bg-blue-100 text-[#103c7f] text-[10px] font-bold px-2.5 py-0.5 rounded border border-blue-200 uppercase w-fit">
              {selectedLead.category || 'General'}
            </span>
          </div>
           
           <div className="flex flex-col min-w-fit max-w-[150px]">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</label>
            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
              <MapPin size={13} className="text-orange-500 shrink-0"/>
              <span className="truncate" title={selectedLead.location}>{selectedLead.location || 'N/A'}</span>
            </div>
          </div>
          {/* City / State */}
          <div className="flex flex-col min-w-fit">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">City / State</label>
            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
              <MapPin size={13} className="text-blue-500 shrink-0"/>
              <span className="truncate">{selectedLead.city ? `${selectedLead.city}, ` : ''}{selectedLead.state}</span>
            </div>
          </div>
           
          {/* Emp Count */}
          <div className="flex flex-col min-w-fit">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Employees</label>
            <div className="flex items-center gap-1.5 text-gray-700 font-bold text-xs">
              <Users size={13} className="text-green-600 shrink-0"/>
              <span>{selectedLead.empCount || '0'}</span>
            </div>
          </div>
          {/* 6. Reference (RE-ADDED) */}
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
    <div className="flex-1 overflow-hidden flex flex-col bg-white p-4">
      <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        
        {/* Table Title */}
        <div className="px-5 py-3 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Interaction History
          </h4>
        </div>
        
        <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar max-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 shadow-sm border-b border-gray-100">
              <tr>
                <th className="p-4">Follow-up Date</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4 w-1/4">Remarks</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Franchise</th>
                <th className="p-4 text-center">Next Follow-up</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-gray-50">
              {interactions.length > 0 ? interactions.map((interaction, index) => (
                <tr key={index} className="hover:bg-blue-50/30 transition duration-150 group">
                  {/* Follow-up Date */}
                  <td className="p-4">
                    <div className="font-bold text-[#103c7f] text-sm">
                      {interaction.date ? new Date(interaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'N/A'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">{interaction.date ? new Date(interaction.date).getFullYear() : ''}</div>
                  </td>

                  {/* MERGED: Contact Person + Info */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {interaction.contact_person ? interaction.contact_person.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="font-bold text-gray-800">{interaction.contact_person || 'N/A'}</div>
                        <div className="flex flex-col text-[10px] text-gray-500 font-medium">
                          {interaction.contact_no && <span className="flex items-center gap-1"><Phone size={10} className="text-gray-400"/> {interaction.contact_no}</span>}
                          {interaction.email && <span className="text-blue-500 lowercase truncate max-w-[140px]">{interaction.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Remarks */}
                  <td className="p-4">
                    <p className="text-gray-600 italic bg-gray-50 p-2 rounded-lg border border-gray-100 group-hover:bg-white transition line-clamp-2" title={interaction.remarks}>
                      "{interaction.remarks || 'No remarks'}"
                    </p>
                  </td>

                  {/* Status */}
                  <td className="p-4 text-center">
                    <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-bold min-w-[80px] ${interaction.status === 'Interested' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                      {interaction.status}
                      <span className="text-[8px] opacity-70 font-normal">{interaction.sub_status}</span>
                    </span>
                  </td>

                  {/* Franchise Status */}
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {interaction.franchise_status || 'N/A'}
                    </span>
                  </td>

                  {/* Next Follow-up Date */}
                  <td className="p-4 text-center">
                    <div className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-100 inline-block">
                      {interaction.next_follow_up ? new Date(interaction.next_follow_up).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : 'N/A'}
                    </div>
                  </td>

                  {/* ACTIONS: Edit & Delete for ALL rows */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => {
                          setInteractionData({...interaction});
                          setEditingInteractionId(interaction.id);
                          setModalType('add');
                        }} 
                        className="p-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors shadow-sm"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={async () => {
                          if(window.confirm("Are you sure you want to delete this interaction?")) {
                            try {
                              const session = JSON.parse(localStorage.getItem('session') || '{}');
                              const token = session.access_token;
                              
                              const response = await fetch('/api/corporate/leadgen/interaction', {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ interaction_id: interaction.id })
                              });
                              
                              const result = await response.json();
                              
                              if (result.success) {
                                // Remove deleted interaction from state
                                setInteractions(interactions.filter(i => i.id !== interaction.id));
                              } else {
                                alert(result.message || "Failed to delete interaction");
                              }
                            } catch (error) {
                              console.error('Error deleting interaction:', error);
                              alert("An error occurred. Please try again.");
                            }
                          }
                        }} 
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest">
                    No interactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
         <button onClick={() => { setIsFormOpen(false); setEditingInteractionId(null); setInteractionData({ date: new Date().toISOString().split('T')[0], status: '', sub_status: '', remarks: '', next_follow_up: '', contact_person: '', contact_no: '', email: '', franchise_status: '' }); }} className="px-4 py-2 text-gray-500 font-bold hover:text-gray-700 text-sm">
           Cancel
         </button>
       )}

       {/* 2. Buttons for CREATE Mode */}
       {modalType === 'create' && (
         <>
           <button
             onClick={handleSaveOnly}
             disabled={isSaving}
             className="px-5 py-2 bg-white border border-[#103c7f] text-[#103c7f] rounded-lg font-bold text-sm shadow-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {isSaving ? (
               <>
                 <Loader2 size={16} className="animate-spin" />
                 Please wait...
               </>
             ) : (
               'Save Only'
             )}
           </button>
           <button
             onClick={handleSaveAndFollowup}
             disabled={isSaving}
             className="bg-[#a1db40] hover:bg-[#8cc430] text-[#103c7f] px-5 py-2 rounded-lg font-black text-sm shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSaving ? (
               <>
                 <Loader2 size={16} className="animate-spin" />
                 Please wait...
               </>
             ) : (
               <>
                 Save & Add Follow-up <ArrowRight size={16} />
               </>
             )}
           </button>
         </>
       )}

       {/* 3. Button for ADD FOLLOWUP Mode */}
       {modalType === 'add' && (
         <button
           onClick={handleSaveInteraction}
           disabled={isSavingInteraction}
           className="bg-[#103c7f] hover:bg-blue-900 text-white px-2 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isSavingInteraction ? (
             <>
               <Loader2 size={16} className="animate-spin" />
               Please wait...
             </>
           ) : (
             <>
               <Save size={16} /> {editingInteractionId ? 'Update Record' : 'Save Record'}
             </>
           )}
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

  
