"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  MapPin,
  Phone,
  Mail,
  History,
  X,
  FileText,
  Building2,
  GraduationCap,
  Eye,
} from "lucide-react";

// --- DUMMY DATA ---
const DUMMY_CANDIDATES = [
  {
    id: "CAN-001",
    cv_url: "/path-to-cv-1.pdf",
    latest_status: "Interview Scheduled",
    latest_profile: "Senior React Developer",
    remarks: "Good communication, technically sound in hooks.",
    portal_name: "Naukri",
    portal_date: "2026-05-15",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "9876543210",
    location: "Pune, MH",
    gender: "Male",
    qualification: "B.Tech (Computer Science)",
    college: "DU",
    experience: "5.5 Years",
    recent_company: "Tech Mahindra",
    top_skills: ["React", "Next.js", "Tailwind"],
    all_skills:
      "React, Next.js, Tailwind CSS, Redux, Node.js, MongoDB, Git",
    companies_worked: "Tech Mahindra, TCS",
    history: [
      {
        id: 1,
        rc_name: "Priya Singh",
        calling_date: "2026-05-16",
        client_profile: "Infosys - SDE II",
        apply_date: "2026-05-15",
        curr_ctc: "12 LPA",
        exp_ctc: "18 LPA",
        feedback: "Agreed for interview next week.",
        status: "Interview Scheduled",
      },
      {
        id: 2,
        rc_name: "Neha Gupta",
        calling_date: "2026-05-10",
        client_profile: "Wipro - UI Dev",
        apply_date: "2026-05-09",
        curr_ctc: "12 LPA",
        exp_ctc: "16 LPA",
        feedback: "Not interested in Wipro location.",
        status: "Rejected by Candidate",
      },
    ],
  },
  {
    id: "CAN-002",
    cv_url: "/path-to-cv-2.pdf",
    latest_status: "Pending Join",
    latest_profile: "Sales Manager",
    remarks: "Notice period buyout required. HR approved.",
    portal_name: "FoundIt",
    portal_date: "2026-05-10",
    name: "Sneha Patel",
    email: "sneha.patel@example.com",
    phone: "9123456789",
    location: "Mumbai, MH",
    gender: "Female",
    qualification: "MBA (Marketing)",
    college: "DU",
    experience: "8 Years",
    recent_company: "HDFC Bank",
    top_skills: ["B2B Sales", "Team Mgmt", "CRM"],
    all_skills:
      "B2B Sales, B2C, Team Management, CRM, Lead Gen, Negotiation",
    companies_worked: "HDFC Bank, ICICI",
    history: [
      {
        id: 3,
        rc_name: "Amit Kumar",
        calling_date: "2026-05-12",
        client_profile: "Axis - Zonal Head",
        apply_date: "2026-05-10",
        curr_ctc: "18 LPA",
        exp_ctc: "24 LPA",
        feedback: "Selected. Waiting for offer letter.",
        status: "Pending Join",
      },
    ],
  },
  {
    id: "CAN-003",
    cv_url: "/path-to-cv-3.pdf",
    latest_status: "Not Reachable",
    latest_profile: "Backend Engineer (Java)",
    remarks: "Called 3 times, number switched off.",
    portal_name: "LinkedIn",
    portal_date: "2026-05-18",
    name: "Vikram Singh",
    email: "vikram.s@example.com",
    phone: "9988776655",
    location: "Bangalore, KA",
    gender: "Male",
    qualification: "MCA",
    college: "DU",
    experience: "3 Years",
    recent_company: "Wipro",
    top_skills: ["Java", "Spring Boot", "Microservices"],
    all_skills:
      "Java, Spring Boot, Hibernate, MySQL, Docker, Kubernetes",
    companies_worked: "Wipro",
    history: [
      {
        id: 4,
        rc_name: "Priya Singh",
        calling_date: "2026-05-19",
        client_profile: "TCS - Backend Engg",
        apply_date: "2026-05-18",
        curr_ctc: "8 LPA",
        exp_ctc: "12 LPA",
        feedback: "Number busy/switched off.",
        status: "Not Reachable",
      },
    ],
  },
];

