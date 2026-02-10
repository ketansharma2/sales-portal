"use client";
import { useState, useEffect } from "react";
import {
  Eye,
  Search,
  Users,
  Truck,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Database,
  ListChecks,
  ArrowRightCircle,
  CheckCircle,
  X,
  Calendar,
  Briefcase,
  User,
  ArrowRightCircle as ArrowRightCircleIcon,
} from "lucide-react";

export default function FseOnboardPage() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("onboard"); // 'onboard' or 'database'
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fseList, setFseList] = useState([]);
  const [crmList, setCrmList] = useState([]); // CRM users for delivery manager dropdown
  const [totalCount, setTotalCount] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // Modal State
  const [modalType, setModalType] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deliveryUser, setDeliveryUser] = useState("");

  // Filters
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    company: "",
    location: "",
    status: "All",
    subStatus: "All",
    sourcedBy: "All Agents",
  });

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [activeTab, filters, showAll]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const token = session?.access_token;

      if (!token) {
        console.error("No auth token found");
        setLoading(false);
        return;
      }

      if (activeTab === "database") {
        // Fetch from All Database API
        const queryParams = new URLSearchParams();
        if (filters.sourcedBy && filters.sourcedBy !== "All Agents") {
          queryParams.append("fse_id", filters.sourcedBy);
        }
        if (filters.from) queryParams.append("fromDate", filters.from);
        if (filters.to) queryParams.append("toDate", filters.to);
        if (filters.company) queryParams.append("company", filters.company);
        if (filters.location) queryParams.append("location", filters.location);
        if (filters.status && filters.status !== "All")
          queryParams.append("status", filters.status);
        if (filters.subStatus && filters.subStatus !== "All")
          queryParams.append("sub_status", filters.subStatus);
        // Fetch all or limited to 100
        queryParams.append("limit", showAll ? "all" : "100");

        const response = await fetch(
          `/api/domestic/manager/all-clients-database?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();

        if (data.success) {
          setLeads(data.data || []);
          setFseList(data.fse_list || []);
          setTotalCount(data.total_count || 0);
        }
      } else {
        // For 'onboard' tab - fetch from FSE Onboard API (clients sent to manager)
        const queryParams = new URLSearchParams();
        if (filters.sourcedBy && filters.sourcedBy !== "All Agents") {
          queryParams.append("fse_id", filters.sourcedBy);
        }
        if (filters.from) queryParams.append("fromDate", filters.from);
        if (filters.to) queryParams.append("toDate", filters.to);
        if (filters.company) queryParams.append("company", filters.company);
        if (filters.location) queryParams.append("location", filters.location);
        if (filters.status && filters.status !== "All")
          queryParams.append("status", filters.status);

        const response = await fetch(
          `/api/domestic/manager/fse-onboard?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();

        if (data.success) {
          setLeads(data.data || []);
          setFseList(data.fse_list || []);
          setCrmList(data.crm_list || []); // Store CRM users for delivery manager dropdown
          setTotalCount(data.total_count || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setShowAll(false); // Reset to limited view when filters change
  };

  const handleAction = (id, action) => {
    // Handle both id (mock) and client_id (real)
    const lead = leads.find((l) => l.client_id === id || l.id === id);
    if (!lead) return;

    setSelectedLead(lead);
    setModalType(action); // 'view' or 'delivery'
    setIsFormOpen(true);
  };

  const submitHandover = async () => {
    if (!deliveryUser) {
      alert("Please select a CRM Manager");
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const token = session?.access_token;

      if (!token) {
        alert("Authentication required");
        return;
      }

      const response = await fetch("/api/domestic/manager/pass-to-crm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: selectedLead.client_id,
          crm_user_id: deliveryUser,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Client successfully passed to CRM");
        setIsFormOpen(false);
        setDeliveryUser("");
        setSelectedLead(null);
        setModalType(null);
        fetchData(); // Refresh the leads list
      } else {
        alert("Error: " + (data.error || "Failed to pass client to CRM"));
      }
    } catch (error) {
      console.error("Error passing to CRM:", error);
      alert("An error occurred. Please try again.");
    }
  };

  // Consistent Stylings for View Modal
  const inputStyle = `w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#103c7f]/20 transition shadow-sm disabled:bg-gray-50 disabled:text-gray-500`;

  // --- FILTER LOGIC ---
  const filteredLeads = leads.filter((lead) => {
    const companyName = lead.company_name || lead.company || "";
    const location = lead.location || "";
    const status = (lead.status || "").toLowerCase();
    const subStatus = (lead.sub_status || "").toLowerCase();
    const fseName = lead.fse_name || "";

    // Get the FSE name from list for comparison
    const selectedFseName =
      filters.sourcedBy !== "All Agents"
        ? fseList.find((f) => f.user_id === filters.sourcedBy)?.name
        : null;

    // Date field depends on tab:
    // - FSE Onboard tab: filter by sent_date (when FSE sent to manager)
    // - Database tab: filter by latest_contact_date
    const filterDate =
      activeTab === "database"
        ? lead.latest_contact_date || ""
        : lead.sent_date || lead.lock_date || "";

    return (
      (filters.company === "" ||
        companyName.toLowerCase().includes(filters.company.toLowerCase())) &&
      (filters.location === "" ||
        location.toLowerCase().includes(filters.location.toLowerCase()) ||
        (lead.state || "")
          .toLowerCase()
          .includes(filters.location.toLowerCase())) &&
      (filters.sourcedBy === "All Agents" ||
        selectedFseName === null ||
        fseName === selectedFseName) &&
      (filters.status === "All" || status === filters.status.toLowerCase()) &&
      (filters.subStatus === "All" ||
        subStatus === filters.subStatus.toLowerCase()) &&
      (!filters.from || !filterDate || filterDate >= filters.from) &&
      (!filters.to || !filterDate || filterDate <= filters.to)
    );
  });

  // Show View All button only in database tab and when there's more data
  const showViewAllButton =
    activeTab === "database" && totalCount > 100 && !showAll;
  const displayedCount = showAll ? totalCount : Math.min(leads.length, 100);

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
            onClick={() => {
              setActiveTab("onboard");
              setFilters({
                from: "",
                to: "",
                company: "",
                location: "",
                status: "All",
                subStatus: "All",
                sourcedBy: "All Agents",
              });
              setShowAll(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "onboard"
                ? "bg-[#103c7f] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ListChecks size={16} /> FSE Onboard
            {activeTab === "onboard" && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {filteredLeads.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("database");
              setFilters({
                from: "",
                to: "",
                company: "",
                location: "",
                status: "All",
                subStatus: "All",
                sourcedBy: "All Agents",
              });
              setShowAll(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === "database"
                ? "bg-[#103c7f] text-white shadow-md"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Database size={16} /> All Database
            {activeTab === "database" && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                {filteredLeads.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. FILTER SECTION */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-3 overflow-x-auto">
        <div className="flex items-end gap-3 min-w-max">
          <div className="w-[130px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              From
            </label>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"
            />
          </div>

          <div className="w-[130px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              To
            </label>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"
            />
          </div>

          <div className="w-[200px] flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Company
            </label>
            <div className="relative">
              <input
                type="text"
                name="company"
                placeholder="Name..."
                value={filters.company}
                onChange={handleFilterChange}
                className="w-full pl-7 bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300"
              />
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          <div className="w-[150px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Loc / State
            </label>
            <input
              type="text"
              name="location"
              placeholder="Delhi..."
              value={filters.location}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-3 py-2 outline-none focus:border-blue-300"
            />
          </div>

          <div className="w-[120px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Interested">Interested</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Onboarded">Onboarded</option>
              <option value="Not Picked">Not Picked</option>
              <option value="Reached out">Reached out</option>
            </select>
          </div>

          <div className="w-[120px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Sub-Status
            </label>
            <select
              name="subStatus"
              value={filters.subStatus}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Blue Collar">Blue Collar</option>
              <option value="Call back">Call back</option>
              <option value="In Process">In Process</option>
              <option value="Low budget">Low budget</option>
              <option value="Proposal shared">Proposal shared</option>
              <option value="ready to sign">ready to sign</option>
              <option value="Not ready to sign">Not ready to sign</option>
              <option value="NA">NA</option>
            </select>
          </div>

          <div className="w-[160px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              FSE / Sourced By
            </label>
            <select
              name="sourcedBy"
              value={filters.sourcedBy}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700 rounded-lg px-2 py-2 outline-none focus:border-blue-300 cursor-pointer"
            >
              <option value="All Agents">All Agents</option>
              {fseList.map((fse) => (
                <option key={fse.user_id} value={fse.user_id}>
                  {fse.name}
                </option>
              ))}
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
                {activeTab === "onboard" ? (
                  <>
                    <th className="px-6 py-4 whitespace-nowrap border-r border-blue-800">
                      FSE Name & Sent Date
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      Company & Type
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      State & Location
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      LatestContact Info
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      Latest Followup
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap w-1/4">
                      Remarks
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 text-center whitespace-nowrap">
                      Status / Sub-Status
                    </th>
                    <th className="px-6 py-4 text-center whitespace-nowrap bg-[#0d316a] sticky right-0 z-20">
                      Action
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 whitespace-nowrap border-r border-blue-800">
                      Sourcing Date & Mode
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      Company & Category
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      State & Location
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      Latest Contact Info
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap">
                      Followup date & Mode
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 whitespace-nowrap w-1/4">
                      Remarks
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 text-center whitespace-nowrap">
                      Status / Sub-Status
                    </th>
                    <th className="px-6 py-4 border-r border-blue-800 text-center whitespace-nowrap">
                      Projection
                    </th>
                    <th className="px-6 py-4 text-center whitespace-nowrap bg-[#0d316a] sticky right-0 z-20">
                      Action
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={activeTab === "onboard" ? 8 : 9}
                    className="py-12 text-center text-gray-400"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "onboard" ? 8 : 9}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-300">
                      <Search size={40} className="mb-2 opacity-50" />
                      <p className="text-sm font-bold uppercase tracking-widest">
                        No Leads Found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.client_id || lead.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {activeTab === "onboard" && (
                      <>
                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#103c7f]">
                              {lead.fse_name || lead.fseName || "Unknown"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">
                              {lead.sent_date || lead.lock_date || "N/A"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">
                              {lead.company_name || lead.company}
                            </span>
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded w-fit uppercase font-bold mt-0.5">
                              {lead.client_type || lead.clientType}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">
                              {lead.location}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {lead.state}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-gray-700">
                              {lead.contact_person || lead.name || "N/A"}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Phone size={10} />{" "}
                              {lead.contact_no || lead.phone || "N/A"}
                            </span>
                            <span className="text-[10px] text-blue-500 flex items-center gap-1">
                              <Mail size={10} /> {lead.email || "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-orange-600">
                              {lead.latest_contact_date ||
                                lead.followupDate ||
                                "-"}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">
                              {lead.latest_contact_mode || lead.mode || "-"}
                            </span>
                          </div>
                        </td>

                        <td
                          className="px-6 py-4 border-r border-gray-100 text-gray-500 italic truncate max-w-xs"
                          title={lead.remarks || lead.remark}
                        >
                          "{lead.remarks || lead.remark || "No remarks"}"
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                lead.status === "Verified"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : lead.status === "Pending"
                                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                                    : lead.status === "Onboarded"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {lead.status || "N/A"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              ({lead.sub_status || lead.subStatus || "N/A"})
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_10px_rgba(0,0,0,0.05)]">
                          {lead.sent_to_crm ? (
                            <span className="px-2 py-1 text-center bg-gray-100 text-gray-400 text-[10px] font-bold rounded border border-gray-200 uppercase tracking-wider">
                              LOCKED  
                            </span>
                            
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleAction(
                                    lead.client_id || lead.id,
                                    "view",
                                  )
                                }
                                className="p-1.5 text-gray-500 bg-white border border-gray-200 hover:text-blue-600 hover:border-blue-200 rounded transition-colors shadow-sm"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(
                                    lead.client_id || lead.id,
                                    "delivery",
                                  )
                                }
                                className="p-1.5 text-green-600 bg-green-50 border border-green-200 hover:bg-green-100 rounded transition-colors shadow-sm"
                                title="Sent to Delivery"
                              >
                                <Truck size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </>
                    )}

                    {activeTab === "database" && (
                      <>
                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-600">
                              {lead.sourcing_date || lead.sourcingDate}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              {lead.sourcing_mode || lead.sourcingMode}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#103c7f]">
                              {lead.company_name || lead.company}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {lead.category}
                            </span>
                            <span className="text-[10px] text-purple-600 font-bold mt-0.5">
                              FSE: {lead.fse_name || "Unknown"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">
                              {lead.location}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                              {lead.state}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-gray-700">
                              {lead.contact_person || "N/A"}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Phone size={10} /> {lead.contact_no || "N/A"}
                            </span>
                            <span className="text-[10px] text-blue-500 flex items-center gap-1">
                              <Mail size={10} /> {lead.email || "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-orange-600">
                              {lead.latest_contact_date ||
                                lead.followupDate ||
                                "-"}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">
                              {lead.latest_contact_mode || lead.mode || "-"}
                            </span>
                          </div>
                        </td>

                        <td
                          className="px-6 py-4 border-r border-gray-100 text-gray-500 italic truncate max-w-xs"
                          title={lead.remarks || lead.remark}
                        >
                          "{lead.remarks || lead.remark || "No remarks"}"
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                lead.status === "Verified"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : lead.status === "Pending"
                                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                                    : lead.status === "Onboarded"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : lead.status === "Not Interested"
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-gray-50 text-gray-500 border border-gray-200"
                              }`}
                            >
                              {lead.status || "N/A"}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              ({lead.sub_status || lead.subStatus || "N/A"})
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 border-r border-gray-100 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              lead.projection &&
                              (lead.projection.includes(">") ||
                                lead.projection === "High")
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : lead.projection &&
                                    (lead.projection.includes("<") ||
                                      lead.projection === "Medium")
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            {lead.projection || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-center bg-white sticky right-0 z-10 border-l border-gray-200 shadow-[-4px_0px_10px_rgba(0,0,0,0.05)]">
                          <button
                            onClick={() =>
                              handleAction(lead.client_id || lead.id, "view")
                            }
                            className="p-1.5 text-gray-500 bg-white border border-gray-200 hover:text-blue-600 hover:border-blue-200 rounded transition-colors shadow-sm"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
              {/* View All Button Row */}
              {showViewAllButton && (
                <tr>
                  <td
                    colSpan={activeTab === "onboard" ? 8 : 9}
                    className="py-4 text-center bg-gray-50"
                  >
                    <button
                      onClick={() => setShowAll(true)}
                      className="px-6 py-2 bg-[#103c7f] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-blue-900 transition"
                    >
                      View All ({totalCount} rows)
                    </button>
                  </td>
                </tr>
              )}
              {/* Showing count row */}
              {!loading && filteredLeads.length > 0 && (
                <tr>
                  <td
                    colSpan={activeTab === "onboard" ? 8 : 9}
                    className="py-2 px-6 text-xs text-gray-400 font-bold bg-gray-50"
                  >
                    Showing {displayedCount} of {totalCount} rows
                  </td>
                </tr>
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
                  <h4 className="font-bold text-[#103c7f] text-lg leading-none">
                    {selectedLead.company}
                  </h4>
                  <p className="text-xs text-gray-500 uppercase font-bold mt-1">
                    Passing to Delivery Operations
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* CRM Manager Select */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Assign to CRM Manager
                  </label>
                  <select
                    value={deliveryUser}
                    onChange={(e) => setDeliveryUser(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#103c7f] focus:ring-1 focus:ring-[#103c7f]"
                  >
                    <option value="">Select CRM Manager...</option>
                    {crmList.length > 0 ? (
                      crmList.map((crm) => (
                        <option key={crm.user_id} value={crm.user_id}>
                          {crm.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No CRM users found</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
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
                  <h2 className="text-2xl font-black text-[#103c7f] italic uppercase tracking-tight">
                    {selectedLead.company}
                  </h2>
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
                    <MapPin size={12} /> {selectedLead.location}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* 2. Top Info Cards (Horizontal Strip) */}
            <div className="px-8 py-6 bg-gray-50/50">
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                {/* Card 1: Sourcing Date */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Sourcing Date
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.sourcing_date}
                    </p>
                  </div>
                </div>
                {/* Card 2: Category */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Category
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.category}
                    </p>
                  </div>
                </div>
                {/* Card 3: Sourcing Mode */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Sourcing Mode
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.sourcing_mode}
                    </p>
                  </div>
                </div>
                {/* Card 4: Emp Count */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Emp Count
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.emp_count}
                    </p>
                  </div>
                </div>
                {/* Card 5: Reference */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Database size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Reference
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.reference}
                    </p>
                  </div>
                </div>
                {/* Card 6: Current Status */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-green-50 p-2 rounded-lg text-green-600">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Current Status
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.status}
                    </p>
                  </div>
                </div>
                {/* Card 7: Projection */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 min-w-[140px] shadow-sm flex items-center gap-3">
                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                    <ArrowRightCircleIcon size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Projection
                    </p>
                    <p className="text-xs font-bold text-gray-800">
                      {selectedLead.projection}
                    </p>
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
                    <CalendarDays size={18} /> Interaction Timeline
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
                  <div className="col-span-2 text-center">
                    Status & Sub-Status
                  </div>
                </div>

                {/* Timeline Body (Scrollable) */}
                <div className="overflow-y-auto flex-1 p-0">
                  {selectedLead.interactions &&
                  selectedLead.interactions.length > 0 ? (
                    selectedLead.interactions.map((interaction, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 px-6 py-5 border-b border-gray-50 hover:bg-blue-50/20 transition group items-start"
                      >
                        {/* Date & Mode */}
                        <div className="col-span-2">
                          <p className="text-sm font-black text-[#103c7f] mb-1">
                            {interaction.contact_date || interaction.date}
                          </p>
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-purple-100 inline-block">
                            {interaction.contact_mode ||
                              interaction.mode ||
                              "CALL"}
                          </span>
                        </div>

                        {/* Contact Person */}
                        <div className="col-span-2 pr-2">
                          <p className="text-xs font-bold text-gray-800 capitalize mb-1">
                            {interaction.contact_person || interaction.person}
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Phone size={10} />{" "}
                            {interaction.contact_no || interaction.phone}
                          </p>
                          {interaction.email && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
                              <Mail size={10} /> {interaction.email}
                            </p>
                          )}
                        </div>

                        {/* Discussion Remarks */}
                        <div className="col-span-4 pr-4">
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {interaction.remarks}
                          </p>
                        </div>

                        {/* Next Followup */}
                        <div className="col-span-2">
                          {interaction.next_follow_up ? (
                            <span className="bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-lg text-[11px] font-bold uppercase inline-block font-mono">
                              {interaction.next_follow_up}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>

                        {/* Status & Action */}
                        <div className="col-span-2 flex justify-between items-center pl-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[#103c7f] uppercase">
                              {interaction.status}
                            </span>
                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded w-fit mt-1 font-bold">
                              {interaction.sub_status || interaction.subStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                      <p className="text-sm font-bold uppercase tracking-widest">
                        No Interactions Found
                      </p>
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
