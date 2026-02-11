"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  UserPlus,
  Truck,
  MapPin,
  X,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  CalendarDays,
  CheckSquare,
  MessageSquare,
  Database,
  ListChecks,
  Edit,
  Map,
  Users,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ManagerLeadsPage() {
  const getWeekNumber = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return Math.ceil(date.getDate() / 7);
  };

  // --- DATA CONSTANTS ---
  const industryCategories = [
    "IT Services",
    "Retail",
    "Manufacturing",
    "Logistics",
    "Healthcare",
    "Education",
    "Real Estate",
  ];
  const indianStates = [
    "Delhi",
    "Haryana",
    "Uttar Pradesh",
    "Maharashtra",
    "Karnataka",
    "Tamil Nadu",
  ];
  const employeeCounts = ["1 - 10", "11 - 50", "51 - 200", "200 - 500", "500+"];

  // --- STATE MANAGEMENT ---
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourcedByOptions, setSourcedByOptions] = useState([]);
  const [leadgenUsers, setLeadgenUsers] = useState([]);
  const [fseOptions, setFseOptions] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);

  // TABS STATE: 'actionable' (Default) or 'database' (All Leads)
  const [activeTab, setActiveTab] = useState("actionable");

  // Modal & Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [modalType, setModalType] = useState("");
  const [assignFseName, setAssignFseName] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [selectedCrmUser, setSelectedCrmUser] = useState("");

  // Conversation State
  const initialConversationState = {
    remarks: "",
    status: "Interested",
    nextFollowUp: "",
    interactionDate: "",
    contactPerson: "",
    phone: "",
    email: "",
    subStatus: "",
  };
  const [conversationData, setConversationData] = useState(
    initialConversationState,
  );

  // Edit Form State
  const [newLeadData, setNewLeadData] = useState({
    company: "",
    category: "",
    sourcing_date: "",
    state: "",
    district_city: "",
    location: "",
    emp_count: "",
    reference: "",
  });
  const [districtsList, setDistrictsList] = useState([]);

  // Selected Lead Interactions State
  const [selectedLeadInteractions, setSelectedLeadInteractions] = useState([]);

  // Latest interaction for pass_delivery
  const [latestInteractionForDelivery, setLatestInteractionForDelivery] =
    useState({});

  // Contact suggestions state
  const [contactSuggestions, setContactSuggestions] = useState({
    contactPersons: [],
    emails: [],
    contactNos: [],
  });
  const [showContactPersonSuggestions, setShowContactPersonSuggestions] =
    useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);

  // --- FILTER STATE ---
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    company: "",
    location: "",
    status: "All",
    subStatus: "All",
    sourcedBy: "All",
  });

  // --- API CALLS ---
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const session = JSON.parse(localStorage.getItem("session") || "{}");

        // Use different API based on tab
        const apiUrl =
          activeTab === "actionable"
            ? `/api/domestic/manager/leads?tab=${activeTab}`
            : `/api/domestic/manager/leads-database`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json();

        if (data.error) {
          console.error("API Error:", data.error);
          setLeads([]);
        } else {
          // Different response structures for each API
          if (activeTab === "actionable") {
            setLeads(data.leads || []);
          } else {
            setLeads(data.leads || data.data || []);
          }
        }

        // Set FSE options only for actionable tab
        if (
          activeTab === "actionable" &&
          data.fseTeam &&
          data.fseTeam.length > 0
        ) {
          setFseOptions(
            data.fseTeam.map((f) => ({ id: f.user_id, name: f.name })),
          );
          setAssignFseName(data.fseTeam[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch leads:", err);
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchCrmUsers = async () => {
      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const response = await fetch("/api/domestic/manager/crm-users", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await response.json();
        if (data.success) setCrmUsers(data.data);
      } catch (error) {
        console.error("Failed to fetch CRM users:", error);
      }
    };

    const fetchLeadgenUsers = async () => {
      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const response = await fetch("/api/domestic/manager/leadgen-users", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await response.json();
        if (data.success) {
          setLeadgenUsers(data.data);
          const leadgenNames = data.data.map((u) => u.name);
          setSourcedByOptions((prev) => [
            ...new Set([...prev, ...leadgenNames]),
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch leadgen users:", error);
      }
    };

    fetchLeads();
    fetchCrmUsers();
    fetchLeadgenUsers();
  }, [activeTab]);

  // --- REAL-TIME FILTER LOGIC (SIMPLIFIED - API NOW FILTERS BY TAB) ---
  useEffect(() => {
    let result = leads;

    // API already filters by tab, so we only apply user-selected filters here
    // 1. Apply User Selected Filters
    if (filters.fromDate) {
      result = result.filter((l) => {
        // Use sourcingDate for database tab, arrivedDate for actionable tab
        const dateToFilter = activeTab === "database" ? l.sourcingDate : l.arrivedDate;
        if (!dateToFilter) return false;
        const [day, month, year] = dateToFilter.split("/");
        const filterDate = new Date(`${year}-${month}-${day}`);
        return filterDate >= new Date(filters.fromDate);
      });
    }
    if (filters.toDate) {
      result = result.filter((l) => {
        // Use sourcingDate for database tab, arrivedDate for actionable tab
        const dateToFilter = activeTab === "database" ? l.sourcingDate : l.arrivedDate;
        if (!dateToFilter) return false;
        const [day, month, year] = dateToFilter.split("/");
        const filterDate = new Date(`${year}-${month}-${day}`);
        return filterDate <= new Date(filters.toDate);
      });
    }
    if (filters.company) {
      result = result.filter((l) =>
        l.company.toLowerCase().includes(filters.company.toLowerCase()),
      );
    }
    if (filters.location) {
      result = result.filter(
        (l) =>
          (l.city && l.city.toLowerCase().includes(filters.location.toLowerCase())) ||
          (l.districtCity && l.districtCity.toLowerCase().includes(filters.location.toLowerCase())) ||
          (l.state && l.state.toLowerCase().includes(filters.location.toLowerCase())),
      );
    }
    if (filters.status !== "All") {
      result = result.filter((l) => l.status === filters.status);
    }
    if (filters.subStatus !== "All") {
      result = result.filter((l) => 
        (l.sub_status && l.sub_status === filters.subStatus) ||
        (l.subStatus && l.subStatus === filters.subStatus)
      );
    }
    if (filters.sourcedBy !== "All") {
      result = result.filter((l) => l.sourcedBy === filters.sourcedBy);
    }

    setFilteredLeads(result);
  }, [filters, leads, activeTab]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // --- ACTIONS ---
  const handleAction = (lead, type) => {
    setSelectedLead(lead);
    setModalType(type);
    setIsFormOpen(true);

    // Fetch contact suggestions for add_conversation modal
    if (type === "add_conversation") {
      fetchContactSuggestions(lead.id);
    }

    // Pre-fill Edit Form
    if (type === "edit_basic") {
      // Convert sourcingDate from DD/MM/YYYY to YYYY-MM-DD for date input
      const convertDateForInput = (dateStr) => {
        if (!dateStr || dateStr === 'N/A') return '';
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
      };

      setNewLeadData({
        company: lead.company || "",
        category: lead.category || "",
        sourcing_date: convertDateForInput(lead.sourcingDate),
        state: lead.state || "",
        city: lead.city || "",
        district_city: lead.city || lead.location || "",
        location: lead.location || lead.city || "",
        emp_count: lead.empCount || "",
        reference: lead.reference || "",
      });
    }

    // Fetch interactions for view mode OR pass_delivery
    if (type === "view" || type === "pass_delivery") {
      const fetchInteractions = async () => {
        try {
          const session = JSON.parse(localStorage.getItem("session") || "{}");

          // Fetch from domestic_manager_interaction
          const managerResponse = await fetch(
            `/api/domestic/manager/interaction?client_id=${lead.id}`,
            {
              headers: { Authorization: `Bearer ${session.access_token}` },
            },
          );
          const managerData = await managerResponse.json();

          // Fetch from domestic_leads_interaction
          const leadsResponse = await fetch(
            `/api/domestic/leadgen/interaction?client_id=${lead.id}`,
            {
              headers: { Authorization: `Bearer ${session.access_token}` },
            },
          );
          const leadsData = await leadsResponse.json();

          // Combine both interaction lists
          const managerInteractions = managerData.data || [];
          const leadsInteractions = leadsData.data || [];
          const allInteractions = [
            ...managerInteractions,
            ...leadsInteractions,
          ];

          // Sort by date descending (most recent first)
          allInteractions.sort((a, b) => new Date(b.date) - new Date(a.date));

          if (type === "view") {
            setSelectedLeadInteractions(allInteractions);
          } else if (type === "pass_delivery") {
            // Store the latest interaction for pass_delivery
            setLatestInteractionForDelivery(allInteractions[0] || {});
          }
        } catch (error) {
          console.error("Failed to fetch interactions:", error);
          if (type === "pass_delivery") {
            setLatestInteractionForDelivery({});
          }
        }
      };
      fetchInteractions();
    }
  };

  // Helper to get interaction field with fallback (handles both snake_case and camelCase)
  const getInteractionField = (interaction, camelField, snakeField) => {
    return interaction[camelField] || interaction[snakeField] || "";
  };

  // Helper to extract latest contact info (safely)
  const getLatestContact = (lead) => {
    const interaction =
      lead.interactions && lead.interactions.length > 0
        ? lead.interactions[0]
        : null;
    return {
      name: interaction?.person || lead.contact_person || "N/A",
      email: interaction?.email || lead.email || "N/A",
      phone: interaction?.phone || lead.phone || "N/A",
    };
  };

  const fetchDistricts = (state) => {
    // Mock district fetch
    setDistrictsList(["District 1", "District 2", "District 3"]);
  };

  const fetchContactSuggestions = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const response = await fetch(
        `/api/domestic/manager/contact-suggestions?client_id=${clientId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setContactSuggestions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch contact suggestions:", error);
    }
  };

  const handleConfirmAction = async () => {
    if (modalType === "assign_fse") {
      const fse = fseOptions.find((f) => f.name === assignFseName);
      if (!fse || !visitDate) {
        alert("Please select FSE and visit date");
        return;
      }
      try {
        const response = await fetch(
          "/api/domestic/manager/leads/assign-fse",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: selectedLead.id,
              fse_id: fse.id,
              date: visitDate,
            }),
          },
        );
        if (!response.ok) throw new Error("Failed");
        const updatedLeads = leads.map((l) =>
          l.id === selectedLead.id
            ? {
                ...l,
                isProcessed: true,
                actionType: "FSE",
                assignedTo: assignFseName,
                assignedDate: new Date().toISOString().split("T")[0],
                visitStatus: "Pending Visit",
              }
            : l,
        );
        setLeads(updatedLeads);
        setIsFormOpen(false);
      } catch (e) {
        console.error(e);
        alert("Error");
      }
    } else if (modalType === "pass_delivery") {
      if (!selectedCrmUser) {
        alert("Select CRM User");
        return;
      }
      // Use latest interaction from domestic_manager_interaction table
      const latestInteraction = latestInteractionForDelivery;
      try {
        const response = await fetch(
          "/api/domestic/manager/leads/pass-to-delivery",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${JSON.parse(localStorage.getItem("session") || "{}").access_token}`,
            },
            body: JSON.stringify({
              client_id: selectedLead.id,
              company_name: selectedLead.company,
              category: selectedLead.category,
              location: selectedLead.location,
              state: selectedLead.state,
              contact_person:
                latestInteraction.contact_person ||
                latestInteraction.person ||
                "",
              email: latestInteraction.email || "",
              phone:
                latestInteraction.contact_no || latestInteraction.phone || "",
              remarks:
                latestInteraction.remarks || latestInteraction.sub_status || "",
              status: latestInteraction.status || "Handover",
              user_id: selectedCrmUser,
            }),
          },
        );
        if (!response.ok) throw new Error("Failed");
        const result = await response.json();
        if (result.success) {
          alert("Lead handed over to CRM successfully!");
          const updatedLeads = leads.map((l) =>
            l.id === selectedLead.id
              ? {
                  ...l,
                  isProcessed: true,
                  actionType: "DELIVERY",
                  assignedCrm: crmUsers.find(
                    (u) => u.user_id === selectedCrmUser,
                  )?.name,
                }
              : l,
          );
          setLeads(updatedLeads);
          setIsFormOpen(false);
          setSelectedCrmUser("");
        } else {
          alert("Error: " + (result.error || "Failed to handover"));
        }
      } catch (e) {
        console.error(e);
        alert("Error");
      }
    } else if (modalType === "add_conversation") {
      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const response = await fetch("/api/domestic/manager/interaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            client_id: selectedLead.id,
            date:
              conversationData.interactionDate ||
              new Date().toISOString().split("T")[0],
            status: conversationData.status,
            sub_status: conversationData.subStatus,
            remarks: conversationData.remarks,
            next_follow_up: conversationData.nextFollowUp,
            contact_person: conversationData.contactPerson,
            contact_no: conversationData.phone,
            email: conversationData.email,
          }),
        });
        if (!response.ok) throw new Error("Failed");
        const updatedLeads = leads.map((l) => {
          if (l.id === selectedLead.id) {
            const newInteraction = {
              date:
                conversationData.interactionDate ||
                new Date().toLocaleDateString("en-GB"),
              person: conversationData.contactPerson || "",
              phone: conversationData.phone || "",
              email: conversationData.email || "",
              remarks: conversationData.remarks,
              status: conversationData.status,
              subStatus: conversationData.subStatus || "",
            };
            return {
              ...l,
              latestRemark: conversationData.remarks,
              status: conversationData.status,
              interactions: [newInteraction, ...(l.interactions || [])],
            };
          }
          return l;
        });
        setLeads(updatedLeads);
        setIsFormOpen(false);
        setConversationData(initialConversationState);
        alert("Success");
      } catch (e) {
        console.error(e);
        alert("Error");
      }
    } else if (modalType === "edit_basic") {
      try {
        const updateData = {
          id: selectedLead.id,
          client_id: selectedLead.client_id || selectedLead.id,
          company: newLeadData.company,
          category: newLeadData.category,
          city: newLeadData.district_city,
          state: newLeadData.state,
          location: newLeadData.location,
          contact_person: selectedLead.contact_person,
          phone: selectedLead.phone,
          email: selectedLead.email,
          remarks: selectedLead.latestRemark,
          next_follow_up: selectedLead.nextFollowup,
          status: selectedLead.status,
          sub_status: selectedLead.subStatus,
          franchise_status: selectedLead.franchiseStatus,
          emp_count: newLeadData.emp_count,
          reference: newLeadData.reference,
          sourcing_date: newLeadData.sourcing_date,
        };
        console.log('Sending update data:', updateData);
        
        const response = await fetch("/api/domestic/manager/leads/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JSON.parse(localStorage.getItem("session") || "{}").access_token}`,
          },
          body: JSON.stringify(updateData),
        });
        const data = await response.json();
        if (data.success) {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === selectedLead.id ? { ...l, ...newLeadData } : l,
            ),
          );
          setIsFormOpen(false);
          alert("Client details updated successfully");
        } else {
          alert("Error updating: " + data.error);
        }
      } catch (e) {
        console.error(e);
        alert("Error updating client details");
      }
    }
  };

  return (
    <div className="p-4 h-screen flex flex-col font-['Calibri'] bg-gray-50/50">
      {/* 1. HEADER & TABS */}
      <div className="mb-4 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight">
            Leads Overview
          </h1>
          <span className="bg-blue-50 border border-blue-100 text-[#103c7f] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm w-fit">
            {filteredLeads.length} Records Found
          </span>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 gap-1">
          <button
            onClick={() => {
              setActiveTab("actionable");
              setFilters({
                fromDate: "",
                toDate: "",
                company: "",
                location: "",
                status: "All",
                subStatus: "All",
                sourcedBy: "All",
              });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "actionable" ? "bg-[#103c7f] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <ListChecks size={16} /> Interested/Onboard Leads
          </button>
          <button
            onClick={() => {
              setActiveTab("database");
              setFilters({
                fromDate: "",
                toDate: "",
                company: "",
                location: "",
                status: "All",
                subStatus: "All",
                sourcedBy: "All",
              });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "database" ? "bg-[#103c7f] text-white shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Database size={16} /> All Leads Database
          </button>
        </div>
      </div>

      {/* 2. FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 grid grid-cols-7 gap-3 items-end">
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            From
          </label>
          <input
            type="date"
            value={filters.fromDate}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition"
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            To
          </label>
          <input
            type="date"
            value={filters.toDate}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition"
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            Company
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Name..."
              value={filters.company}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition"
              onChange={(e) => handleFilterChange("company", e.target.value)}
            />
          </div>
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            Loc / State
          </label>
          <input
            type="text"
            placeholder="Delhi..."
            value={filters.location}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition"
            onChange={(e) => handleFilterChange("location", e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            Status
          </label>
          <select
            value={filters.status}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition cursor-pointer"
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="All">All</option>
            <option>Interested</option>
            <option>Not Interested</option>
            <option>Not Picked</option>
            <option>Onboard</option>
            <option>Call Later</option>
            <option>New</option>
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            Sub-Status
          </label>
          <select
            value={filters.subStatus}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition cursor-pointer"
            onChange={(e) => handleFilterChange("subStatus", e.target.value)}
          >
            <option value="All">All</option>
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
            <option>Ready to Visit</option>
            <option>Callback</option>
            <option>NA</option>
            <option>New Lead</option>
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
            Sourced By
          </label>
          <select
            value={filters.sourcedBy}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:border-[#103c7f] transition cursor-pointer"
            onChange={(e) => handleFilterChange("sourcedBy", e.target.value)}
          >
            <option value="All">All Agents</option>
            {sourcedByOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. TABLE AREA - SEPARATE FOR EACH TAB */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex items-center justify-center">
          <div className="text-gray-500 font-bold uppercase tracking-widest">
            Loading leads...
          </div>
        </div>
      ) : activeTab === "actionable" ? (
        // === ACTIONABLE TAB TABLE ===
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col overflow-x-auto overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          <table className="w-full table-auto border-collapse text-left sticky">
            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-50 shadow-md">
              <tr>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  Arrived
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  Sourced Date
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[140px]">
                  Company / Category
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  City & State
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[150px]">
                  Contact Info
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[180px]">
                  Latest Interaction
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  Next Follow Up
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap text-center">
                  Status/Substatus
                </th>
                <th className="px-4 py-3 text-center bg-[#0d316a] sticky right-0 z-50 min-w-[200px] shadow-lg">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const contact = getLatestContact(lead);
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-blue-50/50 transition duration-150 group"
                    >
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-gray-600 font-bold">
                            {lead.arrivedDate || "-"}
                          </span>
                          {lead.sourcedBy && (
                            <span className="inline-block bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5">
                              {lead.sourcedBy}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-gray-500">
                        {lead.sourcingDate || "-"}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#103c7f] text-sm">
                            {lead.company}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {lead.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="font-bold text-gray-700">
                          {lead.city || lead.districtCity || "-"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          {lead.state}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-700">
                            {contact.name}
                          </span>
                          <span className="text-[10px] text-blue-600 flex items-center gap-1">
                            <Phone size={10} /> {contact.phone}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Mail size={10} /> {contact.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 max-w-[180px]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400">
                            {lead.interactions?.[0]?.date || "-"}
                          </span>
                          <p
                            className="italic text-gray-600 truncate text-[11px]"
                            title={lead.latestRemark}
                          >
                            "{lead.latestRemark}"
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap font-bold text-orange-600 text-center">
                        {lead.nextFollowup || "-"}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${lead.status === "Interested" ? "bg-green-50 text-green-700 border-green-200" : lead.status === "Onboard" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}
                          >
                            {lead.status}
                          </span>
                          {lead.subStatus && (
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                              ({lead.subStatus})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-50/20 border-l border-gray-200 z-10 whitespace-nowrap shadow-[-4px_0px_8px_-4px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          {lead.sentToCrm ? (
                            <span className="px-2 py-1 bg-gray-100 text-gray-400 text-xs font-bold rounded border border-gray-200">
                              LOCKED
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAction(lead, "view")}
                                className="p-1.5 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded hover:shadow-sm"
                                title="View"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleAction(lead, "edit_basic")}
                                className="p-1.5 text-gray-500 hover:text-orange-600 bg-white border border-gray-200 rounded hover:shadow-sm"
                                title="Edit Detail"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(lead, "add_conversation")
                                }
                                className="p-1.5 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded hover:shadow-sm"
                                title="Add Log"
                              >
                                <MessageSquare size={14} />
                              </button>
                              <button
                                onClick={() => handleAction(lead, "assign_fse")}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded hover:shadow-sm"
                                title="Assign FSE"
                              >
                                <UserPlus size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(lead, "pass_delivery")
                                }
                                className="p-1.5 text-gray-500 hover:text-green-600 bg-white border border-gray-200 rounded hover:shadow-sm"
                                title="Pass Delivery"
                              >
                                <Truck size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // === DATABASE TAB TABLE ===
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col overflow-x-auto overflow-y-auto sticky"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          <table className="w-full table-auto border-collapse text-left sticky">
            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-50 shadow-md">
              <tr>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  Sourced Date
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap w-[120px]">
                  Company / Category
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  City & State
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[150px]">
                  Contact Info
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap min-w-[140px]">
                  Latest Interaction
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap">
                  Next Follow Up
                </th>
                <th className="px-4 py-3 border-r border-blue-800 whitespace-nowrap text-center">
                  Status
                </th>
                <th className="px-4 py-3 text-center bg-[#0d316a] sticky right-0 z-20 w-[80px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const contact = getLatestContact(lead);
                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-blue-50/50 transition duration-150 group"
                    >
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-gray-600 font-bold">
                            {lead.sourcingDate || "-"}
                          </span>
                          {lead.sourcedBy && (
                            <span className="inline-block bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5">
                              {lead.sourcedBy}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#103c7f] text-sm truncate max-w-[120px]">
                            {lead.company}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {lead.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="font-bold text-gray-700">
                          {lead.city || lead.districtCity || "-"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          {lead.state}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-700">
                            {contact.name}
                          </span>
                          <span className="text-[10px] text-blue-600 flex items-center gap-1">
                            <Phone size={10} /> {contact.phone}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Mail size={10} /> {contact.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 max-w-[140px]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400">
                            {lead.interactions?.[0]?.date || "-"}
                          </span>
                          <p
                            className="italic text-gray-600 truncate text-[11px]"
                            title={
                              lead.latestRemark ||
                              lead.interactions?.[0]?.remarks
                            }
                          >
                            "
                            {lead.latestRemark ||
                              lead.interactions?.[0]?.remarks ||
                              "No remarks"}
                            "
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap font-bold text-orange-600">
                        {lead.nextFollowup || "-"}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${lead.status === "Interested" ? "bg-green-50 text-green-700 border-green-200" : lead.status === "Onboard" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-purple-50 text-purple-700 border-purple-200"}`}
                          >
                            {lead.status}
                          </span>
                          {lead.subStatus && (
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                              ({lead.subStatus})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-50/20 border-l border-gray-200 z-10 whitespace-nowrap shadow-[-4px_0px_8px_-4px_rgba(0,0,0,0.05)]">
                        <button
                          onClick={() => handleAction(lead, "view")}
                          className="p-2 text-gray-500 hover:text-[#103c7f] bg-gray-50 rounded-lg border border-gray-200 transition shadow-sm"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODALS --- */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-[#103c7f]/50 backdrop-blur-sm flex justify-center items-center z-50 p-2">
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full animate-in zoom-in-95 duration-200 border-4 border-white ${modalType === "view" ? "max-w-5xl" : modalType === "add_conversation" ? "max-w-2xl max-h-[85vh] flex flex-col" : "max-w-md"}`}
          >
            {/* Header */}
            <div
              className={`bg-[#103c7f] p-2 flex justify-between items-center text-white shadow-md ${modalType === "add_conversation" ? "flex-shrink-0" : ""}`}
            >
              <h3 className="font-bold text-lg uppercase tracking-wide">
                {modalType === "view"
                  ? "Lead Overview & History"
                  : modalType === "assign_fse"
                    ? "Assign Field Executive"
                    : modalType === "pass_delivery"
                      ? "Pass to Delivery"
                      : modalType === "add_conversation"
                        ? "Log Interaction"
                        : modalType === "edit_basic"
                          ? "Edit Client Details"
                          : ""}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* CONTENT: VIEW MODE (Single Row Header Layout) */}
            {modalType === "view" && selectedLead && (
              <div className="flex flex-col h-full bg-white font-['Calibri']">
                {/* 1. HEADER: COMPANY INFO & DETAILS STRIP */}
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex items-center gap-8">
                    {/* LEFT: Company Identity */}
                    <div className="shrink-0 min-w-[220px]">
                      <h2
                        className="text-2xl font-black text-[#103c7f] uppercase tracking-tight leading-none mb-2 truncate max-w-[300px]"
                        title={selectedLead.company}
                      >
                        {selectedLead.company}
                      </h2>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        COMPANY PROFILE
                      </span>
                    </div>

                    {/* VERTICAL DIVIDER */}
                    <div className="h-10 w-px bg-gray-300 shrink-0"></div>

                    {/* RIGHT: Horizontal Details Strip */}
                    <div className="flex items-center gap-8 flex-1 overflow-x-auto custom-scrollbar pb-1">
                      {/* Sourced Date */}
                      <div className="flex flex-col shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Sourced Date
                        </span>
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-xs">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="font-mono">
                            {selectedLead.sourcingDate || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Category */}
                      <div className="flex flex-col shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Category
                        </span>
                        <span className="bg-blue-100 text-[#103c7f] border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap">
                          {selectedLead.category || "General"}
                        </span>
                      </div>

                      {/* City / State */}
                      <div className="flex flex-col shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          City / State
                        </span>
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-xs">
                          <MapPin size={14} className="text-blue-600" />
                          <span>
                            {selectedLead.city ||
                              selectedLead.districtCity ||
                              "N/A"}{" "}
                            / {selectedLead.state || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex flex-col shrink-0 max-w-[150px]">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Location
                        </span>
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-xs">
                          <MapPin size={14} className="text-orange-500" />
                          <span
                            className="truncate"
                            title={selectedLead.location}
                          >
                            {selectedLead.location || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Employees */}
                      <div className="flex flex-col shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Employees
                        </span>
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-xs">
                          <Users size={14} className="text-green-600" />
                          <span>{selectedLead.empCount || "N/A"}</span>
                        </div>
                      </div>

                      {/* Reference */}
                      <div className="flex flex-col shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Reference
                        </span>
                        <div className="flex items-center gap-2 text-gray-700 font-bold text-xs">
                          <Database size={14} className="text-purple-500" />
                          <span>{selectedLead.reference || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BODY: INTERACTION HISTORY */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col bg-white">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <h4 className="text-xs font-black text-gray-600 uppercase tracking-widest">
                      Interaction History
                    </h4>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 shadow-sm flex flex-col">
                    <div className="overflow-y-auto flex-1 custom-scrollbar max-h-[400px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                          <tr>
                            <th className="px-6 py-4 w-32">Follow-up Date</th>
                            <th className="px-6 py-4 w-48">Contact Person</th>
                            <th className="px-6 py-4 w-48">Contact Info</th>
                            <th className="px-6 py-4 w-1/3 min-w-[250px]">
                              Remarks
                            </th>
                            <th className="px-6 py-4 text-center w-32">
                              Status
                            </th>
                            <th className="px-6 py-4 text-center w-32">
                              Franchise Status
                            </th>
                            <th className="px-6 py-4 text-center w-32">
                              Next Follow-up
                            </th>
                            <th className="px-6 py-4 w-32">Con.By</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-gray-50">
                          {selectedLeadInteractions &&
                          selectedLeadInteractions.length > 0 ? (
                            selectedLeadInteractions.map(
                              (interaction, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-blue-50/20 transition duration-150 group"
                                >
                                  <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-black text-[#103c7f]">
                                        {new Date(interaction.date).getDate()}{" "}
                                        {new Date(
                                          interaction.date,
                                        ).toLocaleString("default", {
                                          month: "short",
                                        })}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400">
                                        {new Date(
                                          interaction.date,
                                        ).getFullYear()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-[11px] font-black uppercase border border-purple-200 shrink-0">
                                        {(
                                          getInteractionField(
                                            interaction,
                                            "person",
                                            "contact_person",
                                          ) || "N/A"
                                        ).substring(0, 2)}
                                      </div>
                                      <span className="text-xs font-bold text-gray-800 truncate">
                                        {getInteractionField(
                                          interaction,
                                          "contact_person",
                                          "person",
                                        ) || "N/A"}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1">
                                      {getInteractionField(
                                        interaction,
                                        "phone",
                                        "contact_no",
                                      ) ? (
                                        <span className="font-mono text-gray-600 font-semibold tracking-tight">
                                          {getInteractionField(
                                            interaction,
                                            "phone",
                                            "contact_no",
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-gray-300">-</span>
                                      )}

                                      {interaction.email ? (
                                        <span className="text-[10px] text-blue-500 lowercase truncate max-w-[150px]">
                                          {interaction.email}
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-600 italic leading-relaxed group-hover:bg-white group-hover:border-blue-100 transition shadow-sm">
                                      "{interaction.remarks || "No remarks"}"
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <div
                                      className={`inline-flex flex-col items-center justify-center px-4 py-1.5 rounded-lg w-full ${
                                        interaction.status === "Interested"
                                          ? "bg-green-50 border border-green-100"
                                          : "bg-gray-50 border border-gray-100"
                                      }`}
                                    >
                                      <span
                                        className={`text-[10px] font-black uppercase ${
                                          interaction.status === "Interested"
                                            ? "text-green-700"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {interaction.status}
                                      </span>
                                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">
                                        {getInteractionField(
                                          interaction,
                                          "subStatus",
                                          "sub_status",
                                        ) || "N/A"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase inline-block whitespace-nowrap">
                                      {interaction.franchise_status ||
                                        "No Franchise"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    {getInteractionField(
                                      interaction,
                                      "nextFollowUp",
                                      "next_follow_up",
                                    ) || selectedLead.nextFollowUp ? (
                                      <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase inline-block font-mono">
                                        {getInteractionField(
                                          interaction,
                                          "nextFollowUp",
                                          "next_follow_up",
                                        ) || selectedLead.nextFollowUp}
                                      </span>
                                    ) : (
                                      <span className="text-gray-300">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="text-xs font-bold text-gray-600">
                                      {interaction.user_name || "-"}
                                    </span>
                                  </td>
                                </tr>
                              ),
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan="8"
                                className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                              >
                                No history found
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

            {/* CONTENT: ASSIGN FSE */}
            {modalType === "assign_fse" && (
              <div className="p-6">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    Select FSE
                  </label>
                  <select
                    value={assignFseName}
                    onChange={(e) => setAssignFseName(e.target.value)}
                    className="w-full border p-2 rounded outline-none focus:border-[#103c7f]"
                  >
                    {fseOptions.map((f) => (
                      <option key={f.id} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <label className="block text-xs font-bold text-gray-500 uppercase">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full border p-2 rounded outline-none focus:border-[#103c7f]"
                  />
                  <button
                    onClick={handleConfirmAction}
                    className="w-full bg-[#103c7f] text-white py-3 rounded-xl font-bold mt-4 shadow-lg"
                  >
                    Confirm Schedule
                  </button>
                </div>
              </div>
            )}

            {/* CONTENT: PASS TO DELIVERY */}
            {modalType === "pass_delivery" && (
              <div className="p-6">
                <div className="bg-green-50 p-3 rounded mb-4 text-center">
                  <Truck size={24} className="text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-green-800 font-bold">
                    Passing {selectedLead.company} to Delivery Team
                  </p>
                </div>
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Select CRM User
                </label>
                <select
                  value={selectedCrmUser}
                  onChange={(e) => setSelectedCrmUser(e.target.value)}
                  className="w-full border p-2 rounded mt-1 outline-none focus:border-green-600"
                >
                  <option value="">Select...</option>
                  {crmUsers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleConfirmAction}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold mt-6 shadow-lg"
                >
                  Confirm Handover
                </button>
              </div>
            )}

            {/* CONTENT: ADD CONVERSATION */}
            {/* CONTENT: ADD CONVERSATION */}
            {modalType === "add_conversation" && (
              <div className="p-6 overflow-y-auto font-['Calibri'] max-h-[80vh]">
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  {/* 1. PREVIOUS CONTEXT (Auto-filled / Read Only) */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex justify-between items-start">
                    <div className="w-3/4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Last Interaction (
                        {selectedLead?.latestFollowup || "N/A"})
                      </p>
                      <p className="text-xs text-gray-700 italic border-l-2 border-blue-200 pl-2">
                        "{selectedLead?.latestRemark || "No previous remarks"}"
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Current Status
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          selectedLead?.status === "Interested"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {selectedLead?.status || "New"}
                      </span>
                    </div>
                  </div>

                  {/* 2. INPUT FORM */}
                  <div className="space-y-3 pt-2">
                    {/* Row 1: Interaction Date */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Interaction Date
                      </label>
                      <input
                        type="date"
                        value={conversationData.interactionDate}
                        onChange={(e) =>
                          setConversationData({
                            ...conversationData,
                            interactionDate: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none font-medium"
                      />
                    </div>

                    {/* Row 2: Contact Person, Phone, Email */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          placeholder="Enter name"
                          value={conversationData.contactPerson}
                          onChange={(e) =>
                            setConversationData({
                              ...conversationData,
                              contactPerson: e.target.value,
                            })
                          }
                          onFocus={() => setShowContactPersonSuggestions(true)}
                          onBlur={() =>
                            setTimeout(() => setShowContactPersonSuggestions(false), 200)
                          }
                          className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                        />
                        {showContactPersonSuggestions &&
                          contactSuggestions.contactPersons.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                              {contactSuggestions.contactPersons.map((name, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setConversationData({
                                      ...conversationData,
                                      contactPerson: name,
                                    });
                                    setShowContactPersonSuggestions(false);
                                  }}
                                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                                >
                                  {name}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={conversationData.phone}
                          onChange={(e) =>
                            setConversationData({
                              ...conversationData,
                              phone: e.target.value,
                            })
                          }
                          onFocus={() => setShowPhoneSuggestions(true)}
                          onBlur={() =>
                            setTimeout(() => setShowPhoneSuggestions(false), 200)
                          }
                          className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                        />
                        {showPhoneSuggestions &&
                          contactSuggestions.contactNos.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                              {contactSuggestions.contactNos.map((phone, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setConversationData({
                                      ...conversationData,
                                      phone: phone,
                                    });
                                    setShowPhoneSuggestions(false);
                                  }}
                                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                                >
                                  {phone}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="Enter email"
                          value={conversationData.email}
                          onChange={(e) =>
                            setConversationData({
                              ...conversationData,
                              email: e.target.value,
                            })
                          }
                          onFocus={() => setShowEmailSuggestions(true)}
                          onBlur={() =>
                            setTimeout(() => setShowEmailSuggestions(false), 200)
                          }
                          className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                        />
                        {showEmailSuggestions &&
                          contactSuggestions.emails.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                              {contactSuggestions.emails.map((email, idx) => (
                                <div
                                  key={idx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setConversationData({
                                      ...conversationData,
                                      email: email,
                                    });
                                    setShowEmailSuggestions(false);
                                  }}
                                  className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                                >
                                  {email}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Row 3: Status & Sub-Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          New Status
                        </label>
                        <select
                          value={conversationData.status}
                          onChange={(e) =>
                            setConversationData({
                              ...conversationData,
                              status: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                        >
                          <option value="">Select Status</option>
                          <option>Interested</option>
                          <option>Not Interested</option>
                          <option>Not Picked</option>
                          <option>Onboard</option>
                          <option>Call Later</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Sub-Status
                        </label>
                        <select
                          value={conversationData.subStatus}
                          onChange={(e) =>
                            setConversationData({
                              ...conversationData,
                              subStatus: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded p-2 text-sm mt-1 focus:border-[#103c7f] outline-none"
                        >
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

                    {/* Row 4: Remarks */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Remarks (Conversation Details)
                      </label>
                      <textarea
                        value={conversationData.remarks}
                        onChange={(e) =>
                          setConversationData({
                            ...conversationData,
                            remarks: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-3 text-sm mt-1 h-20 focus:border-[#103c7f] outline-none resize-none placeholder:text-gray-300"
                        placeholder="Client kya bola? Mention key points..."
                      ></textarea>
                    </div>

                    {/* Row 5: Next Follow-up */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase text-orange-600">
                        Next Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={conversationData.nextFollowUp}
                        onChange={(e) =>
                          setConversationData({
                            ...conversationData,
                            nextFollowUp: e.target.value,
                          })
                        }
                        className="w-full border border-orange-200 bg-orange-50/30 rounded p-2 text-sm mt-1 focus:border-orange-500 outline-none font-bold text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleConfirmAction}
                      className="w-full bg-[#103c7f] hover:bg-blue-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2"
                    >
                      <MessageSquare size={16} /> Save Interaction Record
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT: EDIT BASIC DETAILS */}
            {modalType === "edit_basic" && (
              <div className="p-6">
                {/* Form Header */}
                <div className="mb-5 border-b border-gray-100 pb-3">
                  <h4 className="text-sm font-bold text-[#103c7f] uppercase tracking-wide">
                    Update Client Information
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Modify basic details for{" "}
                    <span className="font-bold text-gray-600">
                      {selectedLead?.company}
                    </span>
                  </p>
                </div>

                <div className="space-y-4 font-['Calibri']">
                  {/* Row 1: Company & Category */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newLeadData.company}
                        onChange={(e) =>
                          setNewLeadData({
                            ...newLeadData,
                            company: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none font-bold text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Category
                      </label>
                      <select
                        value={newLeadData.category}
                        onChange={(e) =>
                          setNewLeadData({
                            ...newLeadData,
                            category: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none bg-white"
                      >
                        <option value="">Select Category</option>
                        {[
                          "IT Services",
                          "Retail",
                          "Manufacturing",
                          "Logistics",
                          "Healthcare",
                        ].map((cat, idx) => (
                          <option key={idx} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Sourcing Date
                      </label>
                      <input
                        type="date"
                        value={newLeadData.sourcing_date}
                        onChange={(e) =>
                          setNewLeadData({
                            ...newLeadData,
                            sourcing_date: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none"
                      />
                    </div>
                  </div>

                  {/* Row 2: State, City, Emp Count */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        State
                      </label>
                      <select
                        value={newLeadData.state}
                        onChange={(e) =>
                          setNewLeadData({
                            ...newLeadData,
                            state: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none bg-white"
                      >
                        <option value="">Select State</option>
                        {[
                          "Delhi",
                          "Haryana",
                          "Uttar Pradesh",
                          "Maharashtra",
                          "Karnataka",
                        ].map((state, idx) => (
                          <option key={idx} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        District/City
                      </label>
                      <input
                        type="text"
                        value={newLeadData.district_city}
                        onChange={(e) =>
                          setNewLeadData({
                            ...newLeadData,
                            district_city: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Employee Count
                      </label>
                      <select
                        value={newLeadData.emp_count}
                        onChange={(e) =>
                          setNewLeadData({
                            ...newLeadData,
                            emp_count: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none bg-white"
                      >
                        <option value="">Select Count</option>
                        {["1 - 10", "11 - 50", "51 - 200", "200+"].map(
                          (count, idx) => (
                            <option key={idx} value={count}>
                              {count}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Address */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Location / Area
                    </label>
                    <textarea
                      value={newLeadData.location}
                      onChange={(e) =>
                        setNewLeadData({
                          ...newLeadData,
                          location: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded p-2 text-sm h-16 resize-none focus:border-[#103c7f] outline-none"
                      placeholder="Full address..."
                    ></textarea>
                  </div>

                  {/* Row 4: Reference */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Reference / Source
                    </label>
                    <input
                      type="text"
                      value={newLeadData.reference}
                      onChange={(e) =>
                        setNewLeadData({
                          ...newLeadData,
                          reference: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:border-[#103c7f] outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleConfirmAction}
                    className="w-full bg-[#103c7f] hover:bg-blue-900 text-white py-3 rounded-xl font-bold mt-2 shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Edit size={16} /> Update Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