export default function CVByJobPostPage() {
  // --- FILTERS STATE ---
  const [filters, setFilters] = useState({
    globalSearch: "",
    candidateName: "",
    email: "",
    phone: "",
    profileSearch: "",
    fromDate: "",
    toDate: "",
  });

  const [loading, setLoading] = useState(true);

  // --- MODAL STATE ---
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    candidate: null,
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);

    return () => clearTimeout(timer);
  }, []);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return DUMMY_CANDIDATES.filter((cand) => {
      // Global Search
      if (filters.globalSearch) {
        const query = filters.globalSearch.toLowerCase();

        const name = cand.name?.toLowerCase() || "";
        const email = cand.email?.toLowerCase() || "";
        const profile = cand.latest_profile?.toLowerCase() || "";
        const skills = cand.top_skills || [];

        if (
          !name.includes(query) &&
          !email.includes(query) &&
          !profile.includes(query) &&
          !skills.some((s) => (s || "").toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // Individual Filters
      const candidateName =
        filters.candidateName?.toLowerCase() || "";
      const filterEmail = filters.email?.toLowerCase() || "";
      const filterPhone = filters.phone || "";
      const filterProfile =
        filters.profileSearch?.toLowerCase() || "";

      const cName = cand.name?.toLowerCase() || "";
      const cEmail = cand.email?.toLowerCase() || "";
      const cPhone = cand.phone || "";
      const cProfile =
        cand.latest_profile?.toLowerCase() || "";

      if (candidateName && !cName.includes(candidateName))
        return false;

      if (filterEmail && !cEmail.includes(filterEmail))
        return false;

      if (filterPhone && !cPhone.includes(filterPhone))
        return false;

      if (filterProfile && !cProfile.includes(filterProfile))
        return false;

      // Date Range Filter
      if (filters.fromDate || filters.toDate) {
        if (!cand.portal_date) return false;

        const itemDate = new Date(cand.portal_date);
        itemDate.setHours(0, 0, 0, 0);

        if (
          filters.fromDate &&
          itemDate < new Date(filters.fromDate)
        ) {
          return false;
        }

        if (filters.toDate) {
          const tDate = new Date(filters.toDate);
          tDate.setHours(23, 59, 59, 999);

          if (itemDate > tDate) return false;
        }
      }

      return true;
    });
  }, [filters]);

  const handleClearFilters = () => {
    setFilters({
      globalSearch: "",
      candidateName: "",
      email: "",
      phone: "",
      profileSearch: "",
      fromDate: "",
      toDate: "",
    });
  };

  const openHistoryModal = (candidate) => {
    setHistoryModal({
      isOpen: true,
      candidate,
    });
  };

  const getStatusStyle = (status) => {
    if (!status)
      return "bg-blue-50 text-blue-700 border-blue-200";

    if (
      status.includes("Scheduled") ||
      status.includes("Joined") ||
      status.includes("Pending Join")
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (
      status.includes("Rejected") ||
      status.includes("Not")
    ) {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Calibri'] p-2 md:p-2 pb-20">
      {/* --- TOP NAVIGATION --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-[#103c7f] uppercase tracking-tight flex items-center gap-2">
            <FileText size={24} className="text-blue-500" />
            CV By Job Post
          </h1>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Sourced Candidates & Sourcing History
          </p>
        </div>
      </div>

      {/* --- FILTERS --- */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm mb-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Candidate Name
            </label>

            <input
              type="text"
              placeholder="Name..."
              value={filters.candidateName}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  candidateName: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Email ID
            </label>

            <input
              type="text"
              placeholder="Email..."
              value={filters.email}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  email: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Mobile Number
            </label>

            <input
              type="text"
              placeholder="Phone..."
              value={filters.phone}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  phone: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              Profile Search
            </label>

            <input
              type="text"
              placeholder="Job Role..."
              value={filters.profileSearch}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  profileSearch: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              From Portal Date
            </label>

            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  fromDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">
              To Portal Date
            </label>

            <input
              type="date"
              value={filters.toDate}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  toDate: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-[#103c7f] bg-gray-50 cursor-pointer"
            />
          </div>

          {Object.values(filters).some((val) => val !== "") && (
            <button
              onClick={handleClearFilters}
              className="w-full h-[34px] text-[10px] font-black text-red-500 hover:text-white hover:bg-red-500 uppercase tracking-widest transition-all border border-red-200 rounded-lg"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse max-w-[1000px] table-fixed">
            <thead className="bg-[#103c7f] text-white text-[10px] uppercase font-bold sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="p-2 border-r border-blue-800 text-center w-12">
                  CV
                </th>

                <th className="p-2 border-r border-blue-800 w-[120px]">
                  Latest Status
                </th>

                <th className="p-2 border-r border-blue-800 w-[140px]">
                  Latest Profile
                </th>

                <th className="p-2 border-r border-blue-800 w-[160px]">
                  Remarks
                </th>

                <th className="p-2 border-r border-blue-800 w-[80px] text-center">
                  Portal Info
                </th>

                <th className="p-2 border-r border-blue-800 w-[140px]">
                  Candidate Details
                </th>

                <th className="p-2 border-r border-blue-800 w-[100px]">
                  Location/Gender
                </th>

                <th className="p-2 border-r border-blue-800 w-[140px]">
                  Qualification/College
                </th>

                <th className="p-2 border-r border-blue-800 w-[100px]">
                  Exp / Recent Co.
                </th>

                <th className="p-2 border-r border-blue-800 w-[120px]">
                  Top Skills
                </th>

                <th className="p-2 border-r border-blue-800 w-[150px]">
                  All Skills & Companies
                </th>

                <th className="p-2 text-center w-[100px]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="text-xs text-gray-700 font-medium divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    Loading Database...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-blue-50/30 transition group"
                  >
                    <td className="p-2 border-r border-gray-100 text-center align-middle">
                      <a
                        href={cand.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white p-2 rounded-lg transition-colors border border-indigo-100 shadow-sm inline-block"
                        title="View CV"
                      >
                        <Eye size={14} />
                      </a>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <span
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center gap-1 w-fit ${getStatusStyle(
                          cand.latest_status
                        )}`}
                      >
                        {cand.latest_status}
                      </span>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle font-bold text-gray-800">
                      {cand.latest_profile}
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <p
                        className="text-[10px] text-gray-500 leading-tight line-clamp-2"
                        title={cand.remarks}
                      >
                        {cand.remarks}
                      </p>
                    </td>

                    <td className="p-2 border-r border-gray-100 text-center align-middle">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] font-black text-[#103c7f] bg-blue-50 px-2 py-0.5 rounded uppercase border border-blue-100">
                          {cand.portal_name}
                        </span>

                        <span className="font-mono text-[10px] text-gray-500">
                          {cand.portal_date}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                          <User
                            size={14}
                            className="text-gray-400"
                          />
                          {cand.name}
                        </span>

                        <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
                          <Mail
                            size={10}
                            className="text-blue-400"
                          />
                          {cand.email}
                        </span>

                        <span className="text-[10px] font-mono font-bold text-gray-600 flex items-center gap-1.5">
                          <Phone
                            size={10}
                            className="text-green-500"
                          />
                          {cand.phone}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-bold text-gray-700 flex items-center gap-1">
                          <MapPin
                            size={12}
                            className="text-red-400"
                          />
                          {cand.location}
                        </span>

                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                          {cand.gender}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-700 flex items-center gap-1">
                          <GraduationCap
                            size={12}
                            className="text-indigo-400 shrink-0"
                          />
                          {cand.qualification}
                        </span>

                        <span
                          className="text-[9px] text-gray-500 font-medium truncate"
                          title={cand.college}
                        >
                          {cand.college}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-emerald-600 text-sm">
                          {cand.experience}
                        </span>

                        <span
                          className="text-[10px] text-gray-500 flex items-center gap-1 line-clamp-1"
                          title={cand.recent_company}
                        >
                          <Building2 size={10} />
                          {cand.recent_company}
                        </span>
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-middle">
                      <div className="flex flex-wrap gap-1">
                        {cand.top_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-2 border-r border-gray-100 align-top">
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                            All Skills
                          </span>

                          <p
                            className="text-[10px] text-gray-600 line-clamp-1"
                            title={cand.all_skills}
                          >
                            {cand.all_skills}
                          </p>
                        </div>

                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                            Companies
                          </span>

                          <p
                            className="text-[10px] text-gray-600 line-clamp-1"
                            title={cand.companies_worked}
                          >
                            {cand.companies_worked}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-2 text-center bg-white align-middle group-hover:bg-blue-50 transition-colors sticky right-0 z-10 border-l shadow-[-4px_0px_5px_rgba(0,0,0,0.05)]">
                      <button
                        onClick={() => openHistoryModal(cand)}
                        className="w-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-[#103c7f] hover:text-white px-1 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex flex-col items-center justify-center gap-1"
                      >
                        <History size={16} />
                        View Log
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="12"
                    className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest"
                  >
                    No candidates found in database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= HISTORY MODAL ================= */}
      {historyModal.isOpen && historyModal.candidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#103c7f] text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  <History
                    size={20}
                    className="text-blue-300"
                  />
                  Calling & Processing History
                </h2>

                <p className="text-xs font-bold text-blue-200 mt-1 flex items-center gap-2">
                  <User size={12} />
                  {historyModal.candidate.name}
                  <Phone size={12} />
                  {historyModal.candidate.phone}
                </p>
              </div>

              <button
                onClick={() =>
                  setHistoryModal({
                    isOpen: false,
                    candidate: null,
                  })
                }
                className="hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-gray-50 flex-1 overflow-hidden flex flex-col">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-gray-100 text-gray-600 text-[10px] uppercase font-black sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="p-3 border-b border-r">
                          RC Name
                        </th>

                        <th className="p-3 border-b border-r text-center">
                          Calling Date
                        </th>

                        <th className="p-3 border-b border-r">
                          Client & Profile
                        </th>

                        <th className="p-3 border-b border-r text-center">
                          Apply Date
                        </th>

                        <th className="p-3 border-b border-r text-center">
                          Curr / Exp CTC
                        </th>

                        <th className="p-3 border-b border-r w-[250px]">
                          Feedback / Remarks
                        </th>

                        <th className="p-3 border-b text-center">
                          Candidate Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="text-xs divide-y divide-gray-100">
                      {historyModal.candidate.history.length >
                      0 ? (
                        historyModal.candidate.history.map(
                          (log) => (
                            <tr
                              key={log.id}
                              className="hover:bg-blue-50/30"
                            >
                              <td className="p-3 border-r font-bold text-[#103c7f]">
                                {log.rc_name}
                              </td>

                              <td className="p-3 border-r text-center font-mono text-gray-600">
                                {log.calling_date}
                              </td>

                              <td className="p-3 border-r font-bold text-gray-800">
                                {log.client_profile}
                              </td>

                              <td className="p-3 border-r text-center font-mono text-gray-600">
                                {log.apply_date}
                              </td>

                              <td className="p-3 border-r text-center">
                                <div className="flex flex-col gap-1 items-center">
                                  <span className="text-[10px] font-bold text-gray-500">
                                    Curr:
                                    <span className="text-gray-800">
                                      {" "}
                                      {log.curr_ctc}
                                    </span>
                                  </span>

                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">
                                    Exp: {log.exp_ctc}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 border-r">
                                <p className="text-[11px] text-gray-700 leading-relaxed bg-gray-50 p-2 rounded border border-gray-100">
                                  {log.feedback}
                                </p>
                              </td>

                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase border inline-flex items-center justify-center w-full ${getStatusStyle(
                                    log.status
                                  )}`}
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest"
                          >
                            No history logs found for this
                            candidate.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}